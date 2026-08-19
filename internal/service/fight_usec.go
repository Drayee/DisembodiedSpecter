package service

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service/fight"
	"DisembodiedSpecter/internal/service/fight/character"
	"DisembodiedSpecter/internal/service/fight/enemy"
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"DisembodiedSpecter/proto/pd"
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
	"google.golang.org/protobuf/proto"
)

type FightUseCase struct {
	redis         rueidis.Client
	fighter       map[int]struct{}
	battleSession []*fight.BattleSession
	key           string

	gameContentManager *utils.GameContentManager
	playerDataManager  *utils.PlayerDataManager
	skillManager       *character.SkillManager
	enemyManager       *enemy.EnemyManager
}

func NewFightUseCase(redis rueidis.Client,
	config *config.Config,
	gameContentManager *utils.GameContentManager,
	playerDataManager *utils.PlayerDataManager,
	skillManager *character.SkillManager,
	enemyManager *enemy.EnemyManager) *FightUseCase {
	return &FightUseCase{redis: redis, gameContentManager: gameContentManager, playerDataManager: playerDataManager, fighter: make(map[int]struct{}), key: fmt.Sprintf("%s:ws-code", config.Cache.BaseKey), skillManager: skillManager, enemyManager: enemyManager}
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
	fu.battleSession = append(fu.battleSession, &fight.BattleSession{
		Mu:        sync.RWMutex{},
		ID:        fmt.Sprintf("%d", len(fu.battleSession)),
		Player1ID: userID,
		Player2ID: -1,
	})

	// 创建并初始化战斗状态机（从玩家数据加载队伍与对战 NPC），加载阶段带超时
	loadCtx, loadCancel := context.WithTimeout(context.Background(), 10*time.Second)
	machine, err := structs.NewMachine(loadCtx, fu.playerDataManager, fu.gameContentManager, userID)
	loadCancel()
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}

	// 战斗上下文独立于 HTTP 请求：请求结束（gin 取消）不会误杀长期存活的 Machine，
	// 连接断开时由 cancelBattle 统一取消（同时终止 pubsub 订阅等监听）
	battleCtx, cancelBattle := context.WithCancel(context.Background())
	machine.Ctx = battleCtx
	defer cancelBattle()

	fightEngine := fight.NewFightEngine(
		fu.skillManager,
		fu.enemyManager,
		fu.gameContentManager,
	)

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
				log.Printf("反序列化战斗消息失败: %v, userId %d", err, userID)
				continue
			}
			switch respMsg.Payload.(type) {
			case *pd.FightMessage_SyncFightStatus:
				// 检测前端上报的战斗状态是否正确，是否需要同步
				syncMsg := respMsg.GetSyncFightStatus()
				needSync, checkErr := fightEngine.CheckSyncFightStatus(machine, syncMsg)
				if checkErr != nil {
					log.Printf("同步状态检测失败: %v, userId %d", checkErr, userID)
					continue
				}
				if needSync {
					log.Printf("前端战斗状态与服务器不一致，下发权威状态, userId %d", userID)
					fu.sendFightStatus(ws, c, machine, userID)
				}

			case *pd.FightMessage_ChoseSkill:
				// 检测所选技能是否属于在使用的角色，且一个角色不能同时使用两个技能
				skillMsg := respMsg.GetChoseSkill()
				for _, skill := range skillMsg.Skills {
					if checkErr := fightEngine.CheckChoseSkill(c, machine, skill); checkErr != nil {
						log.Printf("选择技能被拒绝: %v, userId %d", checkErr, userID)
						// 校验失败：拒绝该操作，并向客户端同步一次权威状态以纠正前端
						fu.sendFightStatus(ws, c, machine, userID)
						continue
					}
					fightEngine.ApplyChoseSkill(machine, skill)
				}

			}
		}
	}

	e := ws.Close(websocket.StatusNormalClosure, "处理完毕")
	if e != nil {
		response.FailServer(c, e.Error())
		return
	}
}

// sendFightStatus 向客户端下发服务器权威战斗状态（用于纠正前端或主动同步）
func (fu *FightUseCase) sendFightStatus(ws *websocket.Conn, ctx context.Context, machine *structs.Machine, userID int) {
	status := fight.BuildFightStatus(machine)
	respMsg := &pd.FightMessage{
		Timestamp: time.Now().UnixMilli(),
		Payload: &pd.FightMessage_SyncFightStatus{
			SyncFightStatus: &pd.Msg_SyncFightStatus{
				Status:    status,
				Timestamp: time.Now().UnixMilli(),
			},
		},
	}
	data, err := proto.Marshal(respMsg)
	if err != nil {
		log.Printf("序列化战斗状态失败: %v, userId %d", err, userID)
		return
	}
	if err := ws.Write(ctx, websocket.MessageBinary, data); err != nil {
		log.Printf("下发战斗状态失败: %v, userId %d", err, userID)
	}
}
