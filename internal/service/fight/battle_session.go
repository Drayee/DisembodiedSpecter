package fight

import "sync"

type BattleSession struct {
	mu        sync.RWMutex
	ID        string
	player1ID int
	player2ID int
}
