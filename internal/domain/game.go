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

// Buff buff 定义（内容表）。
// 注意与 structs.Buff 的区别：这里是"定义"（内容表里的一条数据），
// structs.Buff 是"运行时实例"（某个战斗位身上挂着的 {ID, Time}）。
// 运行时实例只存 ID 与剩余时间，定义按 ID 走 GameContentManager 的缓存取。
type Buff struct {
	ID   int      `json:"id" gorm:"primaryKey;column:id;autoIncrement;uniqueIndex"`
	Name string   `json:"name" gorm:"column:name;uniqueIndex"`
	Type BuffType `json:"type" gorm:"column:type"`

	// LossWay 时间的损失方式（time/action/none/listener）
	LossWay BuffLossWay `json:"loss_way" gorm:"column:loss_way"`
	// DefaultDuration 上 buff 时若未指定时间则用它兜底（0 表示不兜底，按临时 buff 处理）
	DefaultDuration int `json:"default_duration" gorm:"column:default_duration;default:0"`

	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}
