package structs

import (
	"encoding/json"
	"fmt"
)

// 本文件是**战斗日志的唯一属主**：事件类型、事件详情、缓冲区、全部构造函数、
// 计数器写入口，都在这里。其它包只调用这里的构造函数，不自己拼装 FightLog。
//
// 为什么日志要单独成一个"属主"：
//   - 日志是"前端演出"的唯一数据源，拼装点集中才能保证字段语义一致（尤其是 ref/special 的正负约定）；
//   - 缓冲区带锁（LogMu），散布出去容易被绕过；
//   - 计数器有两个写入口（技能逻辑、buff 层数）时，只有收口才能保证"不遗漏地记日志"。
//
// 分层约定：日志类型用本地常量，**不引用 proto/pd**（保持 structs 不依赖 proto，
// 与 ArmedSkill 存三个 int 是同一个理由）；proto 转换在 fight/log.go 里做。

// ==================== 事件类型 ====================

// FightLogType 战斗日志类型。与 proto 的 FightLogType 一一对应（值必须一致）。
//
// 注意：**没有"出手/CAST"类型** —— 出手动作由攻击事件自身承载（AttackLog.Source 就是出手方），
// 因此被动追加攻击天然也会播出手动画。回合推进、阶段切换不下发日志。
type FightLogType int32

const (
	FightLogUnknown FightLogType = 0
	FightLogAttack  FightLogType = 1 // 攻击（含被被动/特殊受击接管的情况）
	FightLogRecover FightLogType = 2 // 恢复
	FightLogCounter FightLogType = 3 // 计数器变化（含 buff 层数/时间变化）
	FightLogBuff    FightLogType = 4 // 获得/刷新 buff
	FightLogDeath   FightLogType = 5 // 阵亡
	FightLogOther   FightLogType = 6 // 其他（详情走 JSON）
)

func (t FightLogType) String() string {
	switch t {
	case FightLogAttack:
		return "attack"
	case FightLogRecover:
		return "recover"
	case FightLogCounter:
		return "counter"
	case FightLogBuff:
		return "buff"
	case FightLogDeath:
		return "death"
	case FightLogOther:
		return "other"
	default:
		return "unknown"
	}
}

// ==================== ref / special 的正负约定 ====================
//
// ref（伤害/效果的来源）与 special（本次事件触发的被动/特殊受击效果）都用**一个 int**
// 表达"哪来的"，避免为此多开字段：
//
//	ref:      > 0 技能 ID ；< 0 −buffID ；= 0 被动（含普攻、永久行为）
//	special:  > 0 角色 DB ID（该战斗位自身被动生效）；< 0 −buffID ；= 0 无
//
// 下面几个 helper 是唯一的编码/解码方式，调用方不要手写正负号。

// RefPassive 被动（含普攻、永久行为等既非技能也非 buff 的来源/触发者）。
const RefPassive = 0

// RefSkill 编码"技能"来源：正数技能 ID。
func RefSkill(skillID int) int {
	if skillID <= 0 {
		return RefPassive
	}
	return skillID
}

// RefBuff 编码"buff"来源：负数 buff ID（0 或负数按被动处理）。
func RefBuff(buffID int) int {
	if buffID <= 0 {
		return RefPassive
	}
	return -buffID
}

// RefSkillID 取出 ref 里的技能 ID；不是技能来源时返回 0。
func RefSkillID(ref int) int {
	if ref > 0 {
		return ref
	}
	return 0
}

// RefBuffID 取出 ref 里的 buff ID；不是 buff 来源时返回 0。
func RefBuffID(ref int) int {
	if ref < 0 {
		return -ref
	}
	return 0
}

// ==================== 事件详情 ====================
//
// 每个类型一个详情结构（与 proto 的同名 message 对应）；FightLog 只按类型挂载其中一个。

// AttackLog 攻击事件详情。
type AttackLog struct {
	Source   int    // 来源战斗位索引（出手方）
	Target   int    // 目标战斗位索引（受击方）
	Damage   int    // 最终伤害：实际掉血量（被被动/特殊受击抵消掉的不计入）
	HPBefore int    // 结算前生命值
	HPAfter  int    // 结算后生命值
	Ref      int    // 伤害来源：技能 ID / −buffID / 0 被动
	Special  int    // 本次攻击触发的被动/特殊受击效果：角色 DB ID / −buffID / 0
	Other    string // 攻击事件原始 other（JSON 原文，原样透传）
}

// RecoverLog 恢复事件详情。
type RecoverLog struct {
	Source   int
	Target   int
	Recover  int // 实际恢复量（血量差）
	HPBefore int
	HPAfter  int
	Ref      int
	Special  int
	Other    string
}

// CounterLog 计数器变化事件详情。
//
// buff 的层数/时间变化也走这里（键见 BuffCounterKey），值就是剩余量，归零即失效。
type CounterLog struct {
	Key   string // 计数器键
	Delta int    // 变化值（正=增加，负=减少）
	Value int    // 变化后的值
	Ref   int    // 触发来源：技能 ID / −buffID / 0 被动
}

// BuffLog 获得/刷新 buff 事件详情。之后的层数/时间变化走 CounterLog。
type BuffLog struct {
	Source  int
	Target  int
	BuffID  int
	Time    int // 本次时长/层数（已应用默认时长兜底）
	Ref     int
	Special int
	Other   string
}

// DeathLog 阵亡事件详情。
type DeathLog struct {
	Source int // 击杀者战斗位索引（-1 = 无来源）
	Target int // 阵亡的战斗位索引
	Ref    int // 致死来源
}

// OtherLog 其他事件详情（战斗结束等）。
type OtherLog struct {
	Detail string // JSON 原文
}

// FightLog 一条战斗日志：信封（通用字段）+ 详情（按类型只有一个非 nil）。
type FightLog struct {
	Seq         int          // 同场战斗内自增序号
	Type        FightLogType // 事件类型
	Round       int          // 所属回合数（由 AppendLog 统一填写）
	StateNumber int          // 所属战斗状态编号（由 AppendLog 统一填写）

	Attack  *AttackLog
	Recover *RecoverLog
	Counter *CounterLog
	Buff    *BuffLog
	Death   *DeathLog
	Other   *OtherLog
}

// ==================== 缓冲区 ====================

// AppendLog 追加一条日志，自动补序号与当前回合/阶段。
//
// 锁约定：只用 LogMu，**可以被持有 Machine.Mu 的结算路径调用**
// （结算就是在持 Machine.Mu 的区间里记账的）。反过来不成立：
// 持有 LogMu 时不要再去取 Machine.Mu，否则与结算路径构成 AB-BA 死锁。
func (m *Machine) AppendLog(entry FightLog) {
	if m == nil {
		return
	}

	m.LogMu.Lock()
	defer m.LogMu.Unlock()

	m.LogSeq++
	entry.Seq = m.LogSeq
	entry.Round = m.Round
	entry.StateNumber = m.StateNumber
	m.Logs = append(m.Logs, entry)
}

// DrainLogs 取出并清空已记录的日志（每次下发前调用，避免重复播放）。
func (m *Machine) DrainLogs() []FightLog {
	if m == nil {
		return nil
	}

	m.LogMu.Lock()
	defer m.LogMu.Unlock()

	if len(m.Logs) == 0 {
		return nil
	}
	out := m.Logs
	m.Logs = nil
	return out
}

// ==================== 构造函数（唯一拼装入口） ====================

// LogAttack 记一次攻击。damage 必须是**最终实际伤害**（按血量差算），
// 调用方不要传"技能面板伤害"——被格挡/免疫/抵消耗掉的部分不属于伤害。
func (m *Machine) LogAttack(source, target, damage, hpBefore, hpAfter, ref, special int, other string) {
	m.AppendLog(FightLog{
		Type: FightLogAttack,
		Attack: &AttackLog{
			Source: source, Target: target, Damage: damage,
			HPBefore: hpBefore, HPAfter: hpAfter,
			Ref: ref, Special: special, Other: other,
		},
	})
}

// LogRecover 记一次恢复（recover 为实际恢复量，按血量差算）。
func (m *Machine) LogRecover(source, target, recover, hpBefore, hpAfter, ref, special int, other string) {
	m.AppendLog(FightLog{
		Type: FightLogRecover,
		Recover: &RecoverLog{
			Source: source, Target: target, Recover: recover,
			HPBefore: hpBefore, HPAfter: hpAfter,
			Ref: ref, Special: special, Other: other,
		},
	})
}

// LogDeath 记一次阵亡。
func (m *Machine) LogDeath(source, target, ref int) {
	m.AppendLog(FightLog{
		Type:  FightLogDeath,
		Death: &DeathLog{Source: source, Target: target, Ref: ref},
	})
}

// LogBuff 记一次"获得/刷新 buff"。
func (m *Machine) LogBuff(source, target, buffID, buffTime, ref, special int, other string) {
	m.AppendLog(FightLog{
		Type: FightLogBuff,
		Buff: &BuffLog{
			Source: source, Target: target, BuffID: buffID, Time: buffTime,
			Ref: ref, Special: special, Other: other,
		},
	})
}

// LogOther 记一条"其他"事件；detail 传 JSON 字符串（例如 `{"op":"end","win":1}`）。
func (m *Machine) LogOther(detail string) {
	m.AppendLog(FightLog{Type: FightLogOther, Other: &OtherLog{Detail: detail}})
}

// LogBattleEnd 记战斗结束（"其他"事件的一种，约定 op=end）。
func (m *Machine) LogBattleEnd(playerWin bool) {
	win := 0
	if playerWin {
		win = 1
	}
	payload, err := json.Marshal(map[string]any{"op": "end", "win": win})
	if err != nil {
		// map[string]any 的序列化不会失败，这里只是兜底，避免丢事件
		m.LogOther(`{"op":"end"}`)
		return
	}
	m.LogOther(string(payload))
}

// ==================== 计数器写入口 ====================
//
// 战斗内一切"计数"都从这两个函数走，因此计数变化永远不会漏记日志。
//
// 锁约定：Counters 会被 BuildFightStatus 在 Machine.Mu 读锁下遍历，
// 所以**调用方必须已持有 Machine.Mu 写锁**（与既有 Counters 用法一致）。
// 日志追加走 LogMu，顺序为 Mu → LogMu，不会与结算路径互锁。

// AddCounter 给计数器加 delta 并记一条 Counter 日志，返回变化后的值。
// 计数器不存在时按 0 起算。
func (m *Machine) AddCounter(key string, delta int, ref int) int {
	if m == nil || key == "" {
		return 0
	}
	if m.Counters == nil {
		m.Counters = map[string]float32{}
	}
	before := int(m.Counters[key])
	after := before + delta
	m.Counters[key] = float32(after)
	m.logCounter(key, delta, after, ref)
	return after
}

// SetCounter 直接把计数器设为 value 并记一条 Counter 日志，返回设置后的值。
func (m *Machine) SetCounter(key string, value int, ref int) int {
	if m == nil || key == "" {
		return 0
	}
	if m.Counters == nil {
		m.Counters = map[string]float32{}
	}
	before := int(m.Counters[key])
	m.Counters[key] = float32(value)
	m.logCounter(key, value-before, value, ref)
	return value
}

// CounterValue 读一个计数器的当前值（调用方需持有 Machine.Mu）。
func (m *Machine) CounterValue(key string) int {
	if m == nil {
		return 0
	}
	return int(m.Counters[key])
}

// BuffCounterKey buff 在计数器通道里的键：层数/时间变化用它上报，
// 前端看到 value 归零即认为该 buff 失效。
func BuffCounterKey(index int, buffID int) string {
	return fmt.Sprintf("buff:%d:%d", buffID, index)
}

// LogBuffCounter 上报一次 buff 层数/时间变化。
//
// 与 AddCounter 的区别：buff 的真值在 CharacterState.Buffs[].Time 上（不在 Counters map 里），
// 所以这里**只记日志、不写 Counters**，避免同一份数据有两个属主。
func (m *Machine) LogBuffCounter(index int, buffID int, before int, after int, ref int) {
	m.logCounter(BuffCounterKey(index, buffID), after-before, after, ref)
}

func (m *Machine) logCounter(key string, delta int, value int, ref int) {
	if delta == 0 {
		return // 值没变就不产生事件，避免噪声
	}
	m.AppendLog(FightLog{
		Type: FightLogCounter,
		Counter: &CounterLog{
			Key: key, Delta: delta, Value: value, Ref: ref,
		},
	})
}
