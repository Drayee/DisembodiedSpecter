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
	key := u.Cache.Key("ws-code", strconv.Itoa(userID))

	// 缓存优先：同一过期窗口内返回同一个 ws-code（前端可能多次获取后再连接）
	getCmd := u.Redis.B().Get().Key(key).Build()
	cached, err := u.Redis.Do(c, getCmd).ToString()
	if err == nil && cached != "" {
		return cached, nil
	}
	if err != nil && !rueidis.IsRedisNil(err) {
		return "", err
	}

	// 未命中：生成新 code 并以原始字符串写入（不 JSON 序列化，
	// 供战斗/全局 WebSocket 服务按 "{baseKey}:ws-code:{userID}" 直接比对；
	// 连接消费后 key 被删除，下次调用会重新生成）
	code := strconv.Itoa(rand.Int())
	setCmd := u.Redis.B().Set().Key(key).Value(code).ExSeconds(u.Cache.TTLSeconds()).Build()
	if err := u.Redis.Do(c, setCmd).Error(); err != nil {
		return "", err
	}
	return code, nil
}

func (u *UserUseCase) GetData(c *gin.Context) (*response.PlayerDataResp, error) {
	val, _ := c.Get("userID")
	userID := val.(int)
	return u.PlayerDataManager.GetPlayerData(c, userID)
}
