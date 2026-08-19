package character

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"context"
	"fmt"
	"log"
	"reflect"
	"time"

	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

type Skill struct {
	init     reflect.Method
	listener reflect.Method
	run      reflect.Method
}

type SkillManager struct {
	GameContentManger *utils.GameContentManager
	SkillRegistry     map[int]Skill
}

func NewSkillManager(manager *utils.GameContentManager) *SkillManager {
	sm := &SkillManager{GameContentManger: manager}
	t := reflect.TypeFor[*SkillManager]()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	skillIDs, err := sm.GameContentManger.GetAllSkillNumber(ctx)
	if err != nil {
		panic(err)
	}

	sm.SkillRegistry = make(map[int]Skill, skillIDs)
	for id := 1; id <= skillIDs; id++ {
		prefix := fmt.Sprintf("Skill%d", id)
		// 分别查找三个方法（Init/Listener/Run 缺失的方法会被跳过，不 panic）
		initMethod, ok1 := t.MethodByName(prefix + "Init")
		listenerMethod, ok2 := t.MethodByName(prefix + "Listener")
		runMethod, ok3 := t.MethodByName(prefix + "Run")
		if !ok1 && !ok2 && !ok3 {
			log.Printf("技能 %d 未实现任何方法，跳过注册", id)
			continue
		}
		sm.SkillRegistry[id] = Skill{
			init:     initMethod,
			listener: listenerMethod,
			run:      runMethod,
		}
	}
	return sm
}

// callMethod 安全调用技能方法：
//   - 第一个参数必须是接收者（reflect.Type.Method.Func 包含 receiver）；
//   - 方法缺失时跳过（视为无此阶段行为）；
//   - 任何 panic 都会被捕获并转为错误，避免 goroutine 崩溃拖垮进程。
func (sm *SkillManager) callMethod(method reflect.Method, name string, skillID int, args ...reflect.Value) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("技能 %d 的 %s 执行 panic: %v", skillID, name, r)
		}
	}()
	if !method.Func.IsValid() {
		return nil // 未实现该阶段方法，跳过
	}
	method.Func.Call(append([]reflect.Value{reflect.ValueOf(sm)}, args...))
	return nil
}

func (sm *SkillManager) Listener(skillID int, pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) error {
	skill, ok := sm.SkillRegistry[skillID]
	if !ok {
		return fmt.Errorf("技能 %d 不存在", skillID)
	}
	return sm.callMethod(skill.listener, "Listener", skillID,
		reflect.ValueOf(pubSub), reflect.ValueOf(machine), reflect.ValueOf(selfId), reflect.ValueOf(otherId))
}

func (sm *SkillManager) Init(skillID int, pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) error {
	skill, ok := sm.SkillRegistry[skillID]
	if !ok {
		return fmt.Errorf("技能 %d 不存在", skillID)
	}
	return sm.callMethod(skill.init, "Init", skillID,
		reflect.ValueOf(pubSub), reflect.ValueOf(machine), reflect.ValueOf(selfId), reflect.ValueOf(otherId))
}

func (sm *SkillManager) Run(skillID int, machine *structs.Machine, selfId int, otherId int) error {
	skill, ok := sm.SkillRegistry[skillID]
	if !ok {
		return fmt.Errorf("技能 %d 不存在", skillID)
	}
	return sm.callMethod(skill.run, "Run", skillID,
		reflect.ValueOf(machine), reflect.ValueOf(selfId), reflect.ValueOf(otherId))
}
