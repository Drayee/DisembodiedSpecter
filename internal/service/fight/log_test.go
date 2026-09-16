package fight

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/proto/pd"
	"testing"
)

// newLogTestMachine 一个够用的战斗状态机（本包测试只关心日志，不触发结算）。
func newLogTestMachine() *structs.Machine {
	return &structs.Machine{
		Round:               2,
		StateNumber:         structs.OtherRound,
		SelfCharacterNumber: 1,
		CharacterIDs:        []int{1, 1},
		CharacterState: []*structs.CharacterState{
			{Health: 10, MaxHealth: 10, Buffs: []*structs.Buff{}},
			{Health: 5, MaxHealth: 5, Buffs: []*structs.Buff{}},
		},
		Counters: map[string]float32{},
	}
}

// TestBuildFightLogsDetailMapping 6 种事件类型必须映射到各自的 oneof 详情分支，
// 且信封字段（seq/type/round/state_number）齐全。这是客户端按 detail 分发演出的前提。
func TestBuildFightLogsDetailMapping(t *testing.T) {
	machine := newLogTestMachine()

	machine.LogAttack(0, 1, 3, 5, 2, structs.RefSkill(3), structs.RefBuff(1), `{"type":"thunder"}`)
	machine.LogRecover(-1, 1, 2, 2, 4, structs.RefPassive, structs.RefPassive, "")
	machine.Mu.Lock()
	machine.AddCounter("count:skill4", 1, structs.RefSkill(4))
	machine.Mu.Unlock()
	machine.LogBuff(0, 0, 1, 3, structs.RefSkill(5), structs.RefPassive, "")
	machine.LogDeath(0, 1, structs.RefSkill(3))
	machine.LogBattleEnd(true)

	logs := BuildFightLogs(machine.DrainLogs())
	if len(logs) != 6 {
		t.Fatalf("期望 6 条日志，实际 %d 条", len(logs))
	}

	// 信封：序号 1..6，回合/阶段统一填充
	for i, log := range logs {
		if log.Seq != int32(i+1) {
			t.Errorf("第 %d 条 seq = %d，期望 %d", i+1, log.Seq, i+1)
		}
		if log.Round != 2 || log.StateNumber != int32(structs.OtherRound) {
			t.Errorf("第 %d 条 round/state = %d/%d，期望 2/%d", i+1, log.Round, log.StateNumber, structs.OtherRound)
		}
	}

	// 1) 攻击
	if logs[0].Type != pd.FightLogType_LOG_ATTACK {
		t.Fatalf("第 1 条 type = %v，期望 LOG_ATTACK", logs[0].Type)
	}
	attack, ok := logs[0].Detail.(*pd.FightLog_Attack)
	if !ok {
		t.Fatalf("第 1 条 detail 分支错误: %T", logs[0].Detail)
	}
	if attack.Attack.Source != 0 || attack.Attack.Target != 1 || attack.Attack.Damage != 3 ||
		attack.Attack.HpBefore != 5 || attack.Attack.HpAfter != 2 {
		t.Errorf("攻击详情不符: %+v", attack.Attack)
	}
	if attack.Attack.Ref != 3 || attack.Attack.Special != -1 || attack.Attack.Other != `{"type":"thunder"}` {
		t.Errorf("攻击 ref/special/other 不符: %+v", attack.Attack)
	}

	// 2) 恢复
	if r, ok := logs[1].Detail.(*pd.FightLog_Recover); !ok || logs[1].Type != pd.FightLogType_LOG_RECOVER {
		t.Fatalf("第 2 条应为恢复: type=%v detail=%T", logs[1].Type, logs[1].Detail)
	} else if r.Recover.Recover != 2 || r.Recover.Source != -1 || r.Recover.HpAfter != 4 {
		t.Errorf("恢复详情不符: %+v", r.Recover)
	}

	// 3) 计数器
	if c, ok := logs[2].Detail.(*pd.FightLog_Counter); !ok || logs[2].Type != pd.FightLogType_LOG_COUNTER {
		t.Fatalf("第 3 条应为计数: type=%v detail=%T", logs[2].Type, logs[2].Detail)
	} else if c.Counter.Key != "count:skill4" || c.Counter.Delta != 1 || c.Counter.Value != 1 || c.Counter.Ref != 4 {
		t.Errorf("计数详情不符: %+v", c.Counter)
	}

	// 4) 获得 buff
	if b, ok := logs[3].Detail.(*pd.FightLog_Buff); !ok || logs[3].Type != pd.FightLogType_LOG_BUFF {
		t.Fatalf("第 4 条应为 buff: type=%v detail=%T", logs[3].Type, logs[3].Detail)
	} else if b.Buff.BuffId != 1 || b.Buff.Time != 3 || b.Buff.Source != 0 || b.Buff.Target != 0 || b.Buff.Ref != 5 {
		t.Errorf("buff 详情不符: %+v", b.Buff)
	}

	// 5) 阵亡
	if d, ok := logs[4].Detail.(*pd.FightLog_Death); !ok || logs[4].Type != pd.FightLogType_LOG_DEATH {
		t.Fatalf("第 5 条应为阵亡: type=%v detail=%T", logs[4].Type, logs[4].Detail)
	} else if d.Death.Source != 0 || d.Death.Target != 1 || d.Death.Ref != 3 {
		t.Errorf("阵亡详情不符: %+v", d.Death)
	}

	// 6) 其他（战斗结束）
	if o, ok := logs[5].Detail.(*pd.FightLog_Other); !ok || logs[5].Type != pd.FightLogType_LOG_OTHER {
		t.Fatalf("第 6 条应为其他: type=%v detail=%T", logs[5].Type, logs[5].Detail)
	} else if o.Other.Detail != `{"op":"end","win":1}` {
		t.Errorf("其他详情不符: %q", o.Other.Detail)
	}
}

// TestBuildFightLogsEmpty 没有日志时不产生空包。
func TestBuildFightLogsEmpty(t *testing.T) {
	if got := BuildFightLogs(nil); got != nil {
		t.Fatalf("nil 输入应返回 nil，实际 %+v", got)
	}
	if got := BuildFightLogs([]structs.FightLog{}); got != nil {
		t.Fatalf("空切片应返回 nil，实际 %+v", got)
	}
}

// TestRoundResultGuards 结算已结束时两个回合入口都必须拒绝执行。
func TestRoundResultGuards(t *testing.T) {
	machine := newLogTestMachine()
	machine.Ended = true
	fe := &FightEngine{}

	if r := fe.PlayerRound(machine, nil); !r.Rejected {
		t.Error("战斗已结束时 PlayerRound 应拒绝")
	}
	if r := fe.EnemyRound(machine); !r.Rejected {
		t.Error("战斗已结束时 EnemyRound 应拒绝")
	}
}

// TestBeginRound Round 语义：Round 表示"当前正在进行的回合"，由 BeginRound 推进。
func TestBeginRound(t *testing.T) {
	machine := newLogTestMachine()
	machine.Round = 0
	fe := &FightEngine{}

	fe.BeginRound(machine)
	if machine.Round != 1 {
		t.Fatalf("首次 BeginRound 后 Round = %d，期望 1", machine.Round)
	}
	// 第 1 回合内产生的日志都带 Round=1
	machine.LogOther(`{"op":"test"}`)
	logs := machine.DrainLogs()
	if logs[0].Round != 1 {
		t.Errorf("第 1 回合的日志 Round = %d，期望 1", logs[0].Round)
	}

	fe.BeginRound(machine)
	if machine.Round != 2 {
		t.Fatalf("再次 BeginRound 后 Round = %d，期望 2", machine.Round)
	}
}
