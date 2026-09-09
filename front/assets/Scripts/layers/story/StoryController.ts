// StoryController.ts
// 剧情引擎（状态机）：加载段 JSON → 从游标地址逐 node 推进 → 选项/演出/结束分发，
// 每推进一个节点都把新游标通过 onCursor 回调交给 GameManager（内存镜像 + WS 上报后端）。
// 本类是纯逻辑控制器，不创建场景节点；UI 由 StoryPanel 预制体（assets/Prefabs/UI/StoryPanel.prefab）
// 承担——播放时经 UIManager.openPanelByPath('ui', 'StoryPanel', { overlay: true }) 打开，
// 不清除下层面板（如 WorldPanel），结束/中止时关闭并回调 onPlayback(false) 释放世界锁。
import { Node } from 'cc';
import { UIManager } from 'db://assets/Scripts/managers/UIManager';
import { StoryPanel, StoryAdvance } from 'db://assets/Scripts/panels/StoryPanel';
import { ParsedAddr, parseAddr, scopeKeyOf } from './StoryAddr';
import { loadSegment, nextNodeIdInFile, nodeById } from './StoryLoader';
import { StoryNode, StorySegment } from './StoryTypes';

/** 游标推进回调：scope=null 表示主线；否则为支线 key（如 "0.1"） */
export type StoryCursorSink = (scope: string | null, cursor: string) => void;

/** StoryPanel 预制体所在 Bundle 与资源路径 */
const STORY_BUNDLE = 'ui';
const STORY_PREFAB_PATH = 'StoryPanel';

export class StoryController {
    private static _instance: StoryController | null = null;

    public static get instance(): StoryController {
        if (!this._instance) this._instance = new StoryController();
        return this._instance;
    }

    /** 游标推进（由 GameManager 注入：内存镜像 + WS 上报） */
    public onCursor?: StoryCursorSink;
    /** 一段剧情结束/中止（由调用方刷新 UI 状态） */
    public onEnded?: () => void;
    /** 播放状态回调：true=面板已打开并开始播放，false=已关闭（结束/中止/异常） */
    public onPlayback?: (playing: boolean) => void;

    private token = 0;
    private overlay: Node | null = null;
    private panel: StoryPanel | null = null;

    public get playing(): boolean {
        return !!this.overlay && this.overlay.isValid;
    }

    /**
     * 开始/续播剧情。
     * @param address 起始游标地址（如 "1.0.0.1.1"、"1.0.0.1.3.a"）；终态/非法返回 false。
     */
    public play(address: string): boolean {
        const parsed = parseAddr(address);
        if (!parsed) {
            console.error(`[Story] 非法剧情地址: ${address}`);
            return false;
        }
        if (parsed.terminal) {
            console.log(`[Story] 该剧情已完结（终态游标 ${address}），等待世界交互解锁后续内容`);
            return false;
        }
        if (this.playing) {
            console.warn('[Story] 剧情播放中，忽略重复请求');
            return false;
        }
        const tok = ++this.token;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.run(tok, parsed);
        return true;
    }

    /** 强制中止当前剧情（离开大世界 / 切换面板时调用） */
    public abort(): void {
        this.token++;
        this.teardown();
    }

    // ==================== 内部 ====================

    private async run(tok: number, start: ParsedAddr) {
        const ui = UIManager.getInstance();
        if (!ui) {
            console.error('[Story] UIManager 未初始化，无法打开剧情界面');
            return;
        }

        // 以全屏面板方式打开预制体（overlay=true：不清除下层 WorldPanel 等）
        const node = await ui.openPanelByPath(STORY_BUNDLE, STORY_PREFAB_PATH, { overlay: true });
        if (!node || !node.isValid) {
            console.error(`[Story] StoryPanel 打开失败（Bundle=${STORY_BUNDLE} 路径=${STORY_PREFAB_PATH}）`);
            return;
        }

        let panel = node.getComponent(StoryPanel);
        if (!panel) {
            console.warn('[Story] StoryPanel 预制体根节点缺少 StoryPanel 组件，运行时补充');
            panel = node.addComponent(StoryPanel);
        }
        await panel.ensureReady();
        if (tok !== this.token || !node.isValid) {
            ui.closePanelNode(node);
            return;
        }
        this.overlay = node;
        this.panel = panel;
        this.emitPlayback(true);

        try {
            let cur: ParsedAddr | null = start;
            let steps = 0;
            const MAX_STEPS = 500; // 防御：数据误配成环时避免死循环
            while (cur && !cur.terminal && tok === this.token) {
                if (++steps > MAX_STEPS) {
                    console.error(`[Story] 剧情推进超过 ${MAX_STEPS} 步，疑似地址成环，强制终止`);
                    break;
                }
                if (!panel.node || !panel.node.isValid) {
                    console.warn('[Story] 剧情面板已关闭，终止播放');
                    break;
                }
                const seg: StorySegment | null = await loadSegment(cur.file);
                if (tok !== this.token) break;
                if (!seg) {
                    console.error(`[Story] 段文件不存在或格式错误: ${cur.file}`);
                    break;
                }
                const snode: StoryNode | null = nodeById(seg, cur.key);
                if (!snode) {
                    console.error(`[Story] 节点不存在: ${cur.file}.${cur.key}`);
                    break;
                }

                // action 节点不展示界面；其余类型等待玩家操作
                let adv: StoryAdvance | null = null;
                if (snode.type !== 'action') {
                    adv = await panel.present(snode);
                    if (tok !== this.token) break;
                    if (!panel.node || !panel.node.isValid) {
                        console.warn('[Story] 剧情面板在等待操作时被关闭，终止播放');
                        break;
                    }
                }

                const next = this.computeNext(snode, seg, cur, adv);
                if (!next) {
                    // 无后续目标 → 本次剧情完结，游标进入 {file}.end
                    const terminal = `${cur.file}.end`;
                    this.commit(scopeKeyOf(terminal), terminal);
                    break;
                }
                // 先持久化下一游标，再继续播放
                this.commit(scopeKeyOf(next), next);
                cur = parseAddr(next);
            }
        } catch (e) {
            console.error('[Story] 剧情播放异常', e);
        } finally {
            if (tok === this.token) {
                this.teardown();
            }
        }
    }

    /** 计算下一目标地址；返回 null 表示完结（终态）。 */
    private computeNext(node: StoryNode, seg: StorySegment, cur: ParsedAddr, adv: StoryAdvance | null): string | null {
        // action:"end"：有 next 则自动续播；无 next 则完结（忽略段内后续节点）
        if (node.type === 'action' && node.action === 'end') {
            return node.next ?? null;
        }

        let target: string | undefined;
        if (node.type === 'choice' && adv && adv.kind === 'option') {
            const opt = node.options?.[adv.index];
            target = opt?.next || node.next;
        } else {
            target = node.next;
        }
        if (!target) {
            const nx = nextNodeIdInFile(seg, cur.key);
            if (nx) target = `${cur.file}.${nx}`;
        }
        return target || null;
    }

    private commit(scope: string | null, cursor: string) {
        try {
            this.onCursor?.(scope, cursor);
        } catch (e) {
            console.error('[Story] 进度回调异常', e);
        }
    }

    private emitPlayback(playing: boolean) {
        try {
            this.onPlayback?.(playing);
        } catch (e) {
            console.error('[Story] 播放状态回调异常', e);
        }
    }

    private teardown() {
        const ui = UIManager.getInstance();
        if (this.overlay && this.overlay.isValid && ui) {
            ui.closePanelNode(this.overlay);
        }
        this.overlay = null;
        this.panel = null;
        try {
            this.onEnded?.();
        } catch (e) {
            console.error('[Story] 结束回调异常', e);
        }
        this.emitPlayback(false);
    }
}
