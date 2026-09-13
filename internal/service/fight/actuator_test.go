package fight

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"context"
	"encoding/json"
	"runtime"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

// 本文件里的定制行为方法命名，与生产注册表扫描的约定完全一致：
//
//	Character<DB ID>AttackListener / RecoverListener / GetBuffListener
//	Enemy<DB ID>AttackListener     / RecoverListener / GetBuffListener
//
// 因此这些测试实际覆盖的是生产用的反射注册路径（am.register）。
var (
	customAttackCalls  atomic.Int64
	customRecoverCalls atomic.Int64
	// settleLog 记录"反应"与"结算"的先后顺序，用于验证时序
	settleLogMu sync.Mutex
	settleLog   []string
)

func logSettle(what string) {
	settleLogMu.Lock()
	settleLog = append(settleLog, what)
	settleLogMu.Unlock()
}

func takeSettleLog() []string {
	settleLogMu.Lock()
	defer settleLogMu.Unlock()
	out := settleLog
	settleLog = nil
	return out
}

// Character1AttackListener 完全接管：不倒扣血反而治疗 1 点，
// 用于验证"方法存在即接管，默认结算不再执行"。
// 同时记录"结算"这一时刻，用于验证它发生在反应者之后。
func (am *ActuatorManager) Character1AttackListener(machine *structs.Machine, self int, e structs.Effect) error {
	customAttackCalls.Add(1)
	logSettle("settle")
	machine.Mu.Lock()
	defer machine.Mu.Unlock()
	machine.CharacterState[self].Health++
	return nil
}

// Character1RecoverListener 无返回值的签名也应被接受。
func (am *ActuatorManager) Character1RecoverListener(machine *structs.Machine, self int, e structs.Effect) {
	customRecoverCalls.Add(1)
}

// Enemy2AttackListener 验证敌方行为按 NPC DB ID 分派。
func (am *ActuatorManager) Enemy2AttackListener(machine *structs.Machine, self int, e structs.Effect) error {
	machine.Mu.Lock()
	defer machine.Mu.Unlock()
	machine.CharacterState[self].Health -= 100 // 无视防御
	return nil
}

// Character9AttackListener 签名不符（少了 Effect 入参）：应被忽略并回落到默认结算。
func (am *ActuatorManager) Character9AttackListener(machine *structs.Machine, self int) error {
	return nil
}

func newTestActuatorManager() *ActuatorManager {
	return &ActuatorManager{
		characterBehaviors: map[int]Behavior{},
		enemyBehaviors:     map[int]Behavior{},
	}
}

// registerTestBehavior 走生产同款反射注册路径，把 prefix 对应的方法挂到 dbID 上。
func registerTestBehavior(t *testing.T, am *ActuatorManager, prefix string, dbID int, isSelf bool) {
	t.Helper()
	b, ok := am.register(prefix)
	if !ok {
		t.Fatalf("注册 %s 失败：未找到合法签名的方法", prefix)
	}
	if isSelf {
		am.characterBehaviors[dbID] = b
	} else {
		am.enemyBehaviors[dbID] = b
	}
}

func newTestMachine(states ...*structs.CharacterState) *structs.Machine {
	return &structs.Machine{
		Ctx:                 context.Background(),
		CharacterState:      states,
		CharacterUsedSkill:  map[int]int{},
		Counters:            map[string]float32{},
		SelfCharacterIndex:  map[int]int{},
		EnemyCharacterIndex: map[int]int{},
		Reaction:            structs.NewReactionGate(),
	}
}

func state(health, defense int) *structs.CharacterState {
	return &structs.CharacterState{Health: health, Attack: 1, Recover: 1, Defense: defense, Buffs: []*structs.Buff{}}
}

// waitFor 轮询等待条件成立，超时则让测试失败。
func waitFor(t *testing.T, timeout time.Duration, desc string, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatalf("等待超时：%s", desc)
}

func healthOf(m *structs.Machine, idx int) int {
	m.Mu.RLock()
	defer m.Mu.RUnlock()
	return m.CharacterState[idx].Health
}

func newTestPubSub(t *testing.T) *gochannel.GoChannel {
	t.Helper()
	pubSub := gochannel.NewGoChannel(gochannel.Config{}, watermill.NopLogger{})
	t.Cleanup(func() { _ = pubSub.Close() })
	return pubSub
}

// TestApplyDefaultSettle 未注册定制行为时走默认结算：伤害按防御减免、不为负、恢复累加、buff 追加。
func TestApplyDefaultSettle(t *testing.T) {
	am := newTestActuatorManager()
	m := newTestMachine(state(10, 2))
	m.CharacterIDs = []int{1}
	m.SelfCharacterNumber = 1

	// 伤害 5 - 防御 2 = 3
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 0, Damage: 5}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[0].Health; got != 7 {
		t.Fatalf("默认伤害结算错误：Health = %d, want 7", got)
	}

	// 伤害不足以破防：不减血
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 0, Damage: 1}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[0].Health; got != 7 {
		t.Fatalf("伤害低于防御时不应扣血：Health = %d, want 7", got)
	}

	// 生命不为负
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 0, Damage: 999}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[0].Health; got != 0 {
		t.Fatalf("生命应被夹到 0：Health = %d, want 0", got)
	}

	// 恢复累加
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectRecover, TargetID: 0, Recover: 4}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[0].Health; got != 4 {
		t.Fatalf("恢复结算错误：Health = %d, want 4", got)
	}

	// buff 追加
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectBuff, TargetID: 0, BuffID: 7, BuffTime: 3}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if n := len(m.CharacterState[0].Buffs); n != 1 {
		t.Fatalf("buff 未追加：len = %d, want 1", n)
	}

	// 越界目标返回错误而不是 panic
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 9, Damage: 1}); err == nil {
		t.Fatal("越界目标应返回错误")
	}
}

// TestApplyCustomCharacterBehaviorTakesOver 我方角色定制行为存在时完全接管默认结算。
func TestApplyCustomCharacterBehaviorTakesOver(t *testing.T) {
	customAttackCalls.Store(0)
	am := newTestActuatorManager()
	registerTestBehavior(t, am, "Character1", 1, true)

	m := newTestMachine(state(10, 0))
	m.CharacterIDs = []int{1}
	m.SelfCharacterNumber = 1

	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 0, Damage: 5}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[0].Health; got != 11 {
		t.Fatalf("定制行为未接管默认结算：Health = %d, want 11", got)
	}
	if got := customAttackCalls.Load(); got != 1 {
		t.Fatalf("定制行为调用次数 = %d, want 1", got)
	}
}

// TestApplyDispatchesEnemyBehavior 敌方按 NPC DB ID 分派（同一索引空间不串台）。
func TestApplyDispatchesEnemyBehavior(t *testing.T) {
	am := newTestActuatorManager()
	registerTestBehavior(t, am, "Enemy2", 2, false)

	// 索引 0 是我方、索引 1 是敌方（DB ID 均为 2）
	m := newTestMachine(state(10, 0), state(10, 0))
	m.CharacterIDs = []int{2, 2}
	m.SelfCharacterNumber = 1

	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 0, Damage: 1}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[0].Health; got != 9 {
		t.Fatalf("我方战斗位不应套用敌方行为：Health = %d, want 9", got)
	}
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 1, Damage: 1}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[1].Health; got != -90 {
		t.Fatalf("敌方战斗位应套用 Enemy2 行为（无视防御扣 100）：Health = %d, want -90", got)
	}
}

// TestRegisterRejectsBadSignature 签名不符的方法必须被忽略，回落默认结算。
func TestRegisterRejectsBadSignature(t *testing.T) {
	am := newTestActuatorManager()
	if _, ok := am.register("Character9"); ok {
		t.Fatal("签名不符的 Character9AttackListener 不应注册成功")
	}
	m := newTestMachine(state(10, 0))
	m.CharacterIDs = []int{9}
	m.SelfCharacterNumber = 1
	if err := am.Apply(m, structs.Effect{Kind: structs.EffectAttack, TargetID: 0, Damage: 3}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}
	if got := m.CharacterState[0].Health; got != 7 {
		t.Fatalf("应回落默认结算：Health = %d, want 7", got)
	}
}

// TestSettlesOnReceiptWithoutExplicitCommit 核心要求一：收到事件就结算，
// 不需要任何"回合末提交"调用。
func TestSettlesOnReceiptWithoutExplicitCommit(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pubSub := newTestPubSub(t)
	am := newTestActuatorManager()
	m := newTestMachine(state(10, 2))
	m.Ctx = ctx
	m.CharacterIDs = []int{1}
	m.SelfCharacterNumber = 1

	if err := am.StartListener(pubSub, m, []int{0}); err != nil {
		t.Fatalf("StartListener 失败: %v", err)
	}

	payload, _ := json.Marshal(structs.Attack{Damage: 5, TargetID: 0, SourceID: 0})
	if err := m.PublishEvent(pubSub, "fight-attack", message.NewMessage("m1", payload)); err != nil {
		t.Fatalf("PublishEvent 失败: %v", err)
	}

	// 不调用任何提交/结算方法，只等监听器自己结算
	waitFor(t, time.Second, "监听器收到事件后立即结算", func() bool { return healthOf(m, 0) == 7 })
	if pending, tracked, _ := m.Gate().Stats(); pending != 0 || tracked != 0 {
		t.Fatalf("结算后事件应被释放：pending = %d, tracked = %d", pending, tracked)
	}
}

// TestReactorRunsBeforeSettlement 核心要求二：同一事件上，反应者（其它监听器）必须先执行完，
// actuator 才结算 —— 这正是"订阅顺序在 gochannel 上无法保证"的那件事。
func TestReactorRunsBeforeSettlement(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	takeSettleLog()
	pubSub := newTestPubSub(t)
	am := newTestActuatorManager()
	// 用定制行为记录"结算"发生的时刻，便于与反应顺序比对
	registerTestBehavior(t, am, "Character1", 1, true)

	m := newTestMachine(state(10, 0))
	m.Ctx = ctx
	m.CharacterIDs = []int{1}
	m.SelfCharacterNumber = 1

	if err := am.StartListener(pubSub, m, []int{0}); err != nil {
		t.Fatalf("StartListener 失败: %v", err)
	}

	// 反应者：收到攻击后先短暂"思考"再打点，模拟真实技能反应耗时
	reactorStarted := make(chan struct{}, 1)
	reactorDone := make(chan struct{}, 1)
	err := m.RegisterReactor(pubSub, ctx, "fight-attack", func(msg *message.Message) bool {
		select {
		case reactorStarted <- struct{}{}:
		default:
		}
		time.Sleep(5 * time.Millisecond)
		logSettle("react")
		select {
		case reactorDone <- struct{}{}:
		default:
		}
		return false
	})
	if err != nil {
		t.Fatalf("RegisterReactor 失败: %v", err)
	}

	payload, _ := json.Marshal(structs.Attack{Damage: 5, TargetID: 0, SourceID: 0})
	if err := m.PublishEvent(pubSub, "fight-attack", message.NewMessage("m2", payload)); err != nil {
		t.Fatalf("PublishEvent 失败: %v", err)
	}

	select {
	case <-reactorStarted:
	case <-time.After(time.Second):
		t.Fatal("反应者未被触发")
	}
	select {
	case <-reactorDone:
	case <-time.After(time.Second):
		t.Fatal("反应者未完成")
	}

	// 反应者已完成，结算也必须已经（在此之前）发生
	waitFor(t, time.Second, "反应者之后完成结算", func() bool {
		settleLogMu.Lock()
		defer settleLogMu.Unlock()
		return len(settleLog) >= 2
	})

	got := takeSettleLog()
	if len(got) != 2 || got[0] != "react" || got[1] != "settle" {
		t.Fatalf("执行顺序应为 [react settle]，实际 %v", got)
	}
}

// TestReactorFollowUpSettledInSameChain 反应者再次发布事件（如"追加攻击"）时，
// 追加事件同样会被结算，且不会死锁。
func TestReactorFollowUpSettledInSameChain(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pubSub := newTestPubSub(t)
	am := newTestActuatorManager()
	m := newTestMachine(state(10, 0))
	m.Ctx = ctx
	m.CharacterIDs = []int{1}
	m.SelfCharacterNumber = 1

	if err := am.StartListener(pubSub, m, []int{0}); err != nil {
		t.Fatalf("StartListener 失败: %v", err)
	}

	// 模拟 Skill2Listener：收到伤害事件后追加一半伤害（用 Other 标记防止自反馈成环）
	err := m.RegisterReactor(pubSub, ctx, "fight-attack", func(msg *message.Message) bool {
		var atk structs.Attack
		if err := json.Unmarshal(msg.Payload, &atk); err != nil || atk.Other == "follow" {
			return false
		}
		follow, _ := json.Marshal(structs.Attack{
			Damage:   atk.Damage / 2,
			TargetID: atk.TargetID,
			SourceID: atk.SourceID,
			Other:    "follow",
		})
		_ = m.PublishEvent(pubSub, "fight-attack", message.NewMessage("m-follow", follow))
		return false
	})
	if err != nil {
		t.Fatalf("RegisterReactor 失败: %v", err)
	}

	payload, _ := json.Marshal(structs.Attack{Damage: 4, TargetID: 0, SourceID: 0})
	if err := m.PublishEvent(pubSub, "fight-attack", message.NewMessage("m3", payload)); err != nil {
		t.Fatalf("PublishEvent 失败: %v", err)
	}

	// 4 点主伤害 + 2 点追加伤害都要落地，且事件链全部释放
	waitFor(t, 2*time.Second, "主伤害与追加伤害都被结算", func() bool { return healthOf(m, 0) == 4 })
	waitFor(t, 2*time.Second, "事件链全部释放（无泄漏）", func() bool {
		pending, tracked, _ := m.Gate().Stats()
		return pending == 0 && tracked == 0
	})
}

// TestReactVersionReleasedOnStop 反应者退出时必须把反应版本 -1，
// 否则后续事件会一直等一个不存在的反应者，只能走超时。
func TestReactVersionReleasedOnStop(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pubSub := newTestPubSub(t)
	m := newTestMachine(state(10, 0))
	m.Ctx = ctx

	// 反应者处理第一条消息后立即退出（stop = true）
	err := m.RegisterReactor(pubSub, ctx, "fight-attack", func(msg *message.Message) bool { return true })
	if err != nil {
		t.Fatalf("RegisterReactor 失败: %v", err)
	}
	if v := m.Gate().Version("fight-attack"); v != 1 {
		t.Fatalf("注册后反应版本 = %d, want 1", v)
	}

	payload, _ := json.Marshal(structs.Attack{Damage: 1, TargetID: 0, SourceID: 0})
	if err := m.PublishEvent(pubSub, "fight-attack", message.NewMessage("m4", payload)); err != nil {
		t.Fatalf("PublishEvent 失败: %v", err)
	}

	waitFor(t, time.Second, "反应者退出后反应版本归零", func() bool {
		return m.Gate().Version("fight-attack") == 0
	})
}

// TestActuatorAcksMessages 回归测试：
// gochannel 的投递 goroutine 会一直阻塞等 Ack（pubsub.go 中等 Ack 没有超时），
// 监听器不 Ack 就等于每条消息每个订阅者泄漏一个 goroutine 和一份消息副本。
func TestActuatorAcksMessages(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pubSub := newTestPubSub(t)
	am := newTestActuatorManager()
	m := newTestMachine(state(100000, 0))
	m.Ctx = ctx
	m.CharacterIDs = []int{1}
	m.SelfCharacterNumber = 1

	if err := am.StartListener(pubSub, m, []int{0}); err != nil {
		t.Fatalf("StartListener 失败: %v", err)
	}

	// 先发一条并等结算完成，让监听 goroutine 就位，避免把启动开销算进基线
	warm, _ := json.Marshal(structs.Attack{Damage: 1, TargetID: 0, SourceID: 0})
	if err := m.PublishEvent(pubSub, "fight-attack", message.NewMessage("warm", warm)); err != nil {
		t.Fatalf("PublishEvent 失败: %v", err)
	}
	waitFor(t, time.Second, "预热事件结算完成", func() bool { return healthOf(m, 0) == 99999 })
	baseline := runtime.NumGoroutine()

	const n = 100
	for i := 0; i < n; i++ {
		payload, _ := json.Marshal(structs.Attack{Damage: 1, TargetID: 0, SourceID: 0})
		if err := m.PublishEvent(pubSub, "fight-attack", message.NewMessage("leak", payload)); err != nil {
			t.Fatalf("PublishEvent 失败: %v", err)
		}
	}

	// 等投递 goroutine 收尾；若不 Ack，这里会稳定多出约 n 个 goroutine
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if runtime.NumGoroutine() <= baseline+20 {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("疑似 goroutine 泄漏（监听器未 Ack）：baseline = %d, now = %d", baseline, runtime.NumGoroutine())
}
