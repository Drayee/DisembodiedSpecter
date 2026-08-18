package enemy

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"context"
	"fmt"
	"log"
	"reflect"

	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

type EnemyManager struct {
	Action             map[int]reflect.Method
	GameContentManager *utils.GameContentManager
}

func NewEnemyManager(gm *utils.GameContentManager) *EnemyManager {
	enemyManager := &EnemyManager{GameContentManager: gm}
	enemyManager.Action = make(map[int]reflect.Method)
	t := reflect.TypeFor[*EnemyManager]()
	actionIDs, err := enemyManager.GameContentManager.GetEnemyNumber(context.Background())
	if err != nil {
		panic(err)
	}

	for id := 1; id <= actionIDs; id++ {
		prefix := fmt.Sprintf("Action%d", id)
		runMethod, ok1 := t.MethodByName(prefix + "Run")
		if !ok1 {
			log.Printf("Action %d 缺少必需的方法", id)
		}
		enemyManager.Action[id] = runMethod
	}
	return enemyManager
}

func (a *EnemyManager) Run(id int, machine *structs.Machine, pubSub *gochannel.GoChannel, enemyID int) error {
	method, ok := a.Action[enemyID]
	if !ok {
		return fmt.Errorf("action %d 缺少必需的方法", id)
	}
	results := method.Func.Call(
		[]reflect.Value{
			reflect.ValueOf(machine),
			reflect.ValueOf(pubSub),
			reflect.ValueOf(id),
		},
	)
	if results[0].IsNil() {
		return nil
	}
	return results[0].Interface().(error)
}
