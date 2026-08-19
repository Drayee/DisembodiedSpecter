// CLI 战斗试玩客户端。
//
// 用法:
//
//	go run ./cmd/play -server http://localhost:8080 -user testuser -pass test123456
//
// 命令:
//
//	<技能ID> <角色ID> <目标索引>   使用技能，例如: 1 1 1
//	start                       开始阶段（敌方回合时触发敌方行动）
//	status                      请求服务器下发权威状态
//	exit                        退出战斗
package main

import (
	"DisembodiedSpecter/proto/pd"
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/coder/websocket"
	"google.golang.org/protobuf/proto"
)

// apiResult 服务端统一响应体
type apiResult struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

func main() {
	server := flag.String("server", "http://localhost:8080", "服务器地址")
	username := flag.String("user", "testuser", "用户名")
	password := flag.String("pass", "test123456", "密码")
	flag.Parse()

	// 1. 登录获取 access token
	token, err := login(*server, *username, *password)
	if err != nil {
		log.Fatalf("登录失败: %v", err)
	}
	fmt.Println("✓ 登录成功")

	// 2. 从 JWT 中解析 user_id
	userID, err := userIDFromToken(token)
	if err != nil {
		log.Fatalf("解析 user_id 失败: %v", err)
	}
	fmt.Printf("✓ 用户ID: %d\n", userID)

	// 3. 获取 ws-code
	wsCode, err := getWsCode(*server, token)
	if err != nil {
		log.Fatalf("获取 ws-code 失败: %v", err)
	}
	fmt.Printf("✓ ws-code: %s\n", wsCode)

	// 4. 连接战斗 WebSocket
	host := strings.TrimPrefix(strings.TrimSuffix(*server, "/"), "http://")
	wsURL := fmt.Sprintf("ws://%s/api/ws/fight/%d/%s", host, userID, wsCode)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	conn, _, err := websocket.Dial(ctx, wsURL, &websocket.DialOptions{
		HTTPHeader: http.Header{"Authorization": []string{"Bearer " + token}},
	})
	if err != nil {
		log.Fatalf("连接战斗 WebSocket 失败: %v", err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "客户端退出")
	fmt.Printf("✓ 已连接战斗: %s\n\n", wsURL)

	// 5. 接收线程：渲染服务器下发的战斗状态
	go func() {
		for {
			_, data, err := conn.Read(ctx)
			if err != nil {
				fmt.Println("\n✗ 连接已断开:", err)
				cancel()
				os.Exit(0)
			}
			var msg pd.FightMessage
			if err := proto.Unmarshal(data, &msg); err != nil {
				continue
			}
			if st := msg.GetSyncFightStatus(); st != nil {
				renderFightStatus(st.GetStatus())
			}
		}
	}()

	printHelp()

	// 6. 主线程：读取用户输入
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		cmd := strings.ToLower(fields[0])
		switch cmd {
		case "exit", "quit", "q":
			sendSwitchPhase(conn, ctx, pd.Switch_Phase_Option_EXIT_FIGHT)
			fmt.Println("已发送退出战斗请求，等待服务器关闭连接...")
			// 不 return：服务器会发送正常关闭帧，由接收协程收尾后退出进程
			continue
		case "start", "s":
			sendSwitchPhase(conn, ctx, pd.Switch_Phase_Option_START_PHASE)
			fmt.Println("已发送开始阶段")
		case "status", "sync":
			sendSyncRequest(conn, ctx)
			fmt.Println("已请求服务器同步状态")
		case "help", "h":
			printHelp()
		default:
			if len(fields) != 3 {
				fmt.Println("格式错误: 应为 <技能ID> <角色ID> <目标索引>，或输入 help 查看帮助")
				continue
			}
			skillID, e1 := strconv.Atoi(fields[0])
			charID, e2 := strconv.Atoi(fields[1])
			target, e3 := strconv.Atoi(fields[2])
			if e1 != nil || e2 != nil || e3 != nil {
				fmt.Println("请输入数字")
				continue
			}
			sendChoseSkill(conn, ctx, int32(skillID), int32(charID), int32(target))
			fmt.Printf("已发送技能: 技能=%d 角色=%d 目标=[%d]\n", skillID, charID, target)
		}
	}

	// stdin 结束（如管道输入）：不立即退出进程，
	// 阻塞等待连接关闭，由接收协程在断开时 os.Exit(0)
	select {}
}

// ==================== HTTP 部分 ====================

func login(server, username, password string) (string, error) {
	body, _ := json.Marshal(map[string]string{"username": username, "password": password})
	resp, err := http.Post(server+"/api/v1/login", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var r apiResult
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", fmt.Errorf("解析登录响应失败: %v", err)
	}
	if r.Code != 0 {
		return "", fmt.Errorf("%s", r.Message)
	}
	var data struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(r.Data, &data); err != nil {
		return "", err
	}
	if data.AccessToken == "" {
		return "", fmt.Errorf("响应中缺少 access_token")
	}
	return data.AccessToken, nil
}

func getWsCode(server, token string) (string, error) {
	req, _ := http.NewRequest("GET", server+"/api/v2/ws-code", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var r apiResult
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", fmt.Errorf("解析 ws-code 响应失败: %v", err)
	}
	if r.Code != 0 {
		return "", fmt.Errorf("%s", r.Message)
	}
	var data struct {
		WsCode string `json:"wsCode"`
	}
	if err := json.Unmarshal(r.Data, &data); err != nil {
		return "", err
	}
	if data.WsCode == "" {
		return "", fmt.Errorf("响应中缺少 wsCode")
	}
	return data.WsCode, nil
}

// userIDFromToken 从 JWT 的 payload 中解析 user_id（仅解码，不验签）
func userIDFromToken(token string) (int, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return 0, fmt.Errorf("token 格式错误")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return 0, fmt.Errorf("解析 token payload 失败: %v", err)
	}
	var claims struct {
		UserID float64 `json:"user_id"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return 0, err
	}
	return int(claims.UserID), nil
}

// ==================== WebSocket 发送部分 ====================

func sendMsg(conn *websocket.Conn, ctx context.Context, msg *pd.FightMessage) {
	data, err := proto.Marshal(msg)
	if err != nil {
		log.Printf("序列化消息失败: %v", err)
		return
	}
	if err := conn.Write(ctx, websocket.MessageBinary, data); err != nil {
		log.Printf("发送消息失败: %v", err)
	}
}

func sendChoseSkill(conn *websocket.Conn, ctx context.Context, skillID, charID, target int32) {
	sendMsg(conn, ctx, &pd.FightMessage{
		Timestamp: time.Now().UnixMilli(),
		Payload: &pd.FightMessage_ChoseSkill{
			ChoseSkill: &pd.C2S_ChoseSkills{
				Skills: []*pd.Skill{{SkillId: skillID, CharacterId: charID, TargetId: target}},
			},
		},
	})
}

func sendSwitchPhase(conn *websocket.Conn, ctx context.Context, phase pd.Switch_Phase_Option) {
	sendMsg(conn, ctx, &pd.FightMessage{
		Timestamp: time.Now().UnixMilli(),
		Payload: &pd.FightMessage_SwitchPhase{
			SwitchPhase: &pd.C2S_SwitchPhase{Phase: phase},
		},
	})
}

// sendSyncRequest 发送空状态同步请求，服务器比对后发现不一致会下发权威状态
func sendSyncRequest(conn *websocket.Conn, ctx context.Context) {
	sendMsg(conn, ctx, &pd.FightMessage{
		Timestamp: time.Now().UnixMilli(),
		Payload: &pd.FightMessage_SyncFightStatus{
			SyncFightStatus: &pd.Msg_SyncFightStatus{Timestamp: time.Now().UnixMilli()},
		},
	})
}

// ==================== 渲染部分 ====================

func stateName(state int32) string {
	switch state {
	case 0:
		return "等待选择"
	case 1:
		return "我方回合"
	case 2:
		return "敌方回合"
	default:
		return "未知"
	}
}

func renderFightStatus(s *pd.FightStatus) {
	if s == nil {
		return
	}
	fmt.Println("\n==================== 战斗状态 ====================")
	fmt.Printf("回合: %d | 阶段: %s | 状态编号: %d\n", s.Round, stateName(s.StateNumber), s.StateNumber)
	for i, c := range s.GetCharacters() {
		side := "敌方"
		if c.GetIsMyCharacter() {
			side = "我方"
		}
		action := " "
		if i < len(s.GetSites()) && s.GetSites()[i] != nil && s.GetSites()[i].GetIsMainActionCharacter() {
			action = "*"
		}
		hp := c.GetHealth()
		if hp <= 0 {
			fmt.Printf("[%d] %s%s 阵亡\n", i, action, side)
			continue
		}
		fmt.Printf("[%d] %s%s HP:%d 攻:%.1f 防:%d buff:%d\n",
			i, action, side, hp, c.GetAttack(), c.GetDefense(), len(c.GetBuffs()))
	}
	if len(s.GetCounters()) > 0 {
		fmt.Print("计数器: ")
		for k, v := range s.GetCounters() {
			fmt.Printf("%s=%.1f ", k, v)
		}
		fmt.Println()
	}
	fmt.Println("===================================================")
}

func printHelp() {
	fmt.Println("=============== 试玩帮助 ===============")
	fmt.Println("  <技能ID> <角色ID> <目标索引>  使用技能，如: 1 1 1")
	fmt.Println("      （目标索引=敌方战斗位，见上方状态中的 [索引]）")
	fmt.Println("  start                      开始阶段（敌方回合时触发敌方行动）")
	fmt.Println("  status                     请求服务器下发权威状态")
	fmt.Println("  help                       显示帮助")
	fmt.Println("  exit                       退出战斗")
	fmt.Println("=====================================")
}
