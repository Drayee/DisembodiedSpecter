package buff

import (
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/service/fight/structs"
	"errors"
)

// 本包只负责 buff 运行时的读与写：
//   - 定义（domain.Buff）按 ID 走 GameContentManager 的内容表缓存取；
//   - 实例存在 structs.CharacterState.Buffs 里，只有 {ID, Time}（剩余时间）。
//
// 所有函数都以"战斗位索引"（0..N-1，我方在前敌方在后）定位角色，不是角色 DB ID。

// GetBuff 取 buff 定义（走内容表缓存）。
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

	state := stateAt(machine, index)
	if state == nil {
		return false
	}
	for _, b := range state.Buffs {
		if b != nil && b.ID == buffID && b.Time > 0 {
			return true
		}
	}
	return false
}

// LossBuff 扣减战斗位 index 身上该 buff 的剩余时间；剩余时间归零则移除该 buff。
// loss <= 0 时不做事。
func LossBuff(machine *structs.Machine, index int, buffID int, loss int) {
	if machine == nil || loss <= 0 {
		return
	}
	machine.Mu.Lock()
	defer machine.Mu.Unlock()

	state := stateAt(machine, index)
	if state == nil {
		return
	}
	kept := make([]*structs.Buff, 0, len(state.Buffs))
	for _, b := range state.Buffs {
		if b == nil {
			continue
		}
		if b.ID == buffID {
			b.Time -= loss
			if b.Time <= 0 {
				continue // 剩余时间用完：移除
			}
		}
		kept = append(kept, b)
	}
	state.Buffs = kept
}

// stateAt 返回战斗位索引对应的角色状态；越界或缺失返回 nil。
// 调用方必须已持有 machine.Mu。
func stateAt(machine *structs.Machine, index int) *structs.CharacterState {
	if index < 0 || index >= len(machine.CharacterState) {
		return nil
	}
	return machine.CharacterState[index]
}
