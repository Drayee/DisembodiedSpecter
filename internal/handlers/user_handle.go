package handlers

import (
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService *service.UserUseCase
}

func NewUserHandler(userService *service.UserUseCase) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// WSCode 获取 WebSocket 连接码
// @Summary 获取 WebSocket 连接码
// @Description 获取 WebSocket 连接码，用于连接 WebSocket 服务器
// @Tags 用户
// @Accept json
// @Produce json
// @Success 200 {object} response.Result "成功 data: {"wsCode": "123456"}"
// @Failure 500 {object} response.Result "失败"
// @Router /api/v2/ws-code [get]
func (u *UserHandler) WSCode(c *gin.Context) {
	wsCode, err := u.userService.GetWsCode(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, gin.H{"wsCode": wsCode})
}

// GetData 获取用户数据
// @Summary 获取用户数据
// @Description 获取用户数据，包括邮箱、状态等
// @Tags 用户
// @Accept json
// @Produce json
// @Success 200 {object} response.Result "成功 data: 用户数据对象"
// @Failure 500 {object} response.Result "失败"
// @Router /api/v2/data [get]
func (u *UserHandler) GetData(c *gin.Context) {
	data, err := u.userService.GetData(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, data)
}
