package fight

import "DisembodiedSpecter/internal/eventbus"

// Machine 战斗状态机
type Machine struct {
	isSelfRound bool // 是否是自己的回合
	round       int  // 回合数

	characterState []*CharacterState // 角色状态
	characterSite  []*Site           // 角色位置

	roundCharacterNeededOperation []int // 角色回合操作

	tools          []*Tool            // 道具列表
	nowFightStatus int                // 现在的战斗情况
	counters       map[string]float32 // 计数器

	stateNumber   int      // 状态编号
	lastTimeFight *Machine // 上一次战斗状态
}

// CharacterState 角色状态
type CharacterState struct {
	Health  int     // 生命值
	Attack  float64 // 攻击倍率
	Recover float64 // 恢复倍率
	Defense int     // 防御力

	Buffs []*Buff // buff列表
	//IsMyCharacter bool    // 是否是我的角色 // 被废弃,正负数表示是否是我的角色
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

// Event 事件
type Event struct {
	DamageEvent    *eventbus.EventBus[*eventbus.DamageEvent]    // 伤害事件
	RecoverEvent   *eventbus.EventBus[*eventbus.RecoverEvent]   // 恢复事件
	ToolEvent      *eventbus.EventBus[*eventbus.ToolEvent]      // 道具事件
	CharacterEvent *eventbus.EventBus[*eventbus.CharacterEvent] // 角色事件
}
