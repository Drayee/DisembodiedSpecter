package utils

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/repository"
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

// 本文件是 buff 内容表「缓存 + 同步」链路的集成测试：需要本地 Redis 与 Postgres
// （读仓库根的 config.yaml）。基础设施不可用时自动 Skip，因此 go test ./... 在任何环境都能跑。
//
// 它覆盖最容易静默出错的几处：
//   - domain.Buff 的 gorm 标签能否建出表、列名是否对得上；
//   - saveBuffToCache ↔ parseBuff 的字段名契约（走真实 Redis HSET/HGETALL 往返）；
//   - type / loss_way 字符串枚举能否原样读写；
//   - UpdateBuff 是否保留 created_at；
//   - SyncBuffToDB 是否把缓存内容正确落库；
//   - 缓存未命中时是否回落 DB 并回写缓存。

// buffTestID 用远离自然内容 ID 的固定值，避免污染现有内容表。
const buffTestID = 900001

// integrationEnv 准备集成测试环境；任一依赖不可用则 Skip。
func integrationEnv(t *testing.T) (*config.Config, *GameContentManager, func(string)) {
	t.Helper()

	// LoadConfig 只从当前工作目录找 config.yaml，而 go test 的 CWD 是包目录，
	// 因此先把工作目录切到仓库根（t.Chdir 会在测试结束时自动还原）。
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Skip("无法定位测试文件路径，跳过集成测试")
	}
	root := filepath.Dir(filepath.Dir(filepath.Dir(file)))
	if _, err := os.Stat(filepath.Join(root, "config.yaml")); err != nil {
		t.Skipf("未找到 config.yaml，跳过集成测试: %v", err)
	}
	t.Chdir(root)

	cfg, err := config.LoadConfig()
	if err != nil {
		t.Skipf("读取配置失败，跳过集成测试: %v", err)
	}

	redisClient, err := ConnectRedis(cfg)
	if err != nil {
		t.Skipf("Redis 不可用，跳过集成测试: %v", err)
	}
	t.Cleanup(func() { redisClient.Close() })

	db, err := repository.NewGORM(&cfg.Database)
	if err != nil {
		t.Skipf("Postgres 不可用，跳过集成测试: %v", err)
	}
	// 建表：既让测试自给自足，也顺带验证 domain.Buff 的 gorm 标签有效
	if err := db.AutoMigrate(&domain.Buff{}); err != nil {
		t.Fatalf("buff 建表失败（检查 domain.Buff 的 gorm 标签）: %v", err)
	}

	manager := NewGameContentManager(redisClient, repository.NewGormGameRepo(db))
	cleanup := func(cacheKey string) {
		_ = redisClient.Do(context.Background(), redisClient.B().Del().Key(cacheKey).Build()).Error()
		db.Exec("DELETE FROM buffs WHERE id = ?", buffTestID)
	}
	return cfg, manager, cleanup
}

func TestBuffCacheAndSyncRoundTrip(t *testing.T) {
	_, manager, cleanup := integrationEnv(t)
	ctx := context.Background()
	key := manager.buffKey(buffTestID)
	t.Cleanup(func() { cleanup(key) })

	// RFC3339 只精确到秒，因此这里对齐到秒再比较
	now := time.Now().Truncate(time.Second)
	original := &domain.Buff{
		ID:              buffTestID,
		Name:            "集成测试-雷印",
		Type:            domain.BuffTypeListener,
		LossWay:         domain.LossByAction,
		DefaultDuration: 3,
		Description:     "round trip",
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	if err := manager.saveBuffToCache(ctx, original); err != nil {
		t.Fatalf("写入缓存失败: %v", err)
	}

	// 缓存命中读取：save 与 parse 的字段名必须一致，否则这里读到的是零值
	got, err := manager.GetBuff(ctx, buffTestID)
	if err != nil {
		t.Fatalf("读取 buff 失败: %v", err)
	}
	if got.ID != original.ID || got.Name != original.Name || got.Description != original.Description {
		t.Fatalf("字符串/整型字段往返失败: %+v", got)
	}
	if got.Type != domain.BuffTypeListener || got.LossWay != domain.LossByAction {
		t.Fatalf("枚举字段往返失败: type=%q loss_way=%q", got.Type, got.LossWay)
	}
	if got.DefaultDuration != 3 {
		t.Fatalf("default_duration 往返失败: %d", got.DefaultDuration)
	}
	if !got.CreatedAt.Equal(now) || !got.UpdatedAt.Equal(now) {
		t.Fatalf("时间字段往返失败: created=%v updated=%v want %v", got.CreatedAt, got.UpdatedAt, now)
	}

	// 更新：内容生效、created_at 必须保留
	updated := &domain.Buff{
		Name:        "集成测试-改名",
		Type:        domain.BuffTypeTag,
		LossWay:     domain.LossByNone,
		Description: "updated",
	}
	if err := manager.UpdateBuff(ctx, buffTestID, updated); err != nil {
		t.Fatalf("更新 buff 失败: %v", err)
	}
	got, err = manager.GetBuff(ctx, buffTestID)
	if err != nil {
		t.Fatalf("更新后读取失败: %v", err)
	}
	if got.Name != "集成测试-改名" || got.Type != domain.BuffTypeTag || got.LossWay != domain.LossByNone {
		t.Fatalf("更新未生效: %+v", got)
	}
	if !got.CreatedAt.Equal(now) {
		t.Fatalf("更新后 created_at 应保留 %v，实际 %v", now, got.CreatedAt)
	}

	// 列表：应能扫到这条
	list, total, err := manager.ListBuffs(ctx, 1, 500)
	if err != nil {
		t.Fatalf("列表失败: %v", err)
	}
	found := false
	for _, b := range list {
		if b.ID == buffTestID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("列表中未找到测试 buff（total=%d）", total)
	}

	// 同步到 DB：列名与枚举字符串必须能原样落库
	if err := manager.SyncBuffToDB(ctx, buffTestID); err != nil {
		t.Fatalf("同步到 DB 失败: %v", err)
	}
	fromDB, err := manager.gameRepo.GetBuffByID(ctx, buffTestID)
	if err != nil {
		t.Fatalf("从 DB 读取失败: %v", err)
	}
	if fromDB.Name != "集成测试-改名" || fromDB.Type != domain.BuffTypeTag || fromDB.LossWay != domain.LossByNone {
		t.Fatalf("落库内容与缓存不一致: %+v", fromDB)
	}
	if fromDB.Description != "updated" {
		t.Fatalf("description 落库失败: %q", fromDB.Description)
	}
}

// TestBuffCacheMissFallsBackToDB 缓存未命中时必须回落 DB 并把结果写回缓存。
func TestBuffCacheMissFallsBackToDB(t *testing.T) {
	_, manager, cleanup := integrationEnv(t)
	ctx := context.Background()
	key := manager.buffKey(buffTestID)
	t.Cleanup(func() { cleanup(key) })

	// 只写 DB，不写缓存
	if err := manager.gameRepo.UpsertBuff(ctx, &domain.Buff{
		ID: buffTestID, Name: "仅DB", Type: domain.BuffTypeValueChange, LossWay: domain.LossByTime,
	}); err != nil {
		t.Fatalf("写入 DB 失败: %v", err)
	}
	_ = manager.redis.Do(ctx, manager.redis.B().Del().Key(key).Build()).Error()

	got, err := manager.GetBuff(ctx, buffTestID)
	if err != nil {
		t.Fatalf("缓存未命中时应回落 DB: %v", err)
	}
	if got.Name != "仅DB" || got.Type != domain.BuffTypeValueChange || got.LossWay != domain.LossByTime {
		t.Fatalf("DB 回落内容错误: %+v", got)
	}

	exists, err := manager.exists(ctx, key)
	if err != nil {
		t.Fatalf("检查缓存键失败: %v", err)
	}
	if !exists {
		t.Fatal("回落 DB 后应把结果写回缓存")
	}
}
