package service

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/utils"
	"DisembodiedSpecter/proto/pd"
	"fmt"
	"log"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
	"google.golang.org/protobuf/proto"
)

type FightUseCase struct {
	redis              rueidis.Client
	gameContentManager *utils.GameContentManager
	fighter            map[int]struct{}
	key                string
}

func NewFightUseCase(redis rueidis.Client, config *config.Config, gameContentManager *utils.GameContentManager) *FightUseCase {
	return &FightUseCase{redis: redis, gameContentManager: gameContentManager, fighter: make(map[int]struct{}), key: fmt.Sprintf("%s:ws-code", config.Cache.BaseKey)}
}

func (fu *FightUseCase) Connect(c *gin.Context, userID int, wsCode string) {
	varifyCode, cErr := fu.redis.Do(c, fu.redis.B().Get().Key(fmt.Sprintf("%s:%d", fu.key, userID)).Build()).ToString()
	if cErr != nil {
		response.FailServer(c, cErr.Error())
		return
	}
	if varifyCode != wsCode {
		response.FailServer(c, "ws-code 无效")
		return
	}
	if dErr := fu.redis.Do(c, fu.redis.B().Del().Key(fmt.Sprintf("%s:%d", fu.key, userID)).Build()).Error(); dErr != nil {
		response.FailServer(c, dErr.Error())
		return
	}
	if _, ok := fu.fighter[userID]; ok {
		response.FailServer(c, "用户已连接")
		return
	}

	fu.fighter[userID] = struct{}{}

	ws, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}

	// 确保连接在函数退出时关闭
	defer func(ws *websocket.Conn, code websocket.StatusCode, reason string) {
		err := ws.Close(code, reason)
		if err != nil {
			response.FailServer(c, err.Error())
		}
	}(ws, websocket.StatusInternalError, "内部服务器错误")

	for {
		msgType, msg, err := ws.Read(c)
		if err != nil {
			if websocket.CloseStatus(err) == websocket.StatusNormalClosure ||
				websocket.CloseStatus(err) == websocket.StatusGoingAway {
				log.Printf("客户端正常断开连接, userId %d", userID)
			} else {
				log.Printf("读取消息错误或异常断开: %v, userId %d", err, userID)
			}
			break
		}

		if msgType == websocket.MessageBinary {
			var respMsg pd.FightMessage
			if err := proto.Unmarshal(msg, &respMsg); err != nil {
				log.Fatalf("failed to unmarshal response: %v", err)
			}
			switch respMsg.Payload.(type) {
			case *pd.FightMessage_SyncFightStatus:
				// 处理同步战斗状态

			case *pd.FightMessage_ChoseSkill:
				// 处理选择技能

			}
		}
	}

	e := ws.Close(websocket.StatusNormalClosure, "处理完毕")
	if e != nil {
		response.FailServer(c, e.Error())
		return
	}
}
