package utils

import (
	"DisembodiedSpecter/internal/config"
	"context"
	"log"
	"sync"
	"time"
)

// SyncScheduler 定时调度器，负责将 Redis 数据周期性同步到 SQL
type SyncScheduler struct {
	cfg                *config.Config
	playerDataMgr      *PlayerDataManager
	gameContentManager *GameContentManager
	ticker             *time.Ticker
	stopCh             chan struct{}
	wg                 sync.WaitGroup
	running            bool
	mu                 sync.Mutex
}

func NewSyncScheduler(cfg *config.Config, playerDataMgr *PlayerDataManager, gameContentManager *GameContentManager) *SyncScheduler {
	return &SyncScheduler{
		cfg:                cfg,
		playerDataMgr:      playerDataMgr,
		gameContentManager: gameContentManager,
		stopCh:             make(chan struct{}),
	}
}

// Start 启动定时调度器（非阻塞）
func (s *SyncScheduler) Start() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		log.Println("[SyncScheduler] 调度器已在运行，跳过启动")
		return
	}

	if !s.cfg.Sync.Enabled {
		log.Println("[SyncScheduler] 同步功能已禁用，跳过启动")
		return
	}

	interval := s.cfg.Sync.PlayerDataInterval
	if interval <= 0 {
		interval = 300 // 默认5分钟
	}

	s.ticker = time.NewTicker(time.Duration(interval) * time.Second)
	s.running = true
	s.wg.Add(1)

	go s.runLoop()

	log.Printf("[SyncScheduler] 启动成功，玩家数据同步间隔: %d 秒", interval)
}

// Stop 优雅停止调度器，会等待当前正在执行的同步任务完成
func (s *SyncScheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	close(s.stopCh)
	if s.ticker != nil {
		s.ticker.Stop()
	}
	s.wg.Wait()
	s.running = false

	log.Println("[SyncScheduler] 已停止")
}

// runLoop 主循环
func (s *SyncScheduler) runLoop() {
	defer s.wg.Done()

	// 启动时先执行一次立即同步
	s.doSync()

	for {
		select {
		case <-s.ticker.C:
			s.doSync()
		case <-s.stopCh:
			return
		}
	}
}

// doSync 执行一次全量同步
func (s *SyncScheduler) doSync() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	start := time.Now()
	log.Println("[SyncScheduler] ========== 开始同步数据 ==========")

	// 1. 玩家数据同步
	playerSuccess, playerFail, err := s.playerDataMgr.SyncAllPlayerDataToDB(ctx)
	if err != nil {
		log.Printf("[SyncScheduler] 玩家数据同步失败: %v", err)
	} else {
		log.Printf("[SyncScheduler] 玩家数据 | 成功: %d | 失败: %d", playerSuccess, playerFail)
	}

	// 2. 游戏内容同步
	gameResult, err := s.gameContentManager.SyncAllToDB(ctx)
	if err != nil {
		log.Printf("[SyncScheduler] 游戏内容同步失败: %v", err)
	} else {
		log.Printf("[SyncScheduler] 游戏内容 | 角色: 成功 %d 失败 %d | 敌人: 成功 %d 失败 %d | 道具: 成功 %d 失败 %d | 技能: 成功 %d 失败 %d",
			gameResult.CharacterSuccess, gameResult.CharacterFail,
			gameResult.EnemySuccess, gameResult.EnemyFail,
			gameResult.ToolSuccess, gameResult.ToolFail,
			gameResult.SkillSuccess, gameResult.SkillFail)
	}

	duration := time.Since(start)
	log.Printf("[SyncScheduler] 同步完成 | 耗时: %v", duration)
	log.Println("[SyncScheduler] ========================================")
}

// TriggerManualSync 手动触发一次立即同步（可用于调试或紧急情况）
func (s *SyncScheduler) TriggerManualSync() (successCount int, failCount int, err error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	log.Println("[SyncScheduler] 手动触发同步...")
	successCount, failCount, err = s.playerDataMgr.SyncAllPlayerDataToDB(ctx)
	if err != nil {
		return
	}
	// 同时同步游戏内容
	_, gameErr := s.gameContentManager.SyncAllToDB(ctx)
	if gameErr != nil {
		log.Printf("[SyncScheduler] 游戏内容手动同步失败: %v", gameErr)
	}
	return
}
