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
	// 打上反应版本戳后发布：actuator 会等反应者处理完再结算
	if err := machine.PublishEvent(pubSub, "fight-attack", mess); err != nil {
		return err
	}
	return nil
}
