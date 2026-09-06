package service

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service/global"
	"DisembodiedSpecter/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
)

type GlobalUseCase struct {
	gameContentManager *utils.GameContentManager
	playerDataManager  *utils.PlayerDataManager
	globalEngine       *global.GlobalEngine
	redis              rueidis.Client
	player             map[int]struct{}

	key      string // ws-code 缓存 key 前缀
	stateKey string
}

func NewGlobalUseCase(gameContentManager *utils.GameContentManager, playerDataManager *utils.PlayerDataManager, globalEngine *global.GlobalEngine, redis rueidis.Client, cfg *config.Config) *GlobalUseCase {
	return &GlobalUseCase{
		gameContentManager: gameContentManager,
		playerDataManager:  playerDataManager,
		globalEngine:       globalEngine,
		redis:              redis,
		key:                fmt.Sprintf("%s:ws-code", cfg.Cache.BaseKey),
		stateKey:           "global-state",
	}
}

// Connect 建立全局状态 WebSocket 连接：
// 1. 校验并消费 ws-code；2. 加载玩家的全局状态机（Machine，与 player_data_util 对齐）；
// 3. 保持连接直至断开，断开时写回状态机并设置玩家数据过期。
func (g *GlobalUseCase) Connect(c *gin.Context, userID int, wsCode string) {
	// 1. 校验 ws-code（与战斗连接保持一致）
	varifyCode, cErr := g.redis.Do(c, g.redis.B().Get().Key(fmt.Sprintf("%s:%d", g.key, userID)).Build()).ToString()
	if cErr != nil {
		response.FailServer(c, cErr.Error())
		return
	}
	if varifyCode != wsCode {
		response.FailServer(c, "ws-code 无效")
		return
	}
	if dErr := g.redis.Do(c, g.redis.B().Del().Key(fmt.Sprintf("%s:%d", g.key, userID)).Build()).Error(); dErr != nil {
		response.FailServer(c, dErr.Error())
		return
	}
	if _, ok := g.player[userID]; ok {
		response.FailServer(c, "用户已连接")
		return
	}

	g.player[userID] = struct{}{}

	// 2. 加载玩家的全局状态机
	machine, err := g.globalEngine.GetMachine(c, userID)
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}
	log.Printf("[Global] 玩家 %d 接入，状态机加载完成: doing=%d level=%d exp=%d", userID, machine.Doing, machine.Level, machine.Exp)

	// 3. 升级为 WebSocket
	ws, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		response.FailServer(c, err.Error())
		return
	}

	// 断开时：写回状态机、移除在线实例、设置玩家数据 2 天过期
	defer func() {
		disconnectCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if sErr := g.globalEngine.Disconnect(disconnectCtx, userID); sErr != nil {
			log.Printf("[Global] 玩家 %d 状态机保存失败: %v", userID, sErr)
		}
		if eErr := g.playerDataManager.SetExpireOnExit(disconnectCtx, userID); eErr != nil {
			log.Printf("[Global] 玩家 %d 设置数据过期失败: %v", userID, eErr)
		}
		_ = ws.Close(websocket.StatusNormalClosure, "连接关闭")
	}()

	for {
		msgType, msg, err := ws.Read(c)
		if err != nil {
			if websocket.CloseStatus(err) == websocket.StatusNormalClosure ||
				websocket.CloseStatus(err) == websocket.StatusGoingAway {
				log.Printf("[Global] 客户端正常断开连接, userId %d", userID)
			} else {
				log.Printf("[Global] 读取消息错误或异常断开: %v, userId %d", err, userID)
			}
			break
		}
		if msgType != websocket.MessageText {
			log.Printf("[Global] 忽略非文本消息 type=%d, userId %d", msgType, userID)
			continue
		}
		if hErr := g.handleGlobalMessage(c, ws, userID, msg); hErr != nil {
			log.Printf("[Global] 处理消息失败: %v, userId %d", hErr, userID)
		}
	}
}

// ==================== 全局消息分发 ====================

// globalStoryProgress 剧情进度载荷：{ main, branches }，main=主线游标、branches=支线游标。
type globalStoryProgress struct {
	Main     *string            `json:"main"`
	Branches map[string]*string `json:"branches"`
}

// globalClientMessage 客户端 → 服务端 全局消息信封。
type globalClientMessage struct {
	Type     string               `json:"type"`
	Progress *globalStoryProgress `json:"progress"`
}

// cursorPartRe 游标/支线 key 的允许字符集：段地址数字点、分支字母、终态 .end。
// 见 docs/story-json-schema.md 的地址规则。
var cursorPartRe = regexp.MustCompile(`^[0-9A-Za-z._-]{1,64}$`)

func validCursorPart(s string) bool {
	return s != "" && len(s) <= 64 && cursorPartRe.MatchString(s)
}

func (g *GlobalUseCase) handleGlobalMessage(ctx context.Context, ws *websocket.Conn, userID int, raw []byte) error {
	var msg globalClientMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		return fmt.Errorf("消息 JSON 解析失败: %w", err)
	}
	switch msg.Type {
	case "story.save":
		return g.handleStorySave(ctx, ws, userID, msg.Progress)
	default:
		return fmt.Errorf("未知全局消息类型: %q", msg.Type)
	}
}

// handleStorySave 接收前端剧情进度 story.save，校验后写入玩家数据（Redis Hash，
// 由同步任务落 SQL players.story_progress），随后回执 story.ack。
func (g *GlobalUseCase) handleStorySave(ctx context.Context, ws *websocket.Conn, userID int, progress *globalStoryProgress) error {
	if progress == nil {
		return fmt.Errorf("story.save 缺少 progress 字段")
	}

	normalized := globalStoryProgress{Branches: map[string]*string{}}
	if progress.Main != nil && strings.TrimSpace(*progress.Main) != "" {
		main := strings.TrimSpace(*progress.Main)
		if !validCursorPart(main) {
			return fmt.Errorf("story.save main 游标非法: %q", main)
		}
		normalized.Main = &main
	}
	for key, val := range progress.Branches {
		k := strings.TrimSpace(key)
		if !validCursorPart(k) {
			return fmt.Errorf("story.save 支线 key 非法: %q", k)
		}
		if val != nil && strings.TrimSpace(*val) != "" {
			cursor := strings.TrimSpace(*val)
			if !validCursorPart(cursor) {
				return fmt.Errorf("story.save 支线游标非法: %q", cursor)
			}
			normalized.Branches[k] = &cursor
		} else {
			normalized.Branches[k] = nil
		}
	}

	raw, err := json.Marshal(normalized)
	if err != nil {
		return fmt.Errorf("story.save 序列化失败: %w", err)
	}
	if len(raw) > 2048 {
		return fmt.Errorf("story.save 载荷过长: %d bytes", len(raw))
	}

	if err := g.playerDataManager.SaveStoryProgress(ctx, userID, string(raw)); err != nil {
		return fmt.Errorf("保存剧情进度失败: %w", err)
	}

	ack := struct {
		Type string `json:"type"`
		OK   bool   `json:"ok"`
	}{Type: "story.ack", OK: true}
	ackBytes, _ := json.Marshal(ack)
	if err := ws.Write(ctx, websocket.MessageText, ackBytes); err != nil {
		return fmt.Errorf("发送 story.ack 失败: %w", err)
	}
	log.Printf("[Global] 玩家 %d 剧情进度已保存: %s", userID, string(raw))
	return nil
}
