//go:build wireinject
// +build wireinject

package main

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/filter"
	"DisembodiedSpecter/internal/handlers"
	"DisembodiedSpecter/internal/repository"
	"DisembodiedSpecter/internal/service"
	"DisembodiedSpecter/internal/service/fight/character"
	"DisembodiedSpecter/internal/service/fight/enemy"
	"DisembodiedSpecter/internal/service/global"
	"DisembodiedSpecter/internal/utils"

	"github.com/google/wire"
	"github.com/redis/rueidis"
)

func InitializeApp(cfg *config.Config, redisClient rueidis.Client) (*Init, func(), error) {
	wire.Build(
		repository.ProvideDB,

		repository.NewUserRepo,
		repository.NewEmailRepo,
		repository.NewGormPlayerRepo,
		repository.NewGormGameRepo,

		utils.NewTokenManager,
		utils.NewCacheManager,
		utils.NewMailManager,
		utils.NewCodeManager,
		utils.NewPlayerDataManager,
		utils.NewGameContentManager,
		utils.NewSyncScheduler,

		service.NewAuthUseCase,
		handlers.NewAuthHandler,
		service.NewUserUseCase,
		handlers.NewUserHandler,
		service.NewAdminUseCase,
		handlers.NewAdminHandler,
		filter.NewAuthFilter,
		character.NewSkillManager,
		enemy.NewEnemyManager,
		service.NewFightUseCase,
		global.NewGlobalEngine,
		service.NewGlobalUseCase,
		handlers.NewWebSocketHandler,

		handlers.NewRouter,
		NewInit,
	)
	return &Init{}, nil, nil
}
