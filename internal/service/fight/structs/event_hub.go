package structs

import (
	"context"
	"errors"
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
//
// 用指针传递（*Effect）的原因：记账收口在 actuator.Apply，定制行为在结算过程中
// 需要能"声明自己做了什么"（例如"我用龙力 buff 抵消了这一击"），
// 通过写 Effect.Special / Effect.Ref 就能让日志带上这些信息，不必额外开返回值或旁路通道。
type Effect struct {
	Kind     EffectKind
	TargetID int // 目标战斗位索引
	SourceID int // 来源战斗位索引
	Damage   int // Kind == EffectAttack 时的伤害值
	Recover  int // Kind == EffectRecover 时的恢复值
	BuffID   int // Kind == EffectBuff 时的 buff ID
	BuffTime int // Kind == EffectBuff 时的持续回合
	Other    string

	// Ref 本次效果的来源，由发布方（技能/buff/敌方行动）在事件载荷里填写：
	// > 0 技能 ID ；< 0 −buffID ；= 0 被动。
	Ref int
	// Special 结算过程中被声明"本次触发的被动/特殊受击效果"：
	// > 0 角色 DB ID ；< 0 −buffID ；= 0 无。
	// 定制行为（如 Character2AttackListener 用龙力抵消伤害）在这里登记自己消耗/生效的 buff，
	// Apply 记账时透传给客户端。
	Special int
}

// PubSub 发布/订阅端抽象，*gochannel.GoChannel 满足该接口。
// 抽成接口是为了让 structs 包不必依赖具体 pubsub 实现。
type PubSub interface {
	Publish(topic string, messages ...*message.Message) error
	Subscribe(ctx context.Context, topic string) (<-chan *message.Message, error)
	Close() error
}

// ReactorHandler 反应者（技能监听器）的处理函数。
// 返回 true 表示该反应者按业务逻辑要求结束监听（退订并释放反应版本）。
type ReactorHandler func(*message.Message) bool

// 事件元数据键。
const (
	metaEventID   = "fight_event_id"   // 事件唯一 ID（每次发布独立，不复用 machine.UUID）
	metaReactNeed = "fight_react_need" // 本次事件要求几个反应者打点（即发布时的"反应版本"）
)

// errNoPubSub 未注入 pubsub 就尝试发布/订阅。
var errNoPubSub = errors.New("战斗事件中枢尚未注入 pubsub")

const (
	// ReactionWaitTimeout 结算前等待反应者打点的硬上限。
	// 只是兜底：正常情况下反应者在亚毫秒级就会打点，超时说明有反应者漏打点，
	// 此时按超时照常结算，避免卡住该战斗位的监听 goroutine。
	ReactionWaitTimeout = 100 * time.Millisecond
	// MaxPendingEvents 未结算事件的追踪上限，超出后不再追踪（事件照常结算，
	// 只是不参与"本回合是否全部结算完"的判断），保证失控情况下内存有界。
	MaxPendingEvents = 4096
	// pendingEventTTL 未结算事件的追踪存活上限，超时即被清扫。
	// 事件正常由"负责它的 actuator"在结算后释放；目标战斗位不存在 actuator 的事件
	// 会落到这里回收，因此追踪表不会无界增长。
	pendingEventTTL = 30 * time.Second
	// sweepThreshold 追踪表达到该规模时触发一次过期清扫。
	sweepThreshold = 256
)

// EventHub 本场战斗的事件中枢，整场战斗唯一：**独占** pubsub，并持有反应者注册表
// 与"每事件一份"的反应版本闸门。
//
// pubsub 刻意不对外暴露（只有 Subscribe / PublishPayload 两个出口），因为"打版本戳"
// 是正确性的前提：任何绕过 Machine 的裸 Publish 都会发出 required == 0 的事件，
// 使 actuator 不等反应者就结算、"最后执行"当场失效。把 pubsub 关在这里，
// 这类错误在类型层面就写不出来。
//
// 解决两个问题：
//
//  1. **actuator 必须是最后一个执行者**。watermill gochannel 的 Publish 会为每个订阅者
//     各起一个 goroutine 并发投递（pubsub.go sendMessage），订阅者之间没有任何顺序保证。
//     做法：每个 topic 有一个"反应版本"（= 已注册反应者数量），发布事件时把当时版本写进
//     消息元数据并登记为待结算事件；反应者处理完打点；负责该战斗位的 actuator 等
//     "打点数 == 版本"后再立即结算。于是"结算"既发生在收到事件时，
//     又必然晚于所有其它监听器对该事件的处理。
//
//  2. **反应者不能无限累积**。反应者按 key 幂等注册：整场战斗只订阅一次，
//     再次注册只替换处理器（更新本回合的目标上下文），不会新增订阅、也不会让版本增长。
//     WS 连接保持期间反应者一直启用（技能是被动行动，本就该常驻），
//     因此不需要"每回合重复注册"或"暂停/恢复"那套生命周期。
type EventHub struct {
	mu       sync.Mutex
	pubSub   PubSub
	reactors map[string]*reactor // key → 反应者（整场战斗只订阅一次）
	perTopic map[string]int      // topic → 已注册反应者数量（即反应版本）
	events   map[string]*pendingEvent
	pending  int       // 已登记未结算的事件数（用于"本回合是否结算完"）
	lastAct  time.Time // 最近一次活动时间（打点/登记/结算），用于空闲判定
	signal   chan struct{}
}

type reactor struct {
	key     string
	topic   string
	handler ReactorHandler
	cancel  context.CancelFunc
}

type pendingEvent struct {
	required int
	done     int
	created  time.Time
}

func NewEventHub() *EventHub {
	return &EventHub{
		reactors: map[string]*reactor{},
		perTopic: map[string]int{},
		events:   map[string]*pendingEvent{},
		lastAct:  time.Now(),
		signal:   make(chan struct{}, 1),
	}
}

// AttachPubSub 注入本场战斗唯一的 pubsub。整场战斗只调用一次。
func (g *EventHub) AttachPubSub(pubSub PubSub) {
	g.mu.Lock()
	g.pubSub = pubSub
	g.touch()
	g.mu.Unlock()
}

// Close 关闭 pubsub（整场战斗结束时调用一次），并释放所有反应者。
func (g *EventHub) Close() error {
	g.mu.Lock()
	reactors := make([]*reactor, 0, len(g.reactors))
	for _, r := range g.reactors {
		reactors = append(reactors, r)
	}
	g.reactors = map[string]*reactor{}
	g.perTopic = map[string]int{}
	pubSub := g.pubSub
	g.mu.Unlock()

	// 先取消各反应者订阅（让消费 goroutine 退出），再关闭 pubsub
	for _, r := range reactors {
		r.cancel()
	}
	if pubSub == nil {
		return nil
	}
	return pubSub.Close()
}

// touch 记录一次活动并非阻塞唤醒等待者（调用方必须已持有 g.mu）。
func (g *EventHub) touch() {
	g.lastAct = time.Now()
	select {
	case g.signal <- struct{}{}:
	default:
	}
}

// wait 等待被唤醒或超时，两者皆可返回。
func (g *EventHub) wait(d time.Duration) {
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

// subscribe 让战斗位的监听器拿到消息通道（订阅侧唯一出口，pubsub 不出本结构）。
func (g *EventHub) subscribe(ctx context.Context, topic string) (<-chan *message.Message, error) {
	g.mu.Lock()
	pubSub := g.pubSub
	g.mu.Unlock()
	if pubSub == nil {
		return nil, errNoPubSub
	}
	return pubSub.Subscribe(ctx, topic)
}

// publish 发布一条战斗事件，并给它打上"反应版本"戳：
//
//	事件 ID（每次发布独立生成，不复用 machine.UUID）
//	本次要求几个反应者打点（= 发布时刻本 topic 的反应版本）
func (g *EventHub) publish(topic string, msg *message.Message) error {
	g.mu.Lock()
	pubSub := g.pubSub
	required := g.perTopic[topic]
	g.mu.Unlock()

	if pubSub == nil {
		return errNoPubSub
	}

	eventID := watermill.NewUUID()
	g.BeginEvent(eventID, required)

	msg.Metadata.Set(metaEventID, eventID)
	msg.Metadata.Set(metaReactNeed, strconv.Itoa(required))

	if err := pubSub.Publish(topic, msg); err != nil {
		// 发布失败：没有任何监听器会收到它，必须立即释放追踪，否则会拖住本回合的等待
		g.FinishEvent(eventID)
		return err
	}
	return nil
}

// publishSignal 发布一个"信号事件"并等待它被处理完。
//
// 与普通战斗事件的区别：信号事件（例如回合结束的时间推进、某个战斗位行动结束）
// **没有"负责它的 actuator"**，所以不能指望别人调 FinishEvent，
// 否则它会一直挂在待结算表里让 WaitAllSettled 每回合都退化到 stall 兜底。
// 这里由发布方自己收尾：发布 → 等所有已注册反应者打完点 → 释放事件。
//
// 因此本方法是**同步**的：返回时该信号已被全部反应者处理完（或超时兜底）。
func (g *EventHub) publishSignal(topic string, payload []byte) error {
	g.mu.Lock()
	pubSub := g.pubSub
	required := g.perTopic[topic]
	g.mu.Unlock()

	if pubSub == nil {
		return errNoPubSub
	}

	eventID := watermill.NewUUID()
	g.BeginEvent(eventID, required)
	defer g.FinishEvent(eventID)

	msg := message.NewMessage(watermill.NewUUID(), payload)
	msg.Metadata.Set(metaEventID, eventID)
	msg.Metadata.Set(metaReactNeed, strconv.Itoa(required))

	if err := pubSub.Publish(topic, msg); err != nil {
		return err
	}
	// required == 0 时（没有反应者）立即返回；否则等反应者打完点
	g.WaitReacted(eventID, ReactionWaitTimeout)
	return nil
}

// registerReactor 幂等注册一个反应者：同一 key 重复注册只替换处理器
// （用于更新本回合的目标上下文），不会新建订阅、也不会让反应版本增长。
//
// 由本方法统一保证三件容易漏掉的事：
//   - 反应版本 +1（仅首次注册时），反应者结束时 -1；
//   - 每条消息处理完都打点（ReactDone），否则 actuator 会一直等一个不会交差的反应者；
//   - 每条消息都 Ack（gochannel 的投递 goroutine 会一直等 Ack 且没有超时，
//     不等就是每条消息每个订阅者泄漏一个 goroutine 和一份消息副本）。
//
// 版本 +1 刻意发生在 Subscribe 之前：若期间恰好有事件发布，该事件的要求数会包含这个
// 还没建立订阅的反应者，于是它不会收到、也就不会打点，actuator 只能等
// ReactionWaitTimeout 兜底后结算 —— 代价是一次有界等待加一条告警日志。
// 反过来（先订阅再 +1）会让该事件的要求数为 0，导致 actuator 抢在反应者之前结算，
// 直接破坏"最后执行"的语义，因此这里选择前者。
func (g *EventHub) registerReactor(ctx context.Context, key string, topic string, handler ReactorHandler) error {
	if key == "" {
		return nil
	}

	g.mu.Lock()
	if r, ok := g.reactors[key]; ok {
		r.handler = handler
		g.touch()
		g.mu.Unlock()
		return nil
	}
	g.perTopic[topic]++
	g.touch()
	g.mu.Unlock()

	subCtx, cancelSub := context.WithCancel(ctx)
	messages, err := g.subscribe(subCtx, topic)
	if err != nil {
		cancelSub()
		g.mu.Lock()
		g.decTopicLocked(topic)
		g.mu.Unlock()
		return err
	}

	g.mu.Lock()
	g.reactors[key] = &reactor{key: key, topic: topic, handler: handler, cancel: cancelSub}
	g.touch()
	g.mu.Unlock()

	go func() {
		defer cancelSub()
		for msg := range messages {
			if g.dispatch(key, msg) {
				g.removeReactor(key)
				return
			}
		}
	}()
	return nil
}

// dispatch 处理一条消息：调用处理器，并在任何情况下打点 + Ack（必须配平）。
func (g *EventHub) dispatch(key string, msg *message.Message) (stop bool) {
	g.mu.Lock()
	var handler ReactorHandler
	if r, ok := g.reactors[key]; ok {
		handler = r.handler
	}
	g.mu.Unlock()

	// 处理器在锁外调用：处理器内部可能读写状态、甚至发布事件
	if handler != nil {
		stop = handler(msg)
	}

	eventID, _ := EventStamp(msg)
	g.ReactDone(eventID)
	msg.Ack()
	return stop
}

// removeReactor 反应者结束监听：退订、释放反应版本。
func (g *EventHub) removeReactor(key string) {
	g.mu.Lock()
	r, ok := g.reactors[key]
	if ok {
		delete(g.reactors, key)
		g.decTopicLocked(r.topic)
		g.touch()
	}
	g.mu.Unlock()

	if ok {
		r.cancel()
	}
}

// StopReactors 停止全部反应者监听（每回合结束时由主循环调用）。
//
// 真退订：取消订阅并释放反应版本，因此下一回合的反应版本从 0 重新开始，
// 回合之间完全独立（上一回合用过的技能不会残留到下一回合）。
// 必须在事件全部结算完之后调用（先 WaitAllSettled 再 StopReactors），
// 否则"还没打点就被拆掉"会让负责该事件的 actuator 白等 ReactionWaitTimeout 兜底。
func (g *EventHub) StopReactors() {
	g.mu.Lock()
	keys := make([]string, 0, len(g.reactors))
	for k := range g.reactors {
		keys = append(keys, k)
	}
	g.mu.Unlock()

	for _, k := range keys {
		g.removeReactor(k)
	}
}

func (g *EventHub) decTopicLocked(topic string) {
	if g.perTopic[topic] > 0 {
		g.perTopic[topic]--
		if g.perTopic[topic] == 0 {
			delete(g.perTopic, topic)
		}
	}
}

// Version 返回该 topic 当前的反应版本（已注册反应者数量）。
func (g *EventHub) Version(topic string) int {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.perTopic[topic]
}

// BeginEvent 登记一个待结算事件（由发布方调用），返回登记是否成功。
// 返回 false 表示追踪表已达上限，事件仍会正常投递与结算，只是不计入待结算计数。
func (g *EventHub) BeginEvent(id string, required int) bool {
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
func (g *EventHub) ReactDone(id string) {
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
func (g *EventHub) WaitReacted(id string, timeout time.Duration) bool {
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
func (g *EventHub) FinishEvent(id string) {
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
//   - 仍有事件但连续 stall 时长没有任何进展，判定为"无人能结算的事件"
//     （例如目标战斗位不存在对应的 actuator），返回 false 并告警 ——
//     不能为了这种事件把主循环卡到 timeout；
//   - timeout 是硬上限。
func (g *EventHub) WaitAllSettled(quiet, stall, timeout time.Duration) bool {
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
		wait := quiet - silentFor
		if pending > 0 {
			wait = stall - silentFor
		}
		g.wait(min(wait, remain))
	}
}

// Stats 返回待结算事件数、追踪的事件数与已注册反应者总数。
func (g *EventHub) Stats() (pending int, tracked int, reactors int) {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.pending, len(g.events), len(g.reactors)
}

// sweepLocked 清扫追踪超时的未结算事件（调用方必须已持有 g.mu）。
func (g *EventHub) sweepLocked() {
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

// —— Machine 上的入口：pubsub 只在这里进出，其它位置拿不到它 ——

// Events 返回本机的事件中枢（惰性创建，保证发布方/反应者/actuator 拿到同一个实例）。
func (m *Machine) Events() *EventHub {
	m.Mu.RLock()
	h := m.EventHub
	m.Mu.RUnlock()
	if h != nil {
		return h
	}
	m.Mu.Lock()
	defer m.Mu.Unlock()
	if m.EventHub == nil {
		m.EventHub = NewEventHub()
	}
	return m.EventHub
}

// AttachPubSub 注入本场战斗唯一的 pubsub（战斗会话在开局时调用一次）。
func (m *Machine) AttachPubSub(pubSub PubSub) {
	m.Events().AttachPubSub(pubSub)
}

// Subscribe 为本机的监听器（各战斗位的 actuator）取一条消息通道。
// 这是订阅侧唯一出口，pubsub 本身不出事件中枢。
func (m *Machine) Subscribe(topic string) (<-chan *message.Message, error) {
	return m.Events().subscribe(m.Ctx, topic)
}

// PublishPayload 发布一条战斗事件：uuid 与"反应版本戳"都在内部生成，
// 调用方只需给 topic 和 payload。
//
// 这是发布侧唯一出口：绕过它直接 Publish 会发出没有版本戳的事件，
// 使 actuator 不等反应者就结算（"最后执行"失效），因此不要把 pubsub 暴露出去。
func (m *Machine) PublishPayload(topic string, payload []byte) error {
	return m.Events().publish(topic, message.NewMessage(watermill.NewUUID(), payload))
}

// RegisterReactor 幂等注册反应者（同一 key 重复注册只替换处理器，不新增订阅）。
// key 用稳定的业务标识，例如 "skill2"。
func (m *Machine) RegisterReactor(key string, topic string, handler ReactorHandler) error {
	return m.Events().registerReactor(m.Ctx, key, topic, handler)
}

// UnregisterReactor 退订指定 key 的反应者（例如 buff 到期时需要停掉它的监听器）。
// 不存在的 key 是空操作。
func (m *Machine) UnregisterReactor(key string) {
	m.Events().removeReactor(key)
}

// PublishSignal 发布一个信号事件并同步等待其被处理完（见 EventHub.publishSignal）。
func (m *Machine) PublishSignal(topic string, payload []byte) error {
	return m.Events().publishSignal(topic, payload)
}

// StopReactors 停止本机全部反应者监听（回合结束、真退订，见 EventHub.StopReactors）。
func (m *Machine) StopReactors() {
	m.Events().StopReactors()
}

// CloseEvents 关闭本机的事件中枢与 pubsub（整场战斗结束时调用一次）。
func (m *Machine) CloseEvents() error {
	return m.Events().Close()
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
