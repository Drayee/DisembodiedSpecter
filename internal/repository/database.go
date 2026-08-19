package repository

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/domain"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewGORM(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable TimeZone=Asia/Shanghai",
		cfg.Host,
		cfg.Username,
		cfg.Password,
		cfg.DBName,
		cfg.Port,
	)

	gormDB, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// 获取底层的通用数据库对象 sql.DB，以便配置连接池
	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, err
	}

	// 复用上面讲过的标准连接池配置
	sqlDB.SetMaxIdleConns(20)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Minute * 15)

	return gormDB, nil
}

func ProvideDB(cfg *config.Config) (*gorm.DB, func(), error) {
	// 1. 初始化
	database, err := NewGORM(&cfg.Database)
	if err != nil {
		return nil, nil, err
	}

	// 2. 自动迁移：将全部 Go domain 模型同步到 SQL（建表 + 索引）
	//    已存在的表只会做增量变更（新增列/索引），不会清空数据
	if err := database.AutoMigrate(
		&domain.User{},
		&domain.Player{},
		&domain.Item{},
		&domain.PlayerItem{},
		&domain.Email{},
		&domain.Character{},
		&domain.Enemy{},
		&domain.Tool{},
		&domain.Skill{},
	); err != nil {
		sqlDB, _ := database.DB()
		if sqlDB != nil {
			_ = sqlDB.Close()
		}
		return nil, nil, fmt.Errorf("数据库自动迁移失败: %w", err)
	}

	// 3. 定义清理逻辑
	cleanup := func() {
		sqlDB, _ := database.DB()
		if sqlDB != nil {
			err := sqlDB.Close()
			if err != nil {
				return
			}
		}
	}

	// 返回 (实例, 清理函数, error)
	return database, cleanup, nil
}
