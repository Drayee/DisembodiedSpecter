package handlers

import (
	_ "DisembodiedSpecter/docs"
	"DisembodiedSpecter/internal/filter"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter(authHandler *AuthHandler, userHandler *UserHandler, adminHandler *AdminHandler, authFilter *filter.AuthFilter, websocketHandler *WebSocketHandler) *gin.Engine {
	r := gin.Default()
	r.Use(authFilter.AuthRequired())

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 认证路由（白名单，无需 token）
	r.POST("/api/v1/login", authHandler.Login)
	r.POST("/api/v1/register", authHandler.Register)
	r.POST("/api/v1/refresh", authHandler.Refresh)
	r.POST("/api/v1/logout", authHandler.Logout)

	// 用户路由（需认证）
	r.GET("/api/v2/ws-code", userHandler.WSCode)
	r.GET("/api/v2/data", userHandler.GetData)

	// 战斗路由（无需认证）
	r.GET("/api/ws/fight", websocketHandler.FightConnect)

	// 管理员路由（需认证 + 管理员权限）
	admin := r.Group("/api/v3/admin", authFilter.AdminRequired())
	{
		// 用户管理
		admin.GET("/users/list", adminHandler.GetUserList)
		admin.PUT("/users/:id/role", adminHandler.UpdateUserRole)
		admin.PUT("/users/:id/disable", adminHandler.DisableUser)
		admin.PUT("/users/:id/enable", adminHandler.EnableUser)

		// 玩家管理
		admin.GET("/players/list", adminHandler.GetPlayerList)
		admin.GET("/players/:id", adminHandler.GetPlayerDetail)
		admin.PUT("/players/:id/ban", adminHandler.BanPlayer)
		admin.PUT("/players/:id/unban", adminHandler.UnbanPlayer)
		admin.PUT("/players/:id/level", adminHandler.UpdatePlayerLevel)
		admin.PUT("/players/:id/exp", adminHandler.UpdatePlayerExp)

		// 数据统计
		admin.GET("/stats/overview", adminHandler.GetStatsOverview)
		admin.GET("/stats/online", adminHandler.GetStatsOnline)
		admin.GET("/stats/items", adminHandler.GetStatsItems)

		// 系统配置
		admin.GET("/config/emails", adminHandler.GetEmailList)
		admin.PUT("/config/emails/:id", adminHandler.UpdateEmail)

		// 游戏内容管理 - 角色
		admin.GET("/game/characters/list", adminHandler.GetCharacterList)
		admin.GET("/game/characters/:id", adminHandler.GetCharacterDetail)
		admin.POST("/game/characters", adminHandler.CreateCharacter)
		admin.PUT("/game/characters/:id", adminHandler.UpdateCharacter)

		// 游戏内容管理 - 敌人
		admin.GET("/game/enemies/list", adminHandler.GetEnemyList)
		admin.GET("/game/enemies/:id", adminHandler.GetEnemyDetail)
		admin.POST("/game/enemies", adminHandler.CreateEnemy)
		admin.PUT("/game/enemies/:id", adminHandler.UpdateEnemy)

		// 游戏内容管理 - 道具
		admin.GET("/game/tools/list", adminHandler.GetToolList)
		admin.GET("/game/tools/:id", adminHandler.GetToolDetail)
		admin.POST("/game/tools", adminHandler.CreateTool)
		admin.PUT("/game/tools/:id", adminHandler.UpdateTool)

		// 游戏内容管理 - 技能
		admin.GET("/game/skills/list", adminHandler.GetSkillList)
		admin.GET("/game/skills/:id", adminHandler.GetSkillDetail)
		admin.POST("/game/skills", adminHandler.CreateSkill)
		admin.PUT("/game/skills/:id", adminHandler.UpdateSkill)
	}

	return r
}
