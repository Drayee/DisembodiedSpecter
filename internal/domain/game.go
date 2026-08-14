package domain

import "time"

type Character struct {
	ID int `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"column:name;uniqueIndex"`

	Health int `json:"health" gorm:"column:health"`
	Type string `json:"type" gorm:"column:type"`

	Description string `json:"description" gorm:"column:description;type:text"`

	OwnerNumber int `json:"owner_number" gorm:"column:owner_number"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
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
	CharacterID int `json:"character_id" gorm:"column:character_id"`

	Name string `json:"name" gorm:"column:name;uniqueIndex"`
	Type string `json:"type" gorm:"column:type"`
	Description string `json:"description" gorm:"column:description;type:text"`

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}