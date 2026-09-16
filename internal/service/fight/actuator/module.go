package actuator

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"
	"errors"
	"math/rand"
)

// 本文件是**纯数值模块**：只负责"把效果算成数值"，不写任何日志。
//
// 记账（战斗日志）统一收口在 ActuatorManager.Apply：那里用"结算前后血量差"记录最终
// 伤害/恢复，因此这里无论怎么改血量（包括被定制行为直接调用本模块的情况）都不会漏日志，
// 也不需要在每个伤害分支里重复记账、更不用把日志索引从雷扩散的下标改写里抢救出来。

func AttackModule(machine *structs.Machine, sourceIndex int, targetIndex int, damage int, damageType structs.DamageType, ref int) {
	stateSource := machine.CharacterState[sourceIndex]
	stateTarget := machine.CharacterState[targetIndex]

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
		_ = thunderDamage(machine, sites, sourceIndex, targetIndex, damage/2, 0.5, ref)
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
}

func RecoverModule(machine *structs.Machine, targetIndex int, recover int) {
	stateTarget := machine.CharacterState[targetIndex]
	stateTarget.Health += recover
}

// thunderDamage 雷伤害的连锁扩散：沿着同一阵营的站位往两侧找一个"非行动角色"作为下一个落点。
//
// ref 是**最初的伤害来源**（技能/buff/被动），扩散出去的每一跳都原样带上，
// 这样客户端看到的每条攻击日志都知道"这一串雷是哪来的"，而不是一堆无来源的伤害。
func thunderDamage(machine *structs.Machine, sites []*structs.Site, sourceIndex int, targetIndex int, damage int, probability float64, ref int) error {
	siteTarget := sites[targetIndex]
	if damage <= 0 {
		return nil
	}

	if !siteTarget.IsMainActionCharacter {
		currentTargetIndex := targetIndex
		for currentTargetIndex < len(sites) {
			currentTargetIndex++
			if err := thunderDamage(machine, sites, currentTargetIndex, sourceIndex, rand.Intn(damage/2), float64(rand.Intn(int(probability*100)))/100, ref); err == nil {
				break
			}
		}
		currentTargetIndex = targetIndex
		for currentTargetIndex >= 0 {
			currentTargetIndex--
			if err := thunderDamage(machine, sites, currentTargetIndex, sourceIndex, rand.Intn(damage/2), float64(rand.Intn(int(probability*100)))/100, ref); err == nil {
				break
			}
		}

		jsonBytes, _ := json.Marshal(structs.Attack{
			Damage:   damage,
			TargetID: targetIndex,
			SourceID: sourceIndex,
			Other:    "{\"type\":\"thunder:no\"}",
			Ref:      ref,
		})
		// 这里发的是 Attack 载荷，必须走 fight-attack：
		// 发到 fight-buff 会被 GetBuffListener 当成 BuffMessage 反序列化
		// （Damage 被丢弃、ID/Time 为 0），等于按 buffID 0 施加 buff 并报错。
		_ = machine.PublishPayload("fight-attack", jsonBytes)
		return nil
	}
	return errors.New("target is not main action character")
}

func ParseDamageType(e *structs.Effect) structs.DamageType {
	if e == nil {
		return structs.DamageTypeNormal
	}
	var dict map[string]any
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
