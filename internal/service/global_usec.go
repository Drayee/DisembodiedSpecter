package service

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service/global"
	"DisembodiedSpecter/internal/utils"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
)

type GlobalUseCase struct {
	gameContentManager *utils.GameContentManager
	playerDataManager  *utils.PlayerDataManager
	globalEngine       *global.GlobalEngine
	redis              rueidis.Client
	player             map[int]struct{}

	key      string // ws-code 缓存 key 前缀
	stateKey string
}

func NewGlobalUseCase(gameContentManager *utils.GameContentManager, playerDataManager *utils.PlayerDataManager, globalEngine *global.GlobalEngine, redis rueidis.Client, cfg *config.Config) *GlobalUseCase {
	return &GlobalUseCase{
		gameContentManager: gameContentManager,
		playerDataManager:  playerDataManager,
		globalEngine:       globalEngine,
		redis:              redis,
		key:                fmt.Sprintf("%s:ws-code", cfg.Cache.BaseKey),
		stateKey:           "global-state",
	}
}

// Connect 建立全局状态 WebSocket 连接：
// 1. 校验并消费 ws-code；2. 加载玩家的全局状态机（Machine，与 player_data_util 对齐）；
// 3. 保持连接直至断开，断开时写回状态机并设置玩家数据过期。
func (g *GlobalUseCase) Connect(c *gin.Context, userID int, wsCode string) {
	// 1. 校验 ws-code（与战斗连接保持一致）
	varifyCode, cErr := g.redis.Do(c, g.redis.B().Get().Key(fmt.Sprintf("%s:%d", g.key, userID)).Build()).ToString()
	if cErr != nil {
		response.FailServer(c, cErr.Error())
		return
	}
	if varifyCode != wsCode {
		response.FailServer(c, "ws-code 无效")
		return
	}
	if dErr := g.redis.Do(c, g.redis.B().Del().Key(fmt.Sprintf("%s:%d", g.key, userID)).Build()).Error(); dErr != nil {
		response.FailServer(c, dErr.Error())
		return
	}
	if _, ok := g.player[userID]; ok {
		response.FailServer(c, "用户已连接")
		return
	}

	g.player[userID] = struct{}{}

	// 2. 加载玩家的全局状态机
	machine, err := g.globalEngine.GetMachine(c, userID)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	log.Printf("[Global] 玩家 %d 接入，状态机加载完成: doing=%d level=%d exp=%d", userID, machine.Doing, machine.Level, machine.Exp)

	// 3. 升级为 WebSocket
	ws, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}

	// 断开时：写回状态机、移除在线实例、设置玩家数据 2 天过期
	defer func() {
		disconnectCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if sErr := g.globalEngine.Disconnect(disconnectCtx, userID); sErr != nil {
			log.Printf("[Global] 玩家 %d 状态机保存失败: %v", userID, sErr)
		}
		if eErr := g.playerDataManager.SetExpireOnExit(disconnectCtx, userID); eErr != nil {
			log.Printf("[Global] 玩家 %d 设置数据过期失败: %v", userID, eErr)
		}
		_ = ws.Close(websocket.StatusNormalClosure, "连接关闭")
	}()

	for {
		msgType, msg, err := ws.Read(c)
		if err != nil {
			if websocket.CloseStatus(err) == websocket.StatusNormalClosure ||
				websocket.CloseStatus(err) == websocket.StatusGoingAway {
				log.Printf("[Global] 客户端正常断开连接, userId %d", userID)
			} else {
				log.Printf("[Global] 读取消息错误或异常断开: %v, userId %d", err, userID)
			}
			break
		}
		_ = msgType
		_ = msg
		// TODO: 在这里分发全局消息（移动 / 剧情 / 状态查询等），
		// 通过 g.globalEngine.EnterState / SaveMachine 更新并持久化 Machine
	}
}
