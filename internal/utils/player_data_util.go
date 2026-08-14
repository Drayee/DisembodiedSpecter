package utils

import (
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/repository"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/redis/rueidis"
	"gorm.io/gorm"
)

const playerDataKeyPrefix = "private:player:data:"

type PlayerDataManager struct {
	redis      rueidis.Client
	playerRepo repository.PlayerRepo
}

func NewPlayerDataManager(redis rueidis.Client, playerRepo repository.PlayerRepo) *PlayerDataManager {
	return &PlayerDataManager{
		redis:      redis,
		playerRepo: playerRepo,
	}
}

func (m *PlayerDataManager) hashKey(playerID int) string {
	return fmt.Sprintf("%s%d", playerDataKeyPrefix, playerID)
}

// ==================== 读操作 ====================

func (m *PlayerDataManager) GetPlayerData(ctx context.Context, playerID int) (*response.PlayerDataResp, error) {
	key := m.hashKey(playerID)

	// 尝试从 Redis Hash 读取
	hgetAllCmd := m.redis.B().Hgetall().Key(key).Build()
	fields, err := m.redis.Do(ctx, hgetAllCmd).AsStrMap()
	if err != nil && !rueidis.IsRedisNil(err) {
		return nil, fmt.Errorf("读取缓存失败: %w", err)
	}

	// cache miss：从数据库加载并填充缓存
	if len(fields) == 0 {
		if err := m.loadFromDB(ctx, playerID); err != nil {
			return nil, err
		}
		// 重新读取
		hgetAllCmd = m.redis.B().Hgetall().Key(key).Build()
		fields, err = m.redis.Do(ctx, hgetAllCmd).AsStrMap()
		if err != nil {
			return nil, fmt.Errorf("读取缓存失败: %w", err)
		}
	}

	return m.parsePlayerData(fields), nil
}

func (m *PlayerDataManager) parsePlayerData(fields map[string]string) *response.PlayerDataResp {
	resp := &response.PlayerDataResp{
		Bag: make([]response.Object, 0),
	}

	if v, ok := fields["description"]; ok {
		resp.Description = v
	}
	if v, ok := fields["level"]; ok {
		resp.Level, _ = strconv.Atoi(v)
	}
	if v, ok := fields["exp"]; ok {
		resp.Exp, _ = strconv.Atoi(v)
	}
	if v, ok := fields["location"]; ok {
		_ = json.Unmarshal([]byte(v), &resp.Location)
	}
	if v, ok := fields["is_active"]; ok {
		resp.IsActive = v == "true"
	}
	if v, ok := fields["least_active_type"]; ok {
		resp.LeastActiveType = v
	}
	if v, ok := fields["least_active_ip"]; ok {
		resp.LeastActiveIP = v
	}
	if v, ok := fields["least_active_at"]; ok {
		resp.LeastActiveAt, _ = time.Parse(time.RFC3339, v)
	}

	// 解析背包道具
	for field, val := range fields {
		if !strings.HasPrefix(field, "bag:") {
			continue
		}
		var obj response.Object
		if err := json.Unmarshal([]byte(val), &obj); err == nil {
			resp.Bag = append(resp.Bag, obj)
		}
	}

	return resp
}

// ==================== 内部：从数据库加载到缓存 ====================

func (m *PlayerDataManager) loadFromDB(ctx context.Context, playerID int) error {
	player, err := m.playerRepo.GetPlayerByID(ctx, playerID)
	if err != nil {
		return fmt.Errorf("获取玩家信息失败: %w", err)
	}

	items, err := m.playerRepo.GetPlayerItems(ctx, playerID)
	if err != nil {
		return fmt.Errorf("获取玩家道具失败: %w", err)
	}

	key := m.hashKey(playerID)

	// 序列化 location
	locBytes, _ := json.Marshal(player.Location)

	// 构造 HSET 命令（标量字段）
	hset := m.redis.B().Hset().Key(key).FieldValue().
		FieldValue("description", player.Description).
		FieldValue("level", strconv.Itoa(player.Level)).
		FieldValue("exp", strconv.Itoa(player.Exp)).
		FieldValue("is_active", strconv.FormatBool(player.IsActive)).
		FieldValue("least_active_type", player.LeastActiveType).
		FieldValue("least_active_ip", player.LeastActiveIP).
		FieldValue("least_active_at", player.LeastActiveAt.Format(time.RFC3339)).
		FieldValue("location", string(locBytes))

	// 逐个查询道具名并追加 bag:{itemID} 字段
	for _, item := range items {
		itemInfo, err := m.playerRepo.GetItemByID(ctx, item.ItemID)
		if err != nil {
			continue
		}
		bagEntry := response.Object{
			ID:        itemInfo.ID,
			Name:      itemInfo.Name,
			Num:       item.Num,
			Attribute: item.Attribute,
		}
		bagBytes, _ := json.Marshal(bagEntry)
		hset = hset.FieldValue(fmt.Sprintf("bag:%d", item.ItemID), string(bagBytes))
	}

	cmd := hset.Build()
	if err := m.redis.Do(ctx, cmd).Error(); err != nil {
		return fmt.Errorf("写入缓存失败: %w", err)
	}

	return nil
}

// ensureLoaded 确保缓存已加载，未加载则从数据库填充
func (m *PlayerDataManager) ensureLoaded(ctx context.Context, playerID int) error {
	key := m.hashKey(playerID)
	existsCmd := m.redis.B().Exists().Key(key).Build()
	n, err := m.redis.Do(ctx, existsCmd).AsInt64()
	if err != nil {
		return fmt.Errorf("检查缓存失败: %w", err)
	}
	if n == 0 {
		return m.loadFromDB(ctx, playerID)
	}
	return nil
}

// ==================== 写操作（仅写 Redis，不写 SQL） ====================

func (m *PlayerDataManager) SetDescription(ctx context.Context, playerID int, desc string) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	cmd := m.redis.B().Hset().Key(m.hashKey(playerID)).FieldValue().FieldValue("description", desc).Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *PlayerDataManager) SetLevel(ctx context.Context, playerID int, level int) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	cmd := m.redis.B().Hset().Key(m.hashKey(playerID)).FieldValue().FieldValue("level", strconv.Itoa(level)).Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *PlayerDataManager) SetExp(ctx context.Context, playerID int, exp int) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	cmd := m.redis.B().Hset().Key(m.hashKey(playerID)).FieldValue().FieldValue("exp", strconv.Itoa(exp)).Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *PlayerDataManager) AddExp(ctx context.Context, playerID int, delta int) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	cmd := m.redis.B().Hincrby().Key(m.hashKey(playerID)).Field("exp").Increment(int64(delta)).Build()
	_, err := m.redis.Do(ctx, cmd).AsInt64()
	return err
}

func (m *PlayerDataManager) SetLocation(ctx context.Context, playerID int, loc domain.Location) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	locBytes, _ := json.Marshal(loc)
	cmd := m.redis.B().Hset().Key(m.hashKey(playerID)).FieldValue().FieldValue("location", string(locBytes)).Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *PlayerDataManager) SetActive(ctx context.Context, playerID int, active bool) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	cmd := m.redis.B().Hset().Key(m.hashKey(playerID)).FieldValue().FieldValue("is_active", strconv.FormatBool(active)).Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *PlayerDataManager) SetLeastActive(ctx context.Context, playerID int, activeType string, ip string, at time.Time) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	cmd := m.redis.B().Hset().Key(m.hashKey(playerID)).FieldValue().
		FieldValue("least_active_type", activeType).
		FieldValue("least_active_ip", ip).
		FieldValue("least_active_at", at.Format(time.RFC3339)).Build()
	return m.redis.Do(ctx, cmd).Error()
}

// ==================== 道具操作（仅写 Redis） ====================

func (m *PlayerDataManager) AddItem(ctx context.Context, playerID int, itemID int, num int, attr map[string]string) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	key := m.hashKey(playerID)
	bagField := fmt.Sprintf("bag:%d", itemID)

	// 尝试读取已有道具
	getCmd := m.redis.B().Hget().Key(key).Field(bagField).Build()
	existing, err := m.redis.Do(ctx, getCmd).ToString()
	if err != nil && !rueidis.IsRedisNil(err) {
		return err
	}

	if existing != "" {
		// 已有道具，增加数量
		var obj response.Object
		if err := json.Unmarshal([]byte(existing), &obj); err != nil {
			return fmt.Errorf("反序列化道具失败: %w", err)
		}
		obj.Num += num
		if attr != nil {
			obj.Attribute = attr
		}
		bytes, _ := json.Marshal(obj)
		setCmd := m.redis.B().Hset().Key(key).FieldValue().FieldValue(bagField, string(bytes)).Build()
		return m.redis.Do(ctx, setCmd).Error()
	}

	// 新道具，需要查询道具名
	itemInfo, err := m.playerRepo.GetItemByID(ctx, itemID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("道具不存在: %d", itemID)
		}
		return err
	}
	obj := response.Object{
		ID:        itemInfo.ID,
		Name:      itemInfo.Name,
		Num:       num,
		Attribute: attr,
	}
	bytes, _ := json.Marshal(obj)
	setCmd := m.redis.B().Hset().Key(key).FieldValue().FieldValue(bagField, string(bytes)).Build()
	return m.redis.Do(ctx, setCmd).Error()
}

func (m *PlayerDataManager) RemoveItem(ctx context.Context, playerID int, itemID int, num int) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	key := m.hashKey(playerID)
	bagField := fmt.Sprintf("bag:%d", itemID)

	getCmd := m.redis.B().Hget().Key(key).Field(bagField).Build()
	existing, err := m.redis.Do(ctx, getCmd).ToString()
	if err != nil {
		if rueidis.IsRedisNil(err) {
			return nil // 道具不存在，无需操作
		}
		return err
	}

	var obj response.Object
	if err := json.Unmarshal([]byte(existing), &obj); err != nil {
		return fmt.Errorf("反序列化道具失败: %w", err)
	}

	if obj.Num <= num {
		// 数量不足或刚好，删除该道具
		delCmd := m.redis.B().Hdel().Key(key).Field(bagField).Build()
		return m.redis.Do(ctx, delCmd).Error()
	}

	obj.Num -= num
	bytes, _ := json.Marshal(obj)
	setCmd := m.redis.B().Hset().Key(key).FieldValue().FieldValue(bagField, string(bytes)).Build()
	return m.redis.Do(ctx, setCmd).Error()
}

func (m *PlayerDataManager) SetItemCount(ctx context.Context, playerID int, itemID int, num int) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	key := m.hashKey(playerID)
	bagField := fmt.Sprintf("bag:%d", itemID)

	if num <= 0 {
		delCmd := m.redis.B().Hdel().Key(key).Field(bagField).Build()
		return m.redis.Do(ctx, delCmd).Error()
	}

	// 读取已有道具以保留 name 和 attribute
	getCmd := m.redis.B().Hget().Key(key).Field(bagField).Build()
	existing, err := m.redis.Do(ctx, getCmd).ToString()
	if err != nil && !rueidis.IsRedisNil(err) {
		return err
	}

	var obj response.Object
	if existing != "" {
		if err := json.Unmarshal([]byte(existing), &obj); err != nil {
			return fmt.Errorf("反序列化道具失败: %w", err)
		}
	} else {
		// 道具不在缓存中，查询道具名
		itemInfo, err := m.playerRepo.GetItemByID(ctx, itemID)
		if err != nil {
			return err
		}
		obj = response.Object{
			ID:   itemInfo.ID,
			Name: itemInfo.Name,
		}
	}
	obj.Num = num
	bytes, _ := json.Marshal(obj)
	setCmd := m.redis.B().Hset().Key(key).FieldValue().FieldValue(bagField, string(bytes)).Build()
	return m.redis.Do(ctx, setCmd).Error()
}

func (m *PlayerDataManager) UpdateItemAttribute(ctx context.Context, playerID int, itemID int, attr map[string]string) error {
	if err := m.ensureLoaded(ctx, playerID); err != nil {
		return err
	}
	key := m.hashKey(playerID)
	bagField := fmt.Sprintf("bag:%d", itemID)

	getCmd := m.redis.B().Hget().Key(key).Field(bagField).Build()
	existing, err := m.redis.Do(ctx, getCmd).ToString()
	if err != nil {
		if rueidis.IsRedisNil(err) {
			return fmt.Errorf("道具不存在: %d", itemID)
		}
		return err
	}

	var obj response.Object
	if err := json.Unmarshal([]byte(existing), &obj); err != nil {
		return fmt.Errorf("反序列化道具失败: %w", err)
	}
	obj.Attribute = attr
	bytes, _ := json.Marshal(obj)
	setCmd := m.redis.B().Hset().Key(key).FieldValue().FieldValue(bagField, string(bytes)).Build()
	return m.redis.Do(ctx, setCmd).Error()
}

// ==================== TTL 管理 ====================

// SetExpireOnExit 玩家退出游戏时调用，设置 2 天后过期
func (m *PlayerDataManager) SetExpireOnExit(ctx context.Context, playerID int) error {
	key := m.hashKey(playerID)
	cmd := m.redis.B().Expire().Key(key).Seconds(172800).Build()
	return m.redis.Do(ctx, cmd).Error()
}

// ==================== Redis -> SQL 同步（持久化） ====================

// SyncPlayerDataToDB 将指定玩家的 Redis 数据同步到 SQL 数据库
func (m *PlayerDataManager) SyncPlayerDataToDB(ctx context.Context, playerID int) error {
	key := m.hashKey(playerID)

	// 1. 先检查 Redis 中是否存在该玩家数据
	existsCmd := m.redis.B().Exists().Key(key).Build()
	n, err := m.redis.Do(ctx, existsCmd).AsInt64()
	if err != nil {
		return fmt.Errorf("检查缓存存在性失败: %w", err)
	}
	if n == 0 {
		return nil // 缓存不存在，无需同步
	}

	// 2. 从 Redis 读取所有字段
	hgetAllCmd := m.redis.B().Hgetall().Key(key).Build()
	fields, err := m.redis.Do(ctx, hgetAllCmd).AsStrMap()
	if err != nil {
		return fmt.Errorf("读取Redis玩家数据失败: %w", err)
	}
	if len(fields) == 0 {
		return nil
	}

	// 3. 解析为 PlayerDataResp
	data := m.parsePlayerData(fields)

	// 4. 构造 domain.Player 并更新到 SQL
	player := &domain.Player{
		ID:              playerID,
		Description:     data.Description,
		Level:           data.Level,
		Exp:             data.Exp,
		Location:        data.Location,
		IsActive:        data.IsActive,
		LeastActiveType: data.LeastActiveType,
		LeastActiveIP:   data.LeastActiveIP,
		LeastActiveAt:   data.LeastActiveAt,
	}
	if err := m.playerRepo.UpdatePlayer(ctx, player); err != nil {
		return fmt.Errorf("更新玩家基础信息失败: %w", err)
	}

	// 5. 同步背包道具：先删除旧的，再批量插入新的
	if err := m.playerRepo.DeleteAllPlayerItems(ctx, playerID); err != nil {
		return fmt.Errorf("删除旧玩家道具失败: %w", err)
	}

	now := time.Now()
	for _, obj := range data.Bag {
		playerItem := &domain.PlayerItem{
			PlayerID:  playerID,
			ItemID:    obj.ID,
			Num:       obj.Num,
			Attribute: obj.Attribute,
			CreatedAt: now,
		}
		if err := m.playerRepo.CreatePlayerItem(ctx, playerItem); err != nil {
			// 单个道具失败不中断整体流程，记录日志继续
			continue
		}
	}

	return nil
}

// GetAllCachedPlayerIDs 扫描 Redis，获取所有有缓存的玩家 ID 列表
func (m *PlayerDataManager) GetAllCachedPlayerIDs(ctx context.Context) ([]int, error) {
	var playerIDs []int
	pattern := playerDataKeyPrefix + "*"
	var cursor uint64 = 0

	for {
		scanCmd := m.redis.B().Scan().Cursor(cursor).Match(pattern).Count(100).Build()
		result, err := m.redis.Do(ctx, scanCmd).AsScanEntry()
		if err != nil {
			return nil, fmt.Errorf("扫描Redis键失败: %w", err)
		}

		for _, key := range result.Elements {
			// 从 key 中提取 playerID
			idStr := strings.TrimPrefix(key, playerDataKeyPrefix)
			if id, err := strconv.Atoi(idStr); err == nil {
				playerIDs = append(playerIDs, id)
			}
		}

		cursor = result.Cursor
		if cursor == 0 {
			break
		}
	}

	return playerIDs, nil
}

// SyncAllPlayerDataToDB 同步所有有缓存的玩家数据到 SQL
func (m *PlayerDataManager) SyncAllPlayerDataToDB(ctx context.Context) (successCount int, failCount int, err error) {
	playerIDs, err := m.GetAllCachedPlayerIDs(ctx)
	if err != nil {
		return 0, 0, err
	}

	for _, pid := range playerIDs {
		if syncErr := m.SyncPlayerDataToDB(ctx, pid); syncErr != nil {
			failCount++
		} else {
			successCount++
		}
	}

	return successCount, failCount, nil
}
