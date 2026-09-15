package domain

import "time"

type Character struct {
	ID   int    `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"column:name;uniqueIndex"`

	Health int    `json:"health" gorm:"column:health"`
	Type   string `json:"type" gorm:"column:type"`

	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

// UserCharacter 用户-角色 多对多归属关系（替代 Character.OwnerNumber）
// 一个用户可拥有多个角色，一个角色可属于多个用户。
type UserCharacter struct {
	UserID      int       `json:"user_id" gorm:"primaryKey;column:user_id;index"`
	CharacterID int       `json:"character_id" gorm:"primaryKey;column:character_id;index"`
	IsInTeam    bool      `json:"is_in_team" gorm:"column:is_in_team;default:false;index"` // 是否在当前出战队伍中
	Level       int       `json:"level" gorm:"column:level;default:1"`                     // 角色等级（预留，后续属性成长用）
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
}

type Enemy struct {
	ID   int    `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"column:name;uniqueIndex"`

	Health int    `json:"health" gorm:"column:health"`
	Type   string `json:"type" gorm:"column:type"`

	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

type Tool struct {
	ID   int    `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"column:name;uniqueIndex"`

	Description string    `json:"description" gorm:"column:description;type:text"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"column:updated_at"`
}

type Skill struct {
	ID          int `json:"id" gorm:"primaryKey"`
	CharacterID int `json:"character_id" gorm:"column:character_id;index"`

	Name        string `json:"name" gorm:"column:name;uniqueIndex"`
	Type        string `json:"type" gorm:"column:type"`
	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

// BuffType buff 的效果类型
type BuffType string

const (
	BuffTypeValueChange   BuffType = "value_change"   // 单纯数值变化的buff
	BuffTypePercentChange BuffType = "percent_change" // 百分比变化的buff
	BuffTypeListener      BuffType = "listener"       // 监听事件的buff
	BuffTypeTag           BuffType = "tag"            // 标签buff(无效果只是标记)
)

// BuffLossWay buff 时间的损失方式
type BuffLossWay string

const (
	LossByTime     BuffLossWay = "time"     // 每回合损失1格buff
	LossByAction   BuffLossWay = "action"   // 每次角色行动损失1格buff
	LossByNone     BuffLossWay = "none"     // 无损失方式(永久有效)
	LossByListener BuffLossWay = "listener" // 监听事件损失buff
)

// BuffStat 可被 buff 影响的属性
type BuffStat string

const (
	BuffStatAttack  BuffStat = "attack"  // 攻击倍率
	BuffStatDefense BuffStat = "defense" // 防御力
	BuffStatRecover BuffStat = "recover" // 恢复倍率
)

// BuffEffect 一条 buff 效果：对某个属性做固定值或百分比增减。
//
// Percent = true 时 Value 是比例（0.1 表示 +10%），否则是固定值。
// 多条效果一起结算：先累加所有固定值、再乘上百分比之和，
// 即 有效值 = 基础值 × (1 + Σpercent) + Σflat。
type BuffEffect struct {
	Stat    BuffStat `json:"stat"`
	Value   float64  `json:"value"`
	Percent bool     `json:"percent"`
}

// Buff buff 定义（内容表）。
// 注意与 structs.Buff 的区别：这里是"定义"（内容表里的一条数据），
// structs.Buff 是"运行时实例"（某个战斗位身上挂着的快照）。
// 运行时实例只存 ID、剩余时间与效果快照（战斗中途改定义不影响已生效的 buff）。
type Buff struct {
	ID   int      `json:"id" gorm:"primaryKey;column:id;autoIncrement;uniqueIndex"`
	Name string   `json:"name" gorm:"column:name;uniqueIndex"`
	Type BuffType `json:"type" gorm:"column:type"`

	// LossWay 时间的损失方式（time/action/none/listener）。
	// 前三种由引擎按回合/行动推进时扣减；listener 不自动扣，由该 buff 的监听器自行决定。
	LossWay BuffLossWay `json:"loss_way" gorm:"column:loss_way"`
	// DefaultDuration 上 buff 时若未指定时间则用它兜底（0 表示不兜底，按临时 buff 处理）
	DefaultDuration int `json:"default_duration" gorm:"column:default_duration;default:0"`

	// Effects buff 的效果列表（JSON 列）。空列表表示纯标记 buff（tag）。
	Effects []BuffEffect `json:"effects" gorm:"column:effects;serializer:json;type:text"`

	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}
