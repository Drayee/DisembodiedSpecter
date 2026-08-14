package response

import "DisembodiedSpecter/internal/domain"

// AdminUserListResp 用户列表响应
type AdminUserListResp struct {
	Total int64           `json:"total"`
	List  []AdminUserItem `json:"list"`
}

// ==================== 游戏内容响应 ====================

// AdminCharacterListResp 角色列表响应
type AdminCharacterListResp struct {
	Total int64              `json:"total"`
	List  []*domain.Character `json:"list"`
}

// AdminEnemyListResp 敌人列表响应
type AdminEnemyListResp struct {
	Total int64           `json:"total"`
	List  []*domain.Enemy `json:"list"`
}

// AdminToolListResp 道具列表响应
type AdminToolListResp struct {
	Total int64           `json:"total"`
	List  []*domain.Tool `json:"list"`
}

// AdminSkillListResp 技能列表响应
type AdminSkillListResp struct {
	Total int64            `json:"total"`
	List  []*domain.Skill `json:"list"`
}

type AdminUserItem struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Status    int    `json:"status"`
	CreatedAt string `json:"created_at"`
}

// AdminPlayerListResp 玩家列表响应
type AdminPlayerListResp struct {
	Total int64             `json:"total"`
	List  []AdminPlayerItem `json:"list"`
}

type AdminPlayerItem struct {
	ID              int    `json:"id"`
	Description     string `json:"description"`
	Level           int    `json:"level"`
	Exp             int    `json:"exp"`
	IsActive        bool   `json:"is_active"`
	LeastActiveType string `json:"least_active_type"`
	LeastActiveIP   string `json:"least_active_ip"`
	LeastActiveAt   string `json:"least_active_at"`
}

// AdminStatsOverviewResp 数据统计总览
type AdminStatsOverviewResp struct {
	UserCount   int64 `json:"user_count"`
	PlayerCount int64 `json:"player_count"`
	ItemCount   int64 `json:"item_count"`
	EmailCount  int64 `json:"email_count"`
}

// AdminStatsOnlineResp 在线统计
type AdminStatsOnlineResp struct {
	OnlineCount int64 `json:"online_count"`
	TotalCount  int64 `json:"total_count"`
}

// AdminStatsItemsResp 道具分布
type AdminStatsItemsResp struct {
	Items []AdminItemStat `json:"items"`
}

type AdminItemStat struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
}

// AdminEmailListResp 邮箱配置列表
type AdminEmailListResp struct {
	List []*domain.Email `json:"list"`
}

// AdminPaginateResp 通用分页响应
type AdminPaginateResp struct {
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
}
