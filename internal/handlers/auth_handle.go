package handlers

import (
	"DisembodiedSpecter/internal/dto/request"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service"
	"strings"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthUseCase
}

func NewAuthHandler(authService *service.AuthUseCase) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Login 用户登录接口
// @Summary 用户登录
// @Description 通过用户名密码进行登录，返回双令牌（access_token + refresh_token）
// @Tags 认证模块
// @Accept json
// @Produce json
// @Param request body request.LoginReq true "登录请求参数"
// @Success 200 {object} response.Result{data=response.LoginResp} "成功返回双令牌"
// @Failure 400 {object} response.Result "请求参数错误"
// @Router /api/v1/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var dto request.LoginReq
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}

	token, err := h.authService.Login(c, &dto)
	if err != nil {
		response.FailUnauthorized(c, err.Error())
		return
	}

	response.OK(c, token)
}

// Register 用户注册接口
// @Summary 用户注册
// @Description 注册新用户，返回双令牌（access_token + refresh_token）
// @Tags 认证模块
// @Accept json
// @Produce json
// @Param request body request.RegisterReq true "注册请求参数"
// @Success 200 {object} response.Result{data=response.LoginResp} "成功返回双令牌"
// @Failure 400 {object} response.Result "请求参数错误"
// @Router /api/v1/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var dto request.RegisterReq
	if err := c.ShouldBindJSON(&dto); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}

	token, err := h.authService.Register(c, &dto)
	if err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	response.OK(c, token)
}

// Refresh 刷新令牌接口
// @Summary 刷新令牌
// @Description 使用 refresh token 获取新的双令牌
// @Tags 认证模块
// @Accept json
// @Produce json
// @Param request body request.RefreshReq true "刷新令牌请求参数"
// @Success 200 {object} response.Result "成功返回新的双令牌"
// @Failure 400 {object} response.Result "请求参数错误"
// @Router /api/v1/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req request.RefreshReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	result, err := h.authService.Refresh(c, req.RefreshToken)
	if err != nil {
		response.FailUnauthorized(c, err.Error())
		return
	}
	response.OK(c, result)
}

// SendVerifyCode 发送验证码接口
// @Summary 发送验证码接口
// @Description 发送验证码到指定邮箱
// @Tags 认证模块
// @Accept json
// @Produce json
// @Param verifier query string true "验证目标（邮箱）"
// @Param verifier_type query string true "验证类型（email）"
// @Success 200 {object} response.Result "发送验证码成功"
// @Failure 400 {object} response.Result "请求参数错误"
// @Router /api/v1/send_verify_code [get]
func (h *AuthHandler) SendVerifyCode(c *gin.Context) {
	err := h.authService.SendVerifyCode(c, c.Param("verifier"), c.Param("verifier_type"))
	if err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	response.OKWithMsg(c, "发送验证码成功", nil)
}

// Logout 用户退出登录接口
// @Summary 用户退出登录接口
// @Description 退出登录接口（需要 access token 和 refresh token）
// @Tags 认证模块
// @Accept json
// @Produce json
// @Param request body request.RefreshReq true "退出登录请求参数（refresh_token）"
// @Success 200 {object} response.Result "退出登录成功"
// @Failure 400 {object} response.Result "请求参数错误"
// @Router /api/v1/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	authHeader := c.Request.Header.Get("Authorization")
	accessToken := strings.TrimPrefix(authHeader, "Bearer ")

	var req request.RefreshReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}

	err := h.authService.Logout(c, accessToken, req.RefreshToken)
	if err != nil {
		response.FailInvalidParam(c, err.Error())
		return
	}
	response.OKWithMsg(c, "退出登录成功", nil)
}
