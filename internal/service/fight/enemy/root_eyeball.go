package enemy

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"
	"fmt"
	"math/rand"
)

func (a *EnemyManager) Action1Run(machine *structs.Machine, id int) error {
	if machine.SelfCharacterNumber <= 0 {
		return fmt.Errorf("我方没有存活角色，敌方无法行动")
	}
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   2,
		TargetID: rand.Intn(machine.SelfCharacterNumber),
		SourceID: id,
		Other:    "",
	})
	// PublishPayload 生成事件 ID 并打上反应版本戳：actuator 会等反应者处理完再结算
	if err := machine.PublishPayload("fight-attack", jsonBytes); err != nil {
		return err
	}
	return nil
}
