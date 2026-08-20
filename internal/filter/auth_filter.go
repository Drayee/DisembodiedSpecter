package filter

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/utils"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
)

type AuthFilter struct {
	cfg          *config.Config
	tokenManager *utils.TokenManager
}

func NewAuthFilter(cfg *config.Config, tokenManager *utils.TokenManager) *AuthFilter {
	return &AuthFilter{cfg: cfg, tokenManager: tokenManager}
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

		// JWT 签名 + 类型校验 + Redis 会话唯一码比对
		// （唯一码不一致说明已登出或被新登录顶替，token 立即失效）
		userID, username, role, err := tm.tokenManager.ValidateAccessToken(c, tokenString)
		if err != nil {
			response.FailUnauthorized(c, err.Error())
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
