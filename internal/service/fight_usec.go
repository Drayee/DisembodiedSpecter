package service

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service/fight"
	"DisembodiedSpecter/internal/service/fight/buff"
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
	redis         rueidis.Client
	fighter       map[int]struct{}
	battleSession []*fight.BattleSession
	key           string

	// mu 保护 fighter / battleSession 的并发访问（多个连接同时接入/断开）
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
	fu.battleSession = append(fu.battleSession, &fight.BattleSession{
		Mu:        sync.RWMutex{},
		ID:        fmt.Sprintf("%d", len(fu.battleSession)),
		Player1ID: userID,
		Player2ID: -1,
	})
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

	// 战斗开始：启动全部战斗位的底层监听器（攻击/治疗/buff），并同步初始状态（计划步骤 1）
	if err := fightEngine.ActuatorListenerStart(machine); err != nil {
		log.Printf("启动战斗监听器失败: %v, userId %d", err, userID)
		return
	}
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
			// 校验全部技能：任一个不合法则整体拒绝（计划步骤 2）
			rejected := false
			for _, s := range skills {
				if checkErr := fightEngine.CheckChoseSkill(machine.Ctx, machine, s); checkErr != nil {
					log.Printf("选择技能被拒绝: %v, userId %d", checkErr, userID)
					rejected = true
					break
				}
			}
			if rejected {
				fu.sendFightStatus(ws, machine.Ctx, machine, userID)
				continue
			}
			// 应用技能（记录本回合使用）并执行：Listener（武装）→ Init → Run
			for _, s := range skills {
				fightEngine.ApplyChoseSkill(machine, s)
			}
			machine.StateNumber = structs.MyRound
			if err := fightEngine.RunSkillStart(skills, machine); err != nil {
				log.Printf("技能执行失败: %v, userId %d", err, userID)
			}
			// 结束我方回合：等事件结算完并停掉监听器。
			// 不推进 buff 时间——一个完整回合是"我方+敌方"，时间推进放在敌方回合结束时。
			fightEngine.EndRound(machine, false)
			machine.Round++
			machine.CharacterUsedSkill = map[int]int{} // 本回合技能记录已用完，重置
			// 胜负判定
			if ended, win := machine.CheckBattleEnd(); ended {
				machine.Ended = true
				machine.PlayerWin = win
				log.Printf("战斗结束: 玩家%s, userId %d", battleResultText(win), userID)
				fu.logBattleEnd(machine)
				fu.sendFightStatus(ws, machine.Ctx, machine, userID)
				continue
			}
			// 我方行动结束，进入敌方回合（前端发送 START_PHASE 触发敌方行动，计划步骤 6）
			machine.LastStateNumber = structs.Waiting
			machine.StateNumber = structs.OtherRound
			// 记账：回合推进（Round 已 +1，StateNumber 已是敌方回合）
			fu.logRound(machine)
			fu.sendFightStatus(ws, machine.Ctx, machine, userID)

		case *pd.FightMessage_SwitchPhase:
			phase := respMsg.GetSwitchPhase().Phase
			switch phase {
			case pd.Switch_Phase_Option_START_PHASE:
				switch machine.StateNumber {
				case structs.MyRound:
					// 我方技能阶段结束 → 回到等待选择
					machine.LastStateNumber = structs.MyRound
					machine.StateNumber = structs.Waiting
					fu.sendFightStatus(ws, machine.Ctx, machine, userID)
				case structs.OtherRound:
					// 敌方回合不跑技能阶段，但本回合的被动反应仍要生效
					// （例如"被攻击时追加攻击"），所以先用本回合技能集合重新武装监听器
					fightEngine.ArmRoundReactors(machine)
					fu.runEnemyRound(machine)
					// 结束敌方回合：这里是"我方+敌方"一个完整回合的收尾，
					// 因此由它推进 buff 时间（LossByTime 各扣 1 格）
					fightEngine.EndRound(machine, true)
					if ended, win := machine.CheckBattleEnd(); ended {
						machine.Ended = true
						machine.PlayerWin = win
						log.Printf("战斗结束: 玩家%s, userId %d", battleResultText(win), userID)
						fu.logBattleEnd(machine)
					}
					machine.LastStateNumber = structs.OtherRound
					machine.StateNumber = structs.Waiting
					if !machine.Ended {
						// 记账：一个完整回合（我方+敌方）收尾，回到等待选择
						fu.logRound(machine)
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

// logRound 记录一次回合/阶段推进（供客户端播回合提示）。
func (fu *FightUseCase) logRound(machine *structs.Machine) {
	machine.AppendLog(structs.FightLog{Type: structs.FightLogRound})
}

// logBattleEnd 记录战斗结束：Value 1=胜利 0=失败（供客户端播结算演出）。
func (fu *FightUseCase) logBattleEnd(machine *structs.Machine) {
	value := 0
	if machine.PlayerWin {
		value = 1
	}
	machine.AppendLog(structs.FightLog{Type: structs.FightLogEnd, Value: value})
}

// runEnemyRound 敌方回合：为每个敌方 NPC 执行其行动（Action{enemyID}Run）。
// id 为敌方战斗位索引，enemyID 为敌方 DB ID（用于查找行动注册表）。
func (fu *FightUseCase) runEnemyRound(machine *structs.Machine) {
	for _, eid := range machine.EnemyCharacterIDs {
		idx, ok := machine.EnemyCharacterIndex[eid]
		if !ok {
			continue
		}
		// 记账：敌方出手（目标是"由行动内部决定"的，日志里先记 -1，
		// 随后的 Attack 日志会带上真实目标）
		machine.AppendLog(structs.FightLog{
			Type:   structs.FightLogCast,
			Source: idx,
			Target: -1,
		})
		if err := fu.enemyManager.Run(idx, machine, eid); err != nil {
			log.Printf("敌方行动失败: %v", err)
		}
		// 该敌方单位行动完毕：发行动结束信号，让它身上 LossByAction 的 buff 各扣 1 格
		if err := buff.PublishActionTick(machine, idx); err != nil {
			log.Printf("敌方战斗位 %d 行动信号发布失败: %v", idx, err)
		}
	}
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
func (fu *FightUseCase) flushFightLogs(ws *websocket.Conn, ctx context.Context, machine *structs.Machine) error {
	logs := machine.DrainLogs()
	if len(logs) == 0 {
		return nil
	}

	pbLogs := make([]*pd.FightLog, 0, len(logs))
	for _, entry := range logs {
		pbLogs = append(pbLogs, &pd.FightLog{
			Seq:         int32(entry.Seq),
			Type:        pd.FightLogType(entry.Type),
			Source:      int32(entry.Source),
			Target:      int32(entry.Target),
			SkillId:     int32(entry.SkillID),
			BuffId:      int32(entry.BuffID),
			Value:       int32(entry.Value),
			HpBefore:    int32(entry.HPBefore),
			HpAfter:     int32(entry.HPAfter),
			Round:       int32(entry.Round),
			StateNumber: int32(entry.StateNumber),
			Text:        entry.Text,
		})
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

/* 战斗机制:
 * 1. 进入战斗(通过websocket连接): 后端通过playData初始化战斗状态,启动actuator监听器,并同步到前端
 * 2. 技能选择: 前端选择技能，服务器校验(技能归属/队伍/目标/重复使用/状态机阶段)并应用到战斗状态
 * 3. 技能运行: 校验通过后按序执行 Init(主行动者) → Listener(从行动者) → Run(终结技能)
 * 4. 我方行动结束: 服务器做胜负判定；未结束时自动进入敌方回合(StateNumber=OtherRound)并同步
 * 5. 敌方回合: 前端发送 START_PHASE，服务器调用各敌方 Action{id}Run 行动,再做胜负判定,回到 Waiting
 * 6. 未结束则重复 2-5；EXIT_FIGHT 退出战斗, RETURN_PREV_PHASE 恢复上一阶段状态
 */
