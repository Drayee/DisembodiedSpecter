package structs

import (
	"context"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/ThreeDotsLabs/watermill"
	"github.com/ThreeDotsLabs/watermill/message"
)

// EffectKind 结算效果的类型。
type EffectKind int

const (
	EffectAttack  EffectKind = iota // 伤害
	EffectRecover                   // 恢复
	EffectBuff                      // buff
)

func (k EffectKind) String() string {
	switch k {
	case EffectAttack:
		return "attack"
	case EffectRecover:
		return "recover"
	case EffectBuff:
		return "buff"
	default:
		return "unknown"
	}
}

// Effect 一条待结算的战斗效果，也是定制行为方法收到的值对象。
// TargetID / SourceID 都是战斗位索引（0..N-1，我方在前敌方在后），不是角色 DB ID。
type Effect struct {
	Kind     EffectKind
	TargetID int // 目标战斗位索引
	SourceID int // 来源战斗位索引
	Damage   int // Kind == EffectAttack 时的伤害值
	Recover  int // Kind == EffectRecover 时的恢复值
	BuffID   int // Kind == EffectBuff 时的 buff ID
	BuffTime int // Kind == EffectBuff 时的持续回合
	Other    string
}

// PubSub 发布/订阅端抽象，*gochannel.GoChannel 满足该接口。
// 抽成接口是为了让 structs 包不必依赖具体 pubsub 实现。
type PubSub interface {
	Publish(topic string, messages ...*message.Message) error
	Subscribe(ctx context.Context, topic string) (<-chan *message.Message, error)
}

// 事件元数据键。
const (
	metaEventID   = "fight_event_id"   // 事件唯一 ID（每次发布独立，不复用 machine.UUID）
	metaReactNeed = "fight_react_need" // 本次事件要求几个反应者打点（即发布时的"反应版本"）
)

const (
	// ReactionWaitTimeout 结算前等待反应者打点的硬上限。
	// 只是兜底：正常情况下反应者在亚毫秒级就会打点，超时说明有反应者漏打点
	// （例如发布瞬间正好退订），此时按超时照常结算，避免卡住该战斗位的监听 goroutine。
	ReactionWaitTimeout = 100 * time.Millisecond
	// MaxPendingEvents 未结算事件的追踪上限，超出后不再追踪（事件照常结算，只是不参与
	// "本回合是否全部结算完"的判断），保证失控情况下内存有界。
	MaxPendingEvents = 4096
	// pendingEventTTL 未结算事件的追踪存活上限，超时即被清扫。
	// 事件正常由"负责它的 actuator"在结算后释放；目标战斗位不存在 actuator 的事件
	// 会落到这里回收，因此追踪表不会无界增长。
	pendingEventTTL = 30 * time.Second
	// sweepThreshold 追踪表达到该规模时触发一次过期清扫。
	sweepThreshold = 256
)

// ReactionGate 反应版本闸门 —— 在"收到事件即结算"的前提下实现"actuator 最后执行"。
//
// 背景：watermill gochannel 的 Publish 会为每个订阅者各起一个 goroutine 并发投递
// （pubsub.go sendMessage），订阅者之间没有任何顺序保证，靠订阅顺序拿不到"最后执行"。
//
// 做法（每个事件独立一份版本）：
//  1. 每个 topic 有一个"反应版本" = 当前注册的反应者（技能监听器）数量，
//     每注册一个反应者版本 +1，退订则 -1；
//  2. 发布事件时把当时的反应版本写进消息元数据（fight_react_need），
//     并登记为"待结算事件"；
//  3. 反应者处理完该事件后打点（ReactDone）；
//  4. 负责该战斗位的 actuator 收到事件后，先等打点数 == 事件携带的版本，
//     确认所有反应者都已处理完毕，**再立即结算**该事件，然后释放事件。
//
// 于是"结算"既发生在收到事件时（不攒到回合末），又必然发生在所有其它监听器反应之后。
type ReactionGate struct {
	mu       sync.Mutex
	reactors map[string]int           // topic → 活跃反应者数量（即反应版本）
	events   map[string]*pendingEvent // 事件 ID → 待结算状态
	pending  int                      // 已登记未结算的事件数（用于"本回合是否结算完"）
	lastAct  time.Time                // 最近一次活动时间（打点/登记/结算），用于空闲判定
	signal   chan struct{}
}

type pendingEvent struct {
	required int
	done     int
	created  time.Time
}

func NewReactionGate() *ReactionGate {
	return &ReactionGate{
		reactors: map[string]int{},
		events:   map[string]*pendingEvent{},
		lastAct:  time.Now(),
		signal:   make(chan struct{}, 1),
	}
}

// touch 记录一次活动并非阻塞唤醒等待者（调用方必须已持有 g.mu）。
func (g *ReactionGate) touch() {
	g.lastAct = time.Now()
	select {
	case g.signal <- struct{}{}:
	default:
	}
}

// wait 等待被唤醒或超时，两者皆可返回。
func (g *ReactionGate) wait(d time.Duration) {
	if d <= 0 {
		return
	}
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-g.signal:
	case <-timer.C:
	}
}

// AddReactor 注册一个反应者（技能监听器），把该 topic 的反应版本 +1。
// 返回的释放函数必须在其监听 goroutine 退出时调用，把版本 -1，
// 否则后续事件会要求一个已经不复存在的反应者打点，只能等超时。
func (g *ReactionGate) AddReactor(topic string) func() {
	g.mu.Lock()
	g.reactors[topic]++
	g.touch()
	g.mu.Unlock()

	var once sync.Once
	return func() {
		once.Do(func() {
			g.mu.Lock()
			if g.reactors[topic] > 0 {
				g.reactors[topic]--
			}
			g.touch()
			g.mu.Unlock()
		})
	}
}

// Version 返回该 topic 当前的反应版本（活跃反应者数量）。
func (g *ReactionGate) Version(topic string) int {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.reactors[topic]
}

// BeginEvent 登记一个待结算事件（由发布方调用），并返回登记是否成功。
// 返回 false 表示追踪表已达上限，事件仍会正常投递与结算，只是不计入待结算计数。
func (g *ReactionGate) BeginEvent(id string, required int) bool {
	if id == "" {
		return false
	}
	g.mu.Lock()
	defer g.mu.Unlock()

	if len(g.events) >= sweepThreshold {
		g.sweepLocked()
	}
	if len(g.events) >= MaxPendingEvents {
		log.Printf("待结算事件追踪表已达上限 %d，事件 %s 不再追踪（仍会正常结算）", MaxPendingEvents, id)
		return false
	}

	g.events[id] = &pendingEvent{required: required, created: time.Now()}
	g.pending++
	g.touch()
	return true
}

// ReactDone 反应者处理完事件后打点。
// 未登记或已被清扫的事件直接忽略，不报错。
func (g *ReactionGate) ReactDone(id string) {
	if id == "" {
		return
	}
	g.mu.Lock()
	if e, ok := g.events[id]; ok {
		e.done++
		g.touch()
	}
	g.mu.Unlock()
}

// WaitReacted 等待该事件的所有反应者打点完毕；返回 false 表示超时兜底放行。
// 事件未被追踪（已清扫/超限）时直接返回 true，不阻塞结算。
func (g *ReactionGate) WaitReacted(id string, timeout time.Duration) bool {
	if id == "" {
		return true
	}
	deadline := time.Now().Add(timeout)
	for {
		g.mu.Lock()
		e, ok := g.events[id]
		if !ok {
			g.mu.Unlock()
			return true
		}
		done, required := e.done, e.required
		g.mu.Unlock()

		if done >= required {
			return true
		}
		remain := time.Until(deadline)
		if remain <= 0 {
			log.Printf("事件 %s 的反应版本未打满（%d/%d），按超时结算", id, done, required)
			return false
		}
		g.wait(min(remain, 2*time.Millisecond))
	}
}

// FinishEvent 释放事件：由负责该事件的 actuator 在结算完成后调用。
// 幂等：重复调用只生效一次；调用同时递减待结算计数。
func (g *ReactionGate) FinishEvent(id string) {
	if id == "" {
		return
	}
	g.mu.Lock()
	if _, ok := g.events[id]; ok {
		delete(g.events, id)
		if g.pending > 0 {
			g.pending--
		}
		g.touch()
	}
	g.mu.Unlock()
}

// WaitAllSettled 等待"已发布的事件全部结算完"，供主循环在读取最终数值前同步使用。
//
//   - 全部结算完（pending == 0）且连续 quiet 空闲即返回 true；
//   - 仍有事件但连续 stall 时长没有任何进展（打点/登记/结算都算进展），
//     判定为"无人能结算的事件"（例如目标战斗位不存在对应的 actuator），
//     返回 false 并告警 —— 不能为了这种事件把主循环卡到 timeout；
//   - timeout 是硬上限。
func (g *ReactionGate) WaitAllSettled(quiet, stall, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for {
		g.mu.Lock()
		pending := g.pending
		silentFor := time.Since(g.lastAct)
		g.mu.Unlock()

		if pending == 0 {
			if silentFor >= quiet {
				return true
			}
		} else if silentFor >= stall {
			log.Printf("仍有 %d 个事件在 %s 内没有任何进展，判定为无法结算并停止等待", pending, silentFor)
			return false
		}

		remain := time.Until(deadline)
		if remain <= 0 {
			return pending == 0
		}
		// 有事件未结算时按 stall 窗口等（进展会唤醒），否则只需凑满 quiet
		wait := quiet - silentFor
		if pending > 0 {
			wait = stall - silentFor
		}
		g.wait(min(wait, remain))
	}
}

// Stats 返回待结算事件数、追踪的事件数与活跃反应者总数。
func (g *ReactionGate) Stats() (pending int, tracked int, reactors int) {
	g.mu.Lock()
	defer g.mu.Unlock()
	for _, n := range g.reactors {
		reactors += n
	}
	return g.pending, len(g.events), reactors
}

// sweepLocked 清扫追踪超时的未结算事件（调用方必须已持有 g.mu）。
func (g *ReactionGate) sweepLocked() {
	now := time.Now()
	for id, e := range g.events {
		if now.Sub(e.created) > pendingEventTTL {
			delete(g.events, id)
			if g.pending > 0 {
				g.pending--
			}
		}
	}
}

// EventStamp 读取事件上的版本戳，返回事件 ID 与本事件要求的反应者打点数。
// 未打戳（或已损坏）的事件返回 required == 0，表示无需等待反应者，可立即结算。
func EventStamp(msg *message.Message) (eventID string, required int) {
	if msg == nil {
		return "", 0
	}
	id := msg.Metadata.Get(metaEventID)
	if id == "" {
		return "", 0
	}
	n, err := strconv.Atoi(msg.Metadata.Get(metaReactNeed))
	if err != nil || n < 0 {
		return id, 0
	}
	return id, n
}

// Gate 返回本机的反应版本闸门（惰性创建，保证发布方/反应者/actuator 拿到同一实例）。
func (m *Machine) Gate() *ReactionGate {
	m.Mu.RLock()
	g := m.Reaction
	m.Mu.RUnlock()
	if g != nil {
		return g
	}
	m.Mu.Lock()
	defer m.Mu.Unlock()
	if m.Reaction == nil {
		m.Reaction = NewReactionGate()
	}
	return m.Reaction
}

// PublishEvent 发布一条战斗事件，并给它打上"反应版本"戳：
//
//	事件 ID（每次发布独立生成，不复用 machine.UUID）
//	本次要求几个反应者打点（= 发布时刻本 topic 的反应版本）
//
// actuator 收到后会先等这些反应者打完点再结算，因此"结算"必然最后发生。
func (m *Machine) PublishEvent(pubSub PubSub, topic string, msg *message.Message) error {
	gate := m.Gate()
	eventID := watermill.NewUUID()
	required := gate.Version(topic)
	gate.BeginEvent(eventID, required)

	msg.Metadata.Set(metaEventID, eventID)
	msg.Metadata.Set(metaReactNeed, strconv.Itoa(required))

	if err := pubSub.Publish(topic, msg); err != nil {
		// 发布失败：没有任何监听器会收到它，必须立即释放追踪，否则会拖住本回合的等待
		gate.FinishEvent(eventID)
		return err
	}
	return nil
}

// RegisterReactor 把一个技能监听器注册为 topic 的反应者。
//
// 由本方法统一保证三件容易漏掉的事，避免"漏打点/漏 Ack/漏退订"这类隐患：
//   - 反应版本 +1，监听 goroutine 退出时 -1；
//   - 每条消息处理完都打点（ReactDone），无论该监听器是否真的处理了它；
//   - 每条消息都 Ack（gochannel 的投递 goroutine 会一直等 Ack，不等就是每消息泄漏一个 goroutine），
//     退出时取消订阅，避免后续消息堵在无人读取的 channel 上。
//
// 版本 +1 刻意发生在 Subscribe 之前：若期间恰好有事件发布，该事件的要求数会包含这个
// 还没建立订阅的反应者，于是它不会收到、也就不会打点，actuator 只能等
// ReactionWaitTimeout 兜底后结算 —— 代价是一次有界等待加一条告警日志。
// 反过来（先订阅再 +1）会让该事件的要求数为 0，导致 actuator 抢在反应者之前结算，
// 直接破坏"最后执行"的语义，因此这里选择前者。
//
// handler 返回 true 表示按业务逻辑结束本监听器（goroutine 退出并释放反应版本）。
func (m *Machine) RegisterReactor(pubSub PubSub, ctx context.Context, topic string, handler func(*message.Message) bool) error {
	gate := m.Gate()
	release := gate.AddReactor(topic)

	subCtx, cancelSub := context.WithCancel(ctx)
	messages, err := pubSub.Subscribe(subCtx, topic)
	if err != nil {
		release()
		cancelSub()
		return err
	}

	go func() {
		defer cancelSub()
		defer release()
		for msg := range messages {
			stop := handler(msg)
			eventID, _ := EventStamp(msg)
			gate.ReactDone(eventID)
			msg.Ack()
			if stop {
				return
			}
		}
	}()
	return nil
}

// CharacterDBID 返回战斗位索引对应的角色/NPC DB ID。
// self 表示该战斗位是否属于我方；索引越界返回 ok == false。
func (m *Machine) CharacterDBID(index int) (id int, self bool, ok bool) {
	m.Mu.RLock()
	defer m.Mu.RUnlock()
	if index < 0 || index >= len(m.CharacterIDs) {
		return 0, false, false
	}
	return m.CharacterIDs[index], index < m.SelfCharacterNumber, true
}
