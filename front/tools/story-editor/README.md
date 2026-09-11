# 剧情编排工具（Story Editor）

面向策划/美术/本地化的**零依赖**网页工具：编排剧情节点 → 校验 → 预览 → 导出可直接覆盖到 Cocos 工程的 zip。

- 技术：Vue 3（本地 vendored，无构建、无 npm 安装）+ 自研 ZIP 读写（`CompressionStream/DecompressionStream`）
- 位置：`front/tools/story-editor/`（不在 `assets/` 下，Cocos 不会把它当资源）

## 怎么打开

**方式一（推荐）**：双击 `start.cmd`
- 有 Node 时用 `node server.js` 起本地服务并自动打开浏览器（默认 <http://localhost:7788/>）
- 只有 Python 时用 `python -m http.server 7788`

**方式二**：自己用任意静态服务器托管本目录，然后访问 `index.html`
> 注意：ES 模块不能从 `file://` 直接加载（浏览器 CORS 限制），所以**不要**直接双击 `index.html`。

## 界面

| 区域 | 作用 |
| --- | --- |
| 顶部 | 段选择/新建/删除、导入 zip、导出 zip、导出本段 JSON、校验、新建项目、保存状态 |
| 左栏 | 节点列表（改 id、上移/下移/复制/删除、点击选中） |
| 中栏 | 预览（所见即所得，可拖拽立绘）／流程图（连分支）／表格（批量改台词）／资源库／词典·物品／校验结果 |
| 右栏 | 属性面板（类型相关字段 + 立绘 + 选项 + 舞台） |

## 与 Cocos 工程的约定（关键）

导出 zip 的结构：

```
story/data/1.0.0.1.json          ← 段文件（文件名 = 篇.章.片.段）
story/image/{key}/xxx.png        ← 背景 / 立绘 / CG，目录名即 key
assets-manifest.csv              ← 资源清单（给美术）
dialogue-list.csv                ← 台词表（给本地化/配音）
```

解压后覆盖到 `front/assets/resources/story/` 即可被游戏读取（引擎按 `story/image/{key}/spriteFrame` 加载，所以**一个 key 只放一张图**）。

### 节点字段（与 `StoryTypes.ts` 对齐）

```jsonc
{
  "id": "3",                 // 段内节点键：数字，或分支变体 "3.a"
  "type": "dialogue",        // dialogue | narration | choice | stage | action
  "speaker": "林",
  "text": "古木之上，有丰饶之名。",
  "next": "1.0.0.2.1",       // 可跨段；留空=段内顺序；末尾无 next=本段完结（{file}.end）
  "avatars": [               // 多人立绘（P1~P8 同时显示）
    { "slot": 1, "key": "lin", "name": "林" },          // name===speaker → 高亮
    { "slot": 2, "key": "yao", "x": -420, "facing": -1 }
  ],
  "stage": { "bg": "forest", "cg": "flashback", "video": "" }
}
```

立绘规则：不填 `x` → 1 个居中，多个按“左、右、左、右…”自动排开；填 `x` 按数值摆放；`facing: -1` 水平镜像。
舞台规则：`bg` → 底部背景层；`cg` → 顶部 CG 层；**有值=显示、空串 ""=隐藏、字段不上=保持上一幕**。

## 已实现能力

- 节点增删改、跨段跳转地址编辑（带地址补全）、段内引用在改 id 时自动同步
- 多人立绘编辑 + 预览里**拖拽摆位写回 `x`**、双击切换镜像
- 舞台 `bg`/`cg` 分层预览（背景在下、CG 在上），选项可试跑
- 流程图：分层布局、next/选项连线可视化、**选中连线模式后点目标节点即写入跳转**、跨段跳转标记
- 表格视图：批量改台词，CSV 导入/导出
- 资源库：上传图片（IndexedDB 本地存储）、key 重命名/删除、引用计数、缩略图
- 词典（术语解释，供未来 tooltip/注音使用）与物品/信件库（字段预留）
- 校验器：地址悬空、不可达节点、跳转环、slot 越界/重复、资源缺失/未使用、文本超长、空文本/空选项等
- 导出 zip（含资源与两份 CSV）；导入 zip 继续编辑；本地自动保存（localStorage）

## 已知限制 / 后续

1. ZIP 解压依赖 `DecompressionStream('deflate-raw')`（Chrome/Edge 103+ 或新版 Electron）；导出的包本身是兼容格式。
2. 资源一个 key 只支持一张图（与引擎 `spriteFrame` 加载方式一致）。
3. 物品“获得/阅读模式”、术语 tooltip、注音/富文本标记目前只做**数据登记与标记约定**（⟦术语⟧），引擎侧功能另行实现。
4. 想进一步嵌进 Cocos 编辑器面板：Cocos 3.8 官方扩展模板本身就是 Vue 3 面板（`.../extension-template/vue3.x-panel`），可把本目录静态文件放进 `extensions/story-editor/static/`，通过 `Editor.Message.request('asset-db', 'create-asset', ...)` 直接写入 `assets/resources/story/`——后续可加，前端代码不用改。

## 目录

```
tools/story-editor/
├── index.html          # 页面外壳
├── start.cmd           # 双击启动（Node 优先，回退 Python）
├── server.js           # 零依赖静态服务
├── css/app.css
├── js/
│   ├── model.js        # 数据模型 / 地址规则 / 立绘布局 / 校验器
│   ├── zip.js          # ZIP 打包解包（无第三方依赖）
│   ├── io.js           # IndexedDB 资源、zip 导入导出、CSV
│   ├── store.js        # 响应式状态、自动保存、预览播放
│   ├── ui-basic.js     # 工具栏/节点列表/属性/表格/资源库/词典物品/校验
│   ├── ui-views.js     # 预览画布、流程图
│   └── app.js          # 应用入口
└── vendor/vue.esm-browser.prod.js   # Vue 3（MIT，取自 Cocos Creator 扩展模板）
```
