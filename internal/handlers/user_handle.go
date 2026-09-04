package handlers

import (
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service"
	"fmt"
	"net/http"
	"strings"

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
// @Description 获取用户数据，包括邮箱、状态等。支持 If-None-Match 条件请求：
// 玩家数据版本未变化时返回 304，避免重复传输（弱 ETag: W/"version"）
// @Tags 用户
// @Accept json
// @Produce json
// @Param If-None-Match header string false "缓存校验值（弱 ETag）"
// @Success 200 {object} response.Result "成功 data: 用户数据对象"
// @Success 304 "数据未变化"
// @Failure 500 {object} response.Result "失败"
// @Router /api/v2/data [get]
func (u *UserHandler) GetData(c *gin.Context) {
	// 条件请求：版本号（弱 ETag）匹配则直接 304，跳过全量读取
	version, err := u.userService.GetDataVersion(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	etag := fmt.Sprintf("W/\"%d\"", version)
	c.Header("ETag", etag)
	if etagMatches(c.GetHeader("If-None-Match"), etag) {
		c.Status(http.StatusNotModified)
		return
	}

	data, err := u.userService.GetData(c)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	response.OK(c, data)
}

// etagMatches 判断 If-None-Match 头是否包含指定 ETag（逗号分隔列表，忽略空白）
func etagMatches(header string, etag string) bool {
	if header == "" {
		return false
	}
	for _, item := range strings.Split(header, ",") {
		if strings.TrimSpace(item) == etag {
			return true
		}
	}
	return false
}
