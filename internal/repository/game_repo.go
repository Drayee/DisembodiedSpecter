package repository

import (
	"DisembodiedSpecter/internal/domain"
	"context"

	"gorm.io/gorm"
)

// GameRepo 游戏内容仓储接口
type GameRepo interface {
	// Character 角色
	GetCharacterByID(ctx context.Context, id int) (*domain.Character, error)
	GetAllCharacters(ctx context.Context, page, pageSize int) ([]*domain.Character, int64, error)
	UpsertCharacter(ctx context.Context, c *domain.Character) error
	GetAllCharacterNumber(ctx context.Context) (int, error)

	// Enemy 敌人
	GetEnemyByID(ctx context.Context, id int) (*domain.Enemy, error)
	GetAllEnemies(ctx context.Context, page, pageSize int) ([]*domain.Enemy, int64, error)
	UpsertEnemy(ctx context.Context, e *domain.Enemy) error
	GetAllEnemyNumber(ctx context.Context) (int, error)

	// Tool 道具
	GetToolByID(ctx context.Context, id int) (*domain.Tool, error)
	GetAllTools(ctx context.Context, page, pageSize int) ([]*domain.Tool, int64, error)
	UpsertTool(ctx context.Context, t *domain.Tool) error

	// Skill 技能
	GetSkillByID(ctx context.Context, id int) (*domain.Skill, error)
	GetAllSkills(ctx context.Context, page, pageSize int) ([]*domain.Skill, int64, error)
	UpsertSkill(ctx context.Context, s *domain.Skill) error
	GetAllSkillNumber(ctx context.Context) (int, error)
}

func NewGormGameRepo(db *gorm.DB) GameRepo {
	return &gormGameRepo{db: db}
}

type gormGameRepo struct {
	db *gorm.DB
}

// ==================== Character ====================

func (g *gormGameRepo) GetCharacterByID(ctx context.Context, id int) (*domain.Character, error) {
	var c domain.Character
	if err := g.db.WithContext(ctx).Where("id = ?", id).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (g *gormGameRepo) GetAllCharacters(ctx context.Context, page, pageSize int) ([]*domain.Character, int64, error) {
	var list []*domain.Character
	var total int64
	g.db.WithContext(ctx).Model(&domain.Character{}).Count(&total)
	offset := (page - 1) * pageSize
	err := g.db.WithContext(ctx).Order("id DESC").Offset(offset).Limit(pageSize).Find(&list).Error
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (g *gormGameRepo) UpsertCharacter(ctx context.Context, c *domain.Character) error {
	return g.db.WithContext(ctx).Save(c).Error
}

func (g *gormGameRepo) GetAllCharacterNumber(ctx context.Context) (int, error) {
	var count int64
	err := g.db.WithContext(ctx).Model(&domain.Character{}).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

// ==================== Enemy ====================

func (g *gormGameRepo) GetEnemyByID(ctx context.Context, id int) (*domain.Enemy, error) {
	var e domain.Enemy
	if err := g.db.WithContext(ctx).Where("id = ?", id).First(&e).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (g *gormGameRepo) GetAllEnemies(ctx context.Context, page, pageSize int) ([]*domain.Enemy, int64, error) {
	var list []*domain.Enemy
	var total int64
	g.db.WithContext(ctx).Model(&domain.Enemy{}).Count(&total)
	offset := (page - 1) * pageSize
	err := g.db.WithContext(ctx).Order("id DESC").Offset(offset).Limit(pageSize).Find(&list).Error
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (g *gormGameRepo) UpsertEnemy(ctx context.Context, e *domain.Enemy) error {
	return g.db.WithContext(ctx).Save(e).Error
}

func (g *gormGameRepo) GetAllEnemyNumber(ctx context.Context) (int, error) {
	var total int64
	err := g.db.WithContext(ctx).Model(&domain.Enemy{}).Count(&total).Error
	if err != nil {
		return 0, err
	}
	return int(total), nil
}

// ==================== Tool ====================

func (g *gormGameRepo) GetToolByID(ctx context.Context, id int) (*domain.Tool, error) {
	var t domain.Tool
	if err := g.db.WithContext(ctx).Where("id = ?", id).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (g *gormGameRepo) GetAllTools(ctx context.Context, page, pageSize int) ([]*domain.Tool, int64, error) {
	var list []*domain.Tool
	var total int64
	g.db.WithContext(ctx).Model(&domain.Tool{}).Count(&total)
	offset := (page - 1) * pageSize
	err := g.db.WithContext(ctx).Order("id DESC").Offset(offset).Limit(pageSize).Find(&list).Error
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (g *gormGameRepo) UpsertTool(ctx context.Context, t *domain.Tool) error {
	return g.db.WithContext(ctx).Save(t).Error
}

// ==================== Skill ====================

func (g *gormGameRepo) GetSkillByID(ctx context.Context, id int) (*domain.Skill, error) {
	var s domain.Skill
	if err := g.db.WithContext(ctx).Where("id = ?", id).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (g *gormGameRepo) GetAllSkills(ctx context.Context, page, pageSize int) ([]*domain.Skill, int64, error) {
	var list []*domain.Skill
	var total int64
	g.db.WithContext(ctx).Model(&domain.Skill{}).Count(&total)
	offset := (page - 1) * pageSize
	err := g.db.WithContext(ctx).Order("id DESC").Offset(offset).Limit(pageSize).Find(&list).Error
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (g *gormGameRepo) UpsertSkill(ctx context.Context, s *domain.Skill) error {
	return g.db.WithContext(ctx).Save(s).Error
}

func (g *gormGameRepo) GetAllSkillNumber(ctx context.Context) (int, error) {
	var total int64
	err := g.db.WithContext(ctx).Model(&domain.Skill{}).Count(&total).Error
	if err != nil {
		return 0, err
	}
	return int(total), nil
}
