package main

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/utils"
	"context"
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 2. 连接 PostgreSQL（先连默认库，创建目标库）
	adminDSN := fmt.Sprintf("host=%s user=%s password=%s dbname=postgres port=%d sslmode=disable TimeZone=Asia/Shanghai",
		cfg.Database.Host, cfg.Database.Username, cfg.Database.Password, cfg.Database.Port)
	adminDB, err := gorm.Open(postgres.Open(adminDSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("连接 PostgreSQL 失败: %v", err)
	}
	sqlDB, _ := adminDB.DB()
	defer sqlDB.Close()

	// 创建数据库（如果不存在）
	var exists bool
	adminDB.Raw("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ?)", cfg.Database.DBName).Scan(&exists)
	if !exists {
		adminDB.Exec(fmt.Sprintf("CREATE DATABASE %s", cfg.Database.DBName))
		log.Printf("数据库 %s 已创建", cfg.Database.DBName)
	} else {
		log.Printf("数据库 %s 已存在", cfg.Database.DBName)
	}
	sqlDB.Close()

	// 3. 连接目标数据库
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable TimeZone=Asia/Shanghai",
		cfg.Database.Host, cfg.Database.Username, cfg.Database.Password, cfg.Database.DBName, cfg.Database.Port)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("连接目标数据库失败: %v", err)
	}
	sqlDB2, _ := db.DB()
	defer sqlDB2.Close()

	// 4. 删除旧表后自动迁移（确保列名变更生效）
	db.Migrator().DropTable("player_items", "items", "players", "users", "emails", "characters", "enemies", "tools", "skills")
	if err := db.AutoMigrate(&domain.User{}, &domain.Player{}, &domain.Item{}, &domain.PlayerItem{}, &domain.Email{}, &domain.Character{}, &domain.Enemy{}, &domain.Tool{}, &domain.Skill{}); err != nil {
		log.Fatalf("自动迁移失败: %v", err)
	}
	log.Println("表结构迁移完成")

	// 6. 插入 mock 数据

	// 6.1 用户（密码: test123456）
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("test123456"), 14)
	user := domain.User{
		Name:     "testuser",
		Password: string(hashedPassword),
		Email:    "test@example.com",
		Role:     domain.UserRoleAdmin,
		Status:   domain.UserStatusActive,
	}
	db.Create(&user)
	log.Printf("用户已创建: id=%d, name=%s, role=%s", user.ID, user.Name, user.Role)

	// 6.2 玩家（user.ID == player.ID，因为 GetData 用 userID 当 playerID）
	player := domain.Player{
		ID:              user.ID,
		Description:     "测试玩家",
		Level:           10,
		Exp:             5000,
		Location:        domain.Location{X: 100, Y: 200, Map: "新手村"},
		IsActive:        true,
		LeastActiveType: "web",
		LeastActiveIP:   "127.0.0.1",
		LeastActiveAt:   time.Now(),
	}
	db.Create(&player)
	log.Printf("玩家已创建: id=%d, level=%d", player.ID, player.Level)

	// 6.3 道具定义
	items := []domain.Item{
		{Name: "铁剑", Description: "一把普通的铁剑", Type: "weapon", CreatedAt: time.Now()},
		{Name: "木盾", Description: "一面简易木盾", Type: "armor", CreatedAt: time.Now()},
		{Name: "生命药水", Description: "恢复100HP", Type: "consumable", CreatedAt: time.Now()},
	}
	for i := range items {
		db.Create(&items[i])
	}
	log.Printf("道具已创建: %d 个", len(items))

	// 6.4 玩家道具
	playerItems := []domain.PlayerItem{
		{PlayerID: player.ID, ItemID: items[0].ID, Num: 1, Attribute: map[string]string{"attack": "15"}, CreatedAt: time.Now()},
		{PlayerID: player.ID, ItemID: items[1].ID, Num: 1, Attribute: map[string]string{"defense": "10"}, CreatedAt: time.Now()},
		{PlayerID: player.ID, ItemID: items[2].ID, Num: 5, Attribute: map[string]string{"heal": "100"}, CreatedAt: time.Now()},
	}
	for i := range playerItems {
		db.Create(&playerItems[i])
	}
	log.Printf("玩家道具已创建: %d 个", len(playerItems))

	// 6.5 邮箱配置（mock，状态为可用）
	email := domain.Email{
		Host:      "smtp.example.com",
		Port:      587,
		User:      "noreply@example.com",
		Pass:      "fakepassword",
		MaxCount:  1000,
		Status:    1,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	db.Create(&email)
	log.Printf("邮箱配置已创建: id=%d, host=%s", email.ID, email.Host)

	// 7. 清空 Redis DB
	redisClient, err := utils.ConnectRedis(cfg)
	if err != nil {
		log.Fatalf("连接 Redis 失败: %v", err)
	}
	defer redisClient.Close()

	flushCmd := redisClient.B().Flushdb().Build()
	if err := redisClient.Do(context.Background(), flushCmd).Error(); err != nil {
		log.Printf("清空 Redis 失败: %v", err)
	} else {
		log.Println("Redis DB 已清空")
	}

	// 8. 生成测试用 JWT token（双令牌）
	tokenManager := utils.NewTokenManager(redisClient, cfg)
	accessToken, refreshToken, err := tokenManager.GenerateTokens(context.Background(), user.ID, user.Name, user.Role)
	if err != nil {
		log.Fatalf("生成 token 失败: %v", err)
	}

	fmt.Println("\n========================================")
	fmt.Println("        Mock 数据初始化完成")
	fmt.Println("========================================")
	fmt.Printf("数据库: %s\n", cfg.Database.DBName)
	fmt.Printf("测试账号: testuser / test123456\n")
	fmt.Printf("Access Token:\n%s\n", accessToken)
	fmt.Printf("Refresh Token:\n%s\n", refreshToken)
	fmt.Println("========================================")
	fmt.Println("可用接口:")
	fmt.Println("  POST /api/v1/login      (白名单)")
	fmt.Println("  POST /api/v1/register   (白名单)")
	fmt.Println("  POST /api/v1/refresh    (白名单)")
	fmt.Println("  POST /api/v1/logout     (白名单)")
	fmt.Println("  GET  /api/v2/ws-code    (需认证)")
	fmt.Println("  GET  /api/v2/data       (需认证)")
	fmt.Println("========================================")
}
