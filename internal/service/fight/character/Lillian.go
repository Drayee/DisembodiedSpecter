package character

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"

	"github.com/ThreeDotsLabs/watermill/message"
)

func (sm *SkillManager) Skill3Init(machine *structs.Machine, selfId int, otherId int) {
	total := machine.Counters["count:skill3"]
	if total <= 0 {
		total = 1
		machine.Counters["count:skill3"] = total
	}
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   1,
		TargetID: otherId,
		SourceID: selfId,
		Other:    "{\"type\":\"thunder\"}",
	})
	for range int(total) {
		// PublishPayload 生成事件 ID 并打上反应版本戳：actuator 会等反应者打完点再结算
		if err := machine.PublishPayload("fight-attack", jsonBytes); err != nil {
			return
		}
	}
}

func (sm *SkillManager) Skill4Listener(machine *structs.Machine, selfId int, otherId int) {
	// RegisterReactor 按 key 幂等注册：整场战斗只订阅一次，重复调用只更新本回合的
	// 目标上下文（selfId/otherId）。它同时统一负责"每条消息打点 + Ack"与
	// "退出时退订并释放反应版本"。
	if err := machine.RegisterReactor("skill4", "fight-attack", func(msg *message.Message) bool {
		return sm.skill4React(machine, msg, selfId, otherId)
	}); err != nil {
		return
	}
}

// skill4React 处理一条攻击事件；返回 true 表示按原逻辑终止本监听器（退出循环）。
//
// 顺带修正了原实现的两处锁缺陷（都会让 machine.Mu 被永久持有，
// 导致主循环的 CheckBattleEnd / BuildFightStatus 全部阻塞、整场战斗卡死）：
//  1. count <= 4 的所有路径都没有 Unlock；
//  2. json.Unmarshal 失败时在持锁状态下直接 return。
func (sm *SkillManager) skill4React(machine *structs.Machine, msg *message.Message, selfId int, otherId int) bool {
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
		Other:    "{\"type\":\"thunder\"}",
	})
	machine.Counters["count:skill3"]++
	machine.Counters["count:skill4"] = 0
	machine.Mu.Unlock()
	// 发布必须在解锁之后：PublishPayload 内部会读 machine.Events()（需要读锁）
	return machine.PublishPayload("fight-attack", jsonBytes) != nil
}

func (sm *SkillManager) Skill4Run(machine *structs.Machine, selfId int, otherId int) error {
	if machine.Counters["count:skill4"] > 0 {
		machine.Counters["count:skill3"] += machine.Counters["count:skill4"]
		machine.Counters["count:skill4"] = 0
	}
	return nil
}

func (sm *SkillManager) Skill5Init(machine *structs.Machine, selfId int, otherId int) {
	if machine.Counters["count:character2"] > 0 {
		jsonBytes, _ := json.Marshal(structs.BuffMessage{
			TargetID: selfId,
			SourceID: selfId,
			ID:       1,
			Time:     int(machine.Counters["count:character2"]),
			Other:    "",
		})
		if err := machine.PublishPayload("fight-buff", jsonBytes); err != nil {
			return
		}
	}
}
