package request

// AdminPaginateReq 分页请求
type AdminPaginateReq struct {
	Page     int `form:"page" binding:"required,min=1"`
	PageSize int `form:"page_size" binding:"required,min=1,max=100"`
}

// AdminUpdateRoleReq 修改用户角色
type AdminUpdateRoleReq struct {
	Role string `json:"role" binding:"required,oneof=admin user"`
}

// AdminUpdatePlayerLevelReq 修改玩家等级
type AdminUpdatePlayerLevelReq struct {
	Level int `json:"level" binding:"required,min=0"`
}

// AdminUpdatePlayerExpReq 修改玩家经验
type AdminUpdatePlayerExpReq struct {
	Exp int `json:"exp" binding:"required,min=0"`
}

// AdminUpdateEmailReq 修改邮箱配置
type AdminUpdateEmailReq struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Pass     string `json:"pass"`
	MaxCount int    `json:"max_count"`
	Status   int    `json:"status"`
}

// ==================== 游戏内容管理 ====================

// AdminCreateCharacterReq 创建角色
type AdminCreateCharacterReq struct {
	Name        string `json:"name" binding:"required"`
	Health      int    `json:"health" binding:"required,min=0"`
	Type        string `json:"type" binding:"required"`
	Description string `json:"description"`
	OwnerNumber int    `json:"owner_number" binding:"min=0"`
}

// AdminUpdateCharacterReq 修改角色
type AdminUpdateCharacterReq struct {
	Name        string `json:"name"`
	Health      int    `json:"health" binding:"min=0"`
	Type        string `json:"type"`
	Description string `json:"description"`
	OwnerNumber int    `json:"owner_number" binding:"min=0"`
}

// AdminCreateEnemyReq 创建敌人
type AdminCreateEnemyReq struct {
	Name        string `json:"name" binding:"required"`
	Health      int    `json:"health" binding:"required,min=0"`
	Type        string `json:"type" binding:"required"`
	Description string `json:"description"`
}

// AdminUpdateEnemyReq 修改敌人
type AdminUpdateEnemyReq struct {
	Name        string `json:"name"`
	Health      int    `json:"health" binding:"min=0"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

// AdminCreateToolReq 创建道具
type AdminCreateToolReq struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// AdminUpdateToolReq 修改道具
type AdminUpdateToolReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// AdminCreateSkillReq 创建技能
type AdminCreateSkillReq struct {
	CharacterID int    `json:"character_id" binding:"required,min=1"`
	Name        string `json:"name" binding:"required"`
	Type        string `json:"type" binding:"required"`
	Description string `json:"description"`
}

// AdminUpdateSkillReq 修改技能
type AdminUpdateSkillReq struct {
	CharacterID int    `json:"character_id" binding:"min=1"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
}
