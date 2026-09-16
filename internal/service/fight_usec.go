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
	"log/slog"
	"sync"
	"time"

	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
	"google.golang.org/protobuf/proto"
)

// maxFightMessageSize 单条战斗消息上限（防内存 DoS）
const maxFightMessageSize = 1 << 20 // 1MB

type FightUseCase struct {
	redis   rueidis.Client
	fighter map[int]struct{}
	key     string

	// mu 保护 fighter 的并发访问（多个连接同时接入/断开）
	mu sync.Mutex

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

	fu.mu.Lock()
	if _, ok := fu.fighter[userID]; ok {
		fu.mu.Unlock()
		response.FailServer(c, "用户已连接")
		return
	}
	fu.fighter[userID] = struct{}{}
	fu.mu.Unlock()
	// 断开时清理在线标记，保证玩家可以重连
	defer func() {
		fu.mu.Lock()
		delete(fu.fighter, userID)
		fu.mu.Unlock()
	}()

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

	// 战斗级 pubsub：整场战斗唯一一个，交给 Machine 独占接管（其它位置拿不到它）。
	// 发布只能走 machine.PublishPayload（内部生成事件 ID 并打反应版本戳），
	// actuator 订阅走 machine.Subscribe，因此不会出现"绕过版本戳"的事件。
	battlePubSub := gochannel.NewGoChannel(gochannel.Config{}, watermill.NewSlogLogger(slog.Default()))
	machine.AttachPubSub(battlePubSub)
	defer func() {
		_ = machine.CloseEvents()
	}()

	ws, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}

	// 正常关闭标记：EXIT_FIGHT 或连接正常结束时置位，
	// 此时关闭帧使用 StatusNormalClosure，避免给客户端发"内部服务器错误"
	normalClose := false
	defer func(ws *websocket.Conn) {
		code := websocket.StatusInternalError
		reason := "内部服务器错误"
		if normalClose {
			code = websocket.StatusNormalClosure
			reason = "处理完毕"
		}
		if err := ws.Close(code, reason); err != nil {
			log.Printf("关闭 WebSocket 失败: %v, userId %d", err, userID)
		}
	}(ws)

	// 战斗开始：启动全部战斗位的底层监听器（攻击/治疗/buff），
	// 进入第 1 回合（Round 语义 = 当前正在进行的回合），并同步初始状态
	if err := fightEngine.ActuatorListenerStart(machine); err != nil {
		log.Printf("启动战斗监听器失败: %v, userId %d", err, userID)
		return
	}
	fightEngine.BeginRound(machine)
	fu.sendFightStatus(ws, machine.Ctx, machine, userID)

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

		if msgType != websocket.MessageBinary {
			continue
		}
		if len(msg) > maxFightMessageSize {
			log.Printf("战斗消息过大(%d 字节)，已忽略, userId %d", len(msg), userID)
			continue
		}

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
				fu.sendFightStatus(ws, machine.Ctx, machine, userID)
			}

		case *pd.FightMessage_ChoseSkill:
			skills := respMsg.GetChoseSkill().GetSkills()
			if len(skills) == 0 {
				log.Printf("未选择技能, userId %d", userID)
				continue
			}
			// 我方回合的全部流程（校验 → 执行 → 收尾 → 胜负 → 转敌方回合）都在 fight 包里，
			// 这里只负责把结果同步给客户端。
			result := fightEngine.PlayerRound(machine, skills)
			if result.Rejected {
				log.Printf("选择技能被拒绝: %s, userId %d", result.Reason, userID)
			} else if result.Ended {
				log.Printf("战斗结束: 玩家%s, userId %d", battleResultText(result.PlayerWin), userID)
			}
			fu.sendFightStatus(ws, machine.Ctx, machine, userID)

		case *pd.FightMessage_SwitchPhase:
			phase := respMsg.GetSwitchPhase().Phase
			switch phase {
			case pd.Switch_Phase_Option_START_PHASE:
				switch machine.StateNumber {
				case structs.MyRound:
					// 我方技能阶段结束 → 回到等待选择。
					// 正常流程不会走到这里（PlayerRound 会直接把状态推到 OtherRound），
					// 只有客户端重复发 START_PHASE 时才可能命中，做兜底处理。
					machine.LastStateNumber = structs.MyRound
					machine.StateNumber = structs.Waiting
					fu.sendFightStatus(ws, machine.Ctx, machine, userID)
				case structs.OtherRound:
					result := fightEngine.EnemyRound(machine)
					if result.Ended {
						log.Printf("战斗结束: 玩家%s, userId %d", battleResultText(result.PlayerWin), userID)
					}
					fu.sendFightStatus(ws, machine.Ctx, machine, userID)
				default:
					// Waiting：空闲阶段，仅同步
					fu.sendFightStatus(ws, machine.Ctx, machine, userID)
				}
			case pd.Switch_Phase_Option_EXIT_FIGHT:
				log.Printf("玩家 %d 退出战斗", userID)
				normalClose = true
				return
			case pd.Switch_Phase_Option_RETURN_PREV_PHASE:
				// 回到上一阶段（恢复上一状态编号；复杂回滚需快照，暂未实现）
				machine.StateNumber = machine.LastStateNumber
				fu.sendFightStatus(ws, machine.Ctx, machine, userID)
			default:
				log.Printf("未知的战斗阶段: %v, userId %d", phase, userID)
			}
		}
	}

	// 连接正常结束，由 deferred close 发送正常关闭帧
	normalClose = true
}

// sendFightStatus 向客户端下发服务器权威战斗状态（用于纠正前端或主动同步）。
//
// 顺序约定：**先发本批战斗日志、再发状态快照**。客户端因此总能"先按日志演完动画、
// 再把权威状态落位"；反过来（先状态后日志）前端就只能在演出结束后才拿到数值，
// 血条与飘字必然对不上。
func (fu *FightUseCase) sendFightStatus(ws *websocket.Conn, ctx context.Context, machine *structs.Machine, userID int) {
	// 先把待下发的日志冲刷出去（DrainLogs 取走即清空，保证同一批事件只播一次）
	if err := fu.flushFightLogs(ws, ctx, machine); err != nil {
		log.Printf("下发战斗日志失败: %v, userId %d", err, userID)
	}

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

// flushFightLogs 把本机已记录的战斗日志打包下发给客户端；没有日志时什么都不发。
//
// 日志 → protocol 的字段转换在 fight.BuildFightLogs 里（那才是它的属主），
// 这里只负责收发。
func (fu *FightUseCase) flushFightLogs(ws *websocket.Conn, ctx context.Context, machine *structs.Machine) error {
	pbLogs := fight.BuildFightLogs(machine.DrainLogs())
	if len(pbLogs) == 0 {
		return nil
	}

	respMsg := &pd.FightMessage{
		Timestamp: time.Now().UnixMilli(),
		Payload: &pd.FightMessage_FightLogs{
			FightLogs: &pd.S2C_FightLogs{Logs: pbLogs},
		},
	}
	data, err := proto.Marshal(respMsg)
	if err != nil {
		return fmt.Errorf("序列化战斗日志失败: %w", err)
	}
	return ws.Write(ctx, websocket.MessageBinary, data)
}

// battleResultText 战斗结果文案
func battleResultText(playerWin bool) string {
	if playerWin {
		return "胜利"
	}
	return "失败"
}

/* 战斗机制（本文件只负责连接与协议收发，流程编排在 fight 包）:
 * 1. 连接:  校验并消费 ws-code → 建 Machine（队伍 + 对战 NPC）→ 起 actuator 监听器
 *           → fightEngine.BeginRound（进入第 1 回合）→ 下发初始权威状态
 * 2. 选技能: C2S_ChoseSkills → fightEngine.PlayerRound（校验→执行三阶段→收尾→胜负→转敌方回合）
 * 3. 敌方回合: 前端发 START_PHASE → fightEngine.EnemyRound（重新武装→敌方行动→推进 buff 时间→胜负
 *           →回到 Waiting 并进入下一回合）
 * 4. 每次下发状态前，先把本批战斗日志冲刷出去（先日志、后快照）
 * 5. EXIT_FIGHT 退出战斗；RETURN_PREV_PHASE 恢复上一阶段状态
 */
