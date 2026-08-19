package fight

import (
	"DisembodiedSpecter/internal/service/fight/character"
	"DisembodiedSpecter/internal/service/fight/enemy"
	"DisembodiedSpecter/internal/service/fight/structs"
	"DisembodiedSpecter/internal/utils"
	"DisembodiedSpecter/proto/pd"
	"log"

	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
)

type FightEngine struct {
	skillManger        *character.SkillManager
	enemyManager       *enemy.EnemyManager
	actuator           *ActuatorManager
	gameContentManager *utils.GameContentManager
}

func NewFightEngine(skill *character.SkillManager, enemy *enemy.EnemyManager, gameContentManager *utils.GameContentManager) *FightEngine {
	return &FightEngine{
		skillManger:        skill,
		enemyManager:       enemy,
		gameContentManager: gameContentManager,
		actuator: NewActuatorManager(
			gameContentManager,
		),
	}
}

// ActuatorListenerStart 为全部战斗位（我方 + 敌方）启动底层监听器。
// 传入的必须是战斗位索引（0..len(CharacterState)-1），而非角色 DB ID。
func (fe *FightEngine) ActuatorListenerStart(pubSub *gochannel.GoChannel, machine *structs.Machine) error {
	ids := make([]int, len(machine.CharacterState))
	for i := range ids {
		ids[i] = i
	}
	return fe.actuator.StartListener(pubSub, machine, ids)
}

// RunSkillStart 按顺序执行技能三阶段：Init（主行动者）→ Listener（从行动者）→ Run（终结）。
// 任一阶段失败会记录并继续后续技能，不中断整轮战斗。
func (fe *FightEngine) RunSkillStart(skills []*pd.Skill, pubSub *gochannel.GoChannel, machine *structs.Machine) error {
	for _, s := range skills {
		if err := fe.skillManger.Init(int(s.GetSkillId()), pubSub, machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Init 失败: %v", s.GetSkillId(), err)
		}
	}
	for _, s := range skills {
		if err := fe.skillManger.Listener(int(s.GetSkillId()), pubSub, machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Listener 失败: %v", s.GetSkillId(), err)
		}
	}
	for _, s := range skills {
		if err := fe.skillManger.Run(int(s.GetSkillId()), machine, int(s.GetCharacterId()), int(s.GetTargetId())); err != nil {
			log.Printf("技能 %d Run 失败: %v", s.GetSkillId(), err)
		}
	}
	return nil
}
