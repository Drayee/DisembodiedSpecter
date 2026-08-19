package fight

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"reflect"
	"strconv"
	"time"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

type ActuatorManager struct {
	GameContentManager *utils.GameContentManager
	ActuatorRegistry   map[int]reflect.Method
	CharacterNumber    int
}

func NewActuatorManager(gm *utils.GameContentManager) *ActuatorManager {
	// 构造阶段读取数量：带超时，避免 Redis 不可用时启动无限阻塞
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	characterNumber, e1 := gm.GetCharacterNumber(ctx)
	enemyNumber, e2 := gm.GetEnemyNumber(ctx)
	if e1 != nil || e2 != nil {
		panic(fmt.Sprintf("获取角色数量或敌人数量失败: %v, %v", e1, e2))
	}
	t := reflect.TypeFor[*ActuatorManager]()
	actuatorRegistry := make(map[int]reflect.Method)
	for i := range characterNumber {
		actuatorRegistry[i], _ = t.MethodByName("Actuator" + strconv.Itoa(i))
	}
	for i := range enemyNumber {
		var ok bool
		actuatorRegistry[i+characterNumber], ok = t.MethodByName("Actuator" + strconv.Itoa(i+characterNumber))
		if !ok {
			actuatorRegistry[i+characterNumber] = reflect.Method{Func: reflect.ValueOf(NewActuator)}
		}
	}
	return &ActuatorManager{GameContentManager: gm, ActuatorRegistry: actuatorRegistry, CharacterNumber: characterNumber}
}

func (a *ActuatorManager) StartListener(pubSub *gochannel.GoChannel, machine *structs.Machine, ids []int) error {
	for _, id := range ids {
		actuator := a.ActuatorRegistry[id]
		actuator.Func.Call([]reflect.Value{reflect.ValueOf(pubSub), reflect.ValueOf(machine), reflect.ValueOf(id)})
	}
	return nil
}

type Actuator interface {
	AttackListener(msg *message.Message, machine *structs.Machine) error
	RecoverListener(msg *message.Message, machine *structs.Machine) error
	GetBuffListener(msg *message.Message, machine *structs.Machine) error
}

type ActuatorImpl struct {
	GameContentManager *utils.GameContentManager
	pubSub             *gochannel.GoChannel
	ID                 int
}

func NewActuator(id int, gm *utils.GameContentManager, pubSub *gochannel.GoChannel, machine *structs.Machine, ctx context.Context) *ActuatorImpl {
	actuator := &ActuatorImpl{ID: id, GameContentManager: gm, pubSub: pubSub}
	attackMessages, err1 := pubSub.Subscribe(ctx, "fight-attack")
	recoverMessages, err2 := pubSub.Subscribe(ctx, "fight-recover")
	buffMessages, err3 := pubSub.Subscribe(ctx, "fight-buff")
	if err1 != nil || err2 != nil || err3 != nil {
		return nil
	}
	go func() {
		for msg := range attackMessages {
			err := actuator.AttackListener(msg, machine)
			if err != nil {
				log.Printf("Actuator %d AttackListener error: %v", actuator.ID, err)
			}
		}
	}()
	go func() {
		for msg := range recoverMessages {
			err := actuator.RecoverListener(msg, machine)
			if err != nil {
				log.Printf("Actuator %d RecoverListener error: %v", actuator.ID, err)
			}
		}
	}()
	go func() {
		for msg := range buffMessages {
			err := actuator.GetBuffListener(msg, machine)
			if err != nil {
				log.Printf("Actuator %d GetBuffListener error: %v", actuator.ID, err)
			}
		}
	}()
	return actuator
}

func (a *ActuatorImpl) AttackListener(msg *message.Message, machine *structs.Machine) error {
	attack := &structs.Attack{}
	err := json.Unmarshal(msg.Payload, attack)
	if err != nil {
		return err
	}
	if attack.TargetID == a.ID {
		state := machine.CharacterState[a.ID]
		state.Health -= attack.Damage - state.Defense
	}
	return nil
}

func (a *ActuatorImpl) GetBuffListener(msg *message.Message, machine *structs.Machine) error {
	buff := &structs.BuffMessage{}
	err := json.Unmarshal(msg.Payload, buff)
	if err != nil {
		return err
	}
	if buff.TargetID == a.ID {
		state := machine.CharacterState[a.ID]
		state.Buffs = append(state.Buffs, &structs.Buff{ID: buff.ID})
	}
	return nil
}

func (a *ActuatorImpl) RecoverListener(msg *message.Message, machine *structs.Machine) error {
	r := &structs.Recover{}
	err := json.Unmarshal(msg.Payload, r)
	if err != nil {
		return err
	}
	if r.TargetID == a.ID {
		state := machine.CharacterState[a.ID]
		state.Health += r.Recover
	}
	return nil
}
