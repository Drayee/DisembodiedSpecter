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
      │  只负责：连接生命周期 + 协议编解码 + 下发
      ▼
FightEngine (internal/service/fight/)
      ├── fight_engine.go  技能三阶段 / 回合武装 / 结算同步
      ├── round.go         回合编排：BeginRound / PlayerRound / EnemyRound（流程都在这里）
      ├── check.go         校验 + BuildFightStatus（权威状态快照）
      ├── log.go           战斗日志 → proto（唯一的协议转换点）
      ├── SkillManager     技能注册与反射执行 (character/)
      ├── EnemyManager     敌方行动注册与反射执行 (enemy/)
      ├── ActuatorManager  战斗位底层监听器 + 结算收口与记账 (actuator/)
      └── GameContentManager 技能/角色/敌人数据源 (utils/)
      │  watermill gochannel（战斗级 pubsub）
      ▼
Machine (structs/state_struct.go) —— 权威战斗状态
      └── structs/fight_log.go —— 战斗日志的唯一属主（类型/缓冲区/构造函数/counter 写入口）
```

分层与职责边界（"高聚合"的落点）：

| 层 | 只负责 | 不负责 |
|---|---|---|
| `service/fight_usec.go` | WebSocket 连接、协议编解码、把结果发下去 | 战斗流程、日志拼装、结算 |
| `fight/round.go` | 一回合怎么走（校验→执行→收尾→胜负→换边） | 收发、协议字段 |
| `fight/log.go` | 日志 → proto 的字段映射 | 决定"该不该记" |
| `structs/fight_log.go` | 日志类型/缓冲区/全部构造函数/counter 写入口 | 协议 |
| `actuator/actuator.go` | 结算 + **唯一记账点**（血量差） | 具体数值公式 |
| `actuator/module.go` | 纯数值（伤害/治疗怎么算） | 记账 |

- 服务器持有**权威状态**（`Machine`），客户端上报的状态仅用于比对，不一致时由服务器下发纠正。
- 底层结算（扣血/加血/buff）通过 **pubsub 事件** 由各战斗位的 `Actuator` 监听器异步执行；
  记账（战斗日志）统一收口在 `ActuatorManager.Apply`，因此**定制行为完全接管结算时也不会漏记**。
- 每次下发权威状态前，服务器先把"本批执行日志"（`S2C_FightLogs`）发给客户端；
  客户端据此回放演出动画，**不参与任何结算**（前端接入见 `docs/fight-frontend-setup.md`）。

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
OtherRound --SwitchPhase(START_PHASE)--> 敌方行动 --> Waiting（并进入下一回合：BeginRound）
任意阶段 --SwitchPhase(EXIT_FIGHT)--> 战斗结束(断开连接)
任意阶段 --SwitchPhase(RETURN_PREV_PHASE)--> 恢复 LastStateNumber
```

`Machine.Round` 的语义是**"当前正在进行的回合"**，由 `FightEngine.BeginRound` 在
"战斗开局"与"每次回到 Waiting 之前"各推进一次。
早期实现是在我方行动结束时 `Round++`，导致同一回合的我方日志带 `N-1`、敌方日志带 `N`
（`Round` 变成了"已完成回合数"）；现在同一回合内产生的所有日志携带同一个 `Round`，客户端可直接按它分组。

## 战斗流程

流程代码集中在 `fight/round.go`（`PlayerRound` / `EnemyRound`），`fight_usec.go` 只做协议转发。

1. **进入战斗**：`/api/ws/fight` WebSocket 连接，校验并消费 `ws-code`；
   通过 `PlayerDataManager` 读取玩家队伍（`character_team`）与对战 NPC（`doing_map` 的 `enemy_id`/`enemy_ids`），
   经 `GameContentManager` 加载角色/敌人数据构建 `CharacterState`；
   启动全部战斗位的底层监听器，`BeginRound` 进入第 1 回合，下发**初始权威状态**。
2. **技能选择**：客户端发送 `C2S_ChoseSkills` → `PlayerRound`：
   整体校验（见校验规则）——任一项不合法则整批拒绝、不执行任何技能，只回发权威状态。
3. **技能运行**：校验通过后记录本回合技能使用，按序执行 `Listener → Init → Run`（见技能执行）。
4. **我方回合收尾**：等事件全部结算完、真退订本回合监听器、清空本回合技能记录、做胜负判定；
   未结束时把状态推到 `OtherRound` 并同步（`Round` 不变——同一个回合还没走完）。
5. **敌方回合**：前端发送 `SwitchPhase(START_PHASE)` → `EnemyRound`：
   先用本回合技能集合重新武装监听器 → 逐个调用敌方 `Action{enemyID}Run` → 推进 buff 时间
   （这里是"我方+敌方"一个完整回合的收尾，`LossByTime` 各扣 1 格）→ 胜负判定；
   未结束时回到 `Waiting` 并 `BeginRound` 进入下一回合。
6. 未结束则重复 2–5。

## 消息协议

`FightMessage`（oneof payload），详见 `proto/fight_message.proto`：

| 消息 | 说明 |
|---|---|
| `C2S_ChoseSkills{ skills[] }` | 选择技能列表，每个 `Skill{ skill_id, target_id, character_id }` |
| `C2S_UseTool` | 使用道具（预留） |
| `C2S_SwitchPhase` | `START_PHASE` / `EXIT_FIGHT` / `RETURN_PREV_PHASE` |
| `Msg_SyncFightStatus` | 客户端上报战斗状态，服务器比对后决定是否下发权威状态 |
| `S2C_FightLogs{ logs[] }` | **服务端 → 客户端**的战斗日志（一次性的执行事件流，见下节） |

> 关键约定：**`target_id` 是战斗位索引**（0..N-1，我方在前、敌方在后，与 `FightStatus.characters` 数组下标一致），
> 不是角色/敌人 DB ID。`character_id` 是角色 DB ID，服务器通过 `SelfCharacterIndex` 映射校验其在本场战斗中。

### 战斗日志通道（S2C_FightLogs）

状态（`FightStatus`）回答"现在什么样"，日志回答"刚刚发生了什么"，两者互补、不可互相替代：

- **状态**是快照，可随时重发覆盖，用于对齐最终数值；
- **日志**是增量事件，下发一次即清空（`Machine.DrainLogs`），供客户端回放演出。

下发顺序固定为 **先日志、后状态**（`FightUseCase.sendFightStatus` 内部先调 `flushFightLogs`），
因此客户端总能"先按日志演完动画、再把权威状态落位"，血条与飘字不会与数值错位。

#### 事件类型（6 种）与各自的详情 message

每条日志是"信封 + 详情"：信封放通用字段（`seq`/`type`/`round`/`state_number`），
详情由 `FightLog.detail` 这个 **oneof** 承载，每种事件有独立的 message
（`AttackLog`/`RecoverLog`/`CounterLog`/`BuffLog`/`DeathLog`/`OtherLog`），
`type` 与 detail 分支一一对应（服务端保证）。

| 类型 | 详情 message | 记录位置（唯一入口） | 关键字段 |
|---|---|---|---|
| `LOG_ATTACK` | `AttackLog` | `actuator.Apply`（结算收口） | `source`/`target`/`damage`/`hp_before`/`hp_after`/`ref`/`special`/`other` |
| `LOG_RECOVER` | `RecoverLog` | `actuator.Apply` | 同上（`recover` 为实际恢复量） |
| `LOG_COUNTER` | `CounterLog` | `Machine.AddCounter`/`SetCounter`（唯一写入口）、`Machine.LogBuffCounter` | `key`/`delta`/`value`/`ref` |
| `LOG_BUFF` | `BuffLog` | `buff.AddBuff`（获得/刷新的最终时长只有它知道） | `source`/`target`/`buff_id`/`time`/`ref` |
| `LOG_DEATH` | `DeathLog` | `actuator.Apply`（血量由正跨到 0 时追加一条） | `source`/`target`/`ref` |
| `LOG_OTHER` | `OtherLog` | `Machine.LogOther`/`LogBattleEnd` | `detail`（JSON 原文，如 `{"op":"end","win":1}`） |

#### ref / special：用一个 int 表达"哪来的"

```
ref      （伤害/效果的来源）      > 0 技能 ID ；< 0 −buffID ；= 0 被动（含普攻、永久行为）
special  （本次触发的被动/受击）  > 0 角色 DB ID（自身被动生效）；< 0 −buffID ；= 0 无
```

编码/解码只能用 `structs.RefSkill/RefBuff/RefSkillID/RefBuffID`，不要手写正负号。
`ref` 由发布方在事件载荷里声明（`Attack.Ref`/`BuffMessage.Ref`/`Recover.Ref`），
因为只有发布点知道"这一下是技能打的、buff 触发的，还是被动补的"；
`special` 由定制行为在结算过程中写到 `Effect.Special` 上（见下）。

#### 设计要点

- **记账收口在 `actuator.Apply`**：调用定制行为前后各读一次目标血量，用**血量差**记录最终伤害/恢复。
  这样即便定制行为完全接管结算（`Character2AttackListener` 用龙力抵消伤害、自己动 buff 而不碰血量），
  也一定会留下一条攻击日志（0 伤害 + `special` 指明是被谁挡下的），客户端因此能播"格挡"而不是"凭空无事"。
  早先把记账放在 `actuator/module.go`，那条路径一旦被定制行为接管就完全静默——这是本次重构修掉的核心问题。
- **数值取血量差**：各伤害类型（普通/真实/雷/火）与防御减免口径不同，用血量差记账既不重复计算，
  也不会与结算逻辑产生分歧（被抵消的部分天然不计入 `damage`）。
- **计数器只有一个写入口**：`Counters` 的写入全部走 `AddCounter`/`SetCounter`，它们内部自动记 `LOG_COUNTER`，
  因此技能逻辑漏记日志这件事在结构上不可能发生。
- **buff 层数/时间变化走 `LOG_COUNTER`**：键约定 `buff:<buffID>:<战斗位索引>`，值即剩余层数，归零即失效，
  因此不需要单独的"buff 消失"事件。buff 的真值在 `CharacterState.Buffs[].Time` 上，
  所以 `LogBuffCounter` **只记日志、不写 Counters**（避免同一份数据两个属主）。
- **没有"出手/CAST"事件**：出手动作由攻击事件自身承载（`AttackLog.Source` 就是出手方），
  被动追加攻击因此天然也会播出手动画。**回合推进、阶段切换不下发日志**，客户端从 `status.round`/`state_number` 取。
- **日志顺序 = 真实因果顺序**：例如"用龙力抵消"时，`LOG_COUNTER`（层数 −1）会排在 `LOG_ATTACK` 之前——
  因为消耗 buff 发生在结算过程中，而"0 伤害 + special"只有结算完才知道。客户端按序播即可。
- **锁约定**：`Machine.Logs` 只由独立的 `LogMu` 保护，**不用 `Machine.Mu`**
  （结算路径在持 `Mu` 的区间里记账，共用一把锁会自锁死）。顺序只能是 `Mu → LogMu`；
  `AddCounter`/`SetCounter` 反过来要求**调用方已持有 `Machine.Mu`**（`Counters` 会被 `BuildFightStatus` 在读锁下遍历）。
- 前端消费方式见 `docs/fight-frontend-setup.md`。

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

1. `Listener` —— **武装本回合的监听器**（从行动者/被动），如 `Skill2Listener` 注册"追加攻击"；
2. `Init` —— 主行动者行动（回合发动者），如 `Skill1Init` 发布攻击事件；
3. `Run` —— 所有行动者终结技能。

**为什么 `Listener` 必须排在 `Init` 之前**：发布事件时会把"本 topic 当前的监听器数量"写进消息
（反应版本戳），负责该事件的 actuator 会等这么多监听器打完点才结算。若监听器在 `Init` 之后
才装上，`Init` 阶段发出的伤害事件到达时监听器还没就位，被动技能就永远打不到主动技能的伤害。

回合结束（`FightEngine.EndRound`）会先等事件全部结算完，再 `machine.StopReactors()`
**真退订**本回合的全部监听器 —— 因此回合之间相互独立，上一回合用过的技能不会残留到下一回合。
敌方回合不跑技能阶段，由 `ArmRoundReactors` 用本回合技能集合重新武装。

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

判定在每次我方回合收尾（`PlayerRound`）与敌方回合收尾（`EnemyRound`）后执行；
结束后 `Ended=true`、`PlayerWin` 记录结果，并记一条 `LOG_OTHER`（`{"op":"end","win":N}`），
之后不再接受技能。奖励结算（经验/掉落）尚未实现，见 TODO。

## 并发安全设计

- 每个战斗连接一个 goroutine 主循环，**技能提交处理为同步执行**，避免提交竞态（TOCTOU）；
- `FightUseCase` 用 `mu` 保护 `fighter` 在线表，断开时清理在线标记（支持重连）；
- `Machine.Mu`（RWMutex）保护 `CharacterState`/`Counters` 等被监听 goroutine 与主循环并发访问的字段；
- `Machine.LogMu` 保护日志缓冲区（`Logs`/`LogSeq`），与 `Mu` 分离以避免结算路径自锁死，
  顺序固定为 `Mu → LogMu`；
- 计数器的**写入**有两个来源（技能主循环、buff/被动 goroutine），全部收口到
  `AddCounter`/`SetCounter` 并统一要求持有 `Machine.Mu`（本次顺带修掉了 `character.go`、
  `psychecate.go`、`Lillian.go` 里若干处裸写 map 且未加锁的竞争）；
- 战斗级 pubsub 只创建一次，监听器只启动一次，避免重复订阅导致重复结算；
- 所有反射调用（技能/敌方行动/定制行为）带 recover，防止 goroutine panic 拖垮进程；
- 单条战斗消息大小限制 1MB（防内存 DoS）。

## 漏洞修复记录

> 分批记录：第一段是早期的战斗逻辑审查，第二段是本次（日志通道 + 高聚合重构）的修复。

**早期审查（战斗逻辑）**

| 类别 | 问题 | 修复 |
|---|---|---|
| 崩溃 | `ApplyChoseSkill` 把角色 ID 当数组下标 → 越界 panic | 改为以角色 ID 为键记录，新增 `SelfCharacterIndex` 映射 |
| 崩溃 | `ActuatorRegistry` 反射注册零值 Method，`NewActuator` 5 参被 3 参调用 → panic | 移除反射注册表，改为直接按战斗位索引启动监听器 |
| 崩溃 | 技能方法缺失仍注册（nil Func）→ 反射 panic | 缺失方法跳过注册；反射调用统一 recover |
| 崩溃 | `reflect.Type.Method.Func` 含 receiver，调用时未传 → 必崩 | 技能/敌方行动调用补传 receiver 参数 |
| 崩溃 | `StartListener` 遍历的是下标而非元素值，索引语义错乱 | 改为遍历战斗位索引并做边界校验 |
| 竞态 | `fighter`/`battleSession` 无锁并发写 | 增加 `mu` 互斥锁（后续 `battleSession` 因无人读取已删除） |
| 竞态 | 断开后 `fighter` 不清理 → 无法重连 | `defer` 删除在线标记 |
| 竞态 | Machine 状态多 goroutine 无锁共享 | 增加 `Machine.Mu`，监听器/状态序列化加锁 |
| 竞态 | ChoseSkill 开 goroutine 并发提交 → 双技能/双结算 | 改为主循环同步处理；每战斗一个 pubsub |
| 逻辑 | 敌方回合未实现（`enemyManager.Run` 从未调用） | `OtherRound` 阶段调用敌方回合流程 |
| 逻辑 | 无胜负判定/死亡检测 | 新增 `CheckBattleEnd`，两个回合收尾后判定 |
| 逻辑 | 技能使用记录永不重置 → 无法进入下一回合 | 每回合结束后重置 `CharacterUsedSkill` |
| 逻辑 | `LastTimeFight = machine` 自引用 | 移除自引用，改用 `LastStateNumber` 快照恢复 |
| 健壮 | 伤害无下限 | 伤害扣减后 `Health` 钳制到 ≥ 0 |
| 健壮 | 消息无大小限制 | 限制单条消息 1MB |

**本次（日志通道 + 高聚合重构）**

| 类别 | 问题 | 修复 |
|---|---|---|
| 逻辑 | **定制行为接管结算时完全无日志**：记账原先在 `actuator/module.go`，而定制行为一旦注册就直接 return、不再走默认结算（`Character2AttackListener` 用龙力抵消伤害时前端"凭空无事"） | 记账上移到 `ActuatorManager.Apply`：结算前后各读一次血量、用血量差记账；`Effect.Special` 让定制行为声明"我消耗了哪个 buff/哪个被动生效了" |
| 逻辑 | 负血量漏到客户端 | 结算后 `Health` 钳制到 ≥ 0（原先只钳了伤害值） |
| 逻辑 | `Round` 语义错位：同一回合的我方日志带 `N-1`、敌方带 `N`（早先在我方行动结束时 `Round++`，语义变成"已完成回合数"） | `Round` 改为"当前正在进行的回合"，由 `BeginRound` 在开局与每次回到 `Waiting` 前推进 |
| 逻辑 | buff 层数消耗静默（龙力 3→2 无任何事件；只有归零时才有"buff 消失"） | buff 层数/时间变化统一走 `LOG_COUNTER`（键 `buff:<buffID>:<战斗位>`，值即剩余量，归零即失效），不再需要独立的"buff 消失"事件 |
| 竞态 | `Counters` 有多处裸写 map 且未加锁（`Character2Permanent` 在 goroutine 里 `++`、`Skill3Init`/`Skill4Run`/`Skill5Init` 读写不加锁），与 `BuildFightStatus` 的读锁遍历构成数据竞争 | 计数器写入收口到 `AddCounter`/`SetCounter`（唯一入口，内部自动记日志），调用点统一补上 `Machine.Mu` |
| 健壮 | 日志拼装散落在 5 个文件、字段语义（ref/special 正负）无单一定义 | `structs/fight_log.go` 成为日志唯一属主（类型/缓冲区/全部构造函数/counter 入口），协议转换集中在 `fight/log.go` |
| 结构 | `service/fight_usec.go` 同时承担连接、协议、战斗流程、日志记账（低聚合） | 回合编排下沉到 `fight/round.go`（`PlayerRound`/`EnemyRound`），usecase 只留 WS + 协议收发 |
| 结构 | 死代码：空文件 `settle.go`、只写不读的 `BattleSession` | 删除（奖励结算后续单独实现时再建新文件） |

## 已知限制与 TODO

- **奖励结算**：战斗结束未发放经验/掉落/同步玩家数据（可接入 `PlayerDataManager.AddExp`/`AddItem`）；
  原先占位的空文件 `settle.go` 已删除；
- **结算时序**：结算是"收到事件即结算"（各战斗位 actuator 负责），主循环在胜负判定与状态同步前调用 `FightEngine.WaitSettled` 等事件全部落地；原先固定睡眠 20ms 的 `battleSettleDelay` 已移除，改为"待结算事件归零 + 空闲确认"，无事可等时立即返回；
- **回合回滚**：`RETURN_PREV_PHASE` 仅恢复上一状态编号，未实现完整快照回滚；
- **技能实现不完整**：仅有 `Skill1Init`/`Skill2Init`/`Skill2Listener`/`Skill3Init`/`Skill4Listener`/`Skill4Run`/`Skill5Init`/`Action1Run`，其余技能待补充；
- **自定义 buff 监听器可绕过日志**：`buff.AddBuff` 之外的"获得 buff"路径（例如某个定制 `GetBuffListener` 自己接管施加）不会自动产生 `LOG_BUFF`，需要自行调用 `machine.LogBuff`；
- **技能表未下发**：协议里没有"某角色拥有哪些技能"，服务端只校验技能是否存在/归属；
  彻底解决应在 `FightStatus` 里补我方角色的技能列表（或加内容查询接口）；
- **行动角色标记**：`CharacterSite.IsMainActionCharacter` 尚未在战斗初始化时填充，行动角色限制检查暂未生效；
- **玩家间对战（PVP）**：仅支持玩家 vs NPC（原先恒为 -1 的 `BattleSession.Player2ID` 随该结构一并移除）。
