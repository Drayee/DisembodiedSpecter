package character

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

func (sm *SkillManager) Skill1Init(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   2,
		TargetID: otherId,
		SourceID: selfId,
		Other:    "",
	})
	msg := message.NewMessage(machine.UUID, jsonBytes)
	err := pubSub.Publish("fight-attack", msg)
	if err != nil {
		return
	}
}

func (sm *SkillManager) Skill2Listener(pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	messages, err := pubSub.Subscribe(machine.Ctx, "fight-attack")
	if err != nil {
		return
	}
	go func() {
		for msg := range messages {
			machine.Mu.Lock()
			attackNumber, _ := machine.Counters["limit:skill2"]
			if attackNumber >= 1 {
				machine.Mu.Unlock()
				return
			}
			machine.Counters["limit:skill2"] = attackNumber + 1
			machine.Mu.Unlock()
			attack := &structs.Attack{}
			err := json.Unmarshal(msg.Payload, attack)
			if err != nil {
				return
			}
			jsonBytes, _ := json.Marshal(structs.Attack{
				Damage:   attack.Damage / 2,
				TargetID: attack.TargetID,
				SourceID: attack.SourceID,
				Other:    attack.Other,
			})
			msg := message.NewMessage(machine.UUID, jsonBytes)
			err = pubSub.Publish("fight-attack", msg)
			if err != nil {
				return
			}
		}
	}()
}
