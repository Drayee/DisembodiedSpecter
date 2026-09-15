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
}

func RecoverModule(machine *structs.Machine, targetIndex int, recover int) {
	stateTarget := machine.CharacterState[targetIndex]
	stateTarget.Health += recover
}

func GetBuffModule(machine *structs.Machine, targetIndex int, buffID int, buffTime int) {
	stateTarget := machine.CharacterState[targetIndex]
	for _, b := range stateTarget.Buffs {
		if b.ID == buffID {
			b.Time = buffTime
		}
	}
	stateTarget.Buffs = append(stateTarget.Buffs, &structs.Buff{ID: buffID, Time: buffTime})
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
		_ = machine.PublishPayload("fight-buff", jsonBytes)
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
