package service

import (
	"DisembodiedSpecter/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
)

type GlobalUseCase struct {
	gameContentManager *utils.GameContentManager
	playerDataManager *utils.PlayerDataManager
	redis             rueidis.Client

	stateKey          string
}

func NewGlobalUseCase(gameContentManager *utils.GameContentManager, playerDataManager *utils.PlayerDataManager, redis rueidis.Client) *GlobalUseCase {
	return &GlobalUseCase{
		gameContentManager: gameContentManager,
		playerDataManager: playerDataManager,
		redis:             redis,
		stateKey:          "global-state",
	}
}

func (g *GlobalUseCase) Connect(c *gin.Context, userID int, wsCode string) {
	// 连接全局状态
}
