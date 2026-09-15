package actuator

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"reflect"
	"time"

	"github.com/ThreeDotsLabs/watermill/message"
)

// 行为方法签名校验用的类型常量。
var (
	managerTypeRef = reflect.TypeFor[*ActuatorManager]()
	machineTypeRef = reflect.TypeFor[*structs.Machine]()
	intTypeRef     = reflect.TypeFor[int]()
	effectTypeRef  = reflect.TypeFor[structs.Effect]()
	errorTypeRef   = reflect.TypeFor[error]()
)

// Behavior 一个角色的定制行为集合。字段为零值（未注册）表示该类事件走默认结算。
type Behavior struct {
	Attack  reflect.Method
	Recover reflect.Method
	GetBuff reflect.Method
}

// pick 取出该效果类型对应的定制方法；ok == false 表示未注册，应由默认结算处理。
func (b Behavior) pick(kind structs.EffectKind) (reflect.Method, bool) {
	var m reflect.Method
	switch kind {
	case structs.EffectAttack:
		m = b.Attack
	case structs.EffectRecover:
		m = b.Recover
	case structs.EffectBuff:
		m = b.GetBuff
	default:
		return reflect.Method{}, false
	}
	if !m.Func.IsValid() {
		return reflect.Method{}, false
	}
	return m, true
}

// ActuatorManager 战斗底层执行器管理：为每个战斗位启动攻击/治疗/buff 监听器。
//
// 监听器按"战斗位索引"（0..N-1，我方在前敌方在后）订阅，与 CharacterState 下标一致。
// 每个事件由"目标战斗位 == 自身索引"的唯一一个 actuator 负责：它先等该事件要求的
// 反应者（技能监听器）全部打点完毕，**再立即结算并释放事件**。
// 于是"结算发生在收到事件时"与"结算必然最后执行"同时成立，且不依赖 gochannel
// 并发投递的先后顺序（顺带说明：actuator 自己不算反应者，不参与反应版本计数）。
//
// 角色行为差异化的注册约定（与 SkillManager 的 Skill<ID>Init/Listener/Run、
// EnemyManager 的 Action<ID>Run 一致，都是反射按名字查找）：
//
//	我方角色：Character<DB ID>AttackListener / RecoverListener / GetBuffListener
//	敌方 NPC：Enemy<DB ID>AttackListener     / RecoverListener / GetBuffListener
//
// 方法签名：func (a *ActuatorManager) Character1AttackListener(machine *structs.Machine, self int, e structs.Effect) error
// （返回值可省略；self 为该战斗位索引，等于 e.TargetID）。
//
// 语义：方法**存在即完全接管**该类事件的结算，默认结算不再执行（可实现闪避/免疫/反伤等）；
// 不存在则走默认结算（伤害按防御减免、恢复累加、buff 追加）。
//
// 定制行为的两条约定：
//   - 调用时**不持有 machine.Mu**，方法内部若读写角色状态请自行加锁；
//     反过来，不要在持锁区间内发布事件（PublishEvent 需要读锁，会自锁死）。
//   - panic 会被捕获并转成错误记录，不会拖垮战斗主循环。
type ActuatorManager struct {
	GameContentManager *utils.GameContentManager

	characterBehaviors map[int]Behavior // 角色 DB ID → 定制行为
	enemyBehaviors     map[int]Behavior // 敌方 NPC DB ID → 定制行为
}

func NewActuatorManager(gm *utils.GameContentManager) *ActuatorManager {
	am := &ActuatorManager{
		GameContentManager: gm,
		characterBehaviors: map[int]Behavior{},
		enemyBehaviors:     map[int]Behavior{},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 按内容表里的角色/敌人数量扫描方法名。
	// 与 SkillManager 不同，这里读取失败只记日志不 panic：定制行为全部缺失是合法状态
	// （所有战斗位走默认结算），不该因一次内容表读取失败就让整个服务起不来。
	if n, err := gm.GetCharacterNumber(ctx); err != nil {
		log.Printf("ActuatorManager 读取角色数量失败，角色定制行为未注册: %v", err)
	} else {
		for id := 1; id <= n; id++ {
			if b, ok := am.register(fmt.Sprintf("Character%d", id)); ok {
				am.characterBehaviors[id] = b
			}
		}
	}
	if n, err := gm.GetEnemyNumber(ctx); err != nil {
		log.Printf("ActuatorManager 读取敌人数量失败，敌人定制行为未注册: %v", err)
	} else {
		for id := 1; id <= n; id++ {
			if b, ok := am.register(fmt.Sprintf("Enemy%d", id)); ok {
				am.enemyBehaviors[id] = b
			}
		}
	}
	return am
}

// register 查找 <prefix>AttackListener / RecoverListener / GetBuffListener 三个方法。
// 三个方法都不存在时返回 ok == false（该角色没有定制行为）。
func (am *ActuatorManager) register(prefix string) (Behavior, bool) {
	b := Behavior{
		Attack:  am.behaviorMethod(prefix + "AttackListener"),
		Recover: am.behaviorMethod(prefix + "RecoverListener"),
		GetBuff: am.behaviorMethod(prefix + "GetBuffListener"),
	}
	if !b.Attack.Func.IsValid() && !b.Recover.Func.IsValid() && !b.GetBuff.Func.IsValid() {
		return Behavior{}, false
	}
	return b, true
}

// behaviorMethod 按名字取定制行为方法；签名不符时记录日志并忽略（与 SkillManager 缺失即跳过的约定一致）。
func (am *ActuatorManager) behaviorMethod(name string) reflect.Method {
	m, ok := reflect.TypeFor[*ActuatorManager]().MethodByName(name)
	if !ok {
		return reflect.Method{}
	}
	if !validBehaviorSignature(m) {
		log.Printf("ActuatorManager 方法 %s 签名不符，已忽略（期望 func(*ActuatorManager, *structs.Machine, int, structs.Effect) error）", name)
		return reflect.Method{}
	}
	return m
}

// validBehaviorSignature 校验定制行为签名：
// 4 个入参（接收者 / machine / self / effect），出参为空或恰好一个 error。
// 这里用 m.Func.Type()（含接收者）而不是 m.Type，避免不同 reflect 形态下
// "方法类型是否含接收者"的歧义。
func validBehaviorSignature(m reflect.Method) bool {
	t := m.Func.Type()
	if t.NumIn() != 4 || t.NumOut() > 1 {
		return false
	}
	if t.In(0) != managerTypeRef || t.In(1) != machineTypeRef || t.In(2) != intTypeRef || t.In(3) != effectTypeRef {
		return false
	}
	if t.NumOut() == 1 && t.Out(0) != errorTypeRef {
		return false
	}
	return true
}

// StartListener 为给定的战斗位索引启动监听器（订阅走 machine.Subscribe）。
// ids 必须是合法的战斗位索引；越界的索引会被跳过。
func (am *ActuatorManager) StartListener(machine *structs.Machine, ids []int) error {
	for _, idx := range ids {
		if idx < 0 || idx >= len(machine.CharacterState) {
			continue
		}
		NewActuator(am, idx, machine)
	}
	return nil
}

// Apply 结算单条效果：优先使用该战斗位的定制行为（完全接管），否则走默认结算。
//
// 注意：调用定制行为时**不持有 machine.Mu**。定制行为若需读写角色状态请自行加锁
// （与 Skill2Listener 等既有监听器的风格一致）；默认结算内部会自行加锁。
func (am *ActuatorManager) Apply(machine *structs.Machine, e structs.Effect) error {
	if dbID, isSelf, ok := machine.CharacterDBID(e.TargetID); ok {
		behaviors := am.enemyBehaviors
		if isSelf {
			behaviors = am.characterBehaviors
		}
		if b, found := behaviors[dbID]; found {
			if method, has := b.pick(e.Kind); has {
				return am.callBehavior(method, machine, e)
			}
		}
	}
	return defaultSettle(machine, e)
}

// callBehavior 反射调用定制行为；panic 被捕获转为错误，避免拖垮主循环。
func (am *ActuatorManager) callBehavior(method reflect.Method, machine *structs.Machine, e structs.Effect) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("战斗位 %d 的定制行为 %s 执行 panic: %v", e.TargetID, method.Name, r)
		}
	}()

	results := method.Func.Call([]reflect.Value{
		reflect.ValueOf(am),
		reflect.ValueOf(machine),
		reflect.ValueOf(e.TargetID),
		reflect.ValueOf(e),
	})
	if len(results) == 0 || results[0].IsNil() {
		return nil
	}
	return results[0].Interface().(error)
}

// defaultSettle 默认结算：伤害按防御减免（不低于 0，且生命不为负）、恢复累加、buff 追加。
func defaultSettle(machine *structs.Machine, e structs.Effect) error {
	machine.Mu.Lock()
	defer machine.Mu.Unlock()

	if e.TargetID < 0 || e.TargetID >= len(machine.CharacterState) {
		return fmt.Errorf("战斗位 %d 不存在", e.TargetID)
	}
	stateTarget := machine.CharacterState[e.TargetID]
	if stateTarget == nil {
		return fmt.Errorf("战斗位 %d 状态缺失", e.TargetID)
	}

	switch e.Kind {
	case structs.EffectAttack:
		damageType := ParseDamageType(e)
		AttackModule(machine, e.SourceID, e.TargetID, e.Damage, damageType)
	case structs.EffectRecover:
		RecoverModule(machine, e.TargetID, e.Recover)
	case structs.EffectBuff:
		GetBuffModule(machine, e.TargetID, e.BuffID, e.BuffTime)
	default:
		return fmt.Errorf("未知的效果类型 %d", int(e.Kind))
	}
	return nil
}

// Actuator 一个战斗位的监听器契约。
type Actuator interface {
	AttackListener(msg *message.Message, machine *structs.Machine) error
	RecoverListener(msg *message.Message, machine *structs.Machine) error
	GetBuffListener(msg *message.Message, machine *structs.Machine) error
	PermanentListener(machine *structs.Machine) error
}

// ActuatorImpl 单个战斗位的监听器。
//
// 每个事件由"目标战斗位与自身索引相同"的唯一一个 actuator 负责：
// 它先等该事件要求的反应者全部打点完毕（事件中枢的反应版本闸门），**再立即结算**，
// 最后释放该事件。因此：
//   - 结算是收到事件时发生的，不攒到回合末；
//   - 结算必然晚于所有其它监听器（技能反应）对该事件的处理。
//
// 不负责该事件的 actuator 直接返回：既不等待也不结算，不会重复结算。
type ActuatorImpl struct {
	Manager *ActuatorManager
	ID      int // 战斗位索引（0..N-1），不是角色 DB ID
}

var _ Actuator = (*ActuatorImpl)(nil)

// NewActuator 为指定战斗位启动监听 goroutine。
// 订阅走 machine.Subscribe（pubsub 由 Machine 独占，不再作为参数透传）；
// 订阅生命周期与战斗上下文绑定（战斗结束时取消，订阅随之关闭，goroutine 退出）。
func NewActuator(manager *ActuatorManager, id int, machine *structs.Machine) *ActuatorImpl {
	actuator := &ActuatorImpl{Manager: manager, ID: id}
	attackMessages, err1 := machine.Subscribe("fight-attack")
	recoverMessages, err2 := machine.Subscribe("fight-recover")
	buffMessages, err3 := machine.Subscribe("fight-buff")
	if err1 != nil || err2 != nil || err3 != nil {
		log.Printf("Actuator %d Subscribe error: %v, %v, %v", actuator.ID, err1, err2, err3)
		return actuator
	}
	if err := actuator.PermanentListener(machine); err != nil {
		log.Printf("Actuator %d PermanentListener error: %v", actuator.ID, err)
	}
	go actuator.consume(attackMessages, machine, actuator.AttackListener, "Attack")
	go actuator.consume(recoverMessages, machine, actuator.RecoverListener, "Recover")
	go actuator.consume(buffMessages, machine, actuator.GetBuffListener, "GetBuff")
	return actuator
}

// consume 监听循环。
//
// 两件必须配平的事：
//   - 事件处理本身（失败只记日志，不影响订阅继续）；
//   - msg.Ack()：gochannel 的投递 goroutine 会一直阻塞等 Ack（pubsub.go 中等 Ack 没有超时），
//     不 Ack 就等于每条消息每个订阅者泄漏一个 goroutine 和一份消息副本。
func (a *ActuatorImpl) consume(messages <-chan *message.Message, machine *structs.Machine, handle func(*message.Message, *structs.Machine) error, name string) {
	for msg := range messages {
		if err := handle(msg, machine); err != nil {
			log.Printf("Actuator %d %sListener error: %v", a.ID, name, err)
		}
		msg.Ack()
	}
}

// settleOwned 负责结算命中本战斗位的效果：
// 先等该事件要求的反应者全部打点（"actuator 最后执行"由此保证），再立即结算并释放事件。
func (a *ActuatorImpl) settleOwned(msg *message.Message, machine *structs.Machine, e structs.Effect) {
	gate := machine.Events()
	eventID, _ := structs.EventStamp(msg)

	// 事件带了版本戳才会被登记；未登记的（旧格式/已清扫）事件不会阻塞结算
	gate.WaitReacted(eventID, structs.ReactionWaitTimeout)

	if err := a.Manager.Apply(machine, e); err != nil {
		log.Printf("结算战斗位 %d 的 %s 效果失败: %v", e.TargetID, e.Kind, err)
	}
	gate.FinishEvent(eventID)
}

// PermanentListener 预留的常驻监听入口（当前无额外订阅）。
func (a *ActuatorImpl) PermanentListener(machine *structs.Machine) error {
	return nil
}

// AttackListener 伤害事件：命中本战斗位时等反应者打完点后立即结算。
func (a *ActuatorImpl) AttackListener(msg *message.Message, machine *structs.Machine) error {
	attack := &structs.Attack{}
	if err := json.Unmarshal(msg.Payload, attack); err != nil {
		return err
	}
	if attack.TargetID != a.ID {
		return nil // 不负责该事件：不等待、不结算、不释放
	}
	a.settleOwned(msg, machine, structs.Effect{
		Kind:     structs.EffectAttack,
		TargetID: attack.TargetID,
		SourceID: attack.SourceID,
		Damage:   attack.Damage,
		Other:    attack.Other,
	})
	return nil
}

// GetBuffListener buff 事件：同样等反应者打完点后立即结算。
func (a *ActuatorImpl) GetBuffListener(msg *message.Message, machine *structs.Machine) error {
	buff := &structs.BuffMessage{}
	if err := json.Unmarshal(msg.Payload, buff); err != nil {
		return err
	}
	if buff.TargetID != a.ID {
		return nil
	}
	a.settleOwned(msg, machine, structs.Effect{
		Kind:     structs.EffectBuff,
		TargetID: buff.TargetID,
		SourceID: buff.SourceID,
		BuffID:   buff.ID,
		BuffTime: buff.Time,
		Other:    buff.Other,
	})
	return nil
}

// RecoverListener 恢复事件：同样等反应者打完点后立即结算。
func (a *ActuatorImpl) RecoverListener(msg *message.Message, machine *structs.Machine) error {
	r := &structs.Recover{}
	if err := json.Unmarshal(msg.Payload, r); err != nil {
		return err
	}
	if r.TargetID != a.ID {
		return nil
	}
	a.settleOwned(msg, machine, structs.Effect{
		Kind:     structs.EffectRecover,
		TargetID: r.TargetID,
		SourceID: r.SourceID,
		Recover:  r.Recover,
		Other:    r.Other,
	})
	return nil
}
