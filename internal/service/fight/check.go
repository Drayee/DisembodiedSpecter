package fight

import (
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/proto/pd"
	"context"
	"fmt"

	"google.golang.org/protobuf/proto"
)

// CheckChoseSkill 检测玩家选择的技能是否合法：
//  1. 技能必须存在，且属于"在使用的角色"（技能的归属角色 == 消息中的角色，即技能组归属检测）；
//  2. 使用技能的角色必须在本场战斗的我方队伍中；
//  3. 若已标记当前行动角色（CharacterSite.IsMainActionCharacter），技能只能由该行动角色使用；
//  4. 一个角色本回合不能同时使用两个技能。
func (fe *FightEngine) CheckChoseSkill(ctx context.Context, machine *structs.Machine, req *pd.C2S_ChoseSkill) error {
	if req == nil {
		return fmt.Errorf("选择技能消息为空")
	}
	if machine == nil {
		return fmt.Errorf("战斗状态机为空")
	}

	characterID := int(req.CharacterId)
	skillID := int(req.SkillId)

	// 1. 技能必须存在，且属于该角色（技能组归属）
	skill, err := fe.gameContentManager.GetSkill(ctx, skillID)
	if err != nil {
		return fmt.Errorf("技能 %d 不存在: %w", skillID, err)
	}
	if skill.CharacterID != characterID {
		return fmt.Errorf("技能 %d 不属于角色 %d（属于角色 %d）", skillID, characterID, skill.CharacterID)
	}

	// 2. 角色必须在本场战斗的我方队伍中
	if !containsInt(machine.SelfCharacterIDs, characterID) {
		return fmt.Errorf("角色 %d 不在本场战斗的我方队伍中", characterID)
	}

	// 3. 若已标记当前行动角色，技能只能由行动角色使用
	if acting := actingSelfCharacterID(machine); acting >= 0 && acting != characterID {
		return fmt.Errorf("技能只能由当前行动角色 %d 使用，而非角色 %d", acting, characterID)
	}

	// 4. 一个角色本回合不能同时使用两个技能
	if used, ok := machine.CharacterUsedSkill[characterID]; ok {
		return fmt.Errorf("角色 %d 本回合已使用技能 %d，不能再次使用", characterID, used)
	}

	return nil
}

// ApplyChoseSkill 记录角色本回合已使用的技能（需在 CheckChoseSkill 通过后调用）
func (fe *FightEngine) ApplyChoseSkill(machine *structs.Machine, req *pd.C2S_ChoseSkill) {
	if machine == nil || req == nil {
		return
	}
	if machine.CharacterUsedSkill == nil {
		machine.CharacterUsedSkill = make(map[int]int)
	}
	machine.CharacterUsedSkill[int(req.CharacterId)] = int(req.SkillId)
}

// CheckSyncFightStatus 检测前端上报的战斗状态是否正确：
// 将前端 FightStatus 与服务器权威状态（BuildFightStatus）逐字段比对。
// 返回 needSync = true 表示前端状态有误或过期，需要将权威状态同步给前端。
func (fe *FightEngine) CheckSyncFightStatus(machine *structs.Machine, req *pd.Msg_SyncFightStatus) (needSync bool, err error) {
	if machine == nil {
		return false, fmt.Errorf("战斗状态机为空")
	}
	// 空状态视为前端无效，需要同步
	if req == nil || req.Status == nil {
		return true, nil
	}
	authoritative := BuildFightStatus(machine)
	return !proto.Equal(authoritative, req.Status), nil
}

// BuildFightStatus 将服务器端 Machine 序列化为权威战斗状态（用于校验与同步）
func BuildFightStatus(machine *structs.Machine) *pd.FightStatus {
	if machine == nil {
		return &pd.FightStatus{
			Characters: []*pd.CharacterStatus{},
			Sites:      []*pd.Site{},
			Tools:      []*pd.Tool{},
			Counters:   map[string]float32{},
		}
	}
	status := &pd.FightStatus{
		IsSelfRound:    machine.IsSelfRound,
		Round:          int32(machine.Round),
		Characters:     make([]*pd.CharacterStatus, 0, len(machine.CharacterState)),
		Sites:          make([]*pd.Site, 0, len(machine.CharacterSite)),
		Tools:          make([]*pd.Tool, 0, len(machine.Tools)),
		NowFightStatus: int32(machine.NowFightStatus),
		Counters:       make(map[string]float32, len(machine.Counters)),
		StateNumber:    int32(machine.StateNumber),
	}

	for i, cs := range machine.CharacterState {
		if cs == nil {
			status.Characters = append(status.Characters, &pd.CharacterStatus{Buffs: []*pd.Buff{}})
			continue
		}
		status.Characters = append(status.Characters, &pd.CharacterStatus{
			Health:        int32(cs.Health),
			Attack:        cs.Attack,
			Defense:       int32(cs.Defense),
			Buffs:         buildBuffs(cs.Buffs),
			IsMyCharacter: i < machine.SelfCharacterNumber,
		})
	}

	for _, site := range machine.CharacterSite {
		isMain := site != nil && site.IsMainActionCharacter
		status.Sites = append(status.Sites, &pd.Site{IsMainActionCharacter: isMain})
	}

	for _, tool := range machine.Tools {
		if tool == nil {
			continue
		}
		status.Tools = append(status.Tools, &pd.Tool{ToolId: int32(tool.ID), Count: int32(tool.Count)})
	}

	for k, v := range machine.Counters {
		status.Counters[k] = v
	}

	return status
}

// buildBuffs 将状态机 buff 列表转换为协议 buff 列表
func buildBuffs(buffs []*structs.Buff) []*pd.Buff {
	if len(buffs) == 0 {
		return nil
	}
	out := make([]*pd.Buff, 0, len(buffs))
	for _, b := range buffs {
		if b == nil {
			continue
		}
		out = append(out, &pd.Buff{BuffId: int32(b.ID), Time: int32(b.Time)})
	}
	return out
}

// containsInt 判断切片中是否包含指定值
func containsInt(list []int, v int) bool {
	for _, item := range list {
		if item == v {
			return true
		}
	}
	return false
}

// actingSelfCharacterID 返回当前行动的我方角色 ID；
// 未标记行动角色（CharacterSite 为空或没有 IsMainActionCharacter）时返回 -1。
func actingSelfCharacterID(machine *structs.Machine) int {
	for i, site := range machine.CharacterSite {
		if site != nil && site.IsMainActionCharacter && i < machine.SelfCharacterNumber && i < len(machine.SelfCharacterIDs) {
			return machine.SelfCharacterIDs[i]
		}
	}
	return -1
}
