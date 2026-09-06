// StoryTypes.ts
// 剧情数据模型定义。
//
// 数据约定：
//   - 数据目录：assets/Resources/story/data（段文件会被按需加载）
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

/** 演出指令内容（key 对应 Resources/story/image、story/video 下的资源名，缺失时组件自动跳过） */
export interface StoryStageSpec {
    /** 背景图 key → story/image/{key}/spriteFrame */
    bg?: string;
    /** 立绘 key → story/image/{key}/spriteFrame */
    avatar?: string;
    /** 预留：过场视频 key → story/video/{key}（v1 未实现视频播放） */
    video?: string;
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
