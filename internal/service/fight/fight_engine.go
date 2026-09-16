package fight

import (
	actuator2 "DisembodiedSpecter/internal/service/fight/actuator"
	"DisembodiedSpecter/internal/service/fight/buff"
	"DisembodiedSpecter/internal/service/fight/character"
	"DisembodiedSpecter/internal/service/fight/enemy"
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"DisembodiedSpecter/proto/pd"
	"log"
	"time"
)

// 主循环读取最终数值前的同步参数。
const (
	// settleReadQuiet 空闲确认时长：事件全部结算完且连续空闲该时长，即可安全读取数值。
	// 没有待结算事件时立即返回，不产生固定等待（取代原先固定睡眠 20ms 的做法）。
	settleReadQuiet = 2 * time.Millisecond
	// settleReadStall 无进展容忍时长：仍有事件未结算、但连续该时长没有任何进展时，
	// 判定为"无人能结算的事件"并放行。取值远大于正常反应耗时（纯计算，亚毫秒级），
	// 因此既能容纳偶发的慢反应，又不会为异常事件把主循环卡到 timeout。
	settleReadStall = 300 * time.Millisecond
	// settleReadTimeout 同步的硬上限。
	settleReadTimeout = 2 * time.Second
)

type FightEngine struct {
	skillManger        *character.SkillManager
	enemyManager       *enemy.EnemyManager
	actuator           *actuator2.ActuatorManager
	gameContentManager *utils.GameContentManager
}

func NewFightEngine(skill *character.SkillManager, enemy *enemy.EnemyManager, gameContentManager *utils.GameContentManager) *FightEngine {
	return &FightEngine{
		skillManger:        skill,
		enemyManager:       enemy,
		gameContentManager: gameContentManager,
		actuator: actuator2.NewActuatorManager(
			gameContentManager,
		),
	}
}

// ActuatorListenerStart 为全部战斗位（我方 + 敌方）启动底层监听器。
// 传入的必须是战斗位索引（0..len(CharacterState)-1），而非角色 DB ID。
// pubsub 由 Machine 独占，这里不再透传。
func (fe *FightEngine) ActuatorListenerStart(machine *structs.Machine) error {
	ids := make([]int, len(machine.CharacterState))
	for i := range ids {
		ids[i] = i
	}
	return fe.actuator.StartListener(machine, ids)
}

// WaitSettled 等待本回合已发布的事件全部被响应并结算完成。
//
// 结算本身是"收到事件即结算"（由各战斗位的 actuator 负责，与主循环无关），
// 本方法只用于主循环在读取最终数值（胜负判定 / 下发状态）前做一次同步，
// 取代原先固定睡眠 20ms 的做法：事件都结算完就立即返回，没有任何固定等待。
func (fe *FightEngine) WaitSettled(machine *structs.Machine) bool {
	return machine.Events().WaitAllSettled(settleReadQuiet, settleReadStall, settleReadTimeout)
}

// EndRound 结束本回合：等事件结算完 → （可选）推进 buff 时间 → 停掉本回合全部监听器（真退订）。
//
// 顺序不能反：先停监听会让"还没打点"的事件失去反应者，负责它的 actuator
// 只能等 ReactionWaitTimeout 兜底，白等 100ms 并打告警日志；
// 而时间推进必须在停监听之前（buff 的反应者就是靠它扣时间的）。
//
// advanceTime 由调用方决定：一个完整回合是"我方行动 + 敌方行动"，
// 所以只在敌方回合结束时推进 buff 时间，否则同一次回合会扣两次。
func (fe *FightEngine) EndRound(machine *structs.Machine, advanceTime bool) {
	if !fe.WaitSettled(machine) {
		log.Printf("本回合事件未能全部结算，仍继续推进")
	}
	if advanceTime {
		// LossByTime 的 buff 在此各扣 1 格；到期会自行重算属性并退订。
		// PublishSignal 是同步的：返回时所有 buff 反应者都已处理完。
		if err := buff.PublishTimeTick(machine); err != nil {
			log.Printf("推进 buff 时间失败: %v", err)
		}
		if !fe.WaitSettled(machine) {
			log.Printf("buff 时间推进未能全部结算，仍继续推进")
		}
	}
	machine.StopReactors()
	machine.RoundSkills = nil
}

// ArmRoundReactors 武装本回合的监听器：技能监听器 + 已持有 buff 的监听器。
//
// 关键是"武装必须早于本回合任何事件发布"：否则事件会以"本回合要求的反应者数量"发出，
// 而那时监听器还没装上，反应者收不到、也就不会打点，被动技能会打不到主动技能的伤害。
// 因此 RunSkillStart 把 Listener 放在 Init 之前，敌方回合则在跑敌方行动前调用本方法重新武装。
//
// buff 监听器也要在这里补一次：回合结束会真退订所有反应者，
// 上一回合获得的 buff 必须在新回合重新装上（战斗中途获得时由 AddBuff 当场武装）。
func (fe *FightEngine) ArmRoundReactors(machine *structs.Machine) {
	for _, s := range machine.RoundSkills {
		if err := fe.skillManger.Listener(s.SkillID, machine, s.CharacterID, s.TargetID); err != nil {
			log.Printf("技能 %d Listener（武装）失败: %v", s.SkillID, err)
		}
	}
	buff.ArmHeldBuffs(machine)
}

// RunSkillStart 按顺序执行技能三阶段：Listener（武装本回合监听器）→ Init（主行动者）→ Run（终结）。
//
// Listener 必须排在 Init 前面：本回合的被动反应（如"追加攻击"）要先装上监听，
// 才能对 Init 阶段发出的伤害事件做出反应。任一阶段失败会记录并继续后续技能，
// 不中断整轮战斗。注意：本函数返回不代表数值已结算，需要同步时调用 WaitSettled。
//
// 这里**不再记"出手"日志**：出手动作由攻击事件自身承载（AttackLog.Source 就是出手方），
// 因此被动追加攻击天然也会播出手动画，无需单独的出手事件。
func (fe *FightEngine) RunSkillStart(skills []*pd.Skill, machine *structs.Machine) error {
	// 记下本回合的技能集合：敌方回合（不跑技能阶段）要照它重新武装
	machine.RoundSkills = make([]structs.ArmedSkill, 0, len(skills))
	for _, s := range skills {
		machine.RoundSkills = append(machine.RoundSkills, structs.ArmedSkill{
			SkillID:     int(s.GetSkillId()),
			CharacterID: int(s.GetCharacterId()),
			TargetID:    int(s.GetTargetId()),
		})
	}

	fe.ArmRoundReactors(machine)

	for _, s := range skills {
		if err := fe.skillManger.Init(int(s.GetSkillId()), machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Init 失败: %v", s.GetSkillId(), err)
		}
	}
	// 主行动者行动完毕：发行动结束信号，让 LossByAction 的 buff 各扣 1 格。
	// 同一角色本回合用了多个技能也只算一次行动。
	fe.PublishActionTicks(machine, skills)
	for _, s := range skills {
		if err := fe.skillManger.Run(int(s.GetSkillId()), machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Run 失败: %v", s.GetSkillId(), err)
		}
	}
	return nil
}

// PublishActionTicks 为本次行动的角色发布"行动结束"信号（每个角色一次）。
func (fe *FightEngine) PublishActionTicks(machine *structs.Machine, skills []*pd.Skill) {
	acted := make(map[int]bool, len(skills))
	for _, s := range skills {
		index, ok := machine.SelfCharacterIndex[int(s.GetCharacterId())]
		if !ok || acted[index] {
			continue
		}
		acted[index] = true
		if err := buff.PublishActionTick(machine, index); err != nil {
			log.Printf("战斗位 %d 行动信号发布失败: %v", index, err)
		}
	}
}
