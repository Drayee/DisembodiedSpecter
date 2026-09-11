package service

import (
	"DisembodiedSpecter/internal/config"
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/dto/response"
	"DisembodiedSpecter/internal/service/global"
	globalStructs "DisembodiedSpecter/internal/service/global/structs"
	"DisembodiedSpecter/internal/utils"
	"DisembodiedSpecter/proto/pd"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"github.com/redis/rueidis"
	"google.golang.org/protobuf/proto"
)

// maxGlobalMessageSize 单条全局消息上限（与战斗一致，防内存 DoS）
const maxGlobalMessageSize = 1 << 20 // 1MB

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
		player:             map[int]struct{}{},
		key:                fmt.Sprintf("%s:ws-code", cfg.Cache.BaseKey),
		stateKey:           "global-state",
	}
}

// Connect 建立全局状态 WebSocket 连接：
//  1. 校验并消费 ws-code；2. 加载玩家的全局状态机（Machine，与 player_data_util 对齐）；
//  3. 升级后先下发一次 S2C_SyncState，随后循环接收二进制 GlobalMessage 并分发
//     （走动 move / 剧情进度 story_progress / 请求同步 sync_request）；
//  4. 断开时写回状态机并设置玩家数据过期。
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

	// 4. 连接即推一次状态快照（客户端据此刻恢复）
	if sErr := g.pushSyncState(c, ws, userID, 0); sErr != nil {
		log.Printf("[Global] 玩家 %d 初始状态推送失败: %v", userID, sErr)
	}

	// 断开时：写回状态机、移除在线实例、设置玩家数据 2 天过期
	defer func() {
		delete(g.player, userID)
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

	// 5. 循环：仅收二进制 GlobalMessage
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
		if msgType != websocket.MessageBinary {
			log.Printf("[Global] 忽略非二进制消息 type=%d, userId %d", msgType, userID)
			continue
		}
		if len(msg) > maxGlobalMessageSize {
			log.Printf("[Global] 消息超限 %d bytes, userId %d", len(msg), userID)
			_ = g.ack(c, ws, 0, false, "消息过大")
			continue
		}

		var gm pd.GlobalMessage
		if uErr := proto.Unmarshal(msg, &gm); uErr != nil {
			log.Printf("[Global] 全局消息解码失败: %v, userId %d", uErr, userID)
			_ = g.ack(c, ws, 0, false, "解码失败")
			continue
		}
		if hErr := g.handleGlobalMessage(c, ws, userID, &gm); hErr != nil {
			log.Printf("[Global] 处理消息失败: %v, userId %d", hErr, userID)
		}
	}
}

// ==================== 全局消息分发（二进制） ====================

func (g *GlobalUseCase) handleGlobalMessage(ctx context.Context, ws *websocket.Conn, userID int, gm *pd.GlobalMessage) error {
	switch p := gm.Payload.(type) {
	case *pd.GlobalMessage_Move:
		return g.handleMove(ctx, ws, userID, gm.GetSequenceId(), p.Move)
	case *pd.GlobalMessage_StoryProgress:
		return g.handleStoryProgress(ctx, ws, userID, gm.GetSequenceId(), p.StoryProgress)
	case *pd.GlobalMessage_SyncRequest:
		return g.pushSyncState(ctx, ws, userID, gm.GetSequenceId())
	default:
		return g.ack(ctx, ws, gm.GetSequenceId(), false, fmt.Sprintf("不支持的消息类型 %T", gm.Payload))
	}
}

// handleMove 大世界走动：更新状态机 Doing=Move + DoingMap{map,x,y}，同时写玩家 location。
func (g *GlobalUseCase) handleMove(ctx context.Context, ws *websocket.Conn, userID int, seq uint64, move *pd.C2S_Move) error {
	if move == nil || move.Pos == nil {
		return g.ack(ctx, ws, seq, false, "move 缺少 pos")
	}
	pos := move.Pos
	if !mapNameRe.MatchString(pos.MapName) {
		return g.ack(ctx, ws, seq, false, fmt.Sprintf("map 非法: %q", pos.MapName))
	}

	machine, err := g.globalEngine.GetMachine(ctx, userID)
	if err != nil {
		_ = g.ack(ctx, ws, seq, false, "状态机加载失败")
		return err
	}
	machine.Doing = globalStructs.Move
	machine.DoingMap = map[string]string{
		"map": pos.MapName,
		"x":   strconv.Itoa(int(pos.X)),
		"y":   strconv.Itoa(int(pos.Y)),
	}
	if err := g.globalEngine.SaveMachine(ctx, machine); err != nil {
		_ = g.ack(ctx, ws, seq, false, "状态机保存失败")
		return err
	}
	if err := g.playerDataManager.SetLocation(ctx, userID, domain.Location{
		Map: pos.MapName,
		X:   int(pos.X),
		Y:   int(pos.Y),
	}); err != nil {
		_ = g.ack(ctx, ws, seq, false, "位置保存失败")
		return err
	}
	return g.ack(ctx, ws, seq, true, "")
}

// handleStoryProgress 接收剧情进度 C2S_StoryProgress，校验后写入玩家数据
// （Redis Hash story_progress 字段，JSON 文本 {main, branches}；同步任务落 SQL）。
func (g *GlobalUseCase) handleStoryProgress(ctx context.Context, ws *websocket.Conn, userID int, seq uint64, story *pd.C2S_StoryProgress) error {
	if story == nil || story.Progress == nil {
		return g.ack(ctx, ws, seq, false, "story_progress 缺少 progress")
	}
	progress := story.Progress

	normalized := storyJSON{Branches: map[string]string{}}
	main := strings.TrimSpace(progress.Main)
	if main != "" && !validCursorPart(main) {
		return g.ack(ctx, ws, seq, false, fmt.Sprintf("main 游标非法: %q", main))
	}
	normalized.Main = main
	for key, val := range progress.Branches {
		k := strings.TrimSpace(key)
		if k == "" || !validCursorPart(k) {
			return g.ack(ctx, ws, seq, false, fmt.Sprintf("支线 key 非法: %q", k))
		}
		cursor := strings.TrimSpace(val)
		if cursor != "" && !validCursorPart(cursor) {
			return g.ack(ctx, ws, seq, false, fmt.Sprintf("支线游标非法: %q", cursor))
		}
		normalized.Branches[k] = cursor
	}

	raw, err := json.Marshal(normalized)
	if err != nil {
		return g.ack(ctx, ws, seq, false, "序列化失败")
	}
	if len(raw) > 2048 {
		return g.ack(ctx, ws, seq, false, "载荷过长")
	}
	if err := g.playerDataManager.SaveStoryProgress(ctx, userID, string(raw)); err != nil {
		_ = g.ack(ctx, ws, seq, false, "保存失败")
		return err
	}
	return g.ack(ctx, ws, seq, true, "")
}

// pushSyncState 下发 S2C_SyncState（doing/doing_map/level/exp/location/story）。
func (g *GlobalUseCase) pushSyncState(ctx context.Context, ws *websocket.Conn, userID int, seq uint64) error {
	machine, err := g.globalEngine.GetMachine(ctx, userID)
	if err != nil {
		return fmt.Errorf("状态机加载失败: %w", err)
	}
	playerData, err := g.playerDataManager.GetPlayerData(ctx, userID)
	if err != nil {
		return fmt.Errorf("玩家数据加载失败: %w", err)
	}

	story := parseStoryProgress(playerData.StoryProgress)

	sync := &pd.S2C_SyncState{
		Doing:    int32(machine.Doing),
		DoingMap: cloneStringMap(machine.DoingMap),
		Level:    int32(playerData.Level),
		Exp:      int32(playerData.Exp),
		Location: &pd.WorldPos{
			MapName: playerData.Location.Map,
			X:       int32(playerData.Location.X),
			Y:       int32(playerData.Location.Y),
		},
		Story: &pd.StoryProgressData{
			Main:     story.Main,
			Branches: story.Branches,
		},
	}
	return g.send(ctx, ws, &pd.GlobalMessage{
		SequenceId: seq,
		Timestamp:  time.Now().UnixMilli(),
		Payload:    &pd.GlobalMessage_SyncState{SyncState: sync},
	})
}

// ==================== 发送辅助 ====================

func (g *GlobalUseCase) send(ctx context.Context, ws *websocket.Conn, msg *pd.GlobalMessage) error {
	data, err := proto.Marshal(msg)
	if err != nil {
		return fmt.Errorf("全局消息编码失败: %w", err)
	}
	return ws.Write(ctx, websocket.MessageBinary, data)
}

func (g *GlobalUseCase) ack(ctx context.Context, ws *websocket.Conn, seq uint64, ok bool, reason string) error {
	return g.send(ctx, ws, &pd.GlobalMessage{
		SequenceId: seq,
		Timestamp:  time.Now().UnixMilli(),
		Payload:    &pd.GlobalMessage_Ack{Ack: &pd.S2C_Ack{Ok: ok, Reason: reason}},
	})
}

// ==================== 校验与序列化辅助 ====================

// storyJSON 剧情进度的存储/传输形态：{ main, branches }。
type storyJSON struct {
	Main     string            `json:"main"`
	Branches map[string]string `json:"branches"`
}

// cursorPartRe 游标/支线 key 的允许字符集：段地址数字点、分支字母、终态 .end。
// 见 docs/story-json-schema.md 的地址规则。
var cursorPartRe = regexp.MustCompile(`^[0-9A-Za-z._-]{1,64}$`)

// mapNameRe 地图标识允许字符（世界目录名），限制长度。
var mapNameRe = regexp.MustCompile(`^[0-9A-Za-z._/-]{1,64}$`)

func validCursorPart(s string) bool {
	return s != "" && cursorPartRe.MatchString(s)
}

func parseStoryProgress(raw string) storyJSON {
	out := storyJSON{Branches: map[string]string{}}
	if raw == "" {
		return out
	}
	_ = json.Unmarshal([]byte(raw), &out)
	if out.Branches == nil {
		out.Branches = map[string]string{}
	}
	return out
}

func cloneStringMap(src map[string]string) map[string]string {
	out := make(map[string]string, len(src))
	for k, v := range src {
		out[k] = v
	}
	return out
}
