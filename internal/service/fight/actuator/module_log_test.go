package actuator

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"testing"
)

// newTestMachine 构造一个不依赖 Redis 的最小战斗状态机：
// 1 个我方（索引 0）+ 1 个敌方（索引 1）。
func newTestMachine() *structs.Machine {
	return &structs.Machine{
		Round:               2,
		StateNumber:         structs.MyRound,
		SelfCharacterNumber: 1,
		CharacterIDs:        []int{1, 1},
		CharacterState: []*structs.CharacterState{
			{Health: 100, MaxHealth: 100, Attack: 1, Recover: 1, Defense: 0},
			{Health: 50, MaxHealth: 50, Attack: 1, Recover: 1, Defense: 0},
		},
		CharacterSite: []*structs.Site{{}, {}},
	}
}

// TestAttackModuleLogsDamage 验证伤害结算会落一条 Attack 日志，
// 且数值取"结算前后血量差"（而不是重复计算一遍伤害公式）。
func TestAttackModuleLogsDamage(t *testing.T) {
	machine := newTestMachine()

	// 伤害 2 × 攻击倍率 1 - 防御 0 = 2
	AttackModule(machine, 0, 1, 2, structs.DamageTypeNormal)

	logs := machine.DrainLogs()
	if len(logs) != 1 {
		t.Fatalf("期望 1 条日志，实际 %d 条: %+v", len(logs), logs)
	}
	got := logs[0]
	if got.Type != structs.FightLogAttack {
		t.Errorf("日志类型 = %d，期望 Attack(%d)", got.Type, structs.FightLogAttack)
	}
	if got.Source != 0 || got.Target != 1 {
		t.Errorf("战斗位 = (%d→%d)，期望 (0→1)", got.Source, got.Target)
	}
	if got.Value != 2 {
		t.Errorf("伤害值 = %d，期望 2", got.Value)
	}
	if got.HPBefore != 50 || got.HPAfter != 48 {
		t.Errorf("血量 = %d→%d，期望 50→48", got.HPBefore, got.HPAfter)
	}
	if got.Round != 2 || got.StateNumber != structs.MyRound {
		t.Errorf("回合/状态 = %d/%d，期望 2/%d", got.Round, got.StateNumber, structs.MyRound)
	}
	if got.Seq != 1 {
		t.Errorf("序号 = %d，期望 1", got.Seq)
	}
}

// TestAttackModuleLogsDeath 验证打死目标会额外落一条 Death 日志。
func TestAttackModuleLogsDeath(t *testing.T) {
	machine := newTestMachine()
	machine.CharacterState[1].Health = 3

	AttackModule(machine, 0, 1, 10, structs.DamageTypeNormal)

	logs := machine.DrainLogs()
	if len(logs) != 2 {
		t.Fatalf("期望 2 条日志（伤害+阵亡），实际 %d 条: %+v", len(logs), logs)
	}
	if logs[0].Type != structs.FightLogAttack || logs[1].Type != structs.FightLogDeath {
		t.Fatalf("日志类型 = %d,%d，期望 Attack,Death", logs[0].Type, logs[1].Type)
	}
	if logs[1].HPAfter != 0 || logs[1].HPBefore != 3 {
		t.Errorf("阵亡血量 = %d→%d，期望 3→0", logs[1].HPBefore, logs[1].HPAfter)
	}
}

// TestRecoverModuleLogsRecover 验证治疗结算落一条 Recover 日志（数值为正）。
func TestRecoverModuleLogsRecover(t *testing.T) {
	machine := newTestMachine()
	machine.CharacterState[0].Health = 90

	RecoverModule(machine, 0, 7)

	logs := machine.DrainLogs()
	if len(logs) != 1 {
		t.Fatalf("期望 1 条日志，实际 %d 条", len(logs))
	}
	if logs[0].Type != structs.FightLogRecover || logs[0].Value != 7 {
		t.Errorf("日志类型/数值 = %d/%d，期望 Recover/7", logs[0].Type, logs[0].Value)
	}
	if logs[0].HPAfter != 97 {
		t.Errorf("治疗后血量 = %d，期望 97", logs[0].HPAfter)
	}
}

// TestDrainLogsClears 验证"下发即清空"：同一批事件不会重复下发给客户端。
func TestDrainLogsClears(t *testing.T) {
	machine := newTestMachine()
	AttackModule(machine, 0, 1, 1, structs.DamageTypeNormal)
	if got := len(machine.DrainLogs()); got != 1 {
		t.Fatalf("首次取走 = %d 条，期望 1 条", got)
	}
	if got := machine.DrainLogs(); got != nil {
		t.Fatalf("再次取走 = %+v，期望 nil（已清空）", got)
	}
}

// TestAppendLogSeqIncrements 验证序号自增且与回合/状态自动填写。
func TestAppendLogSeqIncrements(t *testing.T) {
	machine := newTestMachine()
	machine.AppendLog(structs.FightLog{Type: structs.FightLogCast, Source: 0, Target: 1, SkillID: 1})
	machine.AppendLog(structs.FightLog{Type: structs.FightLogRound})

	logs := machine.DrainLogs()
	if len(logs) != 2 || logs[0].Seq != 1 || logs[1].Seq != 2 {
		t.Fatalf("序号 = %+v，期望 1,2", logs)
	}
	if logs[0].SkillID != 1 || logs[1].Type != structs.FightLogRound {
		t.Errorf("日志内容不符: %+v", logs)
	}
	if logs[0].Round != 2 {
		t.Errorf("自动填写的回合 = %d，期望 2", logs[0].Round)
	}
}
