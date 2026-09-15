# 战斗前端接入说明（Cocos / FightPanel）

> 本文档说明「后端战斗 → 前端演出」这套机制怎么工作、编辑器里要做什么、以及怎么验证。
> 配套改动见 `BATTLE_LOGIC.md`（协议与后端埋点）与 `proto/fight_message.proto`。

## 1. 机制一句话

**后端执行战斗时顺手记日志，前端按日志播动画。**

- 服务端在结算收口处（伤害/治疗/buff/出手/回合/结束）追加一条 `FightLog`；
- 每次下发权威状态**之前**先把这批日志发给客户端（`S2C_FightLogs`）；
- 前端把日志推进播放队列串行演出（出手 → 命中 → 飘字 → 血条补间），播完再把权威状态落地；
- 前端**不做任何战斗结算**：伤害数值、血量结果全部来自服务端，所以不存在双端算法分歧。

```
服务端                                      前端 (Cocos)
执行技能 ──► 记日志(CAST/ATTACK/BUFF…)  ──►  FightLogPlayer 队列
        └─► 写权威状态                    ──►  ① 逐条演出（BattleActor 动画/飘字/血条）
                                             ② 队列播空 → 落地权威状态（最终对齐）
                                             ③ 若在敌方回合 → 自动发 START_PHASE 继续
```

## 2. 文件清单

**新增（前端）**

| 文件 | 作用 |
|---|---|
| `front/assets/Scripts/layers/fight/FightLogPlayer.ts` | 日志播放队列：串行演出、倍速、跳过、播空回调 |
| `front/assets/Scripts/layers/fight/BattleActor.ts` | 单个战斗位的视图：站位、占位体、血条、buff 图标、飘字、动作演出 |
| `front/assets/Scripts/panels/FightPanel.ts` | 面板控制器：建场、演出调度、技能选择、结算、阶段推进 |
| `front/assets/resources/fight/battle.json` | 展示配置表（角色/敌人 DB ID → 名字、颜色、缩放、技能按钮） |

**修改（前端）**

| 文件 | 改动 |
|---|---|
| `managers/GameManager.ts` | 识别 `fightLogs` 并回调 `onFightLogs`；新增 `useSkills()` 批量提交；同步请求回带本地状态 |
| `api/websocket/proto/messages.js` / `.d.ts` | 由 proto 重新生成（新增 `FightLog`/`S2C_FightLogs`/`character_id`/`max_health`） |

**修改（后端）**：`proto/fight_message.proto`、`proto/pd/fight_message.pb.go`、
`internal/service/fight/structs/fight_log.go`（新增）、`structs/state_struct.go`、
`actuator/module.go`、`buff/buff_manger.go`、`fight_engine.go`、`check.go`、`internal/service/fight_usec.go`。

## 3. 编辑器里要做的事

### 3.1 必须（一步）

1. 用 **Cocos Creator 3.8.8** 打开 `front/`，等资源导入完成（会自动识别 3 个新脚本与 `resources/fight/battle.json`）。
2. 打开 `assets/Prefabs/UI/FightPanel.prefab`（双击进入编辑）。
3. 选中根节点 `FightPanel` → 属性检查器 → **添加组件 → 自定义脚本 → FightPanel**。
4. 保存预制体。

> 只做这一步，面板就能跑：所有 HUD 节点与技能按钮由脚本在运行时兜底创建。
> 下面的 3.2 是"把表现交给编辑器"的可选升级，做了之后脚本**不会覆盖**你排的位置与样式。

### 3.2 可选：用编辑器接管 HUD（推荐）

在根节点下建这些**同名节点**，脚本会直接绑定使用：

| 节点名 | 建议组件 | 用途 |
|---|---|---|
| `Content` | 空节点 | 舞台容器（默认用根节点） |
| `Character` | 空节点 | **战斗位容器**：我方在左、敌方在右，由脚本排布；重建战斗位时只清空它 |
| `HUD` | 空节点 | 下面这些 HUD 节点的父节点 |
| `HUD/RoundLabel` | Label | 回合数 |
| `HUD/PhaseLabel` | Label | 阶段提示（等待选择/我方结算/敌方回合） |
| `HUD/TipLabel` | Label | 操作提示 |
| `HUD/SkillRoot` | 空节点 | 技能按钮容器（按钮由脚本生成到这里） |
| `HUD/AttackBtn` | 空节点 + UITransform | 「出手」按钮（提交本回合行动） |
| `HUD/SpeedBtn` | 空节点 + UITransform | 倍速 ×1/×2/×4 |
| `HUD/SkipBtn` | 空节点 + UITransform | 跳过演出（立刻播完剩余日志） |
| `HUD/ResultRoot` | 空节点 | 结算面板容器（进场时自动隐藏） |
| `HUD/ResultRoot/ResultLabel` | Label | 结算文案（胜利/失败） |
| `HUD/ResultRoot/ExitBtn` | 空节点 + UITransform | 「离开战斗」 |

约定说明：

- 按钮节点：脚本会补 `Label` 子节点做文字（子节点名固定为 `Label`）；若按钮自己挂了 `Sprite`，选中高亮会走**染色**（不动你的美术），否则用脚本画的圆角底色。
- 战斗位节点是运行时创建的（`Character/Actor_0`、`Actor_1`…），**不需要**在编辑器里摆。
- 想要真美术：给 `Actor_*` 的 `Body` 节点挂 `Animation` 组件并放好命名的 Clip（`idle/attack/cast/hit/heal/die`），有同名 Clip 就播 Clip、否则走 tween 占位；或运行时调 `BattleActor.setArt(spriteFrame)` 换成 Sprite。

### 3.3 从世界/剧情进入战斗

现在 `FightPanel` 在 `onLoad` 里直接调 `GameManager.startBattle()`（沿用原有演示入口，无 token 时会用 `testuser/test123456` 演示登录）。
要做成正式入口，把这一步换成你的触发点，例如：

```ts
// WorldPanel / 剧情节点里
UIManager.getInstance().openPanel('FightPanel');
```

## 4. 战斗展示配置表 `resources/fight/battle.json`

```json
{
  "characters": {
    "1": { "name": "见习剑士", "color": [110, 170, 250], "scale": 1,
           "skills": [ { "id": 1, "name": "初击", "target": "enemy" } ] }
  },
  "enemies": { "1": { "name": "根眼怪", "color": [200, 95, 95], "scale": 0.92 } },
  "defaultSkills": [ { "id": 1, "name": "攻击", "target": "enemy" } ]
}
```

- 键是**角色/敌人 DB ID**（服务端已随状态下发 `CharacterStatus.character_id`）。
- `skills[].target`：`enemy` 选敌方、`ally` 选我方、`self` 自身。
- 改了不需要动代码。

## 5. 操作流程（玩起来是什么样）

1. 进面板 → 自动连接战斗 WS → 收到权威状态 → 建好站位与血条。
2. 阶段"等待选择技能"时，技能按钮可用；只有一个技能的角色**默认选中并自动选第一个合法目标**（点一下已选中的技能可取消，再点一次即进入选靶模式）。
3. 点「出手」→ 本回合全部角色的技能**一次提交**（服务端把一条消息当作整回合行动，分两次提交第二条会被拒）。
4. 我方结算 → 日志按序演出（出手/伤害/飘字/血条）→ 播完自动进入敌方回合并自动发 `START_PHASE`。
5. 敌方行动日志演出 → 回到等待选择。
6. 结算日志（`LOG_END`）到达 → 弹结算面板 →「离开战斗」退出并回世界。

## 6. 协议摘要（本次新增）

```proto
enum FightLogType { LOG_CAST=1; LOG_ATTACK=2; LOG_RECOVER=3; LOG_BUFF_ADD=4;
                    LOG_BUFF_REMOVE=5; LOG_DEATH=6; LOG_ROUND=7; LOG_END=8; }

message FightLog {
  int32 seq = 1; int32 type = 2;
  int32 source = 3; int32 target = 4;   // 战斗位索引（我方在前敌方在后）；-1 = 无
  int32 skill_id = 5; int32 buff_id = 6;
  int32 value = 7;                       // 伤害/恢复量；END 时 1=胜利 0=失败
  int32 hp_before = 8; int32 hp_after = 9;
  int32 round = 10; int32 state_number = 11;
  string text = 12;
}
message S2C_FightLogs { repeated FightLog logs = 1; }   // FightMessage 新增 oneof 分支

// CharacterStatus 新增：int32 character_id = 6;  int32 max_health = 7;
```

## 7. 怎么验证

**后端**

```powershell
# 构建缓存要用仓库内的 .gocache（沙箱/权限下默认 GOCACHE 可能不可写）
$env:GOCACHE="$PWD\.gocache"
go build ./...
go vet ./internal/...
go test ./internal/service/fight/actuator/ -v      # 日志埋点行为
```

**前端类型检查**（用 Cocos 自带的 TypeScript，不需要额外装依赖）

```powershell
cd front
node "C:\ProgramData\cocos\editors\Creator\3.8.8\resources\app.asar.unpacked\node_modules\typescript\lib\tsc.js" `
  -p tools/typecheck.tsconfig.json
```

`tools/typecheck.tsconfig.json` 里指向了 Cocos 编辑器自带的 `cc.d.ts`（`files` 字段），
换机器/换编辑器版本时改这个路径即可。

**端到端**：需要本机 Redis（`localhost:6379`，配置里 db 1）+ PostgreSQL（`localhost:5432`），
先跑 `go run ./cmd/mock` 灌种子数据，再 `go run ./cmd/main.go`，最后在 Cocos 预览里进 FightPanel。
Redis 没起时后端连不上，面板只会停在"等待服务端下发战斗状态…"。

## 8. 已知缺口 / 下一步

1. **技能表没有下发**：服务端只校验技能是否存在、是否属于该角色，但协议里没有"角色有哪些技能"，
   因此技能按钮列表目前来自 `battle.json`。要彻底解决应在 `FightStatus` 里下发我方角色的技能列表
   （或加一个 HTTP 内容接口），否则配置表与内容表可能不同步。
2. **美术资源**：目前是 Graphics 占位体 + tween 占位动画，`BattleActor.setArt()` 与 Animation Clip 槽位已留好。
3. **重连**：断开重连会重新建场并拿权威状态，但**不会重播历史演出**（日志是"一次性事件"，下发即清空）。
4. **多角色多技能**：后端限制"一个角色每回合一个技能"且"一条消息 = 一回合行动"，前端已按此实现（攒好再一次性提交）。
5. **buff 图标**只显示 buffID 色块，内容表里有名字/图标后可以接入。
6. **`assets/resources/protos/*.proto`** 是一份未被任何脚本引用的副本，且已与 `proto/` 漂移，本次未动它。
