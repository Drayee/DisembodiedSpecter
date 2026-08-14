package service

import (
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/dto/request"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/repository"
	"DisembodiedSpecter/internal/utils"
	"context"
	"fmt"
)

type AdminUseCase struct {
	userRepo            repository.UserRepo
	playerRepo          repository.PlayerRepo
	emailRepo           repository.EmailRepo
	playerDataManager   *utils.PlayerDataManager
	gameRepo            repository.GameRepo
	gameContentManager  *utils.GameContentManager
}

func NewAdminUseCase(
	userRepo repository.UserRepo,
	playerRepo repository.PlayerRepo,
	emailRepo repository.EmailRepo,
	pdm *utils.PlayerDataManager,
	gameRepo repository.GameRepo,
	gcm *utils.GameContentManager,
) *AdminUseCase {
	return &AdminUseCase{
		userRepo:           userRepo,
		playerRepo:         playerRepo,
		emailRepo:          emailRepo,
		playerDataManager:  pdm,
		gameRepo:           gameRepo,
		gameContentManager: gcm,
	}
}

// ==================== 用户管理 ====================

func (a *AdminUseCase) GetUserList(ctx context.Context, page, pageSize int) (*response.AdminUserListResp, error) {
	users, total, err := a.userRepo.GetAll(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}

	list := make([]response.AdminUserItem, 0, len(users))
	for _, u := range users {
		list = append(list, response.AdminUserItem{
			ID:        u.ID,
			Name:      u.Name,
			Email:     u.Email,
			Role:      u.Role,
			Status:    u.Status,
			CreatedAt: u.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return &response.AdminUserListResp{
		Total: total,
		List:  list,
	}, nil
}

func (a *AdminUseCase) UpdateUserRole(ctx context.Context, userID int, role string) error {
	return a.userRepo.UpdateRole(ctx, userID, role)
}

func (a *AdminUseCase) DisableUser(ctx context.Context, userID int) error {
	return a.userRepo.UpdateStatus(ctx, userID, domain.UserStatusDisabled)
}

func (a *AdminUseCase) EnableUser(ctx context.Context, userID int) error {
	return a.userRepo.UpdateStatus(ctx, userID, domain.UserStatusActive)
}

// ==================== 玩家管理 ====================

func (a *AdminUseCase) GetPlayerList(ctx context.Context, page, pageSize int) (*response.AdminPlayerListResp, error) {
	players, total, err := a.playerRepo.GetAllPlayers(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}

	list := make([]response.AdminPlayerItem, 0, len(players))
	for _, p := range players {
		list = append(list, response.AdminPlayerItem{
			ID:              p.ID,
			Description:     p.Description,
			Level:           p.Level,
			Exp:             p.Exp,
			IsActive:        p.IsActive,
			LeastActiveType: p.LeastActiveType,
			LeastActiveIP:   p.LeastActiveIP,
			LeastActiveAt:   p.LeastActiveAt.Format("2006-01-02 15:04:05"),
		})
	}

	return &response.AdminPlayerListResp{
		Total: total,
		List:  list,
	}, nil
}

func (a *AdminUseCase) GetPlayerDetail(ctx context.Context, playerID int) (*domain.Player, error) {
	return a.playerRepo.GetPlayerByID(ctx, playerID)
}

func (a *AdminUseCase) BanPlayer(ctx context.Context, playerID int) error {
	// 更新数据库
	if err := a.playerRepo.UpdatePlayerActive(ctx, playerID, false); err != nil {
		return err
	}
	// 同步到 Redis 缓存
	_ = a.playerDataManager.SetActive(ctx, playerID, false)
	return nil
}

func (a *AdminUseCase) UnbanPlayer(ctx context.Context, playerID int) error {
	if err := a.playerRepo.UpdatePlayerActive(ctx, playerID, true); err != nil {
		return err
	}
	_ = a.playerDataManager.SetActive(ctx, playerID, true)
	return nil
}

func (a *AdminUseCase) UpdatePlayerLevel(ctx context.Context, playerID int, level int) error {
	_ = a.playerDataManager.SetLevel(ctx, playerID, level)
	return nil
}

func (a *AdminUseCase) UpdatePlayerExp(ctx context.Context, playerID int, exp int) error {
	_ = a.playerDataManager.SetExp(ctx, playerID, exp)
	return nil
}

// ==================== 数据统计 ====================

func (a *AdminUseCase) GetStatsOverview(ctx context.Context) (*response.AdminStatsOverviewResp, error) {
	users, userTotal, _ := a.userRepo.GetAll(ctx, 1, 1)
	_ = users
	_, playerTotal, _ := a.playerRepo.GetAllPlayers(ctx, 1, 1)
	items, _ := a.playerRepo.GetAllItems(ctx)
	emails, _ := a.emailRepo.GetAll(ctx)

	return &response.AdminStatsOverviewResp{
		UserCount:   userTotal,
		PlayerCount: playerTotal,
		ItemCount:   int64(len(items)),
		EmailCount:  int64(len(emails)),
	}, nil
}

func (a *AdminUseCase) GetStatsOnline(ctx context.Context) (*response.AdminStatsOnlineResp, error) {
	_, total, _ := a.playerRepo.GetAllPlayers(ctx, 1, 1)
	// 在线数：实际应从 Redis 或 WebSocket 连接统计
	// 暂时用 IsActive=true 的玩家数作为近似
	return &response.AdminStatsOnlineResp{
		OnlineCount: 0, // TODO: 从 WebSocket 连接管理器获取
		TotalCount:  total,
	}, nil
}

func (a *AdminUseCase) GetStatsItems(ctx context.Context) (*response.AdminStatsItemsResp, error) {
	items, err := a.playerRepo.GetAllItems(ctx)
	if err != nil {
		return nil, err
	}

	stats := make([]response.AdminItemStat, 0, len(items))
	for _, item := range items {
		stats = append(stats, response.AdminItemStat{
			ID:          item.ID,
			Name:        item.Name,
			Description: item.Description,
			Type:        item.Type,
		})
	}

	return &response.AdminStatsItemsResp{Items: stats}, nil
}

// ==================== 系统配置 ====================

func (a *AdminUseCase) GetEmailList(ctx context.Context) (*response.AdminEmailListResp, error) {
	emails, err := a.emailRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	return &response.AdminEmailListResp{List: emails}, nil
}

func (a *AdminUseCase) UpdateEmail(ctx context.Context, emailID int, req *request.AdminUpdateEmailReq) error {
	emails, err := a.emailRepo.GetAll(ctx)
	if err != nil {
		return err
	}

	for _, e := range emails {
		if e.ID == emailID {
			if req.Host != "" {
				e.Host = req.Host
			}
			if req.Port != 0 {
				e.Port = req.Port
			}
			if req.User != "" {
				e.User = req.User
			}
			if req.Pass != "" {
				e.Pass = req.Pass
			}
			if req.MaxCount != 0 {
				e.MaxCount = req.MaxCount
			}
			e.Status = req.Status
			return a.emailRepo.Update(ctx, e)
		}
	}

	return fmt.Errorf("邮箱配置不存在: %d", emailID)
}

// ==================== 游戏内容管理 - Character ====================

func (a *AdminUseCase) GetCharacterList(ctx context.Context, page, pageSize int) (*response.AdminCharacterListResp, error) {
	list, total, err := a.gameContentManager.ListCharacters(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	return &response.AdminCharacterListResp{Total: total, List: list}, nil
}

func (a *AdminUseCase) GetCharacterDetail(ctx context.Context, id int) (*domain.Character, error) {
	return a.gameContentManager.GetCharacter(ctx, id)
}

func (a *AdminUseCase) CreateCharacter(ctx context.Context, req *request.AdminCreateCharacterReq) error {
	c := &domain.Character{
		Name:        req.Name,
		Health:      req.Health,
		Type:        req.Type,
		Description: req.Description,
		OwnerNumber: req.OwnerNumber,
	}
	return a.gameContentManager.CreateCharacter(ctx, c)
}

func (a *AdminUseCase) UpdateCharacter(ctx context.Context, id int, req *request.AdminUpdateCharacterReq) error {
	c := &domain.Character{
		Name:        req.Name,
		Health:      req.Health,
		Type:        req.Type,
		Description: req.Description,
		OwnerNumber: req.OwnerNumber,
	}
	return a.gameContentManager.UpdateCharacter(ctx, id, c)
}

// ==================== 游戏内容管理 - Enemy ====================

func (a *AdminUseCase) GetEnemyList(ctx context.Context, page, pageSize int) (*response.AdminEnemyListResp, error) {
	list, total, err := a.gameContentManager.ListEnemies(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	return &response.AdminEnemyListResp{Total: total, List: list}, nil
}

func (a *AdminUseCase) GetEnemyDetail(ctx context.Context, id int) (*domain.Enemy, error) {
	return a.gameContentManager.GetEnemy(ctx, id)
}

func (a *AdminUseCase) CreateEnemy(ctx context.Context, req *request.AdminCreateEnemyReq) error {
	e := &domain.Enemy{
		Name:        req.Name,
		Health:      req.Health,
		Type:        req.Type,
		Description: req.Description,
	}
	return a.gameContentManager.CreateEnemy(ctx, e)
}

func (a *AdminUseCase) UpdateEnemy(ctx context.Context, id int, req *request.AdminUpdateEnemyReq) error {
	e := &domain.Enemy{
		Name:        req.Name,
		Health:      req.Health,
		Type:        req.Type,
		Description: req.Description,
	}
	return a.gameContentManager.UpdateEnemy(ctx, id, e)
}

// ==================== 游戏内容管理 - Tool ====================

func (a *AdminUseCase) GetToolList(ctx context.Context, page, pageSize int) (*response.AdminToolListResp, error) {
	list, total, err := a.gameContentManager.ListTools(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	return &response.AdminToolListResp{Total: total, List: list}, nil
}

func (a *AdminUseCase) GetToolDetail(ctx context.Context, id int) (*domain.Tool, error) {
	return a.gameContentManager.GetTool(ctx, id)
}

func (a *AdminUseCase) CreateTool(ctx context.Context, req *request.AdminCreateToolReq) error {
	t := &domain.Tool{
		Name:        req.Name,
		Description: req.Description,
	}
	return a.gameContentManager.CreateTool(ctx, t)
}

func (a *AdminUseCase) UpdateTool(ctx context.Context, id int, req *request.AdminUpdateToolReq) error {
	t := &domain.Tool{
		Name:        req.Name,
		Description: req.Description,
	}
	return a.gameContentManager.UpdateTool(ctx, id, t)
}

// ==================== 游戏内容管理 - Skill ====================

func (a *AdminUseCase) GetSkillList(ctx context.Context, page, pageSize int) (*response.AdminSkillListResp, error) {
	list, total, err := a.gameContentManager.ListSkills(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	return &response.AdminSkillListResp{Total: total, List: list}, nil
}

func (a *AdminUseCase) GetSkillDetail(ctx context.Context, id int) (*domain.Skill, error) {
	return a.gameContentManager.GetSkill(ctx, id)
}

func (a *AdminUseCase) CreateSkill(ctx context.Context, req *request.AdminCreateSkillReq) error {
	s := &domain.Skill{
		CharacterID: req.CharacterID,
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
	}
	return a.gameContentManager.CreateSkill(ctx, s)
}

func (a *AdminUseCase) UpdateSkill(ctx context.Context, id int, req *request.AdminUpdateSkillReq) error {
	s := &domain.Skill{
		CharacterID: req.CharacterID,
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
	}
	return a.gameContentManager.UpdateSkill(ctx, id, s)
}
