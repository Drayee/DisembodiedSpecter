# Plan: PlayerDataManager Hash 缓存重构

## Summary

将 `UserUseCase.GetData` 中的玩家数据聚合逻辑迁移到 `utils/PlayerDataManager`，放弃使用泛型 `Fetch`，改用 Redis Hash（HSET/HGET）按字段缓存玩家数据。写操作只写 Redis（不写 SQL），SQL 同步交给未来定时同步器。提供设置 TTL 的方法（玩家退出时调用，2 天过期）。

## Current State

- `UserUseCase.GetData` 使用 `Fetch[T]` 泛型缓存，将整个 `PlayerDataResp` 序列化为单个 JSON blob 存入 Redis
- 修改任意一个字段（如 level）需要重写整个 JSON blob
- 存在 N+1 查询（循环调用 `GetObjectByID`）
- `PlayerDataManager` 是空壳，只有结构体 + 构造函数
- domain 层已重命名：`Object→Item`、`PlayerObject→PlayerItem`、`Email.Post→Port`，但 repo 和 service 层仍在用旧名称（编译不过）

## Proposed Changes

### 1. 前置：修复 PlayerRepo 命名（Object→Item）

**文件**: `internal/repository/player_repo.go`

domain 层已将 `Object→Item`、`PlayerObject→PlayerItem`，但 repo 接口和实现仍在用旧名。需同步修改：

| 旧名 | 新名 |
|------|------|
| `GetObjectByID` | `GetItemByID` |
| `GetPlayerObjects` | `GetPlayerItems` |
| `CreatePlayerObject` | `CreatePlayerItem` |
| `UpdatePlayerObject` | `UpdatePlayerItem` |
| `DeletePlayerObjectByPlayerIDAndObjectID` | `DeletePlayerItem` |
| `domain.Object` | `domain.Item` |
| `domain.PlayerObject` | `domain.PlayerItem` |
| `object.ObjectID` | `item.ItemID` |

同时新增一个方法用于查询单个玩家道具（供 AddItem 时检查已有道具）：
```go
GetPlayerItem(ctx context.Context, playerID int, itemID int) (*domain.PlayerItem, error)
```

### 2. 重写 PlayerDataManager（核心）

**文件**: `../../internal/utils/player_data_util.go`

#### 2.1 结构体

```go
type PlayerDataManager struct {
    redis      rueidis.Client
    playerRepo repository.PlayerRepo
    baseKey    string  // 例如 "private:cache:player-data:"
}
```

构造函数改为接收 `baseKey`：
```go
func NewPlayerDataManager(redis rueidis.Client, playerRepo repository.PlayerRepo, baseKey string) *PlayerDataManager
```

#### 2.2 Redis Hash 结构

```
Key:  private:cache:player-data:{playerID}
Type: HASH
TTL:  无（默认不过期），玩家退出时调用 SetExpireOnExit 设置 2 天 TTL

Fields:
  description        -> string
  level              -> int (字符串)
  exp                -> int (字符串)
  location           -> JSON(domain.Location)
  is_active          -> "true"/"false"
  least_active_type  -> string
  least_active_ip    -> string
  least_active_at    -> RFC3339 时间字符串
  bag:{itemID}       -> JSON({id, name, num, attribute})
```

每个标量字段独立存储，修改单字段只需一条 HSET。
背包道具按 `bag:{itemID}` 前缀独立存储，修改单个道具只需操作对应 hash field。

#### 2.3 读方法

**`GetPlayerData(ctx, playerID) (*response.PlayerDataResp, error)`**

1. `HGETALL` 获取所有字段
2. 若无字段返回（cache miss）→ 调用 `loadFromDB` 从 SQL 加载并填充 hash
3. 再次 `HGETALL`（或直接用加载的数据组装）
4. 遍历字段：
   - 标量字段 → 映射到 PlayerDataResp 对应字段
   - `bag:` 前缀字段 → JSON 反序列化为 `response.Object`，加入 Bag 切片
5. 返回 `*response.PlayerDataResp`

**内部方法 `loadFromDB(ctx, playerID) error`**：
1. `playerRepo.GetPlayerByID` 获取玩家基础信息
2. `playerRepo.GetPlayerItems` 获取背包道具列表
3. 对每个道具 `playerRepo.GetItemByID` 获取道具名（保留现有 N+1 逻辑，后续优化）
4. 用 `HSET` 批量写入所有标量字段
5. 对每个道具用 `HSET bag:{itemID}` 写入道具 JSON

**内部方法 `ensureLoaded(ctx, playerID) error`**：
1. `EXISTS` 检查 hash key 是否存在
2. 不存在则调用 `loadFromDB`

#### 2.4 写方法（仅写 Redis，不写 SQL）

所有写方法先调用 `ensureLoaded` 确保缓存已加载，再执行对应操作。

| 方法 | Redis 操作 | 说明 |
|------|-----------|------|
| `SetDescription(ctx, playerID, desc)` | `HSET description` | |
| `SetLevel(ctx, playerID, level)` | `HSET level` | |
| `SetExp(ctx, playerID, exp)` | `HSET exp` | |
| `AddExp(ctx, playerID, delta)` | `HINCRBY exp delta` | 整数原子自增 |
| `SetLocation(ctx, playerID, loc)` | `HSET location` | JSON 序列化 |
| `SetActive(ctx, playerID, active)` | `HSET is_active` | |
| `SetLeastActive(ctx, playerID, type, ip, at)` | `HSET least_active_type, least_active_ip, least_active_at` | 一次 HSET 多字段 |
| `AddItem(ctx, playerID, itemID, num, attr)` | `HGET bag:{itemID}` → 修改/新建 → `HSET bag:{itemID}` | 已有则 num+=delta，无则查 Item 表获取 name 后新建 |
| `RemoveItem(ctx, playerID, itemID, num)` | `HGET bag:{itemID}` → 减 num → `HSET` 或 `HDEL` | num≤0 则 HDEL |
| `SetItemCount(ctx, playerID, itemID, num)` | `HSET bag:{itemID}` 或 `HDEL` | num≤0 则 HDEL |
| `UpdateItemAttribute(ctx, playerID, itemID, attr)` | `HGET` → 改 attr → `HSET` | |

`AddItem` 特殊处理：若 `bag:{itemID}` 不存在，需调用 `playerRepo.GetItemByID` 获取道具名，构造完整 JSON 后 HSET。

#### 2.5 TTL 方法

**`SetExpireOnExit(ctx, playerID) error`**
```go
// EXPIRE key 172800 (2天 = 2*24*3600)
cmd := m.redis.B().Expire().Key(hashKey(playerID)).Seconds(172800).Build()
return m.redis.Do(ctx, cmd).Error()
```

仅提供方法，不实现退出检测逻辑（由调用方决定何时调用）。

### 3. 简化 UserUseCase.GetData

**文件**: `internal/service/user_usec.go`

`UserUseCase` 新增 `PlayerDataManager` 依赖，移除 `PlayerRepo` 依赖：

```go
type UserUseCase struct {
    Redis            rueidis.Client
    Cache            *utils.CacheManager
    PlayerDataManager *utils.PlayerDataManager
}
```

`GetData` 简化为：
```go
func (u *UserUseCase) GetData(c *gin.Context) (*response.PlayerDataResp, error) {
    val, _ := c.Get("userID")
    userID, _ := val.(string)
    id, err := strconv.Atoi(userID)
    if err != nil {
        return nil, err
    }
    return u.PlayerDataManager.GetPlayerData(c, id)
}
```

### 4. 更新 wire 注入

**文件**: `cmd/wire.go`、`cmd/wire_gen.go`

wire.go 的 `wire.Build` 新增 `utils.NewPlayerDataManager`。

wire_gen.go 新增：
```go
playerRepo := repository.NewGormPlayerRepo(db)
playerDataManager := utils.NewPlayerDataManager(redisClient, playerRepo, cfg.Cache.BaseKey)
userUseCase := service.NewUserUseCase(redisClient, cacheManager, playerDataManager)
```

### 5. 更新 UserHandler 构造函数签名

**文件**: `internal/handlers/user_handle.go`、`internal/service/user_usec.go`

`NewUserUseCase` 参数从 `(redis, cache, playerRepo)` 改为 `(redis, cache, playerDataManager)`。

## Assumptions & Decisions

1. **不使用 singleflight**：GetPlayerData 不使用 `Fetch` 也不引入 singleflight。并发 cache miss 可能导致多次 DB 查询，但实现简单，后续可加。
2. **N+1 查询保留**：`loadFromDB` 中仍按现有逻辑逐个查 Item 表获取道具名，不在本次重构中优化。
3. **背包按 `bag:{itemID}` 独立存储**：而非整个 bag 作为一个 JSON 字段，这样修改单个道具只需操作一个 hash field。
4. **写操作不写 SQL**：所有写方法只操作 Redis Hash，SQL 同步交给未来定时同步器。
5. **Hash 默认无 TTL**：只在玩家退出时调用 `SetExpireOnExit` 设置 2 天过期。
6. **不修改 response DTO**：`response.Object` 和 `response.PlayerDataResp` 保持不变，不与 domain 层的 `Item` 冲突（不同包）。
7. **baseKey 来源**：从 `cfg.Cache.BaseKey` 传入，构造为 `baseKey + ":player-data:"`。

## Verification

1. `go build ./...` 编译通过
2. 调用 `GET /api/v2/data`（需先登录获取 token），首次请求应触发 DB 查询并填充 Redis Hash
3. 用 `redis-cli HGETALL private:cache:player-data:{playerID}` 验证 hash 字段结构
4. 调用写方法（如 `SetLevel`）后，`HGET private:cache:player-data:{playerID} level` 验证字段已更新
5. 再次 `GET /api/v2/data` 应直接从 Redis Hash 返回（不查 DB）
6. 调用 `SetExpireOnExit` 后，`TTL private:cache:player-data:{playerID}` 应为 ~172800
