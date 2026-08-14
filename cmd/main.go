// @title DisembodiedSpecter API
// @version 1.0
// @description DisembodiedSpecter API 文档
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email 1473443474@qq.com

// @host localhost:8080
// @BasePath /
package main

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/utils"
	"log"
	"strconv"
)

func main() {
	appConfig, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("加载配置文件失败: %v", err)
	}

	redisClient, err := utils.ConnectRedis(appConfig)
	if err != nil {
		log.Fatalf("连接Redis失败: %v", err)
	}

	// 3. 初始化应用
	init, cleanup, err := InitializeApp(appConfig, redisClient)
	if err != nil {
		log.Fatalf("初始化应用失败: %v", err)
	}
	engine := init.Engine

	// 4. 启动定时同步调度器
	if init.Scheduler != nil {
		init.Scheduler.Start()
	}

	// 确保服务退出时，执行资源的清理动作（包括停止调度器）
	defer func() {
		if init.Scheduler != nil {
			init.Scheduler.Stop()
		}
		cleanup()
	}()

	// 2. 启动服务
	portStr := ":" + strconv.Itoa(appConfig.App.Port)
	if err := engine.Run(portStr); err != nil {
		log.Fatalf("服务运行失败: %v", err)
	}
}
