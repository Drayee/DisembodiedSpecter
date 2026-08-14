package filter

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/utils"
	"fmt"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
)

type AuthFilter struct {
	cfg          *config.Config
	tokenManager *utils.TokenManager
	redis        rueidis.Client
}

func NewAuthFilter(cfg *config.Config, tokenManager *utils.TokenManager, redis rueidis.Client) *AuthFilter {
	return &AuthFilter{cfg: cfg, tokenManager: tokenManager, redis: redis}
}

func (tm *AuthFilter) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		whiteList := tm.cfg.Security.WhiteList
		for _, item := range whiteList {
			if i, _ := path.Match(item, c.Request.URL.Path); i {
				c.Next()
				return
			}
		}
		authHeader := c.Request.Header.Get(tm.cfg.Security.SecurityHandler)
		if authHeader == "" {
			response.FailUnauthorized(c, "未提供 token")
			c.Abort()
			return
		}
		tokenString := strings.TrimPrefix(authHeader, tm.cfg.Security.SecurityHeaderPrefix)

		// JWT 签名 + 类型校验
		userID, username, role, err := tm.tokenManager.ValidateAccessToken(tokenString)
		if err != nil {
			response.FailUnauthorized(c, err.Error())
			c.Abort()
			return
		}

		// Redis 存在性检查（防止已登出的 token 继续使用）
		key := fmt.Sprintf("jwt:access:%s", tokenString)
		existsCmd := tm.redis.B().Exists().Key(key).Build()
		exists, err := tm.redis.Do(c, existsCmd).AsInt64()
		if err != nil || exists == 0 {
			response.FailUnauthorized(c, "token 已失效")
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Set("username", username)
		c.Set("role", role)
		c.Next()
	}
}

// AdminRequired 管理员权限校验中间件，需在 AuthRequired 之后使用
func (tm *AuthFilter) AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != domain.UserRoleAdmin {
			response.Fail(c, 403, response.CodeForbidden, "无管理员权限")
			c.Abort()
			return
		}
		c.Next()
	}
}
