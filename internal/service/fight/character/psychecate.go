package character

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

// Skill 技能1 伤害
// 主动行动: 造成对方2点的单体伤害
func (sm *SkillManager) Skill1Init(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   2,
		TargetID: otherId,
		SourceID: selfId,
		Other:    "type:none",
	})
	msg := message.NewMessage(machine.UUID, jsonBytes)
	// PublishEvent 会给事件打上"本次要求几个反应者打点"的版本戳，
	// actuator 收到后会先等这些反应者处理完再结算
	if err := machine.PublishEvent(pubSub, "fight-attack", msg); err != nil {
		return
	}
}

// Skill2 技能2 追加攻击
// 被动行动: 当我方攻击时，追加我方伤害的一半
func (sm *SkillManager) Skill2Init(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	machine.Counters["limit:skill2"] = 0
}

func (sm *SkillManager) Skill2Listener(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	// RegisterReactor 统一负责：反应版本 +1（发布事件时要求本监听器打点）、
	// 每条消息处理完打点 + Ack、退出时 -1 版本并退订（避免消息堵在无人读取的 channel 上）
	err := machine.RegisterReactor(pubSub, machine.Ctx, "fight-attack", func(msg *message.Message) bool {
		return sm.skill2React(pubSub, machine, msg, selfId, otherId)
	})
	if err != nil {
		return
	}
}

// skill2React 处理一条攻击事件；返回 true 表示按原逻辑终止本监听器（退出循环）。
func (sm *SkillManager) skill2React(pubSub *gochannel.GoChannel, machine *structs.Machine, msg *message.Message, selfId int, otherId int) bool {
	machine.Mu.Lock()
	attackNumber, _ := machine.Counters["limit:skill2"]
	attack := &structs.Attack{}
	err := json.Unmarshal(msg.Payload, attack)
	if attackNumber >= 1 && attack.SourceID == otherId {
		machine.Mu.Unlock()
		return true
	}
	machine.Counters["limit:skill2"] = attackNumber + 1
	machine.Mu.Unlock()
	if err != nil {
		return true
	}
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   attack.Damage / 2,
		TargetID: attack.TargetID,
		SourceID: selfId,
		Other:    attack.Other,
	})
	follow := message.NewMessage(machine.UUID, jsonBytes)
	return machine.PublishEvent(pubSub, "fight-attack", follow) != nil
}
