package utils

import (
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/repository"
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/redis/rueidis"
	"gorm.io/gorm"
)

// 各实体的 Redis Hash key 前缀
const (
	characterKeyPrefix = "private:game:character:"
	enemyKeyPrefix     = "private:game:enemy:"
	toolKeyPrefix      = "private:game:tool:"
	skillKeyPrefix     = "private:game:skill:"

	// ID 自增计数器
	characterIDKey = "private:game:character:next_id"
	enemyIDKey     = "private:game:enemy:next_id"
	toolIDKey      = "private:game:tool:next_id"
	skillIDKey     = "private:game:skill:next_id"
)

// GameContentManager 游戏内容缓存管理器
// 使用 Redis Hash 存储各实体，cache-aside 读，仅 Redis 写，由 SyncScheduler 同步到 DB
type GameContentManager struct {
	redis    rueidis.Client
	gameRepo repository.GameRepo
}

func NewGameContentManager(redis rueidis.Client, gameRepo repository.GameRepo) *GameContentManager {
	return &GameContentManager{redis: redis, gameRepo: gameRepo}
}

// ==================== 通用辅助 ====================

// nextID 通过 Redis INCR 生成新 ID
func (m *GameContentManager) nextID(ctx context.Context, key string) (int, error) {
	cmd := m.redis.B().Incr().Key(key).Build()
	id, err := m.redis.Do(ctx, cmd).AsInt64()
	if err != nil {
		return 0, fmt.Errorf("生成 ID 失败: %w", err)
	}
	return int(id), nil
}

// exists 检查 Hash 是否存在
func (m *GameContentManager) exists(ctx context.Context, key string) (bool, error) {
	cmd := m.redis.B().Exists().Key(key).Build()
	n, err := m.redis.Do(ctx, cmd).AsInt64()
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

// scanIDs 扫描某前缀下所有 ID（排除 next_id 计数器键）
func (m *GameContentManager) scanIDs(ctx context.Context, prefix string) ([]int, error) {
	var ids []int
	pattern := prefix + "*"
	var cursor uint64 = 0
	for {
		scanCmd := m.redis.B().Scan().Cursor(cursor).Match(pattern).Count(100).Build()
		entry, err := m.redis.Do(ctx, scanCmd).AsScanEntry()
		if err != nil {
			return nil, fmt.Errorf("扫描 Redis 键失败: %w", err)
		}
		for _, k := range entry.Elements {
			idStr := strings.TrimPrefix(k, prefix)
			if idStr == "next_id" {
				continue
			}
			if id, err := strconv.Atoi(idStr); err == nil {
				ids = append(ids, id)
			}
		}
		cursor = entry.Cursor
		if cursor == 0 {
			break
		}
	}
	// 倒序排序
	for i, j := 0, len(ids)-1; i < j; i, j = i+1, j-1 {
		ids[i], ids[j] = ids[j], ids[i]
	}
	return ids, nil
}

// paginate 对 ID 列表分页，返回当前页 ID 和总数
func paginateIDs(ids []int, page, pageSize int) ([]int, int64) {
	total := int64(len(ids))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	start := (page - 1) * pageSize
	if start >= len(ids) {
		return []int{}, total
	}
	end := min(start+pageSize, len(ids))
	return ids[start:end], total
}

// ==================== Character ====================

func (m *GameContentManager) characterKey(id int) string {
	return fmt.Sprintf("%s%d", characterKeyPrefix, id)
}

// GetCharacter 读取角色（cache-aside）
func (m *GameContentManager) GetCharacter(ctx context.Context, id int) (*domain.Character, error) {
	key := m.characterKey(id)
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil && !rueidis.IsRedisNil(err) {
		return nil, fmt.Errorf("读取缓存失败: %w", err)
	}
	if len(fields) == 0 {
		// cache miss：从 DB 加载并回填
		c, err := m.gameRepo.GetCharacterByID(ctx, id)
		if err != nil {
			return nil, err
		}
		if err := m.saveCharacterToCache(ctx, c); err != nil {
			return nil, err
		}
		return c, nil
	}
	return m.parseCharacter(fields), nil
}

func (m *GameContentManager) GetCharacterNumber(ctx context.Context) (int, error) {
	number, err := m.redis.Do(ctx, m.redis.B().Hget().Key(characterKeyPrefix).Field("character_number").Build()).AsInt64()
	if err == nil {
		return int(number), nil
	}
	var characterNumber int
	characterNumber64, err := m.redis.Do(ctx, m.redis.B().Lrange().Key(characterKeyPrefix).Start(0).Stop(-1).Build()).AsInt64()
	if err != nil {
		characterNumber, err = m.gameRepo.GetAllCharacterNumber(ctx)
		if err != nil {
			return 0, err
		}
	} else {
		characterNumber = int(characterNumber64)
	}
	if err := m.redis.Do(ctx, m.redis.B().Hset().Key(characterKeyPrefix).FieldValue().
		FieldValue("character_number", strconv.Itoa(characterNumber)).
		Build()).Error(); err != nil {
		return 0, err
	}
	return characterNumber, nil
}

func (m *GameContentManager) parseCharacter(fields map[string]string) *domain.Character {
	c := &domain.Character{}
	if v, ok := fields["id"]; ok {
		c.ID, _ = strconv.Atoi(v)
	}
	c.Name = fields["name"]
	if v, ok := fields["health"]; ok {
		c.Health, _ = strconv.Atoi(v)
	}
	c.Type = fields["type"]
	c.Description = fields["description"]
	if v, ok := fields["created_at"]; ok {
		c.CreatedAt, _ = time.Parse(time.RFC3339, v)
	}
	if v, ok := fields["updated_at"]; ok {
		c.UpdatedAt, _ = time.Parse(time.RFC3339, v)
	}
	return c
}

func (m *GameContentManager) saveCharacterToCache(ctx context.Context, c *domain.Character) error {
	key := m.characterKey(c.ID)
	cmd := m.redis.B().Hset().Key(key).FieldValue().
		FieldValue("id", strconv.Itoa(c.ID)).
		FieldValue("name", c.Name).
		FieldValue("health", strconv.Itoa(c.Health)).
		FieldValue("type", c.Type).
		FieldValue("description", c.Description).
		FieldValue("created_at", c.CreatedAt.Format(time.RFC3339)).
		FieldValue("updated_at", c.UpdatedAt.Format(time.RFC3339)).
		Build()
	return m.redis.Do(ctx, cmd).Error()
}

// ListCharacters 列表（从 Redis 扫描）
func (m *GameContentManager) ListCharacters(ctx context.Context, page, pageSize int) ([]*domain.Character, int64, error) {
	ids, err := m.scanIDs(ctx, characterKeyPrefix)
	if err != nil {
		return nil, 0, err
	}
	pageIDs, total := paginateIDs(ids, page, pageSize)
	list := make([]*domain.Character, 0, len(pageIDs))
	for _, id := range pageIDs {
		c, err := m.GetCharacter(ctx, id)
		if err != nil {
			continue
		}
		list = append(list, c)
	}
	return list, total, nil
}

// CreateCharacter 创建角色（仅写 Redis）
func (m *GameContentManager) CreateCharacter(ctx context.Context, c *domain.Character) error {
	id, err := m.nextID(ctx, characterIDKey)
	if err != nil {
		return err
	}
	now := time.Now()
	c.ID = id
	c.CreatedAt = now
	c.UpdatedAt = now
	return m.saveCharacterToCache(ctx, c)
}

// UpdateCharacter 更新角色（仅写 Redis，未加载则从 DB 回填）
func (m *GameContentManager) UpdateCharacter(ctx context.Context, id int, c *domain.Character) error {
	key := m.characterKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		// 尝试从 DB 加载
		old, err := m.gameRepo.GetCharacterByID(ctx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("角色不存在: %d", id)
			}
			return err
		}
		if err := m.saveCharacterToCache(ctx, old); err != nil {
			return err
		}
	}
	c.ID = id
	c.UpdatedAt = time.Now()
	// 若未提供 CreatedAt（更新请求通常不传），保留原值
	if c.CreatedAt.IsZero() {
		if fields, err := m.redis.Do(ctx, m.redis.B().Hget().Key(key).Field("created_at").Build()).ToString(); err == nil {
			c.CreatedAt, _ = time.Parse(time.RFC3339, fields)
		}
	}
	return m.saveCharacterToCache(ctx, c)
}

// SyncCharacterToDB 将 Redis 中的角色同步到 DB
func (m *GameContentManager) SyncCharacterToDB(ctx context.Context, id int) error {
	key := m.characterKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil {
		return err
	}
	if len(fields) == 0 {
		return nil
	}
	return m.gameRepo.UpsertCharacter(ctx, m.parseCharacter(fields))
}

// SyncAllCharactersToDB 同步所有缓存中的角色到 DB
func (m *GameContentManager) SyncAllCharactersToDB(ctx context.Context) (int, int, error) {
	ids, err := m.scanIDs(ctx, characterKeyPrefix)
	if err != nil {
		return 0, 0, err
	}
	success, fail := 0, 0
	for _, id := range ids {
		if err := m.SyncCharacterToDB(ctx, id); err != nil {
			fail++
		} else {
			success++
		}
	}
	return success, fail, nil
}

// ==================== Enemy ====================

func (m *GameContentManager) enemyKey(id int) string {
	return fmt.Sprintf("%s%d", enemyKeyPrefix, id)
}

func (m *GameContentManager) GetEnemy(ctx context.Context, id int) (*domain.Enemy, error) {
	key := m.enemyKey(id)
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil && !rueidis.IsRedisNil(err) {
		return nil, fmt.Errorf("读取缓存失败: %w", err)
	}
	if len(fields) == 0 {
		e, err := m.gameRepo.GetEnemyByID(ctx, id)
		if err != nil {
			return nil, err
		}
		if err := m.saveEnemyToCache(ctx, e); err != nil {
			return nil, err
		}
		return e, nil
	}
	return m.parseEnemy(fields), nil
}

func (m *GameContentManager) parseEnemy(fields map[string]string) *domain.Enemy {
	e := &domain.Enemy{}
	if v, ok := fields["id"]; ok {
		e.ID, _ = strconv.Atoi(v)
	}
	e.Name = fields["name"]
	if v, ok := fields["health"]; ok {
		e.Health, _ = strconv.Atoi(v)
	}
	e.Type = fields["type"]
	e.Description = fields["description"]
	if v, ok := fields["created_at"]; ok {
		e.CreatedAt, _ = time.Parse(time.RFC3339, v)
	}
	if v, ok := fields["updated_at"]; ok {
		e.UpdatedAt, _ = time.Parse(time.RFC3339, v)
	}
	return e
}

func (m *GameContentManager) saveEnemyToCache(ctx context.Context, e *domain.Enemy) error {
	key := m.enemyKey(e.ID)
	cmd := m.redis.B().Hset().Key(key).FieldValue().
		FieldValue("id", strconv.Itoa(e.ID)).
		FieldValue("name", e.Name).
		FieldValue("health", strconv.Itoa(e.Health)).
		FieldValue("type", e.Type).
		FieldValue("description", e.Description).
		FieldValue("created_at", e.CreatedAt.Format(time.RFC3339)).
		FieldValue("updated_at", e.UpdatedAt.Format(time.RFC3339)).
		Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *GameContentManager) ListEnemies(ctx context.Context, page, pageSize int) ([]*domain.Enemy, int64, error) {
	ids, err := m.scanIDs(ctx, enemyKeyPrefix)
	if err != nil {
		return nil, 0, err
	}
	pageIDs, total := paginateIDs(ids, page, pageSize)
	list := make([]*domain.Enemy, 0, len(pageIDs))
	for _, id := range pageIDs {
		e, err := m.GetEnemy(ctx, id)
		if err != nil {
			continue
		}
		list = append(list, e)
	}
	return list, total, nil
}

func (m *GameContentManager) CreateEnemy(ctx context.Context, e *domain.Enemy) error {
	id, err := m.nextID(ctx, enemyIDKey)
	if err != nil {
		return err
	}
	now := time.Now()
	e.ID = id
	e.CreatedAt = now
	e.UpdatedAt = now
	return m.saveEnemyToCache(ctx, e)
}

func (m *GameContentManager) UpdateEnemy(ctx context.Context, id int, e *domain.Enemy) error {
	key := m.enemyKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		old, err := m.gameRepo.GetEnemyByID(ctx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("敌人不存在: %d", id)
			}
			return err
		}
		if err := m.saveEnemyToCache(ctx, old); err != nil {
			return err
		}
	}
	e.ID = id
	e.UpdatedAt = time.Now()
	if e.CreatedAt.IsZero() {
		if fields, err := m.redis.Do(ctx, m.redis.B().Hget().Key(key).Field("created_at").Build()).ToString(); err == nil {
			e.CreatedAt, _ = time.Parse(time.RFC3339, fields)
		}
	}
	return m.saveEnemyToCache(ctx, e)
}

func (m *GameContentManager) GetEnemyNumber(ctx context.Context) (int, error) {
	var total int
	totalInt64, err := m.redis.Do(ctx, m.redis.B().Hget().Key(enemyKeyPrefix).Field("enemy_number").Build()).AsInt64()
	if err == nil {
		return int(totalInt64), err
	}
	totalInt64, err = m.redis.Do(ctx, m.redis.B().Lrange().Key(enemyKeyPrefix).Start(0).Stop(-1).Build()).AsInt64()
	if err == nil {
		total = int(totalInt64)
	} else {
		total, err = m.gameRepo.GetAllEnemyNumber(ctx)
		if err != nil {
			return 0, fmt.Errorf("获取所有敌人数量失败: %w", err)
		}
	}
	if err := m.redis.Do(ctx, m.redis.B().Hset().Key(enemyKeyPrefix).FieldValue().FieldValue("enemy_number", strconv.Itoa(total)).Build()).Error(); err != nil {
		return 0, fmt.Errorf("更新所有敌人数量失败: %w", err)
	}
	return total, nil
}

func (m *GameContentManager) SyncEnemyToDB(ctx context.Context, id int) error {
	key := m.enemyKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil {
		return err
	}
	if len(fields) == 0 {
		return nil
	}
	return m.gameRepo.UpsertEnemy(ctx, m.parseEnemy(fields))
}

func (m *GameContentManager) SyncAllEnemiesToDB(ctx context.Context) (int, int, error) {
	ids, err := m.scanIDs(ctx, enemyKeyPrefix)
	if err != nil {
		return 0, 0, err
	}
	success, fail := 0, 0
	for _, id := range ids {
		if err := m.SyncEnemyToDB(ctx, id); err != nil {
			fail++
		} else {
			success++
		}
	}
	return success, fail, nil
}

// ==================== Tool ====================

func (m *GameContentManager) toolKey(id int) string {
	return fmt.Sprintf("%s%d", toolKeyPrefix, id)
}

func (m *GameContentManager) GetTool(ctx context.Context, id int) (*domain.Tool, error) {
	key := m.toolKey(id)
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil && !rueidis.IsRedisNil(err) {
		return nil, fmt.Errorf("读取缓存失败: %w", err)
	}
	if len(fields) == 0 {
		t, err := m.gameRepo.GetToolByID(ctx, id)
		if err != nil {
			return nil, err
		}
		if err := m.saveToolToCache(ctx, t); err != nil {
			return nil, err
		}
		return t, nil
	}
	return m.parseTool(fields), nil
}

func (m *GameContentManager) parseTool(fields map[string]string) *domain.Tool {
	t := &domain.Tool{}
	if v, ok := fields["id"]; ok {
		t.ID, _ = strconv.Atoi(v)
	}
	t.Name = fields["name"]
	t.Description = fields["description"]
	if v, ok := fields["created_at"]; ok {
		t.CreatedAt, _ = time.Parse(time.RFC3339, v)
	}
	if v, ok := fields["updated_at"]; ok {
		t.UpdatedAt, _ = time.Parse(time.RFC3339, v)
	}
	return t
}

func (m *GameContentManager) saveToolToCache(ctx context.Context, t *domain.Tool) error {
	key := m.toolKey(t.ID)
	cmd := m.redis.B().Hset().Key(key).FieldValue().
		FieldValue("id", strconv.Itoa(t.ID)).
		FieldValue("name", t.Name).
		FieldValue("description", t.Description).
		FieldValue("created_at", t.CreatedAt.Format(time.RFC3339)).
		FieldValue("updated_at", t.UpdatedAt.Format(time.RFC3339)).
		Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *GameContentManager) ListTools(ctx context.Context, page, pageSize int) ([]*domain.Tool, int64, error) {
	ids, err := m.scanIDs(ctx, toolKeyPrefix)
	if err != nil {
		return nil, 0, err
	}
	pageIDs, total := paginateIDs(ids, page, pageSize)
	list := make([]*domain.Tool, 0, len(pageIDs))
	for _, id := range pageIDs {
		t, err := m.GetTool(ctx, id)
		if err != nil {
			continue
		}
		list = append(list, t)
	}
	return list, total, nil
}

func (m *GameContentManager) CreateTool(ctx context.Context, t *domain.Tool) error {
	id, err := m.nextID(ctx, toolIDKey)
	if err != nil {
		return err
	}
	now := time.Now()
	t.ID = id
	t.CreatedAt = now
	t.UpdatedAt = now
	return m.saveToolToCache(ctx, t)
}

func (m *GameContentManager) UpdateTool(ctx context.Context, id int, t *domain.Tool) error {
	key := m.toolKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		old, err := m.gameRepo.GetToolByID(ctx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("道具不存在: %d", id)
			}
			return err
		}
		if err := m.saveToolToCache(ctx, old); err != nil {
			return err
		}
	}
	t.ID = id
	t.UpdatedAt = time.Now()
	if t.CreatedAt.IsZero() {
		if fields, err := m.redis.Do(ctx, m.redis.B().Hget().Key(key).Field("created_at").Build()).ToString(); err == nil {
			t.CreatedAt, _ = time.Parse(time.RFC3339, fields)
		}
	}
	return m.saveToolToCache(ctx, t)
}

func (m *GameContentManager) SyncToolToDB(ctx context.Context, id int) error {
	key := m.toolKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil {
		return err
	}
	if len(fields) == 0 {
		return nil
	}
	return m.gameRepo.UpsertTool(ctx, m.parseTool(fields))
}

func (m *GameContentManager) SyncAllToolsToDB(ctx context.Context) (int, int, error) {
	ids, err := m.scanIDs(ctx, toolKeyPrefix)
	if err != nil {
		return 0, 0, err
	}
	success, fail := 0, 0
	for _, id := range ids {
		if err := m.SyncToolToDB(ctx, id); err != nil {
			fail++
		} else {
			success++
		}
	}
	return success, fail, nil
}

// ==================== Skill ====================

func (m *GameContentManager) skillKey(id int) string {
	return fmt.Sprintf("%s%d", skillKeyPrefix, id)
}

func (m *GameContentManager) GetSkill(ctx context.Context, id int) (*domain.Skill, error) {
	key := m.skillKey(id)
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil && !rueidis.IsRedisNil(err) {
		return nil, fmt.Errorf("读取缓存失败: %w", err)
	}
	if len(fields) == 0 {
		s, err := m.gameRepo.GetSkillByID(ctx, id)
		if err != nil {
			return nil, err
		}
		if err := m.saveSkillToCache(ctx, s); err != nil {
			return nil, err
		}
		return s, nil
	}
	return m.parseSkill(fields), nil
}

func (m *GameContentManager) parseSkill(fields map[string]string) *domain.Skill {
	s := &domain.Skill{}
	if v, ok := fields["id"]; ok {
		s.ID, _ = strconv.Atoi(v)
	}
	if v, ok := fields["character_id"]; ok {
		s.CharacterID, _ = strconv.Atoi(v)
	}
	s.Name = fields["name"]
	s.Type = fields["type"]
	s.Description = fields["description"]
	if v, ok := fields["created_at"]; ok {
		s.CreatedAt, _ = time.Parse(time.RFC3339, v)
	}
	if v, ok := fields["updated_at"]; ok {
		s.UpdatedAt, _ = time.Parse(time.RFC3339, v)
	}
	return s
}

func (m *GameContentManager) saveSkillToCache(ctx context.Context, s *domain.Skill) error {
	key := m.skillKey(s.ID)
	cmd := m.redis.B().Hset().Key(key).FieldValue().
		FieldValue("id", strconv.Itoa(s.ID)).
		FieldValue("character_id", strconv.Itoa(s.CharacterID)).
		FieldValue("name", s.Name).
		FieldValue("type", s.Type).
		FieldValue("description", s.Description).
		FieldValue("created_at", s.CreatedAt.Format(time.RFC3339)).
		FieldValue("updated_at", s.UpdatedAt.Format(time.RFC3339)).
		Build()
	return m.redis.Do(ctx, cmd).Error()
}

func (m *GameContentManager) ListSkills(ctx context.Context, page, pageSize int) ([]*domain.Skill, int64, error) {
	ids, err := m.scanIDs(ctx, skillKeyPrefix)
	if err != nil {
		return nil, 0, err
	}
	pageIDs, total := paginateIDs(ids, page, pageSize)
	list := make([]*domain.Skill, 0, len(pageIDs))
	for _, id := range pageIDs {
		s, err := m.GetSkill(ctx, id)
		if err != nil {
			continue
		}
		list = append(list, s)
	}
	return list, total, nil
}

func (m *GameContentManager) CreateSkill(ctx context.Context, s *domain.Skill) error {
	id, err := m.nextID(ctx, skillIDKey)
	if err != nil {
		return err
	}
	now := time.Now()
	s.ID = id
	s.CreatedAt = now
	s.UpdatedAt = now
	return m.saveSkillToCache(ctx, s)
}

func (m *GameContentManager) UpdateSkill(ctx context.Context, id int, s *domain.Skill) error {
	key := m.skillKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		old, err := m.gameRepo.GetSkillByID(ctx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("技能不存在: %d", id)
			}
			return err
		}
		if err := m.saveSkillToCache(ctx, old); err != nil {
			return err
		}
	}
	s.ID = id
	s.UpdatedAt = time.Now()
	if s.CreatedAt.IsZero() {
		if fields, err := m.redis.Do(ctx, m.redis.B().Hget().Key(key).Field("created_at").Build()).ToString(); err == nil {
			s.CreatedAt, _ = time.Parse(time.RFC3339, fields)
		}
	}
	return m.saveSkillToCache(ctx, s)
}

func (m *GameContentManager) GetAllSkillNumber(ctx context.Context) (int, error) {
	var total int
	totalInt64, err := m.redis.Do(ctx, m.redis.B().Hget().Key(skillKeyPrefix).Field("skill_number").Build()).AsInt64()
	if err == nil {
		return int(totalInt64), err
	}
	totalInt64, err = m.redis.Do(ctx, m.redis.B().Lrange().Key(skillKeyPrefix).Start(0).Stop(-1).Build()).AsInt64()
	if err == nil {
		total = int(totalInt64)
	} else {
		total, err = m.gameRepo.GetAllSkillNumber(ctx)
		if err != nil {
			return 0, fmt.Errorf("获取所有技能数量失败: %w", err)
		}
	}
	if err := m.redis.Do(ctx, m.redis.B().Hset().Key(skillKeyPrefix).FieldValue().FieldValue("skill_number", strconv.Itoa(total)).Build()).Error(); err != nil {
		return 0, fmt.Errorf("更新所有技能数量失败: %w", err)
	}
	return total, nil
}

func (m *GameContentManager) SyncSkillToDB(ctx context.Context, id int) error {
	key := m.skillKey(id)
	exists, err := m.exists(ctx, key)
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	fields, err := m.redis.Do(ctx, m.redis.B().Hgetall().Key(key).Build()).AsStrMap()
	if err != nil {
		return err
	}
	if len(fields) == 0 {
		return nil
	}
	return m.gameRepo.UpsertSkill(ctx, m.parseSkill(fields))
}

func (m *GameContentManager) SyncAllSkillsToDB(ctx context.Context) (int, int, error) {
	ids, err := m.scanIDs(ctx, skillKeyPrefix)
	if err != nil {
		return 0, 0, err
	}
	success, fail := 0, 0
	for _, id := range ids {
		if err := m.SyncSkillToDB(ctx, id); err != nil {
			fail++
		} else {
			success++
		}
	}
	return success, fail, nil
}

// ==================== 全量同步 ====================

// SyncAllToDBResult 全量同步结果
type SyncAllToDBResult struct {
	CharacterSuccess int
	CharacterFail    int
	EnemySuccess     int
	EnemyFail        int
	ToolSuccess      int
	ToolFail         int
	SkillSuccess     int
	SkillFail        int
}

// SyncAllToDB 同步所有游戏内容到 DB
func (m *GameContentManager) SyncAllToDB(ctx context.Context) (*SyncAllToDBResult, error) {
	result := &SyncAllToDBResult{}
	var firstErr error

	if s, f, err := m.SyncAllCharactersToDB(ctx); err != nil {
		firstErr = err
	} else {
		result.CharacterSuccess = s
		result.CharacterFail = f
	}
	if s, f, err := m.SyncAllEnemiesToDB(ctx); err != nil {
		if firstErr == nil {
			firstErr = err
		}
	} else {
		result.EnemySuccess = s
		result.EnemyFail = f
	}
	if s, f, err := m.SyncAllToolsToDB(ctx); err != nil {
		if firstErr == nil {
			firstErr = err
		}
	} else {
		result.ToolSuccess = s
		result.ToolFail = f
	}
	if s, f, err := m.SyncAllSkillsToDB(ctx); err != nil {
		if firstErr == nil {
			firstErr = err
		}
	} else {
		result.SkillSuccess = s
		result.SkillFail = f
	}

	return result, firstErr
}
