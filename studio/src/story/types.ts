/**
 * types.ts — 剧情数据模型（与 Cocos 侧 front/assets/Scripts/layers/story/StoryTypes.ts 严格对齐）
 *
 * 约定回顾：
 *   - 段文件名 = 篇.章.片.段（如 1.0.0.1），节点键 = 段内 id（如 3 / 3.a）
 *   - 地址 = {file}.{key}（如 1.0.0.1.3.a）；终态 = {file}.end
 *   - 立绘：slot 1..8；未给 x 时 1 个居中、多个按「左、右、左、右…」向外排开；name===speaker 高亮
 *   - 舞台：bg/cg 有值=显示、''=隐藏、字段缺省=保持上一幕
 */

export type StoryNodeType = 'dialogue' | 'narration' | 'choice' | 'stage' | 'action'

export interface StoryAvatarEntry {
    /** P 槽位 1..8；null/缺省 = 自动分配空闲槽位 */
    slot?: number | null
    /** 立绘 key → resources/story/image/{key}/spriteFrame */
    key: string
    /** 相对 Person 中心的横向偏移；null/缺省 = 参与自动排布 */
    x?: number | null
    /** 朝向：1=正向（默认），-1=水平镜像 */
    facing?: number
    /** 角色名：与 node.speaker 相等时高亮 */
    name?: string
}

export interface StoryOption {
    text: string
    /** 选中后跳转的完整地址；缺省=按段内顺序推进 */
    next?: string
}

export interface StoryStageSpec {
    bg?: string
    cg?: string
    /** 旧版单立绘，兼容保留 */
    avatar?: string
    avatars?: StoryAvatarEntry[]
    /** 预留：过场视频 */
    video?: string
}

export interface StoryNode {
    id: string
    type: StoryNodeType
    speaker?: string
    avatar?: string
    avatars?: StoryAvatarEntry[]
    text?: string
    options?: StoryOption[]
    next?: string
    stage?: StoryStageSpec
    action?: string
}

export interface StorySegmentMeta {
    title?: string
}

export interface StorySegment {
    meta?: StorySegmentMeta
    nodes: StoryNode[]
}

export interface StoryAssetMeta {
    filename: string
    mime: string
    size: number
}

export interface StoryItemDef {
    name: string
    type: 'item' | 'letter'
    desc: string
    iconKey: string
}

/** 编辑器内的整个工程（本地 localStorage + IndexedDB 资源库） */
export interface StoryProject {
    files: Record<string, StorySegment>
    assets: Record<string, StoryAssetMeta>
    /** 术语词典：术语 → 解释（供未来 tooltip / 注音） */
    glossary: Record<string, string>
    /** 物品 / 信件库（字段预留） */
    items: Record<string, StoryItemDef>
}

export type LintLevel = 'error' | 'warn'

export interface LintIssue {
    level: LintLevel
    file: string
    nodeId: string
    msg: string
}

/** 地址解析结果 */
export interface ParsedAddr {
    file: string
    key: string | null
    terminal: boolean
}

/** 立绘布局结果（x 一定已算出） */
export interface AvatarPlan {
    /** 在原始列表中的下标：拖拽摆位时用于把 x 写回正确的条目 */
    srcIndex: number
    slot: number
    key: string
    x: number
    facing: number
    name: string
}

/** 预览舞台累积状态 */
export interface StageState {
    bg: string | null
    cg: string | null
    avatars: StoryAvatarEntry[]
}

/** 资源库记录（IndexedDB） */
export interface AssetRecord {
    id: string
    key: string
    filename: string
    mime: string
    blob: Blob
}
