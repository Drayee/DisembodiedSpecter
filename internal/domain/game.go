package domain

import "time"

type Character struct {
	ID int `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"column:name;uniqueIndex"`

	Health int `json:"health" gorm:"column:health"`
	Type string `json:"type" gorm:"column:type"`

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
	ID int `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"column:name;uniqueIndex"`

	Health int `json:"health" gorm:"column:health"`
	Type string `json:"type" gorm:"column:type"`

	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

type Tool struct {
	ID int `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"column:name;uniqueIndex"`

	Description string `json:"description" gorm:"column:description;type:text"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

type Skill struct {
	ID int `json:"id" gorm:"primaryKey"`
	CharacterID int `json:"character_id" gorm:"column:character_id;index"`

	Name string `json:"name" gorm:"column:name;uniqueIndex"`
	Type string `json:"type" gorm:"column:type"`
	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}