package character

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"

	"github.com/ThreeDotsLabs/watermill/message"
)

// 战斗内的一切"计数"都必须走 machine.AddCounter / SetCounter（见 structs/fight_log.go）：
// 它们是唯一写入口，内部会自动记一条 Counter 日志，前端据此更新计数/层数显示。
// 这两个函数要求**调用方已持有 machine.Mu**（Counters 会被 BuildFightStatus 在读锁下遍历）。
//
// Ref 是"这一下的来源"，用 structs.RefSkill(N) 标注技能 ID，
// 它会一路透传进战斗日志，客户端据此区分"技能打的"和"被动补的"。

// Skill1 技能1 伤害
// 主动行动: 造成对方2点的单体伤害
func (sm *SkillManager) Skill1Init(machine *structs.Machine, selfId int, otherId int) {
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   2,
		TargetID: otherId,
		SourceID: selfId,
		Other:    "{\"type\":\"none\"}",
		Ref:      structs.RefSkill(1),
	})
	// PublishPayload 会生成事件 ID 并打上"本次要求几个反应者打点"的版本戳，
	// actuator 收到后会先等这些反应者处理完再结算
	if err := machine.PublishPayload("fight-attack", jsonBytes); err != nil {
		return
	}
}

// Skill2 技能2 追加攻击
// 被动行动: 当我方攻击时，追加我方伤害的一半
func (sm *SkillManager) Skill2Init(machine *structs.Machine, selfId int, otherId int) {
	machine.Mu.Lock()
	machine.SetCounter("limit:skill2", 0, structs.RefSkill(2))
	machine.Mu.Unlock()
}

func (sm *SkillManager) Skill2Listener(machine *structs.Machine, selfId int, otherId int) {
	// RegisterReactor 按 key 幂等注册：整场战斗只订阅一次，重复调用只更新本回合的
	// 目标上下文（selfId/otherId），不会新增订阅、也不会让反应版本增长。
	// 它同时统一负责"每条消息打点 + Ack"与"退出时退订并释放反应版本"。
	if err := machine.RegisterReactor("skill2", "fight-attack", func(msg *message.Message) bool {
		return sm.skill2React(machine, msg, selfId, otherId)
	}); err != nil {
		return
	}
}

// skill2React 处理一条攻击事件；返回 true 表示按原逻辑终止本监听器（退出循环）。
func (sm *SkillManager) skill2React(machine *structs.Machine, msg *message.Message, selfId int, otherId int) bool {
	machine.Mu.Lock()
	attackNumber := machine.CounterValue("limit:skill2")
	attack := &structs.Attack{}
	err := json.Unmarshal(msg.Payload, attack)
	if attackNumber >= 1 && attack.SourceID == otherId {
		machine.Mu.Unlock()
		return true
	}
	machine.AddCounter("limit:skill2", 1, structs.RefSkill(2))
	machine.Mu.Unlock()
	if err != nil {
		return true
	}
	// 追加攻击：伤害来源是技能 2，所以 Ref 标成技能 2
	// （客户端因此会为这一下播出手动画——被动追加不再"凭空掉血"）
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   attack.Damage / 2,
		TargetID: attack.TargetID,
		SourceID: selfId,
		Other:    attack.Other,
		Ref:      structs.RefSkill(2),
	})
	// 发布必须在解锁之后：PublishPayload 内部会读 machine.Events()（需要读锁）
	return machine.PublishPayload("fight-attack", jsonBytes) != nil
}
