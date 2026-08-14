# Plan: JWT 双令牌 + Redis 集成

## 当前问题

| # | 问题 | 影响 |
|---|------|------|
| 1 | JWT 纯无状态，无 Redis 集成 | 无法实现登出、无法强制下线 |
| 2 | 单令牌模式（7天过期） | 令牌泄露后攻击者有 7 天窗口；缩短过期时间则用户体验差 |
| 3 | `RevokeToken` 是空桩 | 登出不生效 |
| 4 | 无刷新机制 | Access Token 过期后只能重新登录 |

## 方案：双令牌架构

### 令牌类型

| 类型 | 过期时间 | 用途 | 存储 |
|------|---------|------|------|
| Access Token | 30 分钟 | API 请求认证 | Redis: `jwt:access:{token}` → userID, TTL=1800s |
| Refresh Token | 7 天 | 仅用于刷新 Access Token | Redis: `jwt:refresh:{token}` → userID, TTL=604800s |

### 认证流程

```
1. 登录: POST /api/v1/login {username, password}
   → 验证密码 → 生成 access + refresh token → 存入 Redis → 返回双 token

2. API 请求: GET /api/v2/data (Authorization: Bearer {access_token})
   → AuthFilter 校验 JWT 签名 + 检查 Redis EXISTS jwt:access:{token} → 放行

3. 刷新: POST /api/v1/refresh {refresh_token}
   → 检查 Redis EXISTS jwt:refresh:{token} → 生成新 access token → 删除旧 refresh token → 存入新 token

4. 登出: POST /api/v1/logout
   → 从 Header 取 token → 检查 Redis 中该 token → 同时删除 access + refresh token → 返回成功
```

### 令牌 JWT Claims

Access Token:
```json
{"user_id": 1, "username": "tom", "type": "access", "exp": 1700000000, "iat": 1699998200}
```

Refresh Token:
```json
{"user_id": 1, "username": "tom", "type": "refresh", "exp": 1700000000, "iat": 1699400000}
```

Type 字段用于 AuthFilter 区分：`type=access` 可直接使用，`type=refresh` 仅能在 refresh 端点使用。

## 需要修改的文件

### 1. `internal/config/config_struct.go` — JwtConfig 扩展

新增两个字段：
```go
type JwtConfig struct {
    Secret       string
    Expire       int  // 保留，用于兼容（access token 过期时间）
    RefreshExpire int  // 新增，refresh token 过期时间
}
```

### 2. `config.yaml` — 配置更新

```yaml
jwt:
  secret: 123456
  expire: 1800          # access token 过期时间(秒)，30分钟
  refresh_expire: 604800  # refresh token 过期时间(秒)，7天
```

### 3. `internal/utils/auth_util.go` — 重写 TokenManager

TokenManager 新增 Redis 依赖：
```go
type TokenManager struct {
    *config.JwtConfig
    redis rueidis.Client
}

func NewTokenManager(redis rueidis.Client, cfg *config.Config) *TokenManager
```

新增方法：
- `GenerateTokens(userID int, username string) (accessToken string, refreshToken string, err error)` — 生成双令牌并存入 Redis
- `ValidateAccessToken(tokenString string) (int, string, error)` — 校验 access token（JWT + Redis 存在性检查）
- `ValidateRefreshToken(tokenString string) (int, string, error)` — 校验 refresh token
- `RefreshAccessToken(refreshToken string) (newAccessToken string, newRefreshToken string, err error)` — 刷新并轮换
- `RevokeToken(ctx context.Context, token string) error` — 删除 Redis 中的 token（同时查找该用户的 access token 并删除）

Redis Key 规则：
- `jwt:access:{token}` → userID, EX 1800
- `jwt:refresh:{token}` → userID, EX 604800

### 4. `internal/dto/request/user_req.go` — 新增 RefreshReq

```go
type RefreshReq struct {
    RefreshToken string `json:"refresh_token" binding:"required"`
}
```

### 5. `internal/dto/response/user_resp.go` — 新增 LoginResp

```go
type LoginResp struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int    `json:"expires_in"`  // access token 剩余秒数
}
```

### 6. `internal/service/auth_usec.go` — 改造

- `Login` 返回值从 `string` 改为 `*response.LoginResp`（含双 token）
- `Register` 返回值从 `string` 改为 `*response.LoginResp`
- 新增 `Refresh(ctx, refreshToken string) (*response.LoginResp, error)` 方法
- `Logout` 实现真正的 Redis 删除

### 7. `internal/handlers/auth_handle.go` — 改造

- `Login` handler: 返回 `response.LoginResp` 的 JSON
- `Register` handler: 返回 `response.LoginResp` 的 JSON
- 新增 `Refresh` handler
- `Logout` handler: 从 Authorization Header 取 access token，查找并删除对应的 refresh token

### 8. `internal/handlers/router.go` — 新增路由

```go
r.POST("/api/v1/refresh", authHandler.Refresh)
```

### 9. `internal/filter/auth_filter.go` — Redis 校验

`AuthRequired` 中，在 JWT 签名校验通过后，增加 Redis `EXISTS` 检查：
```go
// 检查 Redis 中 token 是否存在（防止已登出的 token 继续使用）
key := fmt.Sprintf("jwt:access:%s", tokenString)
existsCmd := redis.B().Exists().Key(key).Build()
exists, _ := redis.Do(c, existsCmd).AsInt64()
if exists == 0 {
    c.JSON(401, gin.H{"error": "token 已失效"})
    c.Abort()
    return
}
```

AuthFilter 新增 Redis 依赖：
```go
type AuthFilter struct {
    cfg          *config.Config
    tokenManager *utils.TokenManager
    redis        rueidis.Client
}
```

### 10. `cmd/wire.go` — 更新注入

- `utils.NewTokenManager` 签名变更（新增 redis 参数）
- `filter.NewAuthFilter` 签名变更（新增 redis 参数）

### 11. `cmd/wire_gen.go` — 重新生成

运行 wire 命令自动生成。

## 令牌轮换策略

每次刷新时：
1. 检查 refresh token 在 Redis 中是否存在
2. 生成新的 access token + refresh token
3. 删除旧的 refresh token（立即失效）
4. 存入新的 access + refresh token 到 Redis
5. 返回新的双 token

这样即使 refresh token 被窃取，攻击者也只能使用一次（轮换后旧 token 失效）。

## 边界情况处理

- **Refresh Token 被使用过（被盗）**：轮换机制确保旧 token 立即失效
- **Access Token 过期但 Refresh Token 仍有效**：客户端用 refresh 端点获取新 token
- **用户修改密码**：需要额外机制强制登出（可通过删除该用户所有 Redis token 实现，预留接口）
- **多设备登录**：同一用户不同设备可以有不同的 token 集，Redis 中存储多组 token
- **登出时同时删除两种 token**：通过 refresh token 查找并删除对应的 access token

## 风险

- Redis 单点故障：若 Redis 宕机，所有现有 token 立即失效。可通过 Redis Sentinel 或 Cluster 解决，非本次范围。
- Token 存储在 Redis 内存中，需确保 Redis 有足够内存。
