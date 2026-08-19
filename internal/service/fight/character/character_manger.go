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

	for id := 1; id <= skillIDs; id++ {
		prefix := fmt.Sprintf("Skill%d", id)
		// 分别查找三个方法
		initMethod, ok1 := t.MethodByName(prefix + "Init")
		listenerMethod, ok2 := t.MethodByName(prefix + "Listener")
		runMethod, ok3 := t.MethodByName(prefix + "Run")
		if !ok1 || !ok2 || !ok3 {
			log.Printf("技能 %d 缺少必需的方法", id)
		}
		sm.SkillRegistry[id] = Skill{
			init:     initMethod,
			listener: listenerMethod,
			run:      runMethod,
		}
	}
	return sm
}

func (sm *SkillManager) Listener(skillID int, pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	skill, ok := sm.SkillRegistry[skillID]
	if !ok {
		panic(fmt.Sprintf("技能 %d 不存在", skillID))
	}
	skill.listener.Func.Call([]reflect.Value{reflect.ValueOf(pubSub), reflect.ValueOf(machine), reflect.ValueOf(selfId), reflect.ValueOf(otherId)})
}

func (sm *SkillManager) Init(skillID int, pubSub *gochannel.GoChannel, machine *structs.Machine, selfId int, otherId int) {
	skill, ok := sm.SkillRegistry[skillID]
	if !ok {
		panic(fmt.Sprintf("技能 %d 不存在", skillID))
	}
	skill.init.Func.Call([]reflect.Value{reflect.ValueOf(pubSub), reflect.ValueOf(machine), reflect.ValueOf(selfId), reflect.ValueOf(otherId)})
}

func (sm *SkillManager) Run(skillID int, machine *structs.Machine, selfId int, otherId int) {
	skill, ok := sm.SkillRegistry[skillID]
	if !ok {
		panic(fmt.Sprintf("技能 %d 不存在", skillID))
	}
	skill.run.Func.Call([]reflect.Value{reflect.ValueOf(machine), reflect.ValueOf(selfId), reflect.ValueOf(otherId)})
}
