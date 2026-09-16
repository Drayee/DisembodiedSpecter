package actuator

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"reflect"
	"testing"
)

// 这些测试覆盖"战斗日志的记账链路"，重点是**收口在 Apply 之后是否真的不漏**：
// 默认结算、被定制行为完全接管两种情况都必须留下日志。

// newTestMachine 构造一个不依赖 Redis 的最小战斗状态机。
// 战斗位：0 = 我方（角色 DB ID 2，有龙力 buff 的定制受击行为），1 = 敌方（角色 DB ID 1）。
func newTestMachine() *structs.Machine {
	return &structs.Machine{
		Round:               1,
		StateNumber:         structs.MyRound,
		SelfCharacterNumber: 1,
		CharacterIDs:        []int{2, 1},
		CharacterState: []*structs.CharacterState{
			{Health: 100, MaxHealth: 100, Attack: 1, Recover: 1, Defense: 0, Buffs: []*structs.Buff{}},
			{Health: 50, MaxHealth: 50, Attack: 1, Recover: 1, Defense: 0, Buffs: []*structs.Buff{}},
		},
		CharacterSite: []*structs.Site{{}, {}},
		Counters:      map[string]float32{},
	}
}

// newTestManager 构造一个只有"角色 2 定制受击行为"的 ActuatorManager
// （不调用 NewActuatorManager：那个会去内容表扫方法名，需要 Redis）。
func newTestManager(t *testing.T) *ActuatorManager {
	t.Helper()
	method, ok := reflect.TypeFor[*ActuatorManager]().MethodByName("Character2AttackListener")
	if !ok {
		t.Fatal("未找到 Character2AttackListener，定制行为注册约定可能已变")
	}
	return &ActuatorManager{
		characterBehaviors: map[int]Behavior{2: {Attack: method}},
	}
}

// TestApplyLogsAttackDamage 默认结算：伤害按血量差记账。
func TestApplyLogsAttackDamage(t *testing.T) {
	machine := newTestMachine()
	am := newTestManager(t)

	// 伤害 2 × 攻击倍率 1 − 防御 0 = 2
	if err := am.Apply(machine, &structs.Effect{
		Kind: structs.EffectAttack, SourceID: 0, TargetID: 1,
		Damage: 2, Ref: structs.RefSkill(1), Other: `{"type":"none"}`,
	}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}

	logs := machine.DrainLogs()
	if len(logs) != 1 {
		t.Fatalf("期望 1 条日志，实际 %d 条: %+v", len(logs), logs)
	}
	got := logs[0]
	if got.Type != structs.FightLogAttack || got.Attack == nil {
		t.Fatalf("期望 Attack 日志，实际 type=%v detail=%+v", got.Type, got.Attack)
	}
	a := got.Attack
	if a.Source != 0 || a.Target != 1 || a.Damage != 2 {
		t.Errorf("source/target/damage = %d/%d/%d，期望 0/1/2", a.Source, a.Target, a.Damage)
	}
	if a.HPBefore != 50 || a.HPAfter != 48 {
		t.Errorf("血量 = %d→%d，期望 50→48", a.HPBefore, a.HPAfter)
	}
	if a.Ref != structs.RefSkill(1) {
		t.Errorf("ref = %d，期望技能 1", a.Ref)
	}
	if a.Other != `{"type":"none"}` {
		t.Errorf("other = %q，期望原样透传", a.Other)
	}
	if got.Round != 1 || got.Seq != 1 {
		t.Errorf("信封字段 round/seq = %d/%d，期望 1/1", got.Round, got.Seq)
	}
}

// TestApplyLogsDeath 血量由正跨到 0 时补一条阵亡日志。
func TestApplyLogsDeath(t *testing.T) {
	machine := newTestMachine()
	am := newTestManager(t)
	machine.CharacterState[1].Health = 3

	if err := am.Apply(machine, &structs.Effect{
		Kind: structs.EffectAttack, SourceID: 0, TargetID: 1, Damage: 10,
	}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}

	logs := machine.DrainLogs()
	if len(logs) != 2 {
		t.Fatalf("期望 2 条日志（攻击+阵亡），实际 %d 条", len(logs))
	}
	if logs[1].Type != structs.FightLogDeath || logs[1].Death == nil {
		t.Fatalf("第二条应为阵亡日志，实际 %+v", logs[1])
	}
	if logs[1].Death.Target != 1 {
		t.Errorf("阵亡战斗位 = %d，期望 1", logs[1].Death.Target)
	}
	if logs[0].Attack.HPAfter != 0 {
		t.Errorf("阵亡后血量应为 0（不能为负），实际 %d", logs[0].Attack.HPAfter)
	}
}

// TestApplyLogsRecover 恢复按血量差记账，且受生命上限之外的数值不去猜（只记实际增量）。
func TestApplyLogsRecover(t *testing.T) {
	machine := newTestMachine()
	am := newTestManager(t)
	machine.CharacterState[0].Health = 90

	if err := am.Apply(machine, &structs.Effect{
		Kind: structs.EffectRecover, SourceID: 0, TargetID: 0, Recover: 7, Ref: structs.RefSkill(3),
	}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}

	logs := machine.DrainLogs()
	if len(logs) != 1 || logs[0].Type != structs.FightLogRecover {
		t.Fatalf("期望 1 条恢复日志，实际 %+v", logs)
	}
	r := logs[0].Recover
	if r.Recover != 7 || r.HPBefore != 90 || r.HPAfter != 97 {
		t.Errorf("恢复 = %d（%d→%d），期望 7（90→97）", r.Recover, r.HPBefore, r.HPAfter)
	}
	if r.Ref != structs.RefSkill(3) {
		t.Errorf("ref = %d，期望技能 3", r.Ref)
	}
}

// TestApplyCustomBehaviorStillLogged 是本次重构的核心保证：
// 定制行为**完全接管**结算（用龙力 buff 抵消伤害、自己动 buff 而不碰血量）时，
// 依然要留下攻击日志（0 伤害 + special=被消耗的 buff），前端才能播"格挡"而不是"凭空无事"。
func TestApplyCustomBehaviorStillLogged(t *testing.T) {
	machine := newTestMachine()
	am := newTestManager(t)
	// 战斗位 0 身上挂着 2 层龙力（buff 1）
	machine.CharacterState[0].Buffs = []*structs.Buff{{ID: 1, Time: 2, LossWay: "time"}}

	if err := am.Apply(machine, &structs.Effect{
		Kind: structs.EffectAttack, SourceID: 1, TargetID: 0, Damage: 5, Ref: structs.RefPassive,
	}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}

	logs := machine.DrainLogs()
	if len(logs) != 2 {
		t.Fatalf("期望 2 条日志（buff 层数变化 + 攻击），实际 %d 条: %+v", len(logs), logs)
	}

	// 1) 计数日志排在前面：定制行为是在**结算过程中**消耗 buff 的，
	//    而"攻击结果（0 伤害 + special）"只有结算完才知道，所以顺序天然是
	//    "先消耗龙力 → 再得出受击结果"。日志顺序 = 真实因果顺序，前端按序播即可。
	c := logs[0].Counter
	if logs[0].Type != structs.FightLogCounter || c == nil {
		t.Fatalf("第一条应为计数日志，实际 %+v", logs[0])
	}
	if c.Key != structs.BuffCounterKey(0, 1) {
		t.Errorf("key = %q，期望 %q", c.Key, structs.BuffCounterKey(0, 1))
	}
	if c.Delta != -1 || c.Value != 1 {
		t.Errorf("层数变化 = %d→%d，期望 −1→1", c.Delta, c.Value)
	}
	if int(machine.CharacterState[0].Buffs[0].Time) != 1 {
		t.Errorf("龙力应剩 1 层，实际 %d", machine.CharacterState[0].Buffs[0].Time)
	}

	// 2) 攻击日志：血量没掉，但事件必须存在，且 special 指明"是 buff 1 挡下的"
	a := logs[1].Attack
	if logs[1].Type != structs.FightLogAttack || a == nil {
		t.Fatalf("第二条应为攻击日志，实际 %+v", logs[1])
	}
	if a.Damage != 0 || a.HPBefore != 100 || a.HPAfter != 100 {
		t.Errorf("被抵消的攻击应记 0 伤害且血量不变，实际 damage=%d %d→%d", a.Damage, a.HPBefore, a.HPAfter)
	}
	if a.Special != structs.RefBuff(1) {
		t.Errorf("special = %d，期望 −1（buff 1 生效）", a.Special)
	}
}

// TestApplyCustomBehaviorNormalPath 定制行为在"不在龙上"时走正常伤害路径，同样有日志。
func TestApplyCustomBehaviorNormalPath(t *testing.T) {
	machine := newTestMachine()
	am := newTestManager(t)

	if err := am.Apply(machine, &structs.Effect{
		Kind: structs.EffectAttack, SourceID: 1, TargetID: 0, Damage: 5, Ref: structs.RefPassive,
	}); err != nil {
		t.Fatalf("Apply 失败: %v", err)
	}

	logs := machine.DrainLogs()
	if len(logs) != 1 || logs[0].Attack == nil {
		t.Fatalf("期望 1 条攻击日志，实际 %+v", logs)
	}
	if logs[0].Attack.Damage != 5 || logs[0].Attack.HPAfter != 95 {
		t.Errorf("伤害应为 5、血量 95，实际 %d / %d", logs[0].Attack.Damage, logs[0].Attack.HPAfter)
	}
	if logs[0].Attack.Special != 0 {
		t.Errorf("没有触发特殊受击时 special 应为 0，实际 %d", logs[0].Attack.Special)
	}
}

// TestApplyUnknownCombatant 战斗位不存在时报错且不产生日志。
func TestApplyUnknownCombatant(t *testing.T) {
	machine := newTestMachine()
	am := newTestManager(t)

	if err := am.Apply(machine, &structs.Effect{Kind: structs.EffectAttack, TargetID: 9}); err == nil {
		t.Fatal("非法战斗位应报错")
	}
	if logs := machine.DrainLogs(); logs != nil {
		t.Fatalf("非法战斗位不应产生日志，实际 %+v", logs)
	}
}

// TestCounterAPI 计数器唯一写入口：值正确、变化自动记账、值不变不产生噪声。
func TestCounterAPI(t *testing.T) {
	machine := newTestMachine()

	machine.Mu.Lock()
	if got := machine.AddCounter("count:skill4", 1, structs.RefSkill(4)); got != 1 {
		t.Fatalf("AddCounter 返回值 = %d，期望 1", got)
	}
	machine.AddCounter("count:skill4", 1, structs.RefSkill(4))
	if got := machine.CounterValue("count:skill4"); got != 2 {
		t.Fatalf("CounterValue = %d，期望 2", got)
	}
	machine.SetCounter("count:skill4", 0, structs.RefSkill(4))
	machine.AddCounter("count:skill4", 0, structs.RefSkill(4)) // 值不变：不应产生日志
	machine.Mu.Unlock()

	logs := machine.DrainLogs()
	if len(logs) != 3 {
		t.Fatalf("期望 3 条计数日志（+1、+1、归零），实际 %d 条: %+v", len(logs), logs)
	}
	want := []struct {
		delta int
		value int
	}{{1, 1}, {1, 2}, {-2, 0}}
	for i, w := range want {
		c := logs[i].Counter
		if logs[i].Type != structs.FightLogCounter || c == nil {
			t.Fatalf("第 %d 条应为计数日志，实际 %+v", i+1, logs[i])
		}
		if c.Delta != w.delta || c.Value != w.value {
			t.Errorf("第 %d 条 delta/value = %d/%d，期望 %d/%d", i+1, c.Delta, c.Value, w.delta, w.value)
		}
		if c.Key != "count:skill4" || c.Ref != structs.RefSkill(4) {
			t.Errorf("第 %d 条 key/ref = %q/%d，期望 count:skill4/4", i+1, c.Key, c.Ref)
		}
	}
}

// TestLogBuffCounter 不写 Counters（buff 真值在 buff 实例上），只记日志。
func TestLogBuffCounter(t *testing.T) {
	machine := newTestMachine()

	machine.LogBuffCounter(1, 3, 2, 1, structs.RefPassive)

	logs := machine.DrainLogs()
	if len(logs) != 1 {
		t.Fatalf("期望 1 条日志，实际 %d 条", len(logs))
	}
	c := logs[0].Counter
	if c == nil || c.Key != "buff:3:1" || c.Delta != -1 || c.Value != 1 {
		t.Fatalf("计数日志不符: %+v", c)
	}
	machine.Mu.RLock()
	_, exists := machine.Counters["buff:3:1"]
	machine.Mu.RUnlock()
	if exists {
		t.Error("buff 层数不应写入 Counters（真值在 buff 实例上，避免两个属主）")
	}
}

// TestDrainLogsClears 下发即清空：同一批事件不会重复下发给客户端。
func TestDrainLogsClears(t *testing.T) {
	machine := newTestMachine()
	machine.LogOther(`{"op":"end","win":1}`)
	if got := len(machine.DrainLogs()); got != 1 {
		t.Fatalf("首次取走 = %d 条，期望 1 条", got)
	}
	if got := machine.DrainLogs(); got != nil {
		t.Fatalf("再次取走 = %+v，期望 nil（已清空）", got)
	}
}

// TestRefEncoding ref 的正负语义：正=技能、负=buff、0=被动。
func TestRefEncoding(t *testing.T) {
	if structs.RefSkill(3) != 3 {
		t.Errorf("RefSkill(3) = %d，期望 3", structs.RefSkill(3))
	}
	if structs.RefBuff(3) != -3 {
		t.Errorf("RefBuff(3) = %d，期望 −3", structs.RefBuff(3))
	}
	if structs.RefSkill(0) != structs.RefPassive || structs.RefBuff(0) != structs.RefPassive {
		t.Error("非法 ID 应退化为被动(0)")
	}
	if structs.RefSkillID(-2) != 0 || structs.RefBuffID(2) != 0 {
		t.Error("解码方向错误：ref 为正才是技能、为负才是 buff")
	}
	if structs.RefSkillID(2) != 2 || structs.RefBuffID(-2) != 2 {
		t.Error("ref 解码失败")
	}
}

// TestBattleEndLogOther 战斗结束走"其他"事件，detail 是可解析的 JSON。
func TestBattleEndLogOther(t *testing.T) {
	machine := newTestMachine()
	machine.LogBattleEnd(true)

	logs := machine.DrainLogs()
	if len(logs) != 1 || logs[0].Type != structs.FightLogOther || logs[0].Other == nil {
		t.Fatalf("期望 1 条其他日志，实际 %+v", logs)
	}
	if logs[0].Other.Detail != `{"op":"end","win":1}` {
		t.Errorf("detail = %q", logs[0].Other.Detail)
	}
}
