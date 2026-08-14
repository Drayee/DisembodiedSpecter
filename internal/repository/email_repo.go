package repository

import (
	"DisembodiedSpecter/internal/domain"
	"context"

	"gorm.io/gorm"
)

// EmailRepo 接口保持不变
type EmailRepo interface {
	Create(ctx context.Context, email *domain.Email) error
	Update(ctx context.Context, email *domain.Email) error
	Delete(ctx context.Context, email *domain.Email) error
	GetAll(ctx context.Context) ([]*domain.Email, error)
}

type gormEmailRepo struct {
	db *gorm.DB
}

func NewEmailRepo(db *gorm.DB) EmailRepo {
	return &gormEmailRepo{db: db}
}

func (e *gormEmailRepo) Create(ctx context.Context, email *domain.Email) error {
	return e.db.WithContext(ctx).Create(email).Error
}

func (e *gormEmailRepo) Update(ctx context.Context, email *domain.Email) error {
	return e.db.WithContext(ctx).Save(email).Error
}

func (e *gormEmailRepo) Delete(ctx context.Context, email *domain.Email) error {
	return e.db.WithContext(ctx).Delete(email).Error
}

func (e *gormEmailRepo) GetAll(ctx context.Context) ([]*domain.Email, error) {
	var emails []*domain.Email
	if err := e.db.WithContext(ctx).Find(&emails).Error; err != nil {
		return nil, err
	}
	return emails, nil
}
