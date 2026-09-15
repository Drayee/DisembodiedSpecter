package buff

import (
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/service/fight/structs"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"reflect"
	"regexp"
	"strconv"

	"github.com/ThreeDotsLabs/watermill/message"
)

// 本包负责 buff 的全部运行时行为：
//   - 定义（domain.Buff）按 ID 走 GameContentManager 的内容表缓存取；
//   - 实例挂在 structs.CharacterState.Buffs 上，带 LossWay / Effects 快照；
//   - 属性按"基础值 + 全部 buff 重算"写回 CharacterState 的当前值；
//   - 每个实例按需武装一个反应者，负责它自己的时间损失与自定义逻辑。
//
// 所有函数都以"战斗位索引"（0..N-1，我方在前敌方在后）定位角色，不是角色 DB ID。

// TopicTick 时间推进 / 行动结束的信号 topic。
// 信号事件由发布方释放（machine.PublishSignal），因此不需要 actuator。
const TopicTick = "fight-tick"

// TickKind 信号类型
const (
	TickKindTime   = "time"   // 回合结束的时间推进（全局，Actor 为 -1）
	TickKindAction = "action" // 某个战斗位行动结束
)

// TickPayload 信号事件内容
type TickPayload struct {
	Kind  string `json:"kind"`
	Actor int    `json:"actor"` // 行动者战斗位索引；全局推进为 -1
}

// ==================== 自定义监听器注册表 ====================

// BuffListeners 自定义 buff 监听器的注册宿主。
//
// 与 SkillManager（Skill<ID>Init/Listener/Run）、EnemyManager（Action<ID>Run）、
// ActuatorManager（Character<ID>AttackListener）完全同一套约定：
// 方法名匹配 Buff<ID>Listener 即自动注册，新增监听器只需在这里加一个方法，
// 不需要改任何注册代码。
//
// 方法签名：func (l *BuffListeners) Buff<ID>Listener(machine *structs.Machine, index int, topic string, payload []byte)
//   - index 是**携带该 buff 的战斗位索引**；
//   - topic/payload 是收到的信号（当前只有 TopicTick，未来可扩展其它事件）。
//
// 语义：自定义监听器先于默认时间损失执行，可以做任何事（含调 LossBuff 主动消耗自己）；
// LossWay = listener 的 buff 不做默认扣减，完全由监听器决定何时损失。
type BuffListeners struct{}

var (
	listenerHost     = &BuffListeners{}
	customListeners  map[int]reflect.Method
	buffListenerName = regexp.MustCompile(`^Buff(\d+)Listener$`)
)

func init() {
	customListeners = map[int]reflect.Method{}
	t := reflect.TypeFor[*BuffListeners]()
	for i := 0; i < t.NumMethod(); i++ {
		m := t.Method(i)
		matches := buffListenerName.FindStringSubmatch(m.Name)
		if matches == nil {
			continue
		}
		id, err := strconv.Atoi(matches[1])
		if err != nil {
			continue
		}
		customListeners[id] = m
	}
	if len(customListeners) > 0 {
		ids := make([]int, 0, len(customListeners))
		for id := range customListeners {
			ids = append(ids, id)
		}
		log.Printf("buff 自定义监听器已注册: %v", ids)
	}
}

// HasCustomListener 该 buffID 是否有自定义监听器。
func HasCustomListener(buffID int) bool {
	_, ok := customListeners[buffID]
	return ok
}

// callCustomListener 反射调用自定义监听器；panic 被捕获，不影响其它 buff。
func callCustomListener(buffID int, machine *structs.Machine, index int, topic string, payload []byte) {
	method, ok := customListeners[buffID]
	if !ok {
		return
	}
	defer func() {
		if r := recover(); r != nil {
			log.Printf("buff %d 的监听器执行 panic: %v", buffID, r)
		}
	}()
	method.Func.Call([]reflect.Value{
		reflect.ValueOf(listenerHost),
		reflect.ValueOf(machine),
		reflect.ValueOf(index),
		reflect.ValueOf(topic),
		reflect.ValueOf(payload),
	})
}

// ==================== 读取 ====================

// GetBuff 取 buff 定义（走内容表缓存）。
//
// 注意：它底层是 Redis 往返，**不要在持有 machine.Mu 的区间内调用**，
// 否则一次网络 IO 会把所有战斗状态的读写都堵住。
func GetBuff(machine *structs.Machine, buffID int) (*domain.Buff, error) {
	if machine == nil {
		return nil, errors.New("战斗状态机为空")
	}
	gm := machine.GameContent
	if gm == nil {
		return nil, errors.New("战斗状态机未接入内容表管理器")
	}
	return gm.GetBuff(machine.Ctx, buffID)
}

// HasBuff 判断战斗位 index 身上是否挂着该 buff（剩余时间 > 0 才算有效）。
func HasBuff(machine *structs.Machine, index int, buffID int) bool {
	if machine == nil {
		return false
	}
	machine.Mu.RLock()
	defer machine.Mu.RUnlock()

	instance := findBuff(stateAt(machine, index), buffID)
	return instance != nil && instance.Time > 0
}

// BuffTime 返回战斗位 index 身上该 buff 的剩余时间；没有该 buff 时返回 0。
func BuffTime(machine *structs.Machine, index int, buffID int) int {
	if machine == nil {
		return 0
	}
	machine.Mu.RLock()
	defer machine.Mu.RUnlock()

	instance := findBuff(stateAt(machine, index), buffID)
	if instance == nil {
		return 0
	}
	return instance.Time
}

// FindBuff 返回战斗位 index 身上该 buff 的实例快照（含 LossWay / Effects / Source）。
// 返回的是拷贝：调用方拿到后不会被并发修改影响。
func FindBuff(machine *structs.Machine, index int, buffID int) (structs.Buff, bool) {
	if machine == nil {
		return structs.Buff{}, false
	}
	machine.Mu.RLock()
	defer machine.Mu.RUnlock()

	instance := findBuff(stateAt(machine, index), buffID)
	if instance == nil {
		return structs.Buff{}, false
	}
	snapshot := *instance
	snapshot.Effects = append([]domain.BuffEffect(nil), instance.Effects...)
	return snapshot, true
}

// ==================== 写入 ====================

// AddBuff 给战斗位 index 施加 buff。
//
//   - 目标身上已有该 buff 时**刷新**剩余时间与来源，不新增实例；
//   - buffTime <= 0 时用定义的 DefaultDuration 兜底；
//   - 打入 LossWay 与 Effects 快照，重算属性，并按需武装监听器。
//
// 调用前需要先把定义取出来（GetBuff）——即不要在持有 machine.Mu 时调 GetBuff。
func AddBuff(machine *structs.Machine, index int, def *domain.Buff, buffTime int, source int) error {
	if machine == nil {
		return errors.New("战斗状态机为空")
	}
	if def == nil {
		return errors.New("buff 定义为空")
	}
	if def.ID <= 0 {
		return fmt.Errorf("buff ID 非法: %d", def.ID)
	}
	if buffTime <= 0 {
		buffTime = def.DefaultDuration
	}
	if buffTime <= 0 {
		return fmt.Errorf("buff %d(%s) 未指定时间且无默认时长", def.ID, def.Name)
	}

	machine.Mu.Lock()
	state := stateAt(machine, index)
	if state == nil {
		machine.Mu.Unlock()
		return fmt.Errorf("战斗位 %d 不存在", index)
	}
	instance := findBuff(state, def.ID)
	if instance == nil {
		instance = &structs.Buff{ID: def.ID}
		state.Buffs = append(state.Buffs, instance)
	}
	instance.Time = buffTime
	instance.Source = source
	instance.LossWay = def.LossWay
	instance.Effects = append([]domain.BuffEffect(nil), def.Effects...)
	recalcStats(state)
	machine.Mu.Unlock()

	// 武装在解锁之后：RegisterReactor 会订阅 pubsub
	arm(machine, index, def.ID)
	return nil
}

// LossBuff 扣减战斗位 index 身上该 buff 的剩余时间；剩余时间归零则移除并重算属性。
// loss <= 0 时不做事。
func LossBuff(machine *structs.Machine, index int, buffID int, loss int) {
	if machine == nil || loss <= 0 {
		return
	}
	machine.Mu.Lock()
	state := stateAt(machine, index)
	removed := false
	if state != nil {
		removed = lossLocked(state, buffID, loss)
	}
	machine.Mu.Unlock()

	if removed {
		disarm(machine, index, buffID)
	}
}

// RemoveBuff 直接移除战斗位 index 身上的该 buff（不扣时间），并重算属性、停掉监听器。
func RemoveBuff(machine *structs.Machine, index int, buffID int) {
	if machine == nil {
		return
	}
	machine.Mu.Lock()
	state := stateAt(machine, index)
	removed := false
	if state != nil {
		kept := make([]*structs.Buff, 0, len(state.Buffs))
		for _, b := range state.Buffs {
			if b == nil {
				continue
			}
			if b.ID == buffID {
				removed = true
				continue
			}
			kept = append(kept, b)
		}
		if removed {
			state.Buffs = kept
			recalcStats(state)
		}
	}
	machine.Mu.Unlock()

	if removed {
		disarm(machine, index, buffID)
	}
}

// ArmHeldBuffs 为所有战斗位上已持有的 buff 武装监听器（回合开始时调用，
// 因为它们可能是在上一回合获得的，而回合结束会真退订所有反应者）。
func ArmHeldBuffs(machine *structs.Machine) {
	if machine == nil {
		return
	}
	type target struct{ index, buffID int }

	machine.Mu.RLock()
	targets := make([]target, 0, len(machine.CharacterState))
	for index, state := range machine.CharacterState {
		if state == nil {
			continue
		}
		for _, b := range state.Buffs {
			if b == nil || b.Time <= 0 {
				continue
			}
			targets = append(targets, target{index: index, buffID: b.ID})
		}
	}
	machine.Mu.RUnlock()

	for _, t := range targets {
		arm(machine, t.index, t.buffID)
	}
}

// ==================== 属性重算 ====================

// RecalcStats 按"基础值 + 全部 buff"重算战斗位 index 的当前属性。
func RecalcStats(machine *structs.Machine, index int) {
	if machine == nil {
		return
	}
	machine.Mu.Lock()
	defer machine.Mu.Unlock()
	if state := stateAt(machine, index); state != nil {
		recalcStats(state)
	}
}

// recalcStats 重算属性（调用方必须已持有 machine.Mu）。
//
//	当前值 = 基础值 × (1 + Σ百分比) + Σ固定值
//
// 与 buff 施加顺序无关；移除/到期后按剩余 buff 重算，
// 不会像"改完再改回去"那样把基础值写脏。
func recalcStats(state *structs.CharacterState) {
	var attackPercent, attackFlat float64
	var recoverPercent, recoverFlat float64
	var defensePercent, defenseFlat float64

	for _, b := range state.Buffs {
		if b == nil || b.Time <= 0 {
			continue // 已失效的实例不参与结算
		}
		for _, e := range b.Effects {
			switch e.Stat {
			case domain.BuffStatAttack:
				if e.Percent {
					attackPercent += e.Value
				} else {
					attackFlat += e.Value
				}
			case domain.BuffStatRecover:
				if e.Percent {
					recoverPercent += e.Value
				} else {
					recoverFlat += e.Value
				}
			case domain.BuffStatDefense:
				if e.Percent {
					defensePercent += e.Value
				} else {
					defenseFlat += e.Value
				}
			}
		}
	}

	state.Attack = clampMin(state.BaseAttack*(1+attackPercent)+attackFlat, 0)
	state.Recover = clampMin(state.BaseRecover*(1+recoverPercent)+recoverFlat, 0)
	// 防御力是整数：重算后四舍五入，并保证不为负
	state.Defense = int(math.Round(clampMin(float64(state.BaseDefense)*(1+defensePercent)+defenseFlat, 0)))
}

func clampMin(v, min float64) float64 {
	if v < min {
		return min
	}
	return v
}

// ==================== 内部：实例查找 / 扣减 ====================

func stateAt(machine *structs.Machine, index int) *structs.CharacterState {
	if index < 0 || index >= len(machine.CharacterState) {
		return nil
	}
	return machine.CharacterState[index]
}

func findBuff(state *structs.CharacterState, buffID int) *structs.Buff {
	if state == nil {
		return nil
	}
	for _, b := range state.Buffs {
		if b != nil && b.ID == buffID {
			return b
		}
	}
	return nil
}

// lossLocked 扣减剩余时间；归零则移除并重算属性，返回是否因此移除了该 buff。
// 调用方必须已持有 machine.Mu。
func lossLocked(state *structs.CharacterState, buffID int, loss int) bool {
	removed := false
	kept := make([]*structs.Buff, 0, len(state.Buffs))
	for _, b := range state.Buffs {
		if b == nil {
			continue
		}
		if b.ID == buffID {
			b.Time -= loss
			if b.Time <= 0 {
				removed = true
				continue
			}
		}
		kept = append(kept, b)
	}
	if !removed {
		return false
	}
	state.Buffs = kept
	recalcStats(state)
	return true
}

// ==================== 监听器武装 / 退订 ====================

// reactorKey 每个 (buffID, 携带者) 一个反应者 key。
func reactorKey(buffID int, index int) string {
	return fmt.Sprintf("buff:%d:%d", buffID, index)
}

// arm 按需为某个 buff 实例武装反应者。
//
// 只有"需要被时间推进的事件驱动"的实例才武装：
//   - 有自定义监听器（Buff<ID>Listener）：任何事件都要交给它；
//   - LossWay 为 time/action：需要默认扣减。
//
// LossByNone / LossByListener 且无自定义监听器的 buff 不武装，避免白占订阅。
func arm(machine *structs.Machine, index int, buffID int) {
	if !needsReactor(machine, index, buffID) {
		return
	}
	err := machine.RegisterReactor(reactorKey(buffID, index), TopicTick, func(msg *message.Message) bool {
		handleTick(machine, index, buffID, msg)
		return false
	})
	if err != nil {
		log.Printf("buff %d（战斗位 %d）武装监听器失败: %v", buffID, index, err)
	}
}

// disarm 停掉某个 buff 实例的反应者。
func disarm(machine *structs.Machine, index int, buffID int) {
	machine.UnregisterReactor(reactorKey(buffID, index))
}

func needsReactor(machine *structs.Machine, index int, buffID int) bool {
	if HasCustomListener(buffID) {
		return true
	}
	machine.Mu.RLock()
	defer machine.Mu.RUnlock()

	instance := findBuff(stateAt(machine, index), buffID)
	if instance == nil {
		return false
	}
	return instance.LossWay == domain.LossByTime || instance.LossWay == domain.LossByAction
}

// handleTick 处理一条信号事件：先交给自定义监听器，再执行默认时间损失。
func handleTick(machine *structs.Machine, index int, buffID int, msg *message.Message) {
	var payload TickPayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		log.Printf("buff %d（战斗位 %d）解析信号失败: %v", buffID, index, err)
		return
	}

	// 自定义监听器优先（它可以做任何事，包括主动 LossBuff 或移除自己）
	callCustomListener(buffID, machine, index, TopicTick, msg.Payload)

	// 默认时间损失：按实例上的 LossWay 快照判定，
	// LossByNone / LossByListener 不自动扣减。
	machine.Mu.Lock()
	instance := findBuff(stateAt(machine, index), buffID)
	loss := 0
	if instance != nil {
		switch {
		case payload.Kind == TickKindTime && instance.LossWay == domain.LossByTime:
			loss = 1
		case payload.Kind == TickKindAction && instance.LossWay == domain.LossByAction && payload.Actor == index:
			loss = 1
		}
	}
	removed := false
	if loss > 0 {
		removed = lossLocked(stateAt(machine, index), buffID, loss)
	}
	machine.Mu.Unlock()

	if removed {
		disarm(machine, index, buffID)
	}
}

// ==================== 时间推进 ====================

// PublishTimeTick 发布"回合结束时间推进"信号：所有 LossByTime 的 buff 各扣 1 格。
// 同步等待处理完成，因此必须在 StopReactors 之前调用。
func PublishTimeTick(machine *structs.Machine) error {
	payload, err := json.Marshal(TickPayload{Kind: TickKindTime, Actor: -1})
	if err != nil {
		return err
	}
	return machine.PublishSignal(TopicTick, payload)
}

// PublishActionTick 发布"某战斗位行动结束"信号：该战斗位身上 LossByAction 的 buff 各扣 1 格。
func PublishActionTick(machine *structs.Machine, index int) error {
	payload, err := json.Marshal(TickPayload{Kind: TickKindAction, Actor: index})
	if err != nil {
		return err
	}
	return machine.PublishSignal(TopicTick, payload)
}
