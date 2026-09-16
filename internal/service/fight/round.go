package fight

import (
	"DisembodiedSpecter/internal/service/fight/buff"
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/proto/pd"
	"log"
)

// 本文件是战斗的**流程编排**：一个回合怎么开始、我方回合做什么、敌方回合做什么、
// 什么时候判定胜负、什么时候结束。
//
// 它只依赖 Machine + FightEngine，不碰 WebSocket、不碰 protobuf——收发包是 service 层的事。
// 这样 service/fight_usec.go 里就只剩"连接生命周期 + 协议编解码 + 把结果发下去"。

// RoundResult 一次回合执行的结果，供调用方决定是否下发状态、是否记录战报。
type RoundResult struct {
	// Rejected 技能校验未通过（整体拒绝，本回合什么都没执行）
	Rejected bool
	// Reason 拒绝原因（仅日志用）
	Reason string
	// Ended 战斗是否已结束
	Ended bool
	// PlayerWin 结束时的胜负
	PlayerWin bool
}

// BeginRound 进入一个新的回合：回合数 +1。
//
// 语义：**Round 表示"当前正在进行的回合"**。战斗开局与每次回到 Waiting（等待选择技能）之前
// 各调用一次，这样同一回合内产生的所有日志都带同一个 Round，客户端可以直接按它分组。
func (fe *FightEngine) BeginRound(machine *structs.Machine) {
	if machine == nil {
		return
	}
	machine.Round++
}

// PlayerRound 执行我方回合：整体校验 → 记录技能 → 三阶段执行 → 收尾 → 胜负判定。
//
// 结束时 StateNumber 只有两种可能：
//   - 战斗结束：保持 MyRound + Ended（调用方下发状态后不再接受技能）
//   - 未结束：OtherRound（等待敌方回合，由客户端发 START_PHASE 触发 EnemyRound）
//
// enableTimeAdvance 恒为 false：一个完整回合是"我方 + 敌方"，buff 时间推进放在敌方回合收尾，
// 否则同一次回合会被扣两次。
func (fe *FightEngine) PlayerRound(machine *structs.Machine, skills []*pd.Skill) RoundResult {
	if machine == nil {
		return RoundResult{Rejected: true, Reason: "战斗状态机为空"}
	}
	if machine.Ended {
		return RoundResult{Rejected: true, Reason: "战斗已结束"}
	}

	// 1. 整体校验：任一项不合法则整批拒绝（不执行任何技能）
	for _, s := range skills {
		if err := fe.CheckChoseSkill(machine.Ctx, machine, s); err != nil {
			return RoundResult{Rejected: true, Reason: err.Error()}
		}
	}

	// 2. 记录本回合各角色已使用的技能（校验通过后才记录）
	for _, s := range skills {
		fe.ApplyChoseSkill(machine, s)
	}

	// 3. 执行技能三阶段：Listener（武装）→ Init → Run
	machine.StateNumber = structs.MyRound
	if err := fe.RunSkillStart(skills, machine); err != nil {
		log.Printf("技能执行失败: %v", err)
	}

	// 4. 收尾：等事件全部结算完、真退订本回合监听器、清空本回合技能记录
	fe.EndRound(machine, false)
	machine.CharacterUsedSkill = map[int]int{}

	// 5. 胜负判定
	if ended, win := machine.CheckBattleEnd(); ended {
		machine.Ended = true
		machine.PlayerWin = win
		machine.LogBattleEnd(win)
		return RoundResult{Ended: true, PlayerWin: win}
	}

	// 6. 进入敌方回合
	machine.LastStateNumber = structs.Waiting
	machine.StateNumber = structs.OtherRound
	return RoundResult{}
}

// EnemyRound 执行敌方回合：重新武装监听器 → 逐个敌方行动 → 收尾（推进 buff 时间）→ 胜负判定。
//
// 敌方回合不跑技能阶段，但本回合的被动反应仍要生效（例如"被攻击时追加攻击"），
// 所以先用本回合技能集合 ArmRoundReactors 重新武装。
// 收尾时 advanceTime=true：这里是"我方 + 敌方"一个完整回合的收尾，LossByTime 的 buff 各扣 1 格。
func (fe *FightEngine) EnemyRound(machine *structs.Machine) RoundResult {
	if machine == nil {
		return RoundResult{Rejected: true, Reason: "战斗状态机为空"}
	}
	if machine.Ended {
		return RoundResult{Rejected: true, Reason: "战斗已结束"}
	}

	fe.ArmRoundReactors(machine)

	for _, eid := range machine.EnemyCharacterIDs {
		idx, ok := machine.EnemyCharacterIndex[eid]
		if !ok {
			continue
		}
		if err := fe.enemyManager.Run(idx, machine, eid); err != nil {
			log.Printf("敌方行动失败: %v", err)
		}
		// 该敌方单位行动完毕：发行动结束信号，让它身上 LossByAction 的 buff 各扣 1 格
		if err := buff.PublishActionTick(machine, idx); err != nil {
			log.Printf("敌方战斗位 %d 行动信号发布失败: %v", idx, err)
		}
	}

	fe.EndRound(machine, true)

	if ended, win := machine.CheckBattleEnd(); ended {
		machine.Ended = true
		machine.PlayerWin = win
		machine.LogBattleEnd(win)
		return RoundResult{Ended: true, PlayerWin: win}
	}

	// 回到等待选择：随后由调用方 BeginRound 进入下一个回合
	machine.LastStateNumber = structs.OtherRound
	machine.StateNumber = structs.Waiting
	fe.BeginRound(machine)
	return RoundResult{}
}
