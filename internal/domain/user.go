package domain

import "time"

type User struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"column:name;uniqueIndex"`
	Password  string    `json:"password" gorm:"column:password"`
	Email     string    `json:"email" gorm:"column:email;uniqueIndex"`
	Role      string    `json:"role" gorm:"column:role;default:user"`
	Status    int       `json:"status" gorm:"column:status;default:1"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

const (
	UserRoleAdmin = "admin"
	UserRoleUser  = "user"
	UserStatusActive   = 1
	UserStatusDisabled = 0
)
