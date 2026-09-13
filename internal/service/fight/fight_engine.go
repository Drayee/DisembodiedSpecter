package fight

import (
	"DisembodiedSpecter/internal/service/fight/character"
	"DisembodiedSpecter/internal/service/fight/enemy"
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"DisembodiedSpecter/proto/pd"
	"log"
	"time"

	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
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
	actuator           *ActuatorManager
	gameContentManager *utils.GameContentManager
}

func NewFightEngine(skill *character.SkillManager, enemy *enemy.EnemyManager, gameContentManager *utils.GameContentManager) *FightEngine {
	return &FightEngine{
		skillManger:        skill,
		enemyManager:       enemy,
		gameContentManager: gameContentManager,
		actuator: NewActuatorManager(
			gameContentManager,
		),
	}
}

// ActuatorListenerStart 为全部战斗位（我方 + 敌方）启动底层监听器。
// 传入的必须是战斗位索引（0..len(CharacterState)-1），而非角色 DB ID。
func (fe *FightEngine) ActuatorListenerStart(pubSub *gochannel.GoChannel, machine *structs.Machine) error {
	ids := make([]int, len(machine.CharacterState))
	for i := range ids {
		ids[i] = i
	}
	return fe.actuator.StartListener(pubSub, machine, ids)
}

// WaitSettled 等待本回合已发布的事件全部被响应并结算完成。
//
// 结算本身是"收到事件即结算"（由各战斗位的 actuator 负责，与主循环无关），
// 本方法只用于主循环在读取最终数值（胜负判定 / 下发状态）前做一次同步，
// 取代原先固定睡眠 20ms 的做法：事件都结算完就立即返回，没有任何固定等待。
func (fe *FightEngine) WaitSettled(machine *structs.Machine) bool {
	return machine.Gate().WaitAllSettled(settleReadQuiet, settleReadStall, settleReadTimeout)
}

// RunSkillStart 按顺序执行技能三阶段：Init（主行动者）→ Listener（从行动者）→ Run（终结）。
// 任一阶段失败会记录并继续后续技能，不中断整轮战斗。
// 注意：本函数返回不代表数值已结算，需要同步时调用 WaitSettled。
func (fe *FightEngine) RunSkillStart(skills []*pd.Skill, pubSub *gochannel.GoChannel, machine *structs.Machine) error {
	for _, s := range skills {
		if err := fe.skillManger.Init(int(s.GetSkillId()), pubSub, machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Init 失败: %v", s.GetSkillId(), err)
		}
	}
	for _, s := range skills {
		if err := fe.skillManger.Listener(int(s.GetSkillId()), pubSub, machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Listener 失败: %v", s.GetSkillId(), err)
		}
	}
	for _, s := range skills {
		if err := fe.skillManger.Run(int(s.GetSkillId()), machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Run 失败: %v", s.GetSkillId(), err)
		}
	}
	return nil
}
