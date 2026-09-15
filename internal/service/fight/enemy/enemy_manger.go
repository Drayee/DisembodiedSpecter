package enemy

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"context"
	"fmt"
	"log"
	"reflect"
	"time"
)

type EnemyManager struct {
	Action             map[int]reflect.Method
	GameContentManager *utils.GameContentManager
}

func NewEnemyManager(gm *utils.GameContentManager) *EnemyManager {
	enemyManager := &EnemyManager{GameContentManager: gm}
	enemyManager.Action = make(map[int]reflect.Method)
	t := reflect.TypeFor[*EnemyManager]()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	actionIDs, err := enemyManager.GameContentManager.GetEnemyNumber(ctx)
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

// Run 执行敌方行动。签名统一为 (machine, id)：
// pubsub 已由 Machine 独占，不再作为参数透传（发布走 machine.PublishPayload）。
func (a *EnemyManager) Run(id int, machine *structs.Machine, enemyID int) (err error) {
	method, ok := a.Action[enemyID]
	if !ok {
		return fmt.Errorf("action %d 缺少必需的方法", id)
	}
	// 反射调用：reflect.Type.Method.Func 的第一个参数是接收者，必须传入；
	// 捕获 panic 防止 goroutine 崩溃拖垮进程
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("敌方行动 panic: %v", r)
		}
	}()
	results := method.Func.Call(
		[]reflect.Value{
			reflect.ValueOf(a),
			reflect.ValueOf(machine),
			reflect.ValueOf(id),
		},
	)
	if results[0].IsNil() {
		return nil
	}
	return results[0].Interface().(error)
}
