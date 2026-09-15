package actuator

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"
	"errors"
	"math/rand"
)

func AttackModule(machine *structs.Machine, sourceIndex int, targetIndex int, damage int, damageType structs.DamageType) {
	stateSource := machine.CharacterState[sourceIndex]
	stateTarget := machine.CharacterState[targetIndex]

	// 记账用的原始战斗位：下面的雷伤害分支会把 targetIndex/sourceIndex
	// 改成"阵营内下标"，日志必须用改之前的索引（客户端按下标找站位）。
	logSource, logTarget := sourceIndex, targetIndex
	before := stateTarget.Health

	switch damageType {
	case structs.DamageTypeThunder:
		stateTarget.Health -= max(int(float64(damage)*stateSource.Attack)-stateTarget.Defense, 0)
		var states []*structs.CharacterState
		var sites []*structs.Site
		if targetIndex < machine.SelfCharacterNumber {
			states = machine.CharacterState[:machine.SelfCharacterNumber]
			sites = machine.CharacterSite[:machine.SelfCharacterNumber]
		} else {
			targetIndex -= machine.SelfCharacterNumber
			sourceIndex -= machine.SelfCharacterNumber
			states = machine.CharacterState[machine.SelfCharacterNumber:]
			sites = machine.CharacterSite[machine.SelfCharacterNumber:]
		}
		_ = states
		_ = thunderDamage(machine, sites, sourceIndex, targetIndex, damage/2, 0.5)
	case structs.DamageTypeFire:
	case structs.DamageTypeReally:
		stateTarget.Health -= max(int(float64(damage)*stateSource.Attack), 0)
	default:
		stateTarget.Health -= max(int(float64(damage)*stateSource.Attack)-stateTarget.Defense, 0)
	}

	// 生命值不为负（与 BATTLE_LOGIC.md 记录的修复口径一致）。
	// 上面各分支只把**伤害值**钳到了 ≥0，结算后的生命值仍可能为负；
	// 而这个值会直接进下发状态与战斗日志的 hp_after，前端血条与飘字都吃它，
	// 因此在这里统一兜底。判定侧（CheckBattleEnd 用 Health > 0）不受影响。
	if stateTarget.Health < 0 {
		stateTarget.Health = 0
	}

	logSettle(machine, structs.FightLogAttack, logSource, logTarget, before, stateTarget.Health)
}

func RecoverModule(machine *structs.Machine, targetIndex int, recover int) {
	stateTarget := machine.CharacterState[targetIndex]
	before := stateTarget.Health
	stateTarget.Health += recover
	logSettle(machine, structs.FightLogRecover, -1, targetIndex, before, stateTarget.Health)
}

// logSettle 记录一次生命值变动（伤害/治疗）。
//
// 数值直接取结算前后的血量差：各伤害类型（普通/真实/雷/火）与防御减免口径不同，
// 用血量差记账可以完全不重复计算，也就不会与结算逻辑产生分歧。
// 顺带记录阵亡：血量从"有"跨到"无"的那一次结算同时产出一条 Death 日志。
func logSettle(machine *structs.Machine, kind structs.FightLogType, source, target, before, after int) {
	if machine == nil {
		return
	}
	delta := after - before
	if delta < 0 {
		delta = -delta // 伤害记正数，前端可直接拿去做飘字
	}
	machine.AppendLog(structs.FightLog{
		Type:     kind,
		Source:   source,
		Target:   target,
		Value:    delta,
		HPBefore: before,
		HPAfter:  after,
	})
	if before > 0 && after <= 0 {
		machine.AppendLog(structs.FightLog{
			Type:     structs.FightLogDeath,
			Source:   source,
			Target:   target,
			HPBefore: before,
			HPAfter:  after,
		})
	}
}

func thunderDamage(machine *structs.Machine, sites []*structs.Site, sourceIndex int, targetIndex int, damage int, probability float64) error {
	siteTarget := sites[targetIndex]
	if damage <= 0 {
		return nil
	}

	if !siteTarget.IsMainActionCharacter {
		currentTargetIndex := targetIndex
		for currentTargetIndex < len(sites) {
			currentTargetIndex++
			if err := thunderDamage(machine, sites, currentTargetIndex, sourceIndex, rand.Intn(damage/2), float64(rand.Intn(int(probability*100)))/100); err == nil {
				break
			}
		}
		currentTargetIndex = targetIndex
		for currentTargetIndex >= 0 {
			currentTargetIndex--
			if err := thunderDamage(machine, sites, currentTargetIndex, sourceIndex, rand.Intn(damage/2), float64(rand.Intn(int(probability*100)))/100); err == nil {
				break
			}
		}

		jsonBytes, _ := json.Marshal(structs.Attack{
			Damage:   damage,
			TargetID: targetIndex,
			SourceID: sourceIndex,
			Other:    "{\"type\":\"thunder:no\"}",
		})
		// 这里发的是 Attack 载荷，必须走 fight-attack：
		// 发到 fight-buff 会被 GetBuffListener 当成 BuffMessage 反序列化
		// （Damage 被丢弃、ID/Time 为 0），等于按 buffID 0 施加 buff 并报错。
		_ = machine.PublishPayload("fight-attack", jsonBytes)
		return nil
	}
	return errors.New("target is not main action character")
}

func ParseDamageType(e structs.Effect) structs.DamageType {
	var dict map[string]interface{}
	if err := json.Unmarshal([]byte(e.Other), &dict); err != nil {
		return structs.DamageTypeNormal
	}
	var damageType structs.DamageType
	switch dict["type"].(string) {
	case "thunder":
		damageType = structs.DamageTypeThunder
	case "none":
		damageType = structs.DamageTypeNormal
	default:
		damageType = structs.DamageTypeNormal
	}
	return damageType
}
