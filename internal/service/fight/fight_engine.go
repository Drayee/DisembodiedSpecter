package fight

import (
	"DisembodiedSpecter/internal/service/fight/character"
	"DisembodiedSpecter/internal/service/fight/enemy"
	"DisembodiedSpecter/internal/utils"
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
