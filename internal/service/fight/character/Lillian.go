package character

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"

	"github.com/ThreeDotsLabs/watermill/message"
)

// 技能 3/4/5（角色"莉莉安"系）：三个技能通过两个计数器协同。
//
// 计数一律走 machine.AddCounter / SetCounter（唯一写入口，自动记 Counter 日志），
// 且调用方必须持 machine.Mu —— 下面几处原先都是裸写 map 且没有加锁，
// 现在统一补上锁：这些技能运行在主循环 goroutine 上，而计数器还会被 actuator 的
// 监听 goroutine 读写，属于真实的数据竞争。

// Skill3Init 技能3：根据已积累的"印记"层数对目标连续打出等量的雷伤害。
func (sm *SkillManager) Skill3Init(machine *structs.Machine, selfId int, otherId int) {
	machine.Mu.Lock()
	total := machine.CounterValue("count:skill3")
	if total <= 0 {
		total = machine.SetCounter("count:skill3", 1, structs.RefSkill(3))
	}
	machine.Mu.Unlock()

	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   1,
		TargetID: otherId,
		SourceID: selfId,
		Other:    "{\"type\":\"thunder\"}",
		Ref:      structs.RefSkill(3),
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
// 累计到第 5 条攻击事件时，把本回合攒下的层数折成 count:skill3 并打出一记雷伤害。
//
// 顺带修正了原实现的两处锁缺陷（都会让 machine.Mu 被永久持有，
// 导致主循环的 CheckBattleEnd / BuildFightStatus 全部阻塞、整场战斗卡死）：
//  1. count <= 4 的所有路径都没有 Unlock；
//  2. json.Unmarshal 失败时在持锁状态下直接 return。
func (sm *SkillManager) skill4React(machine *structs.Machine, msg *message.Message, selfId int, otherId int) bool {
	machine.Mu.Lock()
	attack := &structs.Attack{}
	err := json.Unmarshal(msg.Payload, attack)
	count := machine.AddCounter("count:skill4", 1, structs.RefSkill(4))
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
		Ref:      structs.RefSkill(4),
	})
	machine.AddCounter("count:skill3", 1, structs.RefSkill(4))
	machine.SetCounter("count:skill4", 0, structs.RefSkill(4))
	machine.Mu.Unlock()
	// 发布必须在解锁之后：PublishPayload 内部会读 machine.Events()（需要读锁）
	return machine.PublishPayload("fight-attack", jsonBytes) != nil
}

// Skill4Run 技能4 收尾：把没触发完的层数折进 count:skill3，避免浪费。
func (sm *SkillManager) Skill4Run(machine *structs.Machine, selfId int, otherId int) error {
	machine.Mu.Lock()
	defer machine.Mu.Unlock()

	if pending := machine.CounterValue("count:skill4"); pending > 0 {
		machine.AddCounter("count:skill3", pending, structs.RefSkill(4))
		machine.SetCounter("count:skill4", 0, structs.RefSkill(4))
	}
	return nil
}

// Skill5Init 技能5：把角色 2 攒下的印记（count:character2）转成"龙力"buff（buff 1）。
func (sm *SkillManager) Skill5Init(machine *structs.Machine, selfId int, otherId int) {
	machine.Mu.RLock()
	pending := machine.CounterValue("count:character2")
	machine.Mu.RUnlock()
	if pending <= 0 {
		return
	}

	jsonBytes, _ := json.Marshal(structs.BuffMessage{
		TargetID: selfId,
		SourceID: selfId,
		ID:       1,
		Time:     pending,
		Ref:      structs.RefSkill(5),
	})
	if err := machine.PublishPayload("fight-buff", jsonBytes); err != nil {
		return
	}
}
