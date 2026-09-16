package actuator

import (
	"DisembodiedSpecter/internal/service/fight/buff"
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"
	"errors"
)

// 这个文件定义了角色相关的执行器的实现

//region Character1
// 角色 1
//endregion

//region Character2
/*
 * 角色 2
 * 1. 收到攻击时, 如果在龙上, 则损失1点龙力抵消伤害, 否则正常收到伤害
 * 2. 进行攻击时如果在龙上, 巨龙会协同攻击攻击伤害为攻击伤害的1/4, 如果不在龙上则叠加1点印记
 */
// Character2AttackListener 完全接管角色 2 的受击结算。
//
// 记账不需要它操心：ActuatorManager.Apply 会在调用前后各读一次血量，
// 用血量差记一条攻击日志（抵消时为 0 伤害），并把这里登记的 e.Special 带给客户端，
// 前端据此播"格挡/龙力抵消"而不是掉血。
func (am *ActuatorManager) Character2AttackListener(machine *structs.Machine, self int, e *structs.Effect) error {
	state := machine.CharacterState[self]
	if state == nil {
		return errors.New("state is nil")
	}
	if buff.HasBuff(machine, self, 1) {
		// 在龙上：消耗 1 格龙力（buff 1）抵消本次伤害，血量不变。
		// e.Special 登记"这次受击是被 buff 1 挡下的"，日志里就是 special = −1。
		e.Special = structs.RefBuff(1)
		buff.LossBuff(machine, self, 1, 1, structs.RefPassive)
	} else {
		damageType := ParseDamageType(e)
		AttackModule(machine, self, e.TargetID, e.Damage, damageType, e.Ref)
	}
	return nil
}

// Character2Permanent 角色 2 的永久行为：自己出手时若在龙上，巨龙协同补一刀。
//
// 协同攻击用 Ref 把自己标成"被动"（0）：它不是技能也不是 buff 触发，而是角色的永久行为。
func (am *ActuatorManager) Character2Permanent(machine *structs.Machine, self int) {
	message, err := machine.Subscribe("fight-attack")
	if err != nil {
		return
	}
	for msg := range message {
		attack := &structs.Attack{}
		if err := json.Unmarshal(msg.Payload, attack); err != nil {
			return
		}
		if attack.SourceID == self {
			if buff.HasBuff(machine, self, 1) {
				jsonBytes, _ := json.Marshal(structs.Attack{
					SourceID: self,
					TargetID: attack.TargetID,
					Damage:   max(1, attack.Damage/4),
					Other:    "{\"type\":\"thunder\",\"sourceID\":\"dragon\"}",
					Ref:      structs.RefPassive,
				})
				err := machine.PublishPayload("fight-attack", jsonBytes)
				if err != nil {
					return
				}
				continue
			}
			machine.Mu.Lock()
			machine.AddCounter("count:character2", 1, structs.RefPassive)
			machine.Mu.Unlock()
		}
	}
}

//endregion
