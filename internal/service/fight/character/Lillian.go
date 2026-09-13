package character

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

func (sm *SkillManager) Skill3Init(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	total := machine.Counters["count:skill3"]
	if total <= 0 {
		total = 1
		machine.Counters["count:skill3"] = total
	}
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   1,
		TargetID: otherId,
		SourceID: selfId,
		Other:    "type:thunder",
	})
	for range int(total) {
		msg := message.NewMessage(machine.UUID, jsonBytes)
		// 打上反应版本戳后发布：actuator 会等反应者打完点再结算
		if err := machine.PublishEvent(pubSub, "fight-attack", msg); err != nil {
			return
		}
	}
}

func (sm *SkillManager) Skill4Listener(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	// RegisterReactor 统一负责：反应版本 +1、每条消息打点 + Ack、
	// 退出时 -1 版本并退订（避免消息堵在无人读取的 channel 上）
	err := machine.RegisterReactor(pubSub, machine.Ctx, "fight-attack", func(msg *message.Message) bool {
		return sm.skill4React(pubSub, machine, msg, selfId, otherId)
	})
	if err != nil {
		return
	}
}

// skill4React 处理一条攻击事件；返回 true 表示按原逻辑终止本监听器（退出循环）。
//
// 顺带修正了原实现的两处锁缺陷（都会让 machine.Mu 被永久持有，
// 导致主循环的 CheckBattleEnd / BuildFightStatus 全部阻塞、整场战斗卡死）：
//  1. count <= 4 的所有路径都没有 Unlock；
//  2. json.Unmarshal 失败时在持锁状态下直接 return。
func (sm *SkillManager) skill4React(pubSub *gochannel.GoChannel, machine *structs.Machine, msg *message.Message, selfId int, otherId int) bool {
	machine.Mu.Lock()
	attack := &structs.Attack{}
	err := json.Unmarshal(msg.Payload, attack)
	machine.Counters["count:skill4"]++
	count := machine.Counters["count:skill4"]
	if err != nil {
		machine.Mu.Unlock()
		return true
	}
	if count <= 4 {
		// 未达触发条件：仅计数，继续监听
		machine.Mu.Unlock()
		return false
	}
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   4,
		TargetID: otherId,
		SourceID: selfId,
		Other:    "type:thunder",
	})
	machine.Counters["count:skill3"]++
	machine.Counters["count:skill4"] = 0
	machine.Mu.Unlock()
	// 发布必须在解锁之后：PublishEvent 内部会读 machine.Gate()（需要读锁）
	return machine.PublishEvent(pubSub, "fight-attack", message.NewMessage(machine.UUID, jsonBytes)) != nil
}

func (sm *SkillManager) Skill4Run(machine *structs.Machine, selfId int, otherId int) error {
	if machine.Counters["count:skill4"] > 0 {
		machine.Counters["count:skill3"] += machine.Counters["count:skill4"]
		machine.Counters["count:skill4"] = 0
	}
	return nil
}

func (sm *SkillManager) Skill5Init(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	if machine.Counters["count:character1"] > 0 {
		jsonBytes, _ := json.Marshal(structs.BuffMessage{
			TargetID: selfId,
			SourceID: selfId,
			ID:       1,
			Time:     int(machine.Counters["count:character1"]),
			Other:    "",
		})
		msg := message.NewMessage(machine.UUID, jsonBytes)
		if err := machine.PublishEvent(pubSub, "fight-buff", msg); err != nil {
			return
		}
	}
}
