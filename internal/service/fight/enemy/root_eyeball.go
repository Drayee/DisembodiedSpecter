package enemy

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"
	"fmt"
	"math/rand"
)

// Action1Run 根眼怪的行动：随机挑一个我方战斗位打 2 点伤害。
//
// Ref 记被动（0）：敌方行动按敌人 DB ID 反射调度（Action<ID>Run），不是"技能"，
// 没有技能 ID 可标；客户端据此播普通出手动画。
func (a *EnemyManager) Action1Run(machine *structs.Machine, id int) error {
	if machine.SelfCharacterNumber <= 0 {
		return fmt.Errorf("我方没有存活角色，敌方无法行动")
	}
	jsonBytes, _ := json.Marshal(structs.Attack{
		Damage:   2,
		TargetID: rand.Intn(machine.SelfCharacterNumber),
		SourceID: id,
		Other:    "",
		Ref:      structs.RefPassive,
	})
	// PublishPayload 生成事件 ID 并打上反应版本戳：actuator 会等反应者处理完再结算
	if err := machine.PublishPayload("fight-attack", jsonBytes); err != nil {
		return err
	}
	return nil
}
