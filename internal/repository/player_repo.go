package repository

import (
	"DisembodiedSpecter/internal/domain"
	"context"

	"gorm.io/gorm"
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
