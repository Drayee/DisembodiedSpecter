package fight

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

// ActuatorManager 战斗底层执行器管理：为每个战斗位启动攻击/治疗/buff 监听器。
// 监听器按"战斗位索引"（0..N-1，我方在前敌方在后）订阅，与 CharacterState 下标一致。
type ActuatorManager struct {
	GameContentManager *utils.GameContentManager
}

func NewActuatorManager(gm *utils.GameContentManager) *ActuatorManager {
	return &ActuatorManager{GameContentManager: gm}
}

// StartListener 为给定的战斗位索引启动监听器（订阅战斗 pubsub）。
// ids 必须是合法的战斗位索引；越界的索引会被跳过。
func (a *ActuatorManager) StartListener(pubSub *gochannel.GoChannel, machine *structs.Machine, ids []int) error {
	for _, idx := range ids {
		if idx < 0 || idx >= len(machine.CharacterState) {
			continue
		}
		NewActuator(idx, a.GameContentManager, pubSub, machine, machine.Ctx)
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

// NewActuator 为指定战斗位启动监听 goroutine。
// ctx 用于订阅的生命周期控制（战斗结束时取消，订阅随之关闭，goroutine 退出）。
func NewActuator(id int, gm *utils.GameContentManager, pubSub *gochannel.GoChannel, machine *structs.Machine, ctx context.Context) {
	actuator := &ActuatorImpl{ID: id, GameContentManager: gm, pubSub: pubSub}
	attackMessages, err1 := pubSub.Subscribe(ctx, "fight-attack")
	recoverMessages, err2 := pubSub.Subscribe(ctx, "fight-recover")
	buffMessages, err3 := pubSub.Subscribe(ctx, "fight-buff")
	if err1 != nil || err2 != nil || err3 != nil {
		log.Printf("Actuator %d Subscribe error: %v, %v, %v", actuator.ID, err1, err2, err3)
		return
	}
	go func() {
		for msg := range attackMessages {
			if err := actuator.AttackListener(msg, machine); err != nil {
				log.Printf("Actuator %d AttackListener error: %v", actuator.ID, err)
			}
		}
	}()
	go func() {
		for msg := range recoverMessages {
			if err := actuator.RecoverListener(msg, machine); err != nil {
				log.Printf("Actuator %d RecoverListener error: %v", actuator.ID, err)
			}
		}
	}()
	go func() {
		for msg := range buffMessages {
			if err := actuator.GetBuffListener(msg, machine); err != nil {
				log.Printf("Actuator %d GetBuffListener error: %v", actuator.ID, err)
			}
		}
	}()
}

// state 返回当前战斗位的状态；索引越界或状态缺失时返回 nil。
func (a *ActuatorImpl) state(machine *structs.Machine) *structs.CharacterState {
	if a.ID < 0 || a.ID >= len(machine.CharacterState) {
		return nil
	}
	return machine.CharacterState[a.ID]
}

func (a *ActuatorImpl) AttackListener(msg *message.Message, machine *structs.Machine) error {
	attack := &structs.Attack{}
	if err := json.Unmarshal(msg.Payload, attack); err != nil {
		return err
	}
	if attack.TargetID != a.ID {
		return nil
	}
	machine.Mu.Lock()
	defer machine.Mu.Unlock()

	state := a.state(machine)
	if state == nil {
		return fmt.Errorf("战斗位 %d 不存在", a.ID)
	}
	damage := attack.Damage - state.Defense
	if damage < 0 {
		damage = 0
	}
	state.Health -= damage
	if state.Health < 0 {
		state.Health = 0
	}
	return nil
}

func (a *ActuatorImpl) GetBuffListener(msg *message.Message, machine *structs.Machine) error {
	buff := &structs.BuffMessage{}
	if err := json.Unmarshal(msg.Payload, buff); err != nil {
		return err
	}
	if buff.TargetID != a.ID {
		return nil
	}
	machine.Mu.Lock()
	defer machine.Mu.Unlock()

	state := a.state(machine)
	if state == nil {
		return fmt.Errorf("战斗位 %d 不存在", a.ID)
	}
	state.Buffs = append(state.Buffs, &structs.Buff{ID: buff.ID, Time: buff.Time})
	return nil
}

func (a *ActuatorImpl) RecoverListener(msg *message.Message, machine *structs.Machine) error {
	r := &structs.Recover{}
	if err := json.Unmarshal(msg.Payload, r); err != nil {
		return err
	}
	if r.TargetID != a.ID {
		return nil
	}
	machine.Mu.Lock()
	defer machine.Mu.Unlock()

	state := a.state(machine)
	if state == nil {
		return fmt.Errorf("战斗位 %d 不存在", a.ID)
	}
	state.Health += r.Recover
	return nil
}
