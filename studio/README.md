# 幽影工坊 · DisembodiedSpecter Studio

与 `front/`（Cocos 客户端）**同层的独立前端工作台**，一个工程里装两件事：

| 模块 | 路由 | 说明 |
| --- | --- | --- |
| **剧情编排** | `#/story` | 节点/分支/立绘/舞台编排、流程图、台词表格、资源库、校验、导出 zip |
| **后台管理** | `#/admin/*` | 对接后端 `/api/v3/admin/*`：数据概览、用户、玩家、角色、敌人、道具、技能、Buff、邮箱配置 |

> 本工程是从 `front/tools/story-editor/`（已删除的零依赖静态工具）**整体迁移并重写**而来：
> 数据模型、地址规则、立绘布局、校验器、zip 格式全部保持与引擎一致，界面则按统一设计系统重排，
> 解决旧工具「样式重叠、间距紧凑」的问题。

## 技术栈

| 项 | 版本 | 用途 |
| --- | --- | --- |
| Vue | 3.5 | 组合式 API + `<script setup>` |
| Vite | 8 | 开发服务器 / 构建 |
| TypeScript | 5.9 | 严格模式；`vue-tsc` 做 SFC 类型检查 |
| Tailwind CSS | 4 | `@tailwindcss/vite` 插件 + CSS-first `@theme` 令牌 |
| Pinia | 4 | 状态（auth / feedback / theme / story） |
| vue-router | 5 | hash 路由（构建产物可直接放任意静态目录） |
| axios | 1.20 | 统一响应体拆包 + 401 单飞刷新 |
| @lucide/vue | 1.x | 图标 |

> ⚠️ 版本注意：`vue-tsc` 目前**不支持 TypeScript 7**（TS7 移除了 `./lib/tsc` 导出），
> 所以 `typescript` 固定在 `^5.9`。升级 TS 前请先确认 `vue-tsc` 已支持。

## 快速开始

```bash
cd studio
npm install
npm run dev        # http://localhost:5273
```

后端联调：

- 开发期 `vite.config.ts` 把 `/api` 代理到 `http://localhost:8080`（`config.yaml` 的 `app.port`），
  目标是 `.env.development` 里的 `VITE_PROXY_TARGET`，需要指向别的后端就改它。
- 生产构建用 `VITE_API_BASE` 指定后端根地址；留空表示与前端同源（由网关反代 `/api`）。

其他脚本：

```bash
npm run typecheck   # vue-tsc --noEmit
npm run build       # 先类型检查，再 vite build → dist/
npm run build:only  # 只构建
npm run preview     # 本地起静态服务看 dist
```

## 一、剧情编排（`#/story`）

### 界面结构

```
┌─ 工具栏 ── 段选择 / 段标题 / 新建段 / 删除段 │ 保存状态 · 载入示例 · 新建工程 · 导入 zip · 导出本段 · 导出 zip · 校验
├─ 标签栏 ── 预览 │ 流程图 │ 表格 │ 资源库 │ 词典·物品 │ 校验
├──────────────┬──────────────────────────────────┬──────────────┐
│ 节点列表      │ 工作区（随标签切换）              │ 属性面板      │
│ 5 种类型新增  │ 1280×720 预览 / SVG 流程图 / ...  │ 按节点类型变化 │
│ 拖拽排序      │                                  │ 立绘 / 舞台   │
└──────────────┴──────────────────────────────────┴──────────────┘
```

左右两栏宽度可拖拽调节并记忆在 `localStorage`；所有面板各自滚动，不会互相覆盖。

### 各标签页能力

| 标签 | 能力 |
| --- | --- |
| **预览** | 16:9 舞台按容器等比缩放（`ResizeObserver` 算 scale，绝不压扁）；背景层在下、立绘居中、CG 层在上；**拖拽立绘写回 `x`**、双击切镜像；播放模式可「试跑 / 下一步 / 停止」，选项节点可点分支；缺失资源显示占位而不是空白 |
| **流程图** | 分层布局 + next/顺序/选项连线；点「连线：next」或某个「选项N」后点目标节点即写入地址；跨段跳转用橙色虚线标注且点标签可跳过去；错误/警告节点描边着色；支持缩放 |
| **表格** | 批量改台词/说话人/next；bg/cg 三态（空=保持、`-`=隐藏、`key`=指定）；导出/导入 CSV |
| **资源库** | 拖拽或选择上传图片（IndexedDB 存储）；key 内联重命名（自动同步全部引用）、删除（提示引用位置）、引用计数、缩略图 |
| **词典·物品** | 术语词典（属性面板可一键插入 `⟦术语⟧` 标记）、物品/信件库（字段按未来引擎指令预留） |
| **校验** | 全工程问题清单，点条目跳到对应节点 |

### 数据约定（与引擎严格对齐）

- 段文件名 = `篇.章.片.段`（如 `1.0.0.1`），导出路径 `story/data/{文件名}.json`
- 节点键 = 段内 `id`（`3` 或分支变体 `3.a`）；地址 = `{file}.{key}`；终态 = `{file}.end`
- 立绘 `slot` 1~8；不给 `x` 时 1 个居中、多个按「左、右、左、右…」自动排开；`name === speaker` 的立绘高亮，其余压暗
- 舞台 `bg`/`cg`：**有值 = 显示、`""` = 隐藏、字段缺省 = 保持上一幕**
- 导出 zip 结构：

```
story/data/*.json            ← 段文件
story/image/{key}/*          ← 背景 / 立绘 / CG（一个 key 一张图，与 spriteFrame 加载方式一致）
assets-manifest.csv          ← 资源清单（给美术）
dialogue-list.csv            ← 台词表（给本地化 / 配音）
```

解压后覆盖到 `front/assets/resources/story/` 即可被游戏读取。

### 校验器覆盖的规则

地址悬空（指向不存在的段/节点）、地址格式非法、不可达节点、跳转环、slot 越界/重复、facing 非法、
资源缺失（被引用但不在资源库）、资源未使用、文本超长、空文本/空选项、对白缺说话人、未知节点类型、
未实现的动作类型、段文件名格式。

### 存储与深链

- 工程数据：`localStorage`（键 `ds-studio.story.project.v1`，改动后 800ms 防抖自动保存）
- 图片资源：`IndexedDB`（库 `ds-studio-story`，store `assets`）
- 深链参数（写在 hash 里）：`#/story?demo=1&tab=flow`
  - `demo=1`：当前工程为空时自动载入示例剧情（含 canvas 现场生成的 3 张占位美术）
  - `tab=`：直接打开某个标签（`preview` / `flow` / `table` / `assets` / `extra` / `lint`）

> 剧情模块**不依赖后端**：不需要登录即可使用，适合策划/美术单独使用。

## 二、后台管理（`#/admin/*`）

需要后端 admin 令牌：先在 `#/login` 用 `POST /api/v1/login` 登录（账号必须是 `admin` 角色），
token 存在 `localStorage`，axios 拦截器自动附带 `Authorization: Bearer`。

| 页面 | 路由 | 用到的接口 |
| --- | --- | --- |
| 数据概览 | `#/admin/overview` | `stats/overview` · `stats/online` · `stats/items` |
| 用户管理 | `#/admin/users` | `users/list` · `users/:id/role` · `users/:id/disable` · `users/:id/enable` |
| 玩家管理 | `#/admin/players` | `players/list` · `players/:id` · `ban` · `unban` · `level` · `exp` |
| 角色 / 敌人 / 道具 / 技能 / Buff | `#/admin/content/*` | `game/{characters,enemies,tools,skills,buffs}` 的 `list` / `:id` / `POST` / `PUT` |
| 邮箱配置 | `#/admin/config/emails` | `config/emails` · `config/emails/:id` |

### 请求层约定

后端统一响应体 `{ code, message, data }`（`internal/dto/response/result.go`）：

- `code === 0` 才算成功，`request()` 直接返回 `data`，业务代码不碰外壳
- 非 0 一律抛 `ApiError`（`@/api/client`），带 `code` / `httpStatus` 与 `isUnauthorized` / `isForbidden` / `isInvalidParam`
- `401`/`4002` 触发**单飞刷新**（并发请求只发一次 `POST /api/v1/refresh`）并自动重放原请求；
  刷新失败则清空会话、跳登录页并提示原因
- 网络不可达 / 超时给出「后端是否在运行 / 代理配置」这类可操作的提示

### 写接口的三个坑（已在 UI 侧防住）

1. **PUT 是整体替换**：所有编辑表单都先调 `detail(id)` 拉全量再回填；`detail` 失败则关闭抽屉且不允许提交，
   防止用空表单把字段清空。
2. **Buff 的 `type` / `loss_way` 是必填枚举**：提交时固定带全 `name/type/loss_way/default_duration/effects/description`。
3. **后端无删除接口**：内容管理页一律只有「新建 / 编辑」，没有删除按钮。

### 需要和后端确认的点

- `stats/online` 的 `online_count` 目前恒为 0（后端 TODO：接 WebSocket 连接数），页面已如实标注
- `config/emails` 返回的 `pass` 若为掩码串，则「不改密码直接保存」会把掩码写回库
- 角色写接口的 `owner_number` 只写不回显（`detail` 不返回），语义按「0 = 不改动归属」实现

## 三、设计系统（`src/styles/main.css`）

统一的令牌 + 少量组件类，是这次重排的根基：

- **语义色**：`--s-surface/-2/-3`、`--s-line`、`--s-text` 等语义变量，深色/浅色两套值挂在 `:root` 与
  `[data-theme]` 上，再经 `@theme inline` 注册成 `bg-surface` / `text-muted` / `border-line` 等工具类 → 支持运行时换肤
- **层级约定**：内容 0 · 吸顶工具条 10 · 浮层锚点 20 · 下拉 30 · 抽屉 40 · 模态 50 · Toast 60
- **布局约定**：分栏一律 `flex + min-h-0 + overflow`，禁止用绝对定位堆叠内容；每个滚动容器只负责自己那一段
- **组件类**：`.panel` / `.btn(-primary/-danger/-success/-ghost/-sm/-icon)` / `.input|.textarea|.select` /
  `.field(-label/-hint)` / `.badge(-accent/-ok/-warn/-danger/-info)` / `.row-item` / `.data-table` / `.tab` /
  `.empty-state` / `.splitter` / `.card`
- **公共组件**（`src/components/ui/`）：`UiPage`、`UiPageHeader`、`UiModal`、`UiDrawer`、`UiField`、
  `UiDataTable`、`UiPagination`、`UiTabs`、`UiSegmented`、`UiSwitch`、`UiBadge`、`UiEmpty`、`UiSplitter`、
  `UiToastHost`、`UiConfirmHost`（原生 `confirm` 已全部替换为统一观感的模态）

## 目录结构

```
studio/
├── index.html
├── vite.config.ts            # 别名 @ → src、/api 代理、Tailwind 插件
├── tsconfig.json
├── .env.development          # VITE_PROXY_TARGET
├── .env.production           # VITE_API_BASE
└── src/
    ├── main.ts / App.vue
    ├── router/index.ts       # hash 路由 + admin 守卫
    ├── styles/main.css       # 设计令牌 + 组件类
    ├── api/                  # client(拆包/刷新/错误) · session · auth · admin · types
    ├── stores/               # auth · feedback(toast/confirm) · theme
    ├── components/ui/        # 通用组件 + types.ts（TableColumn 等）
    ├── layouts/AppShell.vue  # 侧栏导航 + 顶栏
    └── story/                # 剧情模块（与 UI 无关的纯逻辑）
    │   ├── types.ts          # 与 StoryTypes.ts 对齐的数据模型
    │   ├── model.ts          # 地址规则 / 立绘布局 / 校验器
    │   ├── zip.ts            # 无依赖 ZIP 读写
    │   ├── io.ts             # IndexedDB / CSV / 导入导出
    │   ├── sample.ts         # 示例工程（含 canvas 生成的占位美术）
    │   └── store.ts          # Pinia：工程/节点/播放/持久化
    └── views/
        ├── LoginView.vue
        ├── admin/            # 9 个后台页面
        └── story/            # StoryEditorView + parts/（8 个工作区部件）
```

## 已知限制

1. ZIP 解压依赖 `DecompressionStream('deflate-raw')`（Chrome/Edge 103+ 或新版 Electron）；导出的包本身是通用格式。
2. 资源一个 key 只支持一张图（与引擎 `spriteFrame` 加载方式一致）。
3. 物品「获得/阅读模式」、术语 tooltip、注音/富文本标记目前只做**数据登记与标记约定**（`⟦术语⟧`）。
4. 后台列表接口没有搜索参数，页面里的搜索框只过滤**当前页**，界面上已注明。
5. 剧情深链参数（`demo` / `tab`）写在 hash 查询串里，刷新页面会重新执行；`demo=1` 只在工程为空时生效，不会覆盖已有内容。
