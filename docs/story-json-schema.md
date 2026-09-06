# Story 剧情 JSON 数据规范

> 项目：DisembodiedSpecter（Cocos Creator 3.x）前端剧情系统
> 关联代码：`front/assets/Scripts/story/*`、`front/assets/Scripts/panels/StoryPanel.ts`

## 1. 数据位置与文件约定

- 段文件目录：`front/assets/Resources/story/data/`
- 一个 JSON 文件 = **一段（段）**，文件名为段地址前缀：`{篇}.{章}.{片}.{段}.json`
  - 主线示例：`1.0.0.1.json`（篇 1 章 0 片 0 段 1）
  - 支线示例：`0.1.0.1.json`（篇 0 即支线集合，章 1 即第 1 号支线，第 0 片第 1 段）
- 节点顺序推进依赖文件内 `nodes` **数组顺序**；跨段跳转必须显式写 `next`/`options[].next`。

## 2. 地址规则

完整地址：`篇.章.片.段.节点[.分支]`

| 部分 | 含义 | 示例 |
| --- | --- | --- |
| 篇 | 0 = 全部支线；1/2/… = 各主线篇 | `1` |
| 章 | 该篇内的章；支线下取 0 时表示支线编号含义（`0.1` = 第 1 号支线） | `0` |
| 片 | 章内的片（场景分区） | `0` |
| 段 | 一段连续剧情（一个文件） | `1` |
| 节点 | 段内 node 编号（剧情最小单位 = 事件） | `1` |
| 分支 | 可选字母后缀，表示同一节点的分支变体（一般由选项跳转进入） | `a` |

- 主线起点示例：`1.0.0.1.1`
- 分支目标示例：`1.0.0.1.3.a` → 文件 `1.0.0.1.json` 中 `id: "3.a"` 的节点
- **终端游标**：`{文件地址}.end`（如 `1.0.0.2.end`），表示该段剧情已完结，客户端据此不再续播该段。

## 3. 进度

- 单人单档：`StoryProgress = { main: string|null, branches: { "0.1": string|null } }`
- 游标含义 = “下一个待播放节点的地址”；`null` = 未开始。
- 主线游标存于 `main`；各支线游标按 `篇.章` 前缀存于 `branches`。
- 存储：内存镜像 + 本地（若离线）→ 通过 **global WebSocket**（`type:"story.save"`）上报后端 `players.story_progress`（JSON 文本列），一人一份，服务器为权威。

## 4. node（事件）结构

> 除 `type` 外，所有字段**可选**。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | 枚举 | 必填：`dialogue` / `narration` / `choice` / `stage` / `action` |
| `speaker` | string | dialogue：说话人名字 |
| `avatar` | string | dialogue：说话人头像 key（可选；映射 `story/image/{key}`，缺失自动隐藏） |
| `text` | string | dialogue / narration / choice / stage 的正文 |
| `options` | array | choice：`[{ text, next? }]`；`next` 为完整地址，缺省按段内顺序推进 |
| `next` | string | 本节点完成后的下一完整地址；缺省 = 段内顺序下一节点 |
| `stage` | object | stage：`{ bg?, avatar?, video? }`，key 映射 `story/image/{key}`、`story/video/{key}`，资源缺失自动跳过 |
| `action` | string | action：`"end"` 结束本次剧情——有 `next` 自动续播该地址；无 `next` 游标进入 `{file}.end` 并回大世界 |

### 各 type 说明

- `dialogue`：一个人说一句话（“一人一句 = 一个事件”）。表现：底部对话框 + 说话人名（可带头像/立绘）。
- `narration`：无说话人，屏幕文字描述。
- `choice`：向玩家提问，出现 2+ 选项按钮；每个选项可跳任意地址 → 分支剧情入口。
- `stage`：画面演出（切背景/立绘/预留视频），可带一句说明文字。
- `action`：系统动作。v1 仅支持 `"end"`（结束/续播），用于段末尾把剧情交还大世界。

## 5. 示例

`1.0.0.1.json`（主线序章第 1 段，摘录）：

```json
{
  "meta": { "title": "主线·序章（第 1 段：醒来）" },
  "nodes": [
    { "id": "1", "type": "dialogue", "speaker": "？？？", "text": "喂，醒醒。" },
    {
      "id": "3",
      "type": "choice",
      "text": "你张了张嘴，一时间不知从何问起。",
      "options": [
        { "text": "我是谁？", "next": "1.0.0.1.3.a" },
        { "text": "我为什么会在这里？", "next": "1.0.0.1.3.b" }
      ]
    },
    { "id": "3.a", "type": "dialogue", "speaker": "旅店老板", "text": "你是冒险者啊。……", "next": "1.0.0.1.4" },
    { "id": "5", "type": "action", "action": "end", "next": "1.0.0.2.1" }
  ]
}
```

## 6. 寻址推进规则（引擎行为）

1. 从游标地址开始，加载对应段文件，定位 `id = 节点键` 的 node。
2. dialogue / narration / stage：渲染后等待玩家点击 → 取下一目标。
   choice：等待玩家选择 → `options[i].next` 优先。
3. 下一目标优先级：`node.next` / 选项 `next` → 段内顺序下一节点 → 否则完结。
4. 每次推进都把新游标写入进度并（节流地）上报后端。
5. `action:"end"` 且无 `next`：游标置为 `{file}.end`，关闭剧情界面回到大世界。
