package structs

import (
	"DisembodiedSpecter/internal/eventbus"
	"DisembodiedSpecter/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"sync"
)

// ArmedSkill 本回合武装的技能。
// 用三个 int 而不是直接存 proto 消息，避免 structs 包依赖 proto/pd。
// 用途：敌方回合不跑技能阶段，需要用它重新武装同一批监听器。
type ArmedSkill struct {
	SkillID     int
	CharacterID int
	TargetID    int
}

// Machine 战斗状态机
type Machine struct {
	IsSelfRound bool // 是否是自己的回合
	Round       int  // 回合数

	// Ctx 战斗生命周期上下文：由战斗会话创建（context.WithCancel），连接断开时统一取消。
	// 注意：不要存放 HTTP 请求上下文（gin.Context），请求结束后会被取消，而 Machine 会长期存活。
	Ctx context.Context

	// Mu 保护 CharacterState / Counters 等被 actuator 监听 goroutine 与主循环并发访问的字段
	Mu sync.RWMutex

	CharacterState      []*CharacterState // 角色状态(包括敌方角色和我方角色)
	CharacterSite       []*Site           // 角色位置(包括敌方角色和我方角色)
	SelfCharacterNumber int               // 我的角色数

	// CharacterIDs 战斗位索引 → 角色/NPC DB ID，与 CharacterState 严格同长同序。
	// 与 SelfCharacterIDs / EnemyCharacterIDs 的区别：后两者是"配置的 ID 列表"，
	// 加载失败的角色不会进入 CharacterState，用它们按下标取值会错位。
	// actuator 的角色行为分派、行动角色判定都必须用 CharacterIDs。
	CharacterIDs []int

	// EventHub 本机的事件中枢：独占本场战斗唯一的 pubsub，并持有反应者注册表与
	// "每事件一份"的反应版本闸门。不要另建实例，统一用 Events() 获取，
	// 否则发布方、反应者与 actuator 会各自持有不同的中枢，反应版本对不上。
	EventHub *EventHub

	// RoundSkills 本回合武装的技能集合（回合结束时清空）。
	// 回合之间相互独立：回合结束会真退订本回合的全部监听器，
	// 敌方回合则用这份集合重新武装（敌方回合不跑技能阶段）。
	RoundSkills []ArmedSkill

	// GameContent 内容表管理器（角色/敌人/技能/buff 定义都走它读缓存）。
	// 由 NewMachine 注入；战斗侧的 buff 逻辑用它按 ID 取定义。
	// 注意：它底层是 Redis 访问，**不要在持有 Mu 的区间内调用**，
	// 否则一次网络往返会把所有战斗状态的读写都堵住。
	GameContent *utils.GameContentManager

	// 队伍与对战 NPC 的 ID 列表（由 NewMachine 加载）
	SelfCharacterIDs  []int // 我方队伍角色 ID 列表（来自玩家数据的 character_team）
	EnemyCharacterIDs []int // 对方 NPC 角色 ID 列表（来自 DoingMap 的 enemy_id / enemy_ids）

	// 角色/敌人 DB ID → 战斗位索引（0..N-1，我方在前敌方在后，与 CharacterState 下标一致）
	SelfCharacterIndex  map[int]int
	EnemyCharacterIndex map[int]int

	RoundCharacterNeededOperation []int // 角色回合操作

	// CharacterUsedSkill 本回合各角色已使用的技能（characterID -> skillID），
	// 用于检测一个角色不能同时使用两个技能；每回合结束后重置。
	CharacterUsedSkill map[int]int

	Tools          []*Tool            // 道具列表
	NowFightStatus int                // 现在的战斗情况
	Counters       map[string]float32 // 计数器

	StateNumber int    // 状态编号
	UUID        string // 战斗UUID

	// LastStateNumber 上一阶段的状态编号（RETURN_PREV_PHASE 时恢复）
	LastStateNumber int

	// Ended / PlayerWin 战斗是否结束及结果（全部敌方阵亡胜利，全部我方阵亡失败）
	Ended     bool
	PlayerWin bool
}

// CharacterState 角色状态
type CharacterState struct {
	Health  int     // 生命值
	Attack  float64 // 攻击倍率
	Recover float64 // 恢复倍率
	Defense int     // 防御力

	Buffs []*Buff // buff列表
	//IsMyCharacter bool    // 是否是我的角色 // 被废弃,SelfCharacterNumber表示是否是我的角色
}

type Buff struct {
	ID   int //  buffID
	Time int // buff时间
}

// Site 角色位置
type Site struct {
	IsMainActionCharacter bool // 是否是行动角色
}

type Tool struct {
	ID    int // 道具ID
	Count int // 道具数量
}

// NowFightStatus 现在的战斗情况
const (
	Waiting    = 0 // 等待玩家操作
	MyRound    = 1 // 我的回合操作
	OtherRound = 2 // 对方回合操作
)

// DoingMap 在战斗（Doing == Fight）时使用的字段名
const (
	DoingMapEnemyID  = "enemy_id"  // 对战的 NPC ID（单个）
	DoingMapEnemyIDs = "enemy_ids" // 对战的 NPC ID 列表（JSON []int）
)

// Event 事件
type Event struct {
	DamageEvent    *eventbus.EventBus[*eventbus.DamageEvent]    // 伤害事件
	RecoverEvent   *eventbus.EventBus[*eventbus.RecoverEvent]   // 恢复事件
	ToolEvent      *eventbus.EventBus[*eventbus.ToolEvent]      // 道具事件
	CharacterEvent *eventbus.EventBus[*eventbus.CharacterEvent] // 角色事件
}

// NewMachine 创建并初始化战斗状态机：
//  1. 通过 PlayerDataManager（Redis 玩家数据 Hash）读取玩家的队伍角色 ID（character_team 字段）；
//  2. 通过 PlayerDataManager 读取 DoingMap（战斗时内部包含场地 buff、对方角色等消息），
//     从中解析对战的 NPC ID（enemy_id / enemy_ids 字段）；
//  3. 通过 GameContentManager 获取上述角色的信息，初始化 CharacterState 与 SelfCharacterNumber，
//     并将 ID 列表写入 SelfCharacterIDs / EnemyCharacterIDs。
func NewMachine(ctx context.Context, pdm *utils.PlayerDataManager, gm *utils.GameContentManager, userID int) (*Machine, error) {
	machine := &Machine{
		IsSelfRound:         true,
		Round:               0,
		Ctx:                 ctx,
		CharacterState:      nil,
		SelfCharacterIndex:  map[int]int{},
		EnemyCharacterIndex: map[int]int{},
		CharacterUsedSkill:  map[int]int{},
		Counters:            map[string]float32{},
		LastStateNumber:     Waiting,
		EventHub:            NewEventHub(),
		GameContent:         gm,
	}

	// 1+2. 从玩家数据（Redis Hash）读取状态机字段：队伍角色 ID + DoingMap
	state, err := pdm.GetMachineState(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("读取玩家状态机字段失败: %w", err)
	}
	machine.SelfCharacterIDs = state.CharacterTeam
	machine.EnemyCharacterIDs = parseDoingMapEnemyIDs(state.DoingMap)

	// 3. 通过 GameContentManager 获取我方队伍角色信息（我方角色在前）
	for _, cid := range machine.SelfCharacterIDs {
		character, err := gm.GetCharacter(ctx, cid)
		if err != nil {
			log.Printf("获取角色 %d 信息失败: %v", cid, err)
			continue
		}
		idx := len(machine.CharacterState)
		machine.CharacterState = append(machine.CharacterState,
			&CharacterState{Health: character.Health, Attack: 1, Recover: 1, Defense: 0, Buffs: []*Buff{}})
		// CharacterIDs 只在状态真正入列时才追加，保证与 CharacterState 严格同长同序：
		// 加载失败被 continue 跳过的角色不占位，否则 SelfCharacterIDs[i] 会与
		// CharacterState[i] 错位，导致按索引取到错误的角色。
		machine.CharacterIDs = append(machine.CharacterIDs, cid)
		machine.SelfCharacterIndex[cid] = idx
	}
	machine.SelfCharacterNumber = len(machine.CharacterState)

	// 3. 通过 GameContentManager 获取对方 NPC 信息（敌方角色在后）
	for _, eid := range machine.EnemyCharacterIDs {
		enemy, err := gm.GetEnemy(ctx, eid)
		if err != nil {
			log.Printf("获取敌人 %d 信息失败: %v", eid, err)
			continue
		}
		idx := len(machine.CharacterState)
		machine.CharacterState = append(machine.CharacterState,
			&CharacterState{Health: enemy.Health, Attack: 1, Recover: 1, Defense: 1, Buffs: []*Buff{}})
		machine.CharacterIDs = append(machine.CharacterIDs, eid)
		machine.EnemyCharacterIndex[eid] = idx
	}

	return machine, nil
}

// CheckBattleEnd 检测战斗是否结束：我方全部阵亡则失败，敌方全部阵亡则胜利。
// 没有敌方时视为胜利（无战斗目标）。
func (m *Machine) CheckBattleEnd() (ended bool, playerWin bool) {
	m.Mu.RLock()
	defer m.Mu.RUnlock()

	if len(m.EnemyCharacterIDs) == 0 {
		return true, true
	}
	allDead := func(from, to int) bool {
		if from >= len(m.CharacterState) {
			return true
		}
		if to > len(m.CharacterState) {
			to = len(m.CharacterState)
		}
		for i := from; i < to; i++ {
			cs := m.CharacterState[i]
			if cs != nil && cs.Health > 0 {
				return false
			}
		}
		return true
	}
	if allDead(0, m.SelfCharacterNumber) {
		return true, false
	}
	if allDead(m.SelfCharacterNumber, len(m.CharacterState)) {
		return true, true
	}
	return false, false
}

// parseDoingMapEnemyIDs 从 DoingMap 中解析对战的 NPC ID 列表
func parseDoingMapEnemyIDs(doingMap map[string]string) []int {
	if doingMap == nil {
		return []int{}
	}
	// 优先解析 ID 列表（JSON []int）
	if v, ok := doingMap[DoingMapEnemyIDs]; ok && v != "" {
		var ids []int
		if err := json.Unmarshal([]byte(v), &ids); err == nil && len(ids) > 0 {
			return ids
		}
	}
	// 其次解析单个 NPC ID
	if v, ok := doingMap[DoingMapEnemyID]; ok && v != "" {
		if id, err := strconv.Atoi(v); err == nil {
			return []int{id}
		}
	}
	return []int{}
}
