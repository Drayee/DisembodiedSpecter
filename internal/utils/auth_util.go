package utils

import (
	"DisembodiedSpecter/internal/config"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/rueidis"
	"golang.org/x/crypto/bcrypt"
)

type TokenManager struct {
	*config.JwtConfig
	redis rueidis.Client
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPassword(password, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

func NewTokenManager(redis rueidis.Client, cfg *config.Config) *TokenManager {
	return &TokenManager{
		JwtConfig: &cfg.Jwt,
		redis:     redis,
	}
}

func generateToken(userID int, username string, role string, tokenType string, expireSeconds int, secret string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"role":     role,
		"type":     tokenType,
		"exp":      time.Now().Add(time.Duration(expireSeconds) * time.Second).Unix(),
		"iat":      time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (tm *TokenManager) GenerateTokens(userID int, username string, role string) (accessToken string, refreshToken string, err error) {
	accessToken, err = generateToken(userID, username, role, "access", tm.Expire, tm.Secret)
	if err != nil {
		return "", "", err
	}

	refreshToken, err = generateToken(userID, username, role, "refresh", tm.RefreshExpire, tm.Secret)
	if err != nil {
		return "", "", err
	}

	ctx := context.Background()
	if err := tm.storeToken(ctx, "access", accessToken, userID, tm.Expire); err != nil {
		return "", "", err
	}
	if err := tm.storeToken(ctx, "refresh", refreshToken, userID, tm.RefreshExpire); err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (tm *TokenManager) storeToken(ctx context.Context, tokenType string, token string, userID int, expireSeconds int) error {
	key := fmt.Sprintf("jwt:%s:%s", tokenType, token)
	cmd := tm.redis.B().Set().Key(key).Value(fmt.Sprintf("%d", userID)).ExSeconds(int64(expireSeconds)).Build()
	return tm.redis.Do(ctx, cmd).Error()
}

func parseAndValidateToken(tokenString string, secret string, expectedType string) (int, string, string, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("未知的签名方法: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return 0, "", "", errors.New("token 已过期")
		}
		return 0, "", "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, "", "", errors.New("无效的 token")
	}

	if claims["type"] != expectedType {
		return 0, "", "", errors.New("token 类型不匹配")
	}

	userIDFloat, okID := claims["user_id"].(float64)
	username, okName := claims["username"].(string)
	role, _ := claims["role"].(string)
	if !okID || !okName {
		return 0, "", "", errors.New("token 缺少必要的用户信息字段")
	}

	return int(userIDFloat), username, role, nil
}

func (tm *TokenManager) ValidateAccessToken(tokenString string) (int, string, string, error) {
	return parseAndValidateToken(tokenString, tm.Secret, "access")
}

func (tm *TokenManager) ValidateRefreshToken(tokenString string) (int, string, string, error) {
	return parseAndValidateToken(tokenString, tm.Secret, "refresh")
}

func (tm *TokenManager) RefreshAccessToken(refreshToken string) (newAccessToken string, newRefreshToken string, err error) {
	ctx := context.Background()

	// 检查 refresh token 在 Redis 中是否存在
	key := fmt.Sprintf("jwt:refresh:%s", refreshToken)
	existsCmd := tm.redis.B().Exists().Key(key).Build()
	exists, err := tm.redis.Do(ctx, existsCmd).AsInt64()
	if err != nil || exists == 0 {
		return "", "", errors.New("refresh token 无效或已过期")
	}

	// 解析 refresh token
	userID, username, role, err := tm.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", "", err
	}

	// 删除旧的 refresh token（轮换）
	delCmd := tm.redis.B().Del().Key(key).Build()
	tm.redis.Do(ctx, delCmd)

	// 生成新的双令牌
	return tm.GenerateTokens(userID, username, role)
}

func (tm *TokenManager) RevokeToken(ctx context.Context, token string) error {
	// 删除 access token
	accessKey := fmt.Sprintf("jwt:access:%s", token)
	delAccess := tm.redis.B().Del().Key(accessKey).Build()
	tm.redis.Do(ctx, delAccess)

	// 同时查找并删除 refresh token（从 token 解析 userID 不可行，
	// 因此删除同前缀的 refresh token 不现实。
	// 登出应同时提供 refresh token 来完整清理。
	return nil
}

// RevokeSession 完整登出：删除 access + refresh token
func (tm *TokenManager) RevokeSession(ctx context.Context, accessToken string, refreshToken string) error {
	accessKey := fmt.Sprintf("jwt:access:%s", accessToken)
	refreshKey := fmt.Sprintf("jwt:refresh:%s", refreshToken)
	delCmd := tm.redis.B().Del().Key(accessKey).Key(refreshKey).Build()
	return tm.redis.Do(ctx, delCmd).Error()
}

// IsTokenInRedis 检查 token 是否存在于 Redis（供 AuthFilter 使用）
func (tm *TokenManager) IsTokenInRedis(token string) bool {
	ctx := context.Background()
	key := fmt.Sprintf("jwt:access:%s", token)
	existsCmd := tm.redis.B().Exists().Key(key).Build()
	exists, err := tm.redis.Do(ctx, existsCmd).AsInt64()
	return err == nil && exists > 0
}

func generateRandomToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
