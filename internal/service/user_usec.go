package service

import (
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/utils"
	"math/rand"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
)

type UserUseCase struct {
	Redis             rueidis.Client
	Cache             *utils.CacheManager
	PlayerDataManager *utils.PlayerDataManager
}

func NewUserUseCase(redis rueidis.Client, cache *utils.CacheManager, pdm *utils.PlayerDataManager) *UserUseCase {
	return &UserUseCase{
		Redis:             redis,
		Cache:             cache,
		PlayerDataManager: pdm,
	}
}

func (u *UserUseCase) GetWsCode(c *gin.Context) (string, error) {
	val, _ := c.Get("userID")
	userID := val.(int)
	return utils.Fetch[string](u.Cache, c, "ws-code", strconv.Itoa(userID), 0, func() (string, error) {
		return strconv.Itoa(rand.Int()), nil
	})
}

func (u *UserUseCase) GetData(c *gin.Context) (*response.PlayerDataResp, error) {
	val, _ := c.Get("userID")
	userID := val.(int)
	return u.PlayerDataManager.GetPlayerData(c, userID)
}
