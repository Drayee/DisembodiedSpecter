package fight

import "sync"

type BattleSession struct {
	Mu        sync.RWMutex
	ID        string
	Player1ID int
	Player2ID int
}
