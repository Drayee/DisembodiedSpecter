package main

import (
	"DisembodiedSpecter/internal/utils"

	"github.com/gin-gonic/gin"
)

type Init struct {
	Scheduler *utils.SyncScheduler
	Engine    *gin.Engine
}

func NewInit(Scheduler *utils.SyncScheduler, Engine *gin.Engine) *Init {
	return &Init{
		Scheduler: Scheduler,
		Engine:    Engine,
	}
}
