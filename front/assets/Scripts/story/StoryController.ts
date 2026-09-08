// StoryController.ts
// 剧情引擎（状态机）：加载段 JSON → 从游标地址逐 node 推进 → 选项/演出/结束分发，
// 每推进一个节点都把新游标通过 onCursor 回调交给 GameManager（内存镜像 + WS 上报后端）。
// 本类是纯逻辑控制器，不依赖场景节点；UI 由 StoryPanel（StoryOverlay）承担。
import { Node, UITransform } from 'cc';
import { UIManager } from 'db://assets/Scripts/managers/UIManager';
import { StoryPanel, StoryAdvance } from 'db://assets/Scripts/panels/StoryPanel';
import { ParsedAddr, parseAddr, scopeKeyOf } from './StoryAddr';
import { loadSegment, nextNodeIdInFile, nodeById } from './StoryLoader';
import { StoryNode, StorySegment } from './StoryTypes';

/** 游标推进回调：scope=null 表示主线；否则为支线 key（如 "0.1"） */
export type StoryCursorSink = (scope: string | null, cursor: string) => void;

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
    /** 播放状态回调：true=覆盖层已建立并开始播放，false=已拆除（结束/中止/异常） */
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
        const host = ui?.uiRoot ?? null;
        if (!host) {
            console.error('[Story] UIManager 未初始化，无法打开剧情界面');
            return;
        }
        const hostT = host.getComponent(UITransform);
        const w = hostT?.width ?? 1280;
        const h = hostT?.height ?? 720;

        const overlay = new Node('StoryOverlay');
        host.addChild(overlay);
        const ot = overlay.addComponent(UITransform);
        ot.setContentSize(w, h);
        const panel = overlay.addComponent(StoryPanel);

        await panel.ensureReady();
        if (tok !== this.token) {
            overlay.destroy();
            return;
        }
        this.overlay = overlay;
        this.panel = panel;
        try {
            this.onPlayback?.(true);
        } catch (e) {
            console.error('[Story] 播放状态回调异常', e);
        }

        try {
            let cur: ParsedAddr | null = start;
            let steps = 0;
            const MAX_STEPS = 500; // 防御：数据误配成环时避免死循环
            while (cur && !cur.terminal && tok === this.token) {
                if (++steps > MAX_STEPS) {
                    console.error(`[Story] 剧情推进超过 ${MAX_STEPS} 步，疑似地址成环，强制终止`);
                    break;
                }
                const seg: StorySegment | null = await loadSegment(cur.file);
                if (tok !== this.token) break;
                if (!seg) {
                    console.error(`[Story] 段文件不存在或格式错误: ${cur.file}`);
                    break;
                }
                const node: StoryNode | null = nodeById(seg, cur.key);
                if (!node) {
                    console.error(`[Story] 节点不存在: ${cur.file}.${cur.key}`);
                    break;
                }

                // action 节点不展示界面；其余类型等待玩家操作
                let adv: StoryAdvance | null = null;
                if (node.type !== 'action') {
                    adv = await panel.present(node);
                    if (tok !== this.token) break;
                }

                const next = this.computeNext(node, seg, cur, adv);
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

    private teardown() {
        if (this.overlay && this.overlay.isValid) {
            this.overlay.destroy();
        }
        this.overlay = null;
        this.panel = null;
        try {
            this.onEnded?.();
        } catch (e) {
            console.error('[Story] 结束回调异常', e);
        }
        try {
            this.onPlayback?.(false);
        } catch (e) {
            console.error('[Story] 播放状态回调异常', e);
        }
    }
}
