package handlers

import (
	"DisembodiedSpecter/internal/dto/request"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminService *service.AdminUseCase
}

func NewAdminHandler(adminService *service.AdminUseCase) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

// ==================== 用户管理 ====================

// GetUserList 用户列表
// @Summary 用户列表
// @Tags 管理员-用户管理
// @Produce json
// @Param page query int true "页码"
// @Param page_size query int true "每页数量"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/users/list [get]
func (h *AdminHandler) GetUserList(c *gin.Context) {
	var req request.AdminPaginateReq
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	result, err := h.adminService.GetUserList(c, req.Page, req.PageSize)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// UpdateUserRole 修改用户角色
// @Summary 修改用户角色
// @Tags 管理员-用户管理
// @Accept json
// @Produce json
// @Param id path int true "用户ID"
// @Param request body request.AdminUpdateRoleReq true "角色"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/users/{id}/role [put]
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的用户ID")
		return
	}
	var req request.AdminUpdateRoleReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdateUserRole(c, userID, req.Role); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "角色更新成功", nil)
}

// DisableUser 禁用用户
// @Summary 禁用用户
// @Tags 管理员-用户管理
// @Produce json
// @Param id path int true "用户ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/users/{id}/disable [put]
func (h *AdminHandler) DisableUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的用户ID")
		return
	}
	if err := h.adminService.DisableUser(c, userID); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "用户已禁用", nil)
}

// EnableUser 启用用户
// @Summary 启用用户
// @Tags 管理员-用户管理
// @Produce json
// @Param id path int true "用户ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/users/{id}/enable [put]
func (h *AdminHandler) EnableUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的用户ID")
		return
	}
	if err := h.adminService.EnableUser(c, userID); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "用户已启用", nil)
}

// ==================== 玩家管理 ====================

// GetPlayerList 玩家列表
// @Summary 玩家列表
// @Tags 管理员-玩家管理
// @Produce json
// @Param page query int true "页码"
// @Param page_size query int true "每页数量"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/players/list [get]
func (h *AdminHandler) GetPlayerList(c *gin.Context) {
	var req request.AdminPaginateReq
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	result, err := h.adminService.GetPlayerList(c, req.Page, req.PageSize)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// GetPlayerDetail 玩家详情
// @Summary 玩家详情
// @Tags 管理员-玩家管理
// @Produce json
// @Param id path int true "玩家ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/players/{id} [get]
func (h *AdminHandler) GetPlayerDetail(c *gin.Context) {
	playerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的玩家ID")
		return
	}
	player, err := h.adminService.GetPlayerDetail(c, playerID)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, player)
}

// BanPlayer 封禁玩家
// @Summary 封禁玩家
// @Tags 管理员-玩家管理
// @Produce json
// @Param id path int true "玩家ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/players/{id}/ban [put]
func (h *AdminHandler) BanPlayer(c *gin.Context) {
	playerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的玩家ID")
		return
	}
	if err := h.adminService.BanPlayer(c, playerID); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "玩家已封禁", nil)
}

// UnbanPlayer 解封玩家
// @Summary 解封玩家
// @Tags 管理员-玩家管理
// @Produce json
// @Param id path int true "玩家ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/players/{id}/unban [put]
func (h *AdminHandler) UnbanPlayer(c *gin.Context) {
	playerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的玩家ID")
		return
	}
	if err := h.adminService.UnbanPlayer(c, playerID); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "玩家已解封", nil)
}

// UpdatePlayerLevel 修改玩家等级
// @Summary 修改玩家等级
// @Tags 管理员-玩家管理
// @Accept json
// @Produce json
// @Param id path int true "玩家ID"
// @Param request body request.AdminUpdatePlayerLevelReq true "等级"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/players/{id}/level [put]
func (h *AdminHandler) UpdatePlayerLevel(c *gin.Context) {
	playerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的玩家ID")
		return
	}
	var req request.AdminUpdatePlayerLevelReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdatePlayerLevel(c, playerID, req.Level); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "等级更新成功", nil)
}

// UpdatePlayerExp 修改玩家经验
// @Summary 修改玩家经验
// @Tags 管理员-玩家管理
// @Accept json
// @Produce json
// @Param id path int true "玩家ID"
// @Param request body request.AdminUpdatePlayerExpReq true "经验值"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/players/{id}/exp [put]
func (h *AdminHandler) UpdatePlayerExp(c *gin.Context) {
	playerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的玩家ID")
		return
	}
	var req request.AdminUpdatePlayerExpReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdatePlayerExp(c, playerID, req.Exp); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "经验更新成功", nil)
}

// ==================== 数据统计 ====================

// GetStatsOverview 数据总览
// @Summary 数据总览
// @Tags 管理员-数据统计
// @Produce json
// @Success 200 {object} response.Result
// @Router /api/v3/admin/stats/overview [get]
func (h *AdminHandler) GetStatsOverview(c *gin.Context) {
	result, err := h.adminService.GetStatsOverview(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// GetStatsOnline 在线统计
// @Summary 在线统计
// @Tags 管理员-数据统计
// @Produce json
// @Success 200 {object} response.Result
// @Router /api/v3/admin/stats/online [get]
func (h *AdminHandler) GetStatsOnline(c *gin.Context) {
	result, err := h.adminService.GetStatsOnline(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// GetStatsItems 道具分布
// @Summary 道具分布
// @Tags 管理员-数据统计
// @Produce json
// @Success 200 {object} response.Result
// @Router /api/v3/admin/stats/items [get]
func (h *AdminHandler) GetStatsItems(c *gin.Context) {
	result, err := h.adminService.GetStatsItems(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// ==================== 系统配置 ====================

// GetEmailList 邮箱配置列表
// @Summary 邮箱配置列表
// @Tags 管理员-系统配置
// @Produce json
// @Success 200 {object} response.Result
// @Router /api/v3/admin/config/emails [get]
func (h *AdminHandler) GetEmailList(c *gin.Context) {
	result, err := h.adminService.GetEmailList(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// UpdateEmail 修改邮箱配置
// @Summary 修改邮箱配置
// @Tags 管理员-系统配置
// @Accept json
// @Produce json
// @Param id path int true "邮箱配置ID"
// @Param request body request.AdminUpdateEmailReq true "邮箱配置"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/config/emails/{id} [put]
func (h *AdminHandler) UpdateEmail(c *gin.Context) {
	emailID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的邮箱配置ID"})
		return
	}
	var req request.AdminUpdateEmailReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdateEmail(c, emailID, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "邮箱配置更新成功", nil)
}

// ==================== 游戏内容管理 - Character ====================

// GetCharacterList 角色列表
// @Summary 角色列表
// @Tags 管理员-游戏内容-角色
// @Produce json
// @Param page query int true "页码"
// @Param page_size query int true "每页数量"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/characters/list [get]
func (h *AdminHandler) GetCharacterList(c *gin.Context) {
	var req request.AdminPaginateReq
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	result, err := h.adminService.GetCharacterList(c, req.Page, req.PageSize)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// GetCharacterDetail 角色详情
// @Summary 角色详情
// @Tags 管理员-游戏内容-角色
// @Produce json
// @Param id path int true "角色ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/characters/{id} [get]
func (h *AdminHandler) GetCharacterDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的角色ID")
		return
	}
	result, err := h.adminService.GetCharacterDetail(c, id)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// CreateCharacter 创建角色
// @Summary 创建角色
// @Tags 管理员-游戏内容-角色
// @Accept json
// @Produce json
// @Param request body request.AdminCreateCharacterReq true "角色信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/characters [post]
func (h *AdminHandler) CreateCharacter(c *gin.Context) {
	var req request.AdminCreateCharacterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.CreateCharacter(c, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "角色创建成功", nil)
}

// UpdateCharacter 修改角色
// @Summary 修改角色
// @Tags 管理员-游戏内容-角色
// @Accept json
// @Produce json
// @Param id path int true "角色ID"
// @Param request body request.AdminUpdateCharacterReq true "角色信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/characters/{id} [put]
func (h *AdminHandler) UpdateCharacter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的角色ID")
		return
	}
	var req request.AdminUpdateCharacterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdateCharacter(c, id, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "角色更新成功", nil)
}

// ==================== 游戏内容管理 - Enemy ====================

// GetEnemyList 敌人列表
// @Summary 敌人列表
// @Tags 管理员-游戏内容-敌人
// @Produce json
// @Param page query int true "页码"
// @Param page_size query int true "每页数量"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/enemies/list [get]
func (h *AdminHandler) GetEnemyList(c *gin.Context) {
	var req request.AdminPaginateReq
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	result, err := h.adminService.GetEnemyList(c, req.Page, req.PageSize)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// GetEnemyDetail 敌人详情
// @Summary 敌人详情
// @Tags 管理员-游戏内容-敌人
// @Produce json
// @Param id path int true "敌人ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/enemies/{id} [get]
func (h *AdminHandler) GetEnemyDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的敌人ID")
		return
	}
	result, err := h.adminService.GetEnemyDetail(c, id)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// CreateEnemy 创建敌人
// @Summary 创建敌人
// @Tags 管理员-游戏内容-敌人
// @Accept json
// @Produce json
// @Param request body request.AdminCreateEnemyReq true "敌人信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/enemies [post]
func (h *AdminHandler) CreateEnemy(c *gin.Context) {
	var req request.AdminCreateEnemyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.CreateEnemy(c, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "敌人创建成功", nil)
}

// UpdateEnemy 修改敌人
// @Summary 修改敌人
// @Tags 管理员-游戏内容-敌人
// @Accept json
// @Produce json
// @Param id path int true "敌人ID"
// @Param request body request.AdminUpdateEnemyReq true "敌人信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/enemies/{id} [put]
func (h *AdminHandler) UpdateEnemy(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的敌人ID")
		return
	}
	var req request.AdminUpdateEnemyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdateEnemy(c, id, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "敌人更新成功", nil)
}

// ==================== 游戏内容管理 - Tool ====================

// GetToolList 道具列表
// @Summary 道具列表
// @Tags 管理员-游戏内容-道具
// @Produce json
// @Param page query int true "页码"
// @Param page_size query int true "每页数量"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/tools/list [get]
func (h *AdminHandler) GetToolList(c *gin.Context) {
	var req request.AdminPaginateReq
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	result, err := h.adminService.GetToolList(c, req.Page, req.PageSize)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// GetToolDetail 道具详情
// @Summary 道具详情
// @Tags 管理员-游戏内容-道具
// @Produce json
// @Param id path int true "道具ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/tools/{id} [get]
func (h *AdminHandler) GetToolDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的道具ID")
		return
	}
	result, err := h.adminService.GetToolDetail(c, id)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// CreateTool 创建道具
// @Summary 创建道具
// @Tags 管理员-游戏内容-道具
// @Accept json
// @Produce json
// @Param request body request.AdminCreateToolReq true "道具信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/tools [post]
func (h *AdminHandler) CreateTool(c *gin.Context) {
	var req request.AdminCreateToolReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.CreateTool(c, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "道具创建成功", nil)
}

// UpdateTool 修改道具
// @Summary 修改道具
// @Tags 管理员-游戏内容-道具
// @Accept json
// @Produce json
// @Param id path int true "道具ID"
// @Param request body request.AdminUpdateToolReq true "道具信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/tools/{id} [put]
func (h *AdminHandler) UpdateTool(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的道具ID")
		return
	}
	var req request.AdminUpdateToolReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdateTool(c, id, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "道具更新成功", nil)
}

// ==================== 游戏内容管理 - Skill ====================

// GetSkillList 技能列表
// @Summary 技能列表
// @Tags 管理员-游戏内容-技能
// @Produce json
// @Param page query int true "页码"
// @Param page_size query int true "每页数量"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/skills/list [get]
func (h *AdminHandler) GetSkillList(c *gin.Context) {
	var req request.AdminPaginateReq
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	result, err := h.adminService.GetSkillList(c, req.Page, req.PageSize)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// GetSkillDetail 技能详情
// @Summary 技能详情
// @Tags 管理员-游戏内容-技能
// @Produce json
// @Param id path int true "技能ID"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/skills/{id} [get]
func (h *AdminHandler) GetSkillDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的技能ID")
		return
	}
	result, err := h.adminService.GetSkillDetail(c, id)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, result)
}

// CreateSkill 创建技能
// @Summary 创建技能
// @Tags 管理员-游戏内容-技能
// @Accept json
// @Produce json
// @Param request body request.AdminCreateSkillReq true "技能信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/skills [post]
func (h *AdminHandler) CreateSkill(c *gin.Context) {
	var req request.AdminCreateSkillReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.CreateSkill(c, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "技能创建成功", nil)
}

// UpdateSkill 修改技能
// @Summary 修改技能
// @Tags 管理员-游戏内容-技能
// @Accept json
// @Produce json
// @Param id path int true "技能ID"
// @Param request body request.AdminUpdateSkillReq true "技能信息"
// @Success 200 {object} response.Result
// @Router /api/v3/admin/game/skills/{id} [put]
func (h *AdminHandler) UpdateSkill(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.FailInvalidParam(c, "无效的技能ID")
		return
	}
	var req request.AdminUpdateSkillReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	if err := h.adminService.UpdateSkill(c, id, &req); err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OKWithMsg(c, "技能更新成功", nil)
}
