# DisembodiedSpecter

一个基于 Go 的即时制回合战斗游戏服务端，包含账号认证、玩家数据缓存、游戏内容管理（角色/敌人/道具/技能）、
WebSocket 战斗系统与全局状态机，数据采用 **Redis Hash 缓存 + 定时同步 SQL** 的架构。

## 技术栈

| 组件 | 用途 |
|---|---|
| Go 1.26 | 语言 |
| [Gin](https://github.com/gin-gonic/gin) | HTTP 框架 / 路由 / 中间件 |
| [GORM](https://gorm.io/) + PostgreSQL | 关系型数据库 |
| [rueidis](https://github.com/redis/rueidis) | Redis 客户端（缓存 / 会话 / 玩家数据） |
| [coder/websocket](https://github.com/coder/websocket) | WebSocket 连接 |
| [watermill](https://github.com/ThreeDotsLabs/watermill) | 战斗事件 pubsub（gochannel） |
| [protobuf](https://protobuf.dev/) | 战斗消息协议（`proto/fight_message.proto`） |
| [google/wire](https://github.com/google/wire) | 依赖注入（`cmd/wire.go` 生成 `cmd/wire_gen.go`） |
| [swaggo](https://github.com/swaggo/swag) | Swagger 文档（`/swagger/*`） |
| JWT（双令牌） | 认证 |

## 核心特性

- **双令牌认证**：Access Token（短期）+ Refresh Token（长期），Redis 记录 token 实现登出即失效
- **玩家数据缓存**：`PlayerDataManager` 以 Redis Hash 按字段缓存玩家数据（cache-aside），写操作只写 Redis，由定时调度器同步回 SQL
- **游戏内容管理**：角色 / 敌人 / 道具 / 技能 统一由 `GameContentManager` 管理（Redis 缓存 + SQL 同步），并提供管理端 CRUD
- **战斗系统**：WebSocket 接入，服务器权威状态机（技能校验 → 技能执行 → 敌方行动 → 胜负判定），pubsub 事件驱动底层伤害/治疗/buff 结算
- **全局状态机**：玩家在线状态（剧情/战斗/无事/移动）与角色队伍持久化，与玩家数据共用同一 Redis Hash
- **同步调度器**：`SyncScheduler` 周期性将 Redis 数据全量同步到 SQL（间隔可配置）
- **CLI 试玩客户端**：`cmd/play` 交互式命令行体验战斗流程

## 目录结构

```
DisembodiedSpecter/
├── cmd/
│   ├── main.go            # 服务入口（启动调度器 + HTTP）
│   ├── init.go            # 启动装配（Scheduler + Engine）
│   ├── wire.go            # Wire 依赖注入声明
│   ├── wire_gen.go        # Wire 生成代码
│   ├── mock/              # Mock 数据初始化工具（建库建表 + 种子数据）
│   └── play/              # 战斗试玩 CLI 客户端
├── internal/
│   ├── config/            # 配置加载（viper + yaml）
│   ├── domain/            # 领域模型（User/Player/Item/Character/Enemy/Tool/Skill/Email）
│   ├── dto/               # 请求/响应 DTO
│   ├── repository/        # GORM 仓储层 + 数据库初始化/自动迁移
│   ├── service/           # 业务用例（auth/user/admin/fight/global）
│   │   └── fight/         # 战斗引擎：状态机、技能、敌人、执行器、校验
│   │   └── global/        # 全局引擎与状态机
│   ├── handlers/          # Gin 处理器 + 路由
│   ├── filter/            # 认证/鉴权中间件
│   ├── eventbus/          # 泛型事件总线
│   └── utils/             # 工具：Redis 缓存、玩家数据、游戏内容、邮件、Token 等
├── proto/                 # 战斗 protobuf 定义与生成代码
├── docs/                  # Swagger 生成文档
├── config.yaml            # 配置文件
└── BATTLE_LOGIC.md        # 战斗系统设计与修复记录
```

## 快速开始

### 环境要求

- Go 1.26+
- PostgreSQL（默认 `localhost:5432`，账号密码见 `config.yaml`）
- Redis（默认 `localhost:6379`，db 1）

### 1. 配置

复制/编辑 `config.yaml`，按本机环境修改数据库与 Redis 连接：

```yaml
database:
  host: localhost
  port: 5432
  username: postgres
  password: your_password
  dbname: disembodied_specter

redis:
  init_addr: localhost:6379
  password: "your_redis_password"
  db: 1
```

### 2. 初始化 Mock 数据（可选，推荐试玩用）

自动创建数据库、迁移全部表结构（含索引）、写入种子数据：

```bash
go run ./cmd/mock
```

种子数据：`testuser / test123456`（管理员）、玩家（等级 10）、3 件道具、
角色「见习剑士」（HP 100）、敌人「根眼怪」（HP 50）、技能「初击」（角色 1），
并预置玩家的战斗队伍与对战 NPC（Redis）。

> 注意：`cmd/mock` 会重建开发库表并清空 Redis，仅用于开发环境。

### 3. 启动服务

```bash
go run ./cmd
```

服务启动时会自动执行 GORM 迁移（建表 + 索引），监听 `:8080`，
Swagger 文档地址：<http://localhost:8080/swagger/index.html>

### 4. 试玩战斗

```bash
go run ./cmd/play -server http://localhost:8080 -user testuser -pass test123456
```

CLI 命令：

```
<技能ID> <角色ID> <目标索引>   使用技能（如: 1 1 1，目标索引=敌方战斗位）
start                         开始阶段（敌方回合时触发敌方行动）
status                        请求服务器下发权威状态
help                          帮助
exit                          退出战斗
```

## 配置说明

`config.yaml`（环境变量可覆盖，键名忽略下划线大小写）：

| 配置 | 说明 | 默认 |
|---|---|---|
| `app.port` | HTTP 端口 | 8080 |
| `database.*` | PostgreSQL 连接 | localhost:5432 |
| `jwt.secret` | JWT 签名密钥 | 123456 |
| `jwt.expire` | Access Token 有效期（秒） | 1800 |
| `jwt.refresh_expire` | Refresh Token 有效期（秒） | 604800 |
| `redis.*` | Redis 连接 | localhost:6379, db 1 |
| `cache.base_key` | 缓存 key 前缀 | private:cache |
| `cache.expire` | 缓存默认过期（秒） | 604800 |
| `security.white_list` | 免认证路径（`path.Match` 模式） | /api/v1/*、/swagger/*、/api/ws/* |
| `security.security_handler` | 认证头名称 | Authorization |
| `security.security_header_prefix` | 认证头前缀 | "Bearer " |
| `sync.enabled` | 定时同步开关 | true |
| `sync.player_data_interval` | 同步间隔（秒） | 300 |

## 接口一览

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | `/api/v1/login` | 登录（username/password） | 免 |
| POST | `/api/v1/register` | 注册（邮箱验证码） | 免 |
| POST | `/api/v1/refresh` | 刷新令牌 | 免 |
| POST | `/api/v1/logout` | 登出（撤销双令牌） | 免 |
| GET | `/api/v2/ws-code` | 获取 WebSocket 连接码（缓存，同窗口内返回同一个 code） | Bearer |
| GET | `/api/v2/data` | 获取玩家数据 | Bearer |
| GET | `/api/ws/fight/:user_id/:ws_code` | 战斗 WebSocket（protobuf 消息） | ws-code |
| GET | `/api/v3/admin/*` | 管理端：用户/玩家/邮箱/统计/游戏内容 CRUD | Bearer + admin |
| GET | `/swagger/*any` | Swagger 文档 | 免 |

### 认证与连接流程

```
1. POST /api/v1/login          → access_token / refresh_token
2. GET  /api/v2/ws-code        （Authorization: Bearer <access_token>）→ wsCode
3. GET  /api/ws/fight/{user_id}/{ws_code}  （升级为 WebSocket）
```

- ws-code 写入 Redis 并带缓存：过期窗口内重复获取返回同一个 code；连接成功后即被消费删除
- Access Token 同时校验 JWT 签名与 Redis 存在性，登出后立即失效
- 战斗/全局 WebSocket 也支持携带 `Authorization: Bearer <access_token>`（`/api/ws/*` 白名单仅匹配单段路径）

## 数据存储设计

### 玩家数据（Redis Hash + SQL）

```
Key:  private:player:data:{playerID}   (HASH)
字段: description, level, exp, location(JSON), is_active,
      least_active_*, character_team(JSON []int), character_list(JSON []int),
      doing(int), doing_map(JSON map), bag:{itemID}(JSON)
```

- 读：cache-aside，miss 时从 SQL 加载并回填
- 写：仅写 Redis（`SetLevel`/`AddExp`/`AddItem`/`SetDoing`…），由 `SyncScheduler` 定时同步回 SQL
- 玩家退出时调用 `SetExpireOnExit` 设置 2 天 TTL

### 游戏内容（Redis Hash + SQL）

角色/敌人/道具/技能共用 `GameContentManager`，同一套 cache-aside 模式；
ID 由 Redis INCR 生成，管理端 CRUD 只写 Redis，由调度器同步到 SQL。

### 数据表与索引

服务启动时 `AutoMigrate` 全量建表：`users`、`players`、`items`、`player_items`、`emails`、
`characters`、`enemies`、`tools`、`skills`。关键索引：

- `users.name` / `users.email`（唯一）
- `characters.name` / `enemies.name` / `tools.name` / `skills.name`（唯一）
- `characters.owner_number`（角色归属查询）
- `skills.character_id`（角色技能组查询）
- `players.is_active`（在线统计）
- `player_items` 复合主键 `(player_id, item_id)` 覆盖 `WHERE player_id = ?`

## 战斗系统

架构、状态机、协议与校验规则详见 **[BATTLE_LOGIC.md](BATTLE_LOGIC.md)**，要点：

- 服务器持有权威状态（`Machine`），客户端上报状态不一致时服务器下发纠正
- 状态机：`Waiting（等待选择）→ MyRound（我方技能执行）→ OtherRound（敌方回合）→ Waiting`
- 技能校验：技能归属角色、角色在本场队伍、目标为合法战斗位索引、同角色本回合不可重复用技能、阶段门控
- 技能执行三阶段：`Init（主行动者）→ Listener（从行动者）→ Run（终结）`，反射注册缺失方法自动跳过
- 底层结算：pubsub 事件驱动各战斗位 `Actuator` 监听器（攻击/治疗/buff），带锁保护与血量下限
- 敌方回合：前端 `START_PHASE` 触发各敌方 `Action{id}Run`
- 胜负判定：我方全灭失败 / 敌方全灭胜利；`EXIT_FIGHT` 退出、`RETURN_PREV_PHASE` 回退阶段

## 已知限制与 TODO

- 战斗奖励结算（`settle.go` 为空）：未发放经验/掉落，可接入 `PlayerDataManager.AddExp/AddItem`
- 技能实现不完整：当前仅有 `Skill1Init` / `Skill2Listener` / `Action1Run`
- `CharacterSite.IsMainActionCharacter` 尚未填充，行动角色限制检查未生效
- 仅支持玩家 vs NPC（`battleSession.Player2ID` 恒为 -1），PVP 未实现
- 全局 WebSocket 路由（`GlobalConnect`）尚未注册到路由表
- 邮件发送依赖 SMTP 配置（`cmd/mock` 中的为占位数据）
