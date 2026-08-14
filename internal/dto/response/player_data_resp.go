package response

import (
	"DisembodiedSpecter/internal/domain"
	"time"
)

type Object struct {
	ID        int               `json:"id"`
	Name      string            `json:"name"`
	Num       int               `json:"num"`
	Attribute map[string]string `json:"attribute"`
}

type PlayerDataResp struct {
	Description     string          `json:"description"`

	Level           int             `json:"level"`
	Exp             int             `json:"exp"`
	Location        domain.Location `json:"location"`
	Bag             []Object        `json:"bag"`

	IsActive        bool            `json:"is_active"`
	LeastActiveType string          `json:"least_active_type"`
	LeastActiveIP   string          `json:"least_active_ip"`
	LeastActiveAt   time.Time       `json:"least_active_at"`
}
