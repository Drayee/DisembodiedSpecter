# 战斗系统（Battle Logic）说明

> 本文档描述 `internal/service/fight` 战斗系统的设计、状态机流程、消息协议与校验规则，
> 以及一次针对"战斗逻辑漏洞"的全面修复记录。

## 目录

1. [总体架构](#总体架构)
2. [战斗状态机](#战斗状态机)
3. [战斗流程](#战斗流程)
4. [消息协议](#消息协议)
5. [技能校验规则（CheckChoseSkill）](#技能校验规则checkchoseskill)
6. [技能执行三阶段](#技能执行三阶段)
7. [敌方回合](#敌方回合)
8. [胜负判定](#胜负判定)
9. [并发安全设计](#并发安全设计)
10. [漏洞修复记录](#漏洞修复记录)
11. [已知限制与 TODO](#已知限制与-todo)

## 总体架构

```
WebSocket 客户端
      │  protobuf(FightMessage)
      ▼
FightUseCase.Connect (internal/service/fight_usec.go)
      │  单连接单 goroutine 主循环
      ▼
FightEngine (internal/service/fight/fight_engine.go)
      ├── SkillManager    技能注册与反射执行 (character/)
      ├── EnemyManager    敌方行动注册与反射执行 (enemy/)
      ├── ActuatorManager 战斗位底层监听器：攻击/治疗/buff (actuator.go)
      └── GameContentManager 技能/角色/敌人数据源 (utils/)
      │  watermill gochannel（战斗级 pubsub）
      ▼
Machine (structs/state_struct.go) —— 权威战斗状态
```

- 服务器持有**权威状态**（`Machine`），客户端上报的状态仅用于比对，不一致时由服务器下发纠正。
- 底层结算（扣血/加血/buff）通过 **pubsub 事件** 由各战斗位的 `Actuator` 监听器异步执行。

## 战斗状态机

`Machine.StateNumber`：

| 状态 | 值 | 含义 |
|---|---|---|
| `Waiting` | 0 | 等待玩家选择技能（唯一可提交 `ChoseSkill` 的阶段） |
| `MyRound` | 1 | 我方技能已提交，正在执行/已执行完毕 |
| `OtherRound` | 2 | 敌方回合，等待前端 `START_PHASE` 触发敌方行动 |

状态流转：

```
Waiting --ChoseSkill(校验通过)--> MyRound --技能执行完--> OtherRound
OtherRound --SwitchPhase(START_PHASE)--> 敌方行动 --> Waiting
任意阶段 --SwitchPhase(EXIT_FIGHT)--> 战斗结束(断开连接)
任意阶段 --SwitchPhase(RETURN_PREV_PHASE)--> 恢复 LastStateNumber
```

## 战斗流程

1. **进入战斗**：`/api/ws/fight` WebSocket 连接，校验并消费 `ws-code`；
   通过 `PlayerDataManager` 读取玩家队伍（`character_team`）与对战 NPC（`doing_map` 的 `enemy_id`/`enemy_ids`），
   经 `GameContentManager` 加载角色/敌人数据构建 `CharacterState`；
   启动全部战斗位的底层监听器，并向客户端下发**初始权威状态**。
2. **技能选择**：客户端发送 `C2S_ChoseSkills`，服务器整体校验（见校验规则），任一项不合法则整体拒绝并同步权威状态。
3. **技能运行**：校验通过后记录本回合技能使用，按序执行 `Init → Listener → Run`（见技能执行）。
4. **我方行动结束**：回合数 +1、重置本回合技能记录、做胜负判定；
   未结束时自动进入敌方回合（`StateNumber = OtherRound`）并同步。
5. **敌方回合**：前端发送 `SwitchPhase(START_PHASE)`，服务器逐个调用敌方 `Action{enemyID}Run` 行动，
   再做胜负判定，回到 `Waiting` 并同步。
6. 未结束则重复 2–5。

## 消息协议

`FightMessage`（oneof payload），详见 `proto/fight_message.proto`：

| 消息 | 说明 |
|---|---|
| `C2S_ChoseSkills{ skills[] }` | 选择技能列表，每个 `Skill{ skill_id, target_id, character_id }` |
| `C2S_UseTool` | 使用道具（预留） |
| `C2S_SwitchPhase` | `START_PHASE` / `EXIT_FIGHT` / `RETURN_PREV_PHASE` |
| `Msg_SyncFightStatus` | 客户端上报战斗状态，服务器比对后决定是否下发权威状态 |

> 关键约定：**`target_id` 是战斗位索引**（0..N-1，我方在前、敌方在后，与 `FightStatus.characters` 数组下标一致），
> 不是角色/敌人 DB ID。`character_id` 是角色 DB ID，服务器通过 `SelfCharacterIndex` 映射校验其在本场战斗中。

## 技能校验规则（CheckChoseSkill）

选择技能时依次校验，全部通过才接受：

1. 战斗未结束（`Ended == false`），且当前处于 `Waiting` 阶段；
2. 技能存在，且 `skill.CharacterID == character_id`（技能组归属）；
3. `character_id` 在本场战斗的我方队伍中（`SelfCharacterIndex` 映射）；
4. 若已标记行动角色（`CharacterSite.IsMainActionCharacter`），技能只能由行动角色使用；
5. `target_id` 是合法战斗位索引（`0 <= target < len(CharacterState)`）；
6. 同一角色本回合不能重复使用技能（`CharacterUsedSkill`，每回合结束后重置）。

## 技能执行三阶段

`SkillManager.RunSkillStart` 按序执行（缺失的方法跳过，panic 会被捕获转错误）：

1. `Init` —— 主行动者行动（回合发动者），如 `Skill1Init` 发布攻击事件；
2. `Listener` —— 从行动者行动（战斗辅助者），如 `Skill2Listener` 订阅并联动；
3. `Run` —— 所有行动者终结技能。

技能方法通过反射注册（`Skill{skillID}Init/Listener/Run`），缺失的方法不会导致 panic。

## 敌方回合

`EnemyManager` 按敌方 DB ID 注册行动方法（`Action{enemyID}Run`）。
敌方行动发布攻击事件（如 `Action1Run` 随机攻击我方一个战斗位），
由对应的 `Actuator` 监听器异步结算伤害。

## 胜负判定

`Machine.CheckBattleEnd()`：

- 我方全部阵亡（`Health == 0`）→ **失败**；
- 敌方全部阵亡 → **胜利**；
- 无敌方目标 → 视为胜利。

判定在每次我方技能结算后与敌方行动结算后执行；结束后 `Ended=true`、`PlayerWin` 记录结果，
之后不再接受技能。奖励结算（经验/掉落）尚未实现，见 TODO。

## 并发安全设计

- 每个战斗连接一个 goroutine 主循环，**技能提交处理为同步执行**，避免提交竞态（TOCTOU）；
- `FightUseCase` 用 `mu` 保护 `fighter` 在线表与 `battleSession`，断开时清理在线标记（支持重连）；
- `Machine.Mu`（RWMutex）保护 `CharacterState`/`Counters` 等被监听 goroutine 与主循环并发访问的字段；
- 战斗级 pubsub 只创建一次，监听器只启动一次，避免重复订阅导致重复结算；
- 所有反射调用（技能/敌方行动）带 recover，防止 goroutine panic 拖垮进程；
- 单条战斗消息大小限制 1MB（防内存 DoS）。

## 漏洞修复记录

本次审查发现并修复的问题（按类别）：

| 类别 | 问题 | 修复 |
|---|---|---|
| 崩溃 | `ApplyChoseSkill` 把角色 ID 当数组下标 → 越界 panic | 改为以角色 ID 为键记录，新增 `SelfCharacterIndex` 映射 |
| 崩溃 | `ActuatorRegistry` 反射注册零值 Method，`NewActuator` 5 参被 3 参调用 → panic | 移除反射注册表，改为直接按战斗位索引启动监听器 |
| 崩溃 | 技能方法缺失仍注册（nil Func）→ 反射 panic | 缺失方法跳过注册；反射调用统一 recover |
| 崩溃 | `reflect.Type.Method.Func` 含 receiver，调用时未传 → 必崩 | 技能/敌方行动调用补传 receiver 参数 |
| 崩溃 | `StartListener` 遍历的是下标而非元素值，索引语义错乱 | 改为遍历战斗位索引并做边界校验 |
| 竞态 | `fighter`/`battleSession` 无锁并发写 | 增加 `mu` 互斥锁 |
| 竞态 | 断开后 `fighter` 不清理 → 无法重连 | `defer` 删除在线标记 |
| 竞态 | Machine 状态多 goroutine 无锁共享 | 增加 `Machine.Mu`，监听器/状态序列化加锁 |
| 竞态 | ChoseSkill 开 goroutine 并发提交 → 双技能/双结算 | 改为主循环同步处理；每战斗一个 pubsub |
| 逻辑 | 敌方回合未实现（`enemyManager.Run` 从未调用） | `OtherRound` 阶段调用 `runEnemyRound` |
| 逻辑 | 无胜负判定/死亡检测 | 新增 `CheckBattleEnd`，技能与敌方行动后判定 |
| 逻辑 | 技能使用记录永不重置 → 无法进入下一回合 | 每回合结束后重置 `CharacterUsedSkill`、`Round++` |
| 逻辑 | `LastTimeFight = machine` 自引用 | 移除自引用，改用 `LastStateNumber` 快照恢复 |
| 健壮 | 伤害无下限 | 伤害扣减后 `Health` 钳制到 ≥ 0 |
| 健壮 | 消息无大小限制 | 限制单条消息 1MB |

## 已知限制与 TODO

- **奖励结算**：`settle.go` 为空，战斗结束未发放经验/掉落/同步玩家数据（可接入 `PlayerDataManager.AddExp`/`AddItem`）；
- **pubsub 异步性**：伤害由监听器异步结算，胜负判定可能与结算存在极短窗口的延迟（约 1 轮）；
- **回合回滚**：`RETURN_PREV_PHASE` 仅恢复上一状态编号，未实现完整快照回滚；
- **技能实现不完整**：当前仅 `Skill1Init`/`Skill2Listener`/`Action1Run` 有实现，其余技能待补充；
- **行动角色标记**：`CharacterSite.IsMainActionCharacter` 尚未在战斗初始化时填充，行动角色限制检查暂未生效；
- **玩家间对战（PVP）**：`battleSession.Player2ID` 目前恒为 -1，仅支持玩家 vs NPC。
