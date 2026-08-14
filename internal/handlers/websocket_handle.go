package handlers

import (
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type WebSocketHandler struct {
	fightService  *service.FightUseCase
	globalService *service.GlobalUseCase
}

func NewWebSocketHandler(fightService *service.FightUseCase, globalService *service.GlobalUseCase) *WebSocketHandler {
	return &WebSocketHandler{
		fightService:  fightService,
		globalService: globalService,
	}
}

func (wh *WebSocketHandler) FightConnect(c *gin.Context) {
	wsCode := c.Params.ByName("ws_code")
	userID := c.Params.ByName("user_id")
	if wsCode == "" || userID == "" {
		response.FailServer(c, "ws_code 或 user_id 不能为空")
		return
	}
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		response.FailServer(c, "user_id 格式错误")
		return
	}

	wh.fightService.Connect(c, userIDInt, wsCode)
}

func (wh *WebSocketHandler) GlobalConnect(c *gin.Context) {
	wsCode := c.Params.ByName("ws_code")
	userID := c.Params.ByName("user_id")
	if wsCode == "" || userID == "" {
		response.FailServer(c, "ws_code 或 user_id 不能为空")
		return
	}
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		response.FailServer(c, "user_id 格式错误")
		return
	}
	wh.globalService.Connect(c, userIDInt, wsCode)
}
