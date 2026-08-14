package domain

import "time"

type Email struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	Host      string    `json:"host" gorm:"column:host"`
	Port      int       `json:"port" gorm:"column:port"`
	User      string    `json:"user" gorm:"column:user"`
	Pass      string    `json:"pass" gorm:"column:pass"`
	MaxCount  int       `json:"max_count" gorm:"column:max_count"`
	Status    int       `json:"status" gorm:"column:status"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}
