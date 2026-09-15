package structs

// 战斗日志：服务端执行战斗时按发生顺序记录的"一次性事件"。
//
// 与状态（CharacterState / FightStatus）的分工：
//   - 状态是"现在什么样"的快照，可以随时重发覆盖；
//   - 日志是"刚刚发生了什么"的增量事件，下发一次后即清空。
//
// 客户端据此回放演出（出手 → 结算 → 飘字 → 血条落位），状态只用于最终对齐。
// 这样战斗逻辑完全不用搬到前端：前端不参与任何结算，只按日志播动画。
//
// 分层约定：用本地常量而不直接引用 proto/pd，保持 structs 包不依赖 proto
// （与 ArmedSkill 存三个 int 而不用 proto 消息是同一个理由）。
type FightLogType int32

const (
	FightLogUnknown    FightLogType = 0
	FightLogCast       FightLogType = 1 // 施放技能 / 敌方开始行动
	FightLogAttack     FightLogType = 2 // 伤害结算
	FightLogRecover    FightLogType = 3 // 治疗结算
	FightLogBuffAdd    FightLogType = 4 // 获得 buff
	FightLogBuffRemove FightLogType = 5 // 失去 buff
	FightLogDeath      FightLogType = 6 // 战斗位阵亡
	FightLogRound      FightLogType = 7 // 回合 / 阶段推进
	FightLogEnd        FightLogType = 8 // 战斗结束
)

// FightLog 一条战斗日志。
//
// Source / Target 是**战斗位索引**（0..N-1，我方在前敌方在后，与 Machine.CharacterState
// 下标一致），不是角色 DB ID；-1 表示无来源/无目标。
type FightLog struct {
	Seq      int          // 同场战斗内自增序号
	Type     FightLogType // 事件类型
	Source   int          // 来源战斗位索引（-1 表示无来源）
	Target   int          // 目标战斗位索引（-1 表示无目标）
	SkillID  int          // 技能 ID（Cast）
	BuffID   int          // buff ID（BuffAdd / BuffRemove）
	Value    int          // 伤害/恢复量；End 时 1=胜利 0=失败
	HPBefore int          // 结算前生命值
	HPAfter  int          // 结算后生命值
	Round    int          // 追加时的回合数
	// StateNumber 追加时的战斗状态编号。Round/StateNumber 都由 AppendLog 统一填写
	// （调用方不必传）：它们是"记账那一刻"的展示用快照，不参与任何结算判定。
	StateNumber int
	Text        string // 展示文案（可选，留给前端直接飘字）
}

// AppendLog 追加一条日志，自动补序号与当前回合/状态。
//
// 锁约定：本方法只用 LogMu，**可以被持有 Machine.Mu 的结算路径调用**
// （伤害结算就是在持 Machine.Mu 的区间里记账的，见 actuator.defaultSettle）。
// 反过来不成立：持有 LogMu 时不要再去取 Machine.Mu，否则与结算路径构成 AB-BA 死锁。
//
// Round/StateNumber 在这里直接读机器字段：回合字段只在两回合之间（事件已全部结算完）
// 由主循环推进，因此读到的值与"事件发生时的回合"一致。
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
// 返回的切片已与本机解耦，调用方可以安全地继续读。
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
