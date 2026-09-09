// StoryTypes.ts
// 剧情数据模型定义。
//
// 数据约定：
//   - 数据目录：assets/resources/story/data（段文件会被按需加载）
//   - 地址规则：篇.章.片.段.节点[.分支]，例：
//       1.0.0.1.1     主线（篇 1、章 0、片 0、段 1）的第 1 个节点
//       1.0.0.1.3.a   同一段节点 3 的分支 a 变体（选项跳转目标）
//       0.1.0.1.1     支线剧情（篇 = 0，0.1 即第 1 号支线）
//   - 最小单位 = node（事件）：一句对白 / 一句旁白 / 一组选项 / 一次演出 / 一个动作，
//     每个都是独立的 node；node 顺序组成段。
//   - 段文件命名：story/data/{篇}.{章}.{片}.{段}.json，文件内 nodes 顺序即默认推进顺序。
//   - 除 type 外，node 的所有字段均为可选。

/** 剧情节点（事件）类型 */
export type StoryNodeType = 'dialogue' | 'narration' | 'choice' | 'stage' | 'action';

/** 演出指令内容（key 对应 resources/story/image、story/video 下的资源名，缺失时组件自动跳过） */
export interface StoryStageSpec {
    /** 背景图 key → story/image/{key}/spriteFrame */
    bg?: string;
    /** 立绘 key → story/image/{key}/spriteFrame（旧版单立绘，兼容保留） */
    avatar?: string;
    /** 多人立绘（P1~P8 槽位，同时显示多个人物） */
    avatars?: StoryAvatarEntry[];
    /** 预留：过场视频 key → story/video/{key}（v1 未实现视频播放） */
    video?: string;
}

/**
 * 多人立绘条目（对应 StoryPanel 预制体 Person 下的 P1~P8 子节点）。
 * 布局规则：
 *   - 未给 x：单人生成时居中；多人按出现顺序“左、右、左、右…”左右交替排开；
 *   - 给了 x：按 x（相对 Person 中心的横向偏移）与 facing 摆放，不参与自动排布；
 *   - name 与当前节点 speaker 相同 → 该槽位高亮（其余压暗）。
 */
export interface StoryAvatarEntry {
    /** P 槽位 1..8；缺省按出现顺序自动分配空闲槽位 */
    slot?: number;
    /** 立绘 key → resources/story/image/{key}/spriteFrame */
    key: string;
    /** 相对 Person 中心的横向偏移 x（可选，覆盖自动排布） */
    x?: number;
    /** 朝向：1=正向(默认)，-1=水平镜像 */
    facing?: number;
    /** 角色名：与 node.speaker 相等时作为当前说话者高亮 */
    name?: string;
}

/** 选项（choice 节点） */
export interface StoryOption {
    /** 选项文案 */
    text: string;
    /** 选中后跳转的完整地址（可跨篇/章/片/段/分支）；缺省时按段内顺序推进 */
    next?: string;
}

/**
 * 单个剧情节点 = 一个事件。
 * dialogue：speaker(说话人) + text + avatar(可选头像)
 * narration：text
 * choice：text(提问) + options[]
 * stage：stage(画面演出) + text(可选说明文字)
 * action：action='end'（剧情结束：有 next 则自动续播该地址，否则本次剧情完结回大世界）
 */
export interface StoryNode {
    /** 段内节点键："1"、"2"、"3.a"（数字 + 可选字母分支后缀） */
    id: string;
    type: StoryNodeType;
    speaker?: string;
    avatar?: string;
    /** 多人立绘（同时显示多个 P1~P8 槽位；与 avatar 二选一，优先本字段） */
    avatars?: StoryAvatarEntry[];
    text?: string;
    options?: StoryOption[];
    /** 当前节点完成后的下一完整地址；缺省 = 段内顺序下一节点 */
    next?: string;
    stage?: StoryStageSpec;
    action?: string;
}

/** 段文件元信息（作者备注，运行时可不展示） */
export interface StorySegmentMeta {
    title?: string;
}

/** 一个段文件（story/data/{file}.json）的内容结构 */
export interface StorySegment {
    meta?: StorySegmentMeta;
    /** 顺序即默认推进顺序；含分支变体节点（如 "3.a"） */
    nodes: StoryNode[];
}

/**
 * 单人单档剧情进度（后端 WS 同步 + 内存镜像）。
 * 游标 = “下一个待播放节点的地址”；null = 未开始。
 * 终端游标形如 {file}.end，表示该段剧情已完结。
 */
export interface StoryProgress {
    /** 主线游标 */
    main: string | null;
    /** 支线游标：key = 支线地址前缀（篇.章，如 "0.1"） */
    branches: Record<string, string | null>;
}
