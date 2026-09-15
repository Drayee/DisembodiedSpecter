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
func (am *ActuatorManager) Character2AttackListener(machine *structs.Machine, self int, e structs.Effect) error {
	state := machine.CharacterState[self]
	if state == nil {
		return errors.New("state is nil")
	}
	if buff.HasBuff(machine, self, 1) {
		buff.LossBuff(machine, self, 1, 1)
	} else {
		damageType := ParseDamageType(e)
		AttackModule(machine, self, e.TargetID, e.Damage, damageType)
	}
	return nil
}

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
					Other:    "{\"type\":\"thunder\"}",
				})
				err := machine.PublishPayload("fight-attack", jsonBytes)
				if err != nil {
					return
				}
				continue
			}
			machine.Counters["count:character2"]++
		}
	}
}

//endregion
