package actuator

import (
	"DisembodiedSpecter/internal/service/fight/buff"
	"DisembodiedSpecter/internal/service/fight/structs"
	"errors"
)

// 这个文件定义了角色相关的执行器的实现

//region Character1
// 角色 1
//endregion

// region Character2
// 角色 2
// 收到攻击时, 如果在龙上, 则损失1点龙力, 否则正常收到伤害
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

//endregion
