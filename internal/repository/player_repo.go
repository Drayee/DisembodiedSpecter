package repository

import (
	"DisembodiedSpecter/internal/domain"
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerRepo interface {
	CreatePlayer(ctx context.Context, player *domain.Player) error
	GetPlayerByID(ctx context.Context, id int) (*domain.Player, error)
	GetAllPlayers(ctx context.Context, page int, pageSize int) ([]*domain.Player, int64, error)
	UpdatePlayerActive(ctx context.Context, playerID int, isActive bool) error
	UpdatePlayer(ctx context.Context, player *domain.Player) error
	DeleteAllPlayerItems(ctx context.Context, playerID int) error

	GetItemByID(ctx context.Context, id int) (*domain.Item, error)
	GetAllItems(ctx context.Context) ([]*domain.Item, error)

	GetPlayerItems(ctx context.Context, playerID int) ([]*domain.PlayerItem, error)
	GetPlayerItem(ctx context.Context, playerID int, itemID int) (*domain.PlayerItem, error)
	CreatePlayerItem(ctx context.Context, playerItem *domain.PlayerItem) error
	UpdatePlayerItem(ctx context.Context, playerItem *domain.PlayerItem) error
	DeletePlayerItem(ctx context.Context, playerID int, itemID int) error

	// UserCharacter 用户-角色 多对多归属关系
	GetUserCharacterIDs(ctx context.Context, userID int) ([]int, error)
	GetUserTeamCharacterIDs(ctx context.Context, userID int) ([]int, error)
	GetCharactersByUserID(ctx context.Context, userID int) ([]*domain.Character, error)
	AddUserCharacter(ctx context.Context, userID int, characterID int) error
	RemoveUserCharacter(ctx context.Context, userID int, characterID int) error
	DeleteUserCharacterByCharacterID(ctx context.Context, characterID int) error
	SetUserCharacterTeam(ctx context.Context, userID int, characterID int, inTeam bool) error
	SetUserCharacterLevel(ctx context.Context, userID int, characterID int, level int) error
	GetUserCharacterLevel(ctx context.Context, userID int, characterID int) (int, error)
}

func NewGormPlayerRepo(db *gorm.DB) PlayerRepo {
	return &gormPlayerRepo{db: db}
}

type gormPlayerRepo struct {
	db *gorm.DB
}

func (g *gormPlayerRepo) CreatePlayer(ctx context.Context, player *domain.Player) error {
	return g.db.WithContext(ctx).Create(player).Error
}

func (g *gormPlayerRepo) GetPlayerByID(ctx context.Context, id int) (*domain.Player, error) {
	var player domain.Player
	err := g.db.WithContext(ctx).Where("id = ?", id).First(&player).Error
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (g *gormPlayerRepo) GetAllPlayers(ctx context.Context, page int, pageSize int) ([]*domain.Player, int64, error) {
	var players []*domain.Player
	var total int64

	g.db.WithContext(ctx).Model(&domain.Player{}).Count(&total)

	offset := (page - 1) * pageSize
	err := g.db.WithContext(ctx).
		Order("id DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&players).Error
	if err != nil {
		return nil, 0, err
	}
	return players, total, nil
}

func (g *gormPlayerRepo) UpdatePlayerActive(ctx context.Context, playerID int, isActive bool) error {
	return g.db.WithContext(ctx).Model(&domain.Player{}).Where("id = ?", playerID).Update("is_active", isActive).Error
}

func (g *gormPlayerRepo) UpdatePlayer(ctx context.Context, player *domain.Player) error {
	return g.db.WithContext(ctx).Save(player).Error
}

func (g *gormPlayerRepo) DeleteAllPlayerItems(ctx context.Context, playerID int) error {
	return g.db.WithContext(ctx).Where("player_id = ?", playerID).Delete(&domain.PlayerItem{}).Error
}

func (g *gormPlayerRepo) GetItemByID(ctx context.Context, id int) (*domain.Item, error) {
	var item domain.Item
	err := g.db.WithContext(ctx).Where("id = ?", id).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (g *gormPlayerRepo) GetAllItems(ctx context.Context) ([]*domain.Item, error) {
	var items []*domain.Item
	err := g.db.WithContext(ctx).Order("id DESC").Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

func (g *gormPlayerRepo) GetPlayerItems(ctx context.Context, playerID int) ([]*domain.PlayerItem, error) {
	var playerItems []*domain.PlayerItem
	err := g.db.WithContext(ctx).Where("player_id = ?", playerID).Find(&playerItems).Error
	if err != nil {
		return nil, err
	}
	return playerItems, nil
}

func (g *gormPlayerRepo) GetPlayerItem(ctx context.Context, playerID int, itemID int) (*domain.PlayerItem, error) {
	var playerItem domain.PlayerItem
	err := g.db.WithContext(ctx).
		Where("player_id = ? AND item_id = ?", playerID, itemID).
		First(&playerItem).Error
	if err != nil {
		return nil, err
	}
	return &playerItem, nil
}

func (g *gormPlayerRepo) CreatePlayerItem(ctx context.Context, playerItem *domain.PlayerItem) error {
	return g.db.WithContext(ctx).Create(playerItem).Error
}

func (g *gormPlayerRepo) UpdatePlayerItem(ctx context.Context, playerItem *domain.PlayerItem) error {
	return g.db.WithContext(ctx).Save(playerItem).Error
}

func (g *gormPlayerRepo) DeletePlayerItem(ctx context.Context, playerID int, itemID int) error {
	return g.db.WithContext(ctx).Delete(&domain.PlayerItem{}, "player_id = ? AND item_id = ?", playerID, itemID).Error
}

// ==================== UserCharacter（用户-角色 多对多归属） ====================

// GetUserCharacterIDs 查询用户拥有的角色 ID 列表
func (g *gormPlayerRepo) GetUserCharacterIDs(ctx context.Context, userID int) ([]int, error) {
	var ids []int
	err := g.db.WithContext(ctx).Model(&domain.UserCharacter{}).
		Where("user_id = ?", userID).
		Order("character_id ASC").
		Pluck("character_id", &ids).Error
	if err != nil {
		return nil, err
	}
	return ids, nil
}

// GetUserTeamCharacterIDs 查询用户在出战队伍中的角色 ID 列表（is_in_team = true）
func (g *gormPlayerRepo) GetUserTeamCharacterIDs(ctx context.Context, userID int) ([]int, error) {
	var ids []int
	err := g.db.WithContext(ctx).Model(&domain.UserCharacter{}).
		Where("user_id = ? AND is_in_team = ?", userID, true).
		Order("character_id ASC").
		Pluck("character_id", &ids).Error
	if err != nil {
		return nil, err
	}
	return ids, nil
}

// GetCharactersByUserID 查询用户拥有的角色列表
func (g *gormPlayerRepo) GetCharactersByUserID(ctx context.Context, userID int) ([]*domain.Character, error) {
	var list []*domain.Character
	err := g.db.WithContext(ctx).
		Model(&domain.Character{}).
		Joins("JOIN user_characters uc ON uc.character_id = characters.id").
		Where("uc.user_id = ?", userID).
		Order("characters.id ASC").
		Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

// AddUserCharacter 绑定用户与角色（幂等：已存在则忽略）
func (g *gormPlayerRepo) AddUserCharacter(ctx context.Context, userID int, characterID int) error {
	uc := &domain.UserCharacter{UserID: userID, CharacterID: characterID}
	return g.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(uc).Error
}

// RemoveUserCharacter 解除用户与角色的绑定
func (g *gormPlayerRepo) RemoveUserCharacter(ctx context.Context, userID int, characterID int) error {
	return g.db.WithContext(ctx).Where("user_id = ? AND character_id = ?", userID, characterID).
		Delete(&domain.UserCharacter{}).Error
}

// DeleteUserCharacterByCharacterID 删除某个角色的全部归属（角色删除/转移归属时使用）
func (g *gormPlayerRepo) DeleteUserCharacterByCharacterID(ctx context.Context, characterID int) error {
	return g.db.WithContext(ctx).Where("character_id = ?", characterID).
		Delete(&domain.UserCharacter{}).Error
}

// SetUserCharacterTeam 设置角色是否在当前出战队伍中
func (g *gormPlayerRepo) SetUserCharacterTeam(ctx context.Context, userID int, characterID int, inTeam bool) error {
	return g.db.WithContext(ctx).Model(&domain.UserCharacter{}).
		Where("user_id = ? AND character_id = ?", userID, characterID).
		Update("is_in_team", inTeam).Error
}

// SetUserCharacterLevel 设置角色等级（预留）
func (g *gormPlayerRepo) SetUserCharacterLevel(ctx context.Context, userID int, characterID int, level int) error {
	if level < 1 {
		level = 1
	}
	return g.db.WithContext(ctx).Model(&domain.UserCharacter{}).
		Where("user_id = ? AND character_id = ?", userID, characterID).
		Update("level", level).Error
}

// GetUserCharacterLevel 查询角色等级（预留）
func (g *gormPlayerRepo) GetUserCharacterLevel(ctx context.Context, userID int, characterID int) (int, error) {
	var uc domain.UserCharacter
	err := g.db.WithContext(ctx).
		Where("user_id = ? AND character_id = ?", userID, characterID).
		First(&uc).Error
	if err != nil {
		return 0, err
	}
	return uc.Level, nil
}
