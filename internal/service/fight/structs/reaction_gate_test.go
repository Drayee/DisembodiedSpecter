package structs

import (
	"context"
	"errors"
	"strconv"
	"testing"
	"time"

	"github.com/ThreeDotsLabs/watermill/message"
)

var errPublish = errors.New("publish failed")

// fakePubSub 只记录发布行为的 PubSub 桩。
type fakePubSub struct {
	topic     string
	published int
	err       error
}

func (f *fakePubSub) Publish(topic string, messages ...*message.Message) error {
	if f.err != nil {
		return f.err
	}
	f.topic = topic
	f.published += len(messages)
	return nil
}

func (f *fakePubSub) Subscribe(ctx context.Context, topic string) (<-chan *message.Message, error) {
	ch := make(chan *message.Message)
	close(ch)
	return ch, nil
}

// TestAddReactorVersionCounting 反应版本 = 活跃反应者数量，注册 +1、释放 -1，且重复释放只生效一次。
func TestAddReactorVersionCounting(t *testing.T) {
	g := NewReactionGate()
	if v := g.Version("fight-attack"); v != 0 {
		t.Fatalf("初始反应版本 = %d, want 0", v)
	}

	r1 := g.AddReactor("fight-attack")
	r2 := g.AddReactor("fight-attack")
	if v := g.Version("fight-attack"); v != 2 {
		t.Fatalf("注册两个反应者后版本 = %d, want 2", v)
	}
	if v := g.Version("fight-buff"); v != 0 {
		t.Fatalf("不同 topic 的版本必须隔离：%d", v)
	}

	r1()
	if v := g.Version("fight-attack"); v != 1 {
		t.Fatalf("释放一个后版本 = %d, want 1", v)
	}
	r1() // 幂等
	if v := g.Version("fight-attack"); v != 1 {
		t.Fatalf("重复释放不应改变版本：%d", v)
	}
	r2()
	if v := g.Version("fight-attack"); v != 0 {
		t.Fatalf("全部释放后版本 = %d, want 0", v)
	}
}

// TestWaitReactedBarrier actuator 必须等到"打点数 == 事件版本"才放行。
func TestWaitReactedBarrier(t *testing.T) {
	g := NewReactionGate()
	g.BeginEvent("e1", 2)

	released := make(chan bool, 1)
	go func() { released <- g.WaitReacted("e1", time.Second) }()

	// 只打了一个点：不应放行
	g.ReactDone("e1")
	select {
	case <-released:
		t.Fatal("打点未满时不应放行")
	case <-time.After(30 * time.Millisecond):
	}

	// 打满第二个点：应立即放行
	g.ReactDone("e1")
	select {
	case ok := <-released:
		if !ok {
			t.Fatal("打满后应放行")
		}
	case <-time.After(time.Second):
		t.Fatal("打满后未放行")
	}
}

// TestWaitReactedTimeoutAndUntracked 超时要兜底放行；未追踪的事件不应阻塞结算。
func TestWaitReactedTimeoutAndUntracked(t *testing.T) {
	g := NewReactionGate()

	g.BeginEvent("e1", 3)
	g.ReactDone("e1")
	start := time.Now()
	if g.WaitReacted("e1", 20*time.Millisecond) {
		t.Fatal("打点未满时应返回 false（超时兜底）")
	}
	if elapsed := time.Since(start); elapsed < 20*time.Millisecond {
		t.Fatalf("不应在超时前返回，实际 %s", elapsed)
	}

	// 未登记的事件：直接放行，避免卡住结算
	if !g.WaitReacted("never-begun", time.Second) {
		t.Fatal("未追踪的事件应直接放行")
	}
	// 空 ID（未打戳的旧格式事件）同样直接放行
	if !g.WaitReacted("", time.Second) {
		t.Fatal("空事件 ID 应直接放行")
	}
	g.ReactDone("") // 不应 panic
}

// TestFinishEventReleasesAndIsIdempotent 释放事件必须递减待结算计数，且重复释放只生效一次。
func TestFinishEventReleasesAndIsIdempotent(t *testing.T) {
	g := NewReactionGate()
	g.BeginEvent("e1", 0)
	g.BeginEvent("e2", 0)
	if pending, tracked, _ := g.Stats(); pending != 2 || tracked != 2 {
		t.Fatalf("Stats = (%d, %d), want (2, 2)", pending, tracked)
	}

	g.FinishEvent("e1")
	g.FinishEvent("e1") // 幂等
	pending, tracked, _ := g.Stats()
	if pending != 1 || tracked != 1 {
		t.Fatalf("释放 e1 后 Stats = (%d, %d), want (1, 1)", pending, tracked)
	}

	g.FinishEvent("unknown") // 未知事件不应把计数减成负数
	if pending, _, _ := g.Stats(); pending != 1 {
		t.Fatalf("未知事件不应影响计数：pending = %d", pending)
	}
}

// TestWaitAllSettled 主循环读值前的同步：全部结算完立即返回；
// 有事件长期无进展时按 stall 窗口放行，而不是死等 timeout。
func TestWaitAllSettled(t *testing.T) {
	g := NewReactionGate()
	g.BeginEvent("e1", 0)

	done := make(chan bool, 1)
	go func() { done <- g.WaitAllSettled(5*time.Millisecond, time.Second, 5*time.Second) }()

	// 还有未结算事件：不应立刻返回 true
	select {
	case ok := <-done:
		if ok {
			t.Fatal("仍有未结算事件时不应返回 true")
		}
	case <-time.After(2 * time.Millisecond):
	}

	g.FinishEvent("e1")
	select {
	case ok := <-done:
		if !ok {
			t.Fatal("事件全部结算后应返回 true")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("等待全部结算超时")
	}
}

// TestWaitAllSettledPutsUpWithStuckEvent 无人能结算的事件不能把主循环卡住：
// 连续 stall 无进展后放行，且不消耗完整 timeout。
func TestWaitAllSettledPutsUpWithStuckEvent(t *testing.T) {
	g := NewReactionGate()
	g.BeginEvent("stuck", 5)

	start := time.Now()
	if g.WaitAllSettled(5*time.Millisecond, 30*time.Millisecond, 5*time.Second) {
		t.Fatal("仍有未结算事件时应返回 false")
	}
	elapsed := time.Since(start)
	if elapsed < 30*time.Millisecond {
		t.Fatalf("应至少等待 stall 窗口，实际 %s", elapsed)
	}
	if elapsed > time.Second {
		t.Fatalf("应在 stall 窗口后立即返回，实际等待 %s", elapsed)
	}
}

// TestWaitAllSettledToleratesSlowReaction 慢反应（持续有进展）不应被误判为无法结算。
func TestWaitAllSettledToleratesSlowReaction(t *testing.T) {
	g := NewReactionGate()
	g.BeginEvent("slow", 2)

	stop := make(chan struct{})
	defer close(stop)
	// 反应者分多次打点，间隔小于 stall 窗口：期间不断"有进展"
	go func() {
		for i := 0; i < 2; i++ {
			select {
			case <-stop:
				return
			case <-time.After(20 * time.Millisecond):
			}
			g.ReactDone("slow")
		}
		g.FinishEvent("slow")
	}()

	// stall 窗口 30ms，而每次打点间隔 20ms < 30ms，因此不应提前放弃
	if !g.WaitAllSettled(5*time.Millisecond, 30*time.Millisecond, 3*time.Second) {
		t.Fatal("持续有进展的慢反应不应被判定为无法结算")
	}
}

// TestBeginEventCapAndSweep 事件追踪表必须有界：达到规模触发过期清扫，达到上限后不再追踪，
// 但事件本身仍可正常结算（不阻塞）。
func TestBeginEventCapAndSweep(t *testing.T) {
	g := NewReactionGate()

	for i := 0; i < sweepThreshold; i++ {
		if !g.BeginEvent("e"+strconv.Itoa(i), 0) {
			t.Fatalf("第 %d 个事件不应被拒绝", i)
		}
	}
	// 此时追踪表已达清扫阈值：过期条目会被清理，新增仍然成功
	if !g.BeginEvent("after-sweep", 0) {
		t.Fatal("清扫后应能继续登记事件")
	}

	// 填到上限
	for i := 0; len(g.events) < MaxPendingEvents; i++ {
		if !g.BeginEvent("f"+strconv.Itoa(i), 0) {
			break
		}
	}
	if len(g.events) > MaxPendingEvents {
		t.Fatalf("追踪表超过上限：%d", len(g.events))
	}
	// 超限后拒绝追踪，但不报错、也不影响后续结算
	if g.BeginEvent("overflow", 0) {
		t.Fatal("达到上限后不应继续追踪")
	}
	if !g.WaitReacted("overflow", 10*time.Millisecond) {
		t.Fatal("未被追踪的事件应直接放行")
	}
}

// TestMachineCharacterDBIDAlignment CharacterIDs 必须与 CharacterState 同长同序，
// 且能区分我方/敌方（actuator 的角色行为分派依赖它）。
func TestMachineCharacterDBIDAlignment(t *testing.T) {
	m := &Machine{
		Ctx:                 context.Background(),
		CharacterState:      []*CharacterState{{Health: 1}, {Health: 1}, {Health: 1}},
		CharacterIDs:        []int{3, 5, 2}, // 索引 0/1 我方，索引 2 敌方
		SelfCharacterNumber: 2,
	}

	cases := []struct {
		index  int
		wantID int
		wantIs bool
	}{
		{0, 3, true},
		{1, 5, true},
		{2, 2, false},
	}
	for _, c := range cases {
		id, self, ok := m.CharacterDBID(c.index)
		if !ok {
			t.Fatalf("索引 %d 应有效", c.index)
		}
		if id != c.wantID || self != c.wantIs {
			t.Fatalf("索引 %d → (id %d, self %v), want (%d, %v)", c.index, id, self, c.wantID, c.wantIs)
		}
	}
	if _, _, ok := m.CharacterDBID(3); ok {
		t.Fatal("越界索引应返回 ok == false")
	}
}

// TestMachineGateLazyInit Gate() 必须惰性返回同一个实例，
// 否则发布方、反应者与 actuator 会各自持有不同的闸门，反应版本对不上。
func TestMachineGateLazyInit(t *testing.T) {
	m := &Machine{Ctx: context.Background()}
	first := m.Gate()
	if first == nil {
		t.Fatal("Gate() 不应返回 nil")
	}
	if second := m.Gate(); second != first {
		t.Fatal("Gate() 每次应返回同一个闸门实例")
	}
}

// TestRegisterReactorInvariants RegisterReactor 必须统一保证三件事：
// 反应版本 +1、每条消息打点 + Ack、退出时版本 -1。
func TestRegisterReactorInvariants(t *testing.T) {
	m := &Machine{Ctx: context.Background()}
	pub := &recordingPubSub{messages: make(chan *message.Message, 4)}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	handled := make(chan string, 4)
	err := m.RegisterReactor(pub, ctx, "fight-attack", func(msg *message.Message) bool {
		payload := string(msg.Payload)
		handled <- payload
		return payload == "stop" // 模拟业务上要求结束监听的场景
	})
	if err != nil {
		t.Fatalf("RegisterReactor 失败: %v", err)
	}
	if v := m.Gate().Version("fight-attack"); v != 1 {
		t.Fatalf("注册后反应版本 = %d, want 1", v)
	}

	// 已登记的事件：处理完必须打点，使版本要求被满足
	m.Gate().BeginEvent("evt-1", 1)
	msg := message.NewMessage("u1", []byte("payload"))
	msg.Metadata.Set(metaEventID, "evt-1")
	pub.messages <- msg
	select {
	case <-handled:
	case <-time.After(time.Second):
		t.Fatal("反应者未收到消息")
	}
	if !m.Gate().WaitReacted("evt-1", time.Second) {
		t.Fatal("反应者处理完必须打点")
	}
	// 消息必须被 Ack：Acked() 通道关闭即表示已确认
	select {
	case <-msg.Acked():
	case <-time.After(time.Second):
		t.Fatal("消息必须被 Ack，否则 gochannel 投递 goroutine 会永久阻塞")
	}

	// 退订（模拟反应者返回 stop）：反应版本必须归零
	stopMsg := message.NewMessage("u2", []byte("stop"))
	pub.messages <- stopMsg
	waitUntil(t, time.Second, func() bool { return m.Gate().Version("fight-attack") == 0 })
}

// recordingPubSub 可手动投喂消息的 PubSub 桩。
type recordingPubSub struct {
	messages chan *message.Message
}

func (r *recordingPubSub) Publish(topic string, messages ...*message.Message) error { return nil }

func (r *recordingPubSub) Subscribe(ctx context.Context, topic string) (<-chan *message.Message, error) {
	return r.messages, nil
}

func waitUntil(t *testing.T, timeout time.Duration, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatal("等待条件超时")
}

// TestEventStamp 版本戳解析：无戳/脏戳按"无需等待反应者"处理。
func TestEventStamp(t *testing.T) {
	msg := message.NewMessage("u1", nil)
	if id, need := EventStamp(msg); id != "" || need != 0 {
		t.Fatalf("无戳事件应为 ('', 0)，实际 (%q, %d)", id, need)
	}

	msg.Metadata.Set(metaEventID, "evt-1")
	msg.Metadata.Set(metaReactNeed, "3")
	if id, need := EventStamp(msg); id != "evt-1" || need != 3 {
		t.Fatalf("解析结果 = (%q, %d), want (evt-1, 3)", id, need)
	}

	msg.Metadata.Set(metaReactNeed, "not-a-number")
	if id, need := EventStamp(msg); id != "evt-1" || need != 0 {
		t.Fatalf("脏版本号应按 0 处理，实际 (%q, %d)", id, need)
	}

	msg.Metadata.Set(metaReactNeed, "-1")
	if _, need := EventStamp(msg); need != 0 {
		t.Fatalf("负版本号应按 0 处理，实际 %d", need)
	}

	if id, need := EventStamp(nil); id != "" || need != 0 {
		t.Fatalf("nil 消息应为 ('', 0)，实际 (%q, %d)", id, need)
	}
}

// TestPublishEventStampsAndTracks 发布事件必须打上"事件 ID + 反应版本"戳并登记为待结算。
func TestPublishEventStampsAndTracks(t *testing.T) {
	m := &Machine{Ctx: context.Background(), Reaction: NewReactionGate()}
	release := m.Gate().AddReactor("fight-attack")
	defer release()

	pub := &fakePubSub{}
	msg := message.NewMessage("u1", nil)
	if err := m.PublishEvent(pub, "fight-attack", msg); err != nil {
		t.Fatalf("PublishEvent 失败: %v", err)
	}
	if pub.topic != "fight-attack" || pub.published != 1 {
		t.Fatalf("发布结果 = (%q, %d)", pub.topic, pub.published)
	}

	id, need := EventStamp(msg)
	if id == "" {
		t.Fatal("事件应带上唯一 ID")
	}
	if need != 1 {
		t.Fatalf("反应版本 = %d, want 1（一个反应者）", need)
	}
	if id == m.UUID {
		t.Fatal("事件 ID 不应复用 machine.UUID（同一场战斗的所有消息会撞 ID）")
	}
	if pending, tracked, _ := m.Gate().Stats(); pending != 1 || tracked != 1 {
		t.Fatalf("发布后应登记为待结算：Stats = (%d, %d)", pending, tracked)
	}

	// 另一条事件必须拿到不同的 ID
	msg2 := message.NewMessage("u1", nil)
	if err := m.PublishEvent(pub, "fight-attack", msg2); err != nil {
		t.Fatalf("PublishEvent 失败: %v", err)
	}
	if id2, _ := EventStamp(msg2); id2 == id {
		t.Fatal("每个事件必须独立分配 ID")
	}
}

// TestPublishEventReleasesOnPublishError 发布失败必须立即释放追踪，
// 否则本回合的等待会被一个永远不会有监听器处理的事件拖住。
func TestPublishEventReleasesOnPublishError(t *testing.T) {
	m := &Machine{Ctx: context.Background(), Reaction: NewReactionGate()}
	pub := &fakePubSub{err: errPublish}
	if err := m.PublishEvent(pub, "fight-attack", message.NewMessage("u1", nil)); err == nil {
		t.Fatal("发布失败应返回错误")
	}
	if pending, tracked, _ := m.Gate().Stats(); pending != 0 || tracked != 0 {
		t.Fatalf("发布失败后不应留下追踪：Stats = (%d, %d)", pending, tracked)
	}
}
