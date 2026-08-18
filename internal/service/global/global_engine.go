package global

import (
	"DisembodiedSpecter/internal/service/global/structs"
	"DisembodiedSpecter/internal/utils"
	"context"
	"fmt"
	"sync"

	"github.com/redis/rueidis"
)

// GlobalEngine 全局状态引擎：负责每个玩家全局状态机（Machine）的加载与持久化。
//
// Machine 与 PlayerDataManager（player_data_util）对齐：
//   - Level / Exp / Bag 通过 PlayerDataManager.GetPlayerData 加载，与玩家数据共用同一 Hash；
//   - CharacterTeam / CharacterList / Doing / DoingMap 通过
//     PlayerDataManager.GetMachineState / SaveMachineState 读写同一个 Hash。
//
// 引擎持有在线玩家的 Machine 内存实例，断开连接时写回 Redis 并移除。
type GlobalEngine struct {
	Redis             rueidis.Client
	PlayerDataManager *utils.PlayerDataManager

	mu       sync.RWMutex
	machines map[int]*structs.Machine // 在线玩家的全局状态机
}

func NewGlobalEngine(redis rueidis.Client, playerDataManager *utils.PlayerDataManager) *GlobalEngine {
	return &GlobalEngine{
		Redis:             redis,
		PlayerDataManager: playerDataManager,
		machines:          make(map[int]*structs.Machine),
	}
}

// GetMachine 获取玩家的全局状态机：优先返回内存实例，否则从玩家数据加载并注册。
// 已连接玩家再次调用会拿到同一个实例，保证状态机在连接期间是一致的。
func (g *GlobalEngine) GetMachine(ctx context.Context, userID int) (*structs.Machine, error) {
	g.mu.RLock()
	if m, ok := g.machines[userID]; ok {
		g.mu.RUnlock()
		return m, nil
	}
	g.mu.RUnlock()

	m, err := g.LoadMachine(ctx, userID)
	if err != nil {
		return nil, err
	}

	g.mu.Lock()
	defer g.mu.Unlock()
	if existing, ok := g.machines[userID]; ok {
		return existing, nil
	}
	g.machines[userID] = m
	return m, nil
}

// LoadMachine 从 PlayerDataManager 加载玩家状态机（内存无缓存时调用）
func (g *GlobalEngine) LoadMachine(ctx context.Context, userID int) (*structs.Machine, error) {
	// 玩家基础数据（Level / Exp / Bag，与 player_data_util 对齐）
	playerData, err := g.PlayerDataManager.GetPlayerData(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("加载玩家数据失败: %w", err)
	}
	// 状态机自有字段（与玩家数据共用同一个 Hash）
	state, err := g.PlayerDataManager.GetMachineState(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("加载状态机字段失败: %w", err)
	}

	return &structs.Machine{
		ID:            userID,
		CharacterTeam: state.CharacterTeam,
		CharacterList: state.CharacterList,
		Bag:           playerData.Bag,
		Level:         playerData.Level,
		Exp:           playerData.Exp,
		Doing:         state.Doing,
		DoingMap:      state.DoingMap,
	}, nil
}

// SaveMachine 将状态机自有字段写回 Redis（Level / Exp / Bag 的修改请走 PlayerDataManager 的写方法，
// 例如 SetLevel / AddExp / AddItem，以保证与玩家数据 Hash 一致）
func (g *GlobalEngine) SaveMachine(ctx context.Context, m *structs.Machine) error {
	if m == nil {
		return nil
	}
	return g.PlayerDataManager.SaveMachineState(ctx, m.ID, &utils.MachineState{
		CharacterTeam: m.CharacterTeam,
		CharacterList: m.CharacterList,
		Doing:         m.Doing,
		DoingMap:      m.DoingMap,
	})
}

// EnterState 切换状态机状态（Doing / DoingMap）并立即持久化
func (g *GlobalEngine) EnterState(ctx context.Context, m *structs.Machine, doing int, doingMap map[string]string) error {
	m.Doing = doing
	m.DoingMap = doingMap
	return g.SaveMachine(ctx, m)
}

// Disconnect 玩家断开连接：写回状态机并从内存移除
func (g *GlobalEngine) Disconnect(ctx context.Context, userID int) error {
	g.mu.RLock()
	m, ok := g.machines[userID]
	g.mu.RUnlock()
	if !ok {
		return nil
	}
	if err := g.SaveMachine(ctx, m); err != nil {
		return err
	}
	g.mu.Lock()
	delete(g.machines, userID)
	g.mu.Unlock()
	return nil
}

// OnlineCount 返回在线玩家数量
func (g *GlobalEngine) OnlineCount() int {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return len(g.machines)
}
