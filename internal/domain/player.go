package domain

import "time"

type Location struct {
	X   int    `json:"x" gorm:"column:x"`
	Y   int    `json:"y" gorm:"column:y"`
	Map string `json:"map" gorm:"column:map"`
}

type Player struct {
	ID              int       `json:"id" gorm:"primary_key"`
	Description     string    `json:"description" gorm:"column:description"`
	Level           int       `json:"level" gorm:"column:level"`
	Exp             int       `json:"exp" gorm:"column:exp"`
	Location        Location  `json:"location" gorm:"column:location;serializer:json"`
	IsActive        bool      `json:"is_active" gorm:"column:is_active"`
	LeastActiveType string    `json:"least_active_type" gorm:"column:least_active_type"`
	LeastActiveIP   string    `json:"least_active_ip" gorm:"column:least_active_ip"`
	LeastActiveAt   time.Time `json:"least_active_at" gorm:"column:least_active_at"`
}

type Item struct {
	ID          int       `json:"id" gorm:"primary_key"`
	Name        string    `json:"name" gorm:"column:name"`
	Description string    `json:"description" gorm:"column:description"`
	Type        string    `json:"type" gorm:"column:type"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at"`
}

type PlayerItem struct {
	PlayerID  int               `json:"player_id" gorm:"primary_key;column:player_id"`
	ItemID    int               `json:"item_id" gorm:"primary_key;column:item_id"`
	Num       int               `json:"num" gorm:"column:num"`
	Attribute map[string]string `json:"attribute" gorm:"column:attribute;serializer:json"`
	CreatedAt time.Time         `json:"created_at" gorm:"column:created_at"`
}
