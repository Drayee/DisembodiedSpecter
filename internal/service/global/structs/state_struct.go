package structs

import (
	"DisembodiedSpecter/internal/dto/response"
)

// Machine 玩家全局状态机
//
// 与 utils.PlayerDataManager（player_data_util）对齐：
//   - Level / Exp / Bag 直接来自玩家数据 Hash（private:player:data:{userID}）；
//   - CharacterTeam / CharacterList / Doing / DoingMap 为状态机自有字段，
//     由 PlayerDataManager.GetMachineState / SaveMachineState 读写同一个 Hash。
//
// Machine 本身是纯内存数据，加载与持久化由 GlobalEngine 负责。
type Machine struct {
	ID int //用户ID

	CharacterTeam []int //角色团队

	CharacterList []int             //角色列表
	Bag           []response.Object //背包（与 player_data_util 的 response.Object 对齐）

	Level int //等级
	Exp   int //经验

	Doing    int               //正在做的事情
	DoingMap map[string]string //正在做的事情的详情
}

// Doing 常量：玩家正在做的事情
const (
	Story   = 0 //剧情
	Fight   = 1 //战斗中
	Nothing = 2 //无事
	Move    = 3 //移动中
)
