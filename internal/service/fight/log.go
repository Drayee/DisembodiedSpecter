package fight

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/proto/pd"
)

// 本文件是**战斗日志 → 协议消息的唯一转换点**。
//
// 为什么单独放这里：structs 包刻意不依赖 proto/pd（它只提供带语义的本地类型），
// 而传输层（service/fight_usec.go）不应该关心"日志有几种、每种字段怎么摆"。
// 于是转换只在这里做一次，加新事件类型时只改这一个文件。

// BuildFightLogs 把状态机记录的日志批量转换成协议消息（保持原有顺序）。
func BuildFightLogs(entries []structs.FightLog) []*pd.FightLog {
	if len(entries) == 0 {
		return nil
	}
	out := make([]*pd.FightLog, 0, len(entries))
	for _, entry := range entries {
		out = append(out, buildFightLog(entry))
	}
	return out
}

func buildFightLog(entry structs.FightLog) *pd.FightLog {
	log := &pd.FightLog{
		Seq:         int32(entry.Seq),
		Type:        pd.FightLogType(entry.Type),
		Round:       int32(entry.Round),
		StateNumber: int32(entry.StateNumber),
	}

	// detail 与 type 一一对应：只有对应类型的详情非 nil
	switch entry.Type {
	case structs.FightLogAttack:
		if entry.Attack != nil {
			a := entry.Attack
			log.Detail = &pd.FightLog_Attack{Attack: &pd.AttackLog{
				Source: int32(a.Source), Target: int32(a.Target), Damage: int32(a.Damage),
				HpBefore: int32(a.HPBefore), HpAfter: int32(a.HPAfter),
				Ref: int32(a.Ref), Special: int32(a.Special), Other: a.Other,
			}}
		}
	case structs.FightLogRecover:
		if entry.Recover != nil {
			r := entry.Recover
			log.Detail = &pd.FightLog_Recover{Recover: &pd.RecoverLog{
				Source: int32(r.Source), Target: int32(r.Target), Recover: int32(r.Recover),
				HpBefore: int32(r.HPBefore), HpAfter: int32(r.HPAfter),
				Ref: int32(r.Ref), Special: int32(r.Special), Other: r.Other,
			}}
		}
	case structs.FightLogCounter:
		if entry.Counter != nil {
			c := entry.Counter
			log.Detail = &pd.FightLog_Counter{Counter: &pd.CounterLog{
				Key: c.Key, Delta: int32(c.Delta), Value: int32(c.Value), Ref: int32(c.Ref),
			}}
		}
	case structs.FightLogBuff:
		if entry.Buff != nil {
			b := entry.Buff
			log.Detail = &pd.FightLog_Buff{Buff: &pd.BuffLog{
				Source: int32(b.Source), Target: int32(b.Target), BuffId: int32(b.BuffID),
				Time: int32(b.Time), Ref: int32(b.Ref), Special: int32(b.Special), Other: b.Other,
			}}
		}
	case structs.FightLogDeath:
		if entry.Death != nil {
			d := entry.Death
			log.Detail = &pd.FightLog_Death{Death: &pd.DeathLog{
				Source: int32(d.Source), Target: int32(d.Target), Ref: int32(d.Ref),
			}}
		}
	case structs.FightLogOther:
		if entry.Other != nil {
			log.Detail = &pd.FightLog_Other{Other: &pd.OtherLog{Detail: entry.Other.Detail}}
		}
	}

	return log
}
