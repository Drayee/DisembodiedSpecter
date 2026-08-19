package enemy

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"
	"fmt"
	"math/rand"

	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

func (a *EnemyManager) Action1Run(machine *structs.Machine, pubSub *gochannel.GoChannel, id int) error {
	if machine.SelfCharacterNumber <= 0 {
		return fmt.Errorf("我方没有存活角色，敌方无法行动")
	}
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   2,
		TargetID: rand.Intn(machine.SelfCharacterNumber),
		SourceID: id,
		Other:    "",
	})
	mess := message.NewMessage(watermill.NewUUID(), jsonBytes)
	if err := pubSub.Publish("fight-attack", mess); err != nil {
		return err
	}
	return nil
}
