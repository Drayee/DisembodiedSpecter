// WorldPanel.ts
// 世界面板：进入时连接全局状态 WebSocket（globalWs）。
// 挂载位置：WorldPanel 预制体根节点。
//
// 剧情临时调试入口（大世界交互物件未实现前）：
//   - 进入世界：拉取服务端剧情进度 → 主线未开始时自动播放序章
//   - 顶部调试栏：主线·开始/继续、支线 0.1 演示、重置主线
//   - 剧情播放中全屏覆盖，结束后回到大世界
import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { NetworkManager } from 'db://assets/Scripts/managers/NetworkManager';
import { GameManager } from 'db://assets/Scripts/managers/GameManager';
import { UIManager } from 'db://assets/Scripts/managers/UIManager';
import { StoryController } from 'db://assets/Scripts/story/StoryController';
import { MAIN_START_ADDR, isTerminal } from 'db://assets/Scripts/story/StoryAddr';
const { ccclass } = _decorator;

/** 主线未开始时进入世界是否自动播放序章（验收用） */
const STORY_AUTO_START = true;

/** 支线 0.1 默认起点 */
const BRANCH_0_1_START = '0.1.0.1.1';

@ccclass('WorldPanel')
export class WorldPanel extends Component {
    private connecting = false;
    private autoStarted = false;

    private dock: Node | null = null;
    private statusLabel: Label | null = null;
    private whiteSf: SpriteFrame | null = null;

    onEnable() {
        this.initDock();
        this.connectGlobalWs().then(() => this.afterWorldReady());
    }

    onDisable() {
        // 中止未完成的剧情（Overlay 由 StoryController 销毁）
        const sc = StoryController.instance;
        if (sc.playing) sc.abort();
        // 离开世界面板时断开全局连接
        const nm = NetworkManager.getInstance();
        if (nm) {
            nm.worldWs.close();
        }
        // 清理调试栏
        this.clearDock();
    }

    // ==================== 世界就绪 ====================

    private async afterWorldReady() {
        const gm = GameManager.getInstance();
        if (!gm) return;
        // 以服务端进度为权威（单人单档）
        try {
            const data = await gm.syncPlayerData<any>();
            if (data) gm.ingestStoryFromServer(data);
        } catch (e) {
            console.warn('[WorldPanel] 拉取玩家数据失败（使用本地镜像）', e);
        }
        this.refreshStatus();

        // 自动开始：主线未开始（且本次进入尚未自动播放过）
        if (STORY_AUTO_START && !this.autoStarted && !StoryController.instance.playing && !gm.storyProgress.main) {
            this.autoStarted = true;
            this.scheduleOnce(() => {
                if (this.node && this.node.isValid) {
                    gm.beginMainStory();
                    this.refreshStatus();
                }
            }, 0.4);
        }
    }

    private async connectGlobalWs() {
        if (this.connecting) return;
        this.connecting = true;
        try {
            const nm = NetworkManager.getInstance();
            if (!nm || !nm.userId) {
                console.error('[WorldPanel] NetworkManager 未初始化或缺少 userId');
                return;
            }
            // 获取一次性 ws-code 并连接全局状态 WebSocket
            const wsCode = await nm.getWsCode();
            console.log('[WorldPanel] ws-code =', wsCode);
            nm.connectWorldWS(nm.userId, wsCode, (bytes) => {
                // TODO: 解析全局状态消息（当前后端 global 连接仅保持在线，暂无消息协议）
                console.log('[WorldPanel] 收到全局消息', bytes.byteLength, '字节');
            });
        } catch (e) {
            console.error('[WorldPanel] 连接全局失败', e);
        } finally {
            this.connecting = false;
        }
    }

    // ==================== 剧情入口 ====================

    private onMain() {
        const gm = GameManager.getInstance();
        if (!gm) return;
        if (StoryController.instance.playing) return;
        const cursor = gm.storyProgress.main;
        if (!cursor) {
            gm.beginMainStory();
            this.refreshStatus();
        } else if (isTerminal(cursor)) {
            this.showNotice(`主线已推进至完结态（${cursor}），等待后续章节解锁`);
        } else {
            gm.beginMainStory();
            this.refreshStatus();
        }
    }

    private onBranchDemo() {
        const gm = GameManager.getInstance();
        if (!gm) return;
        if (StoryController.instance.playing) return;
        const cursor = gm.storyProgress.branches['0.1'];
        if (cursor && isTerminal(cursor)) {
            this.showNotice(`支线 0.1 已完结（${cursor}）`);
            return;
        }
        gm.beginBranchStory('0.1', BRANCH_0_1_START);
        this.refreshStatus();
    }

    private onResetMain() {
        const gm = GameManager.getInstance();
        if (!gm) return;
        gm.resetMainStory();
        this.showNotice('主线进度已重置（新游戏）');
    }

    // ==================== 状态栏 ====================

    private statusText(): string {
        const gm = GameManager.getInstance();
        if (!gm) return '';
        if (StoryController.instance.playing) return '剧情播放中…（点击屏幕推进）';
        const m = gm.storyProgress.main;
        if (!m) return '主线：未开始（新游戏将自动播放序章）';
        if (isTerminal(m)) return `主线：已完结态 ${m}`;
        return `主线进度：${m}`;
    }

    private showNotice(msg: string) {
        console.log('[WorldPanel]', msg);
        if (this.statusLabel) this.statusLabel.string = msg;
    }

    private refreshStatus() {
        if (!this.statusLabel || !this.node || !this.node.isValid) return;
        this.statusLabel.string = this.statusText();
    }

    // ==================== 调试栏构建 ====================

    private initDock() {
        if (this.dock) return;
        const host = UIManager.getInstance()?.uiRoot;
        const hostT = host?.getComponent(UITransform);
        const w = hostT?.width ?? 1280;
        const h = hostT?.height ?? 720;
        const dock = new Node('StoryDebugDock');
        this.node.addChild(dock);
        dock.setPosition(0, h / 2 - 60);
        this.dock = dock;

        this.ensureWhiteForDock();
        this.mkStatusLabel(dock, w);
        this.mkDockButton(dock, -260, -60, '主线 · 开始/继续', () => this.onMain());
        this.mkDockButton(dock, 0, -60, '支线 0.1 演示', () => this.onBranchDemo());
        this.mkDockButton(dock, 260, -60, '重置主线', () => this.onResetMain());
    }

    /** 预加载白色贴图用于调试按钮底色（异步到达后自动回填） */
    private ensureWhiteForDock() {
        if (this.whiteSf) return;
        resources.load('image/white/spriteFrame', SpriteFrame, (err, sf) => {
            if (err || !sf) return;
            this.whiteSf = sf;
            if (this.dock && this.dock.isValid) {
                const sprites = this.dock.getComponentsInChildren(Sprite);
                sprites.forEach((s) => {
                    if (!s.spriteFrame) s.spriteFrame = sf;
                });
            }
        });
    }

    private clearDock() {
        if (this.dock) {
            this.dock.destroy();
            this.dock = null;
            this.statusLabel = null;
        }
    }

    private mkStatusLabel(parent: Node, canvasW: number) {
        const n = new Node('StoryStatus');
        parent.addChild(n);
        n.setPosition(0, 60);
        const t = n.addComponent(UITransform);
        t.setContentSize(canvasW * 0.9, 40);
        const lb = n.addComponent(Label);
        lb.fontSize = 20;
        lb.lineHeight = 28;
        lb.color = new Color(255, 255, 255, 255);
        lb.overflow = Label.Overflow.SHRINK;
        lb.horizontalAlign = Label.HorizontalAlign.CENTER;
        lb.enableWrapText = true;
        this.statusLabel = lb;
    }

    private mkDockButton(parent: Node, x: number, y: number, text: string, onClick: () => void) {
        const n = new Node(`Btn_${text}`);
        parent.addChild(n);
        n.setPosition(x, y);
        const t = n.addComponent(UITransform);
        t.setContentSize(220, 52);
        const sp = n.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.type = Sprite.Type.SIMPLE;
        sp.color = new Color(16, 20, 32, 210);
        if (this.whiteSf) sp.spriteFrame = this.whiteSf;
        const lb = this.mkText(n, text, 20, new Color(255, 220, 130, 255));
        lb.setPosition(0, 0);
        n.on(Node.EventType.TOUCH_END, (ev: any) => {
            if (ev) ev.propagationStopped = true;
            onClick();
        });
    }

    private mkText(parent: Node, str: string, size: number, color: Color): Node {
        const n = new Node('Text');
        parent.addChild(n);
        n.addComponent(UITransform);
        const lb = n.addComponent(Label);
        lb.string = str;
        lb.fontSize = size;
        lb.lineHeight = Math.round(size * 1.5);
        lb.color = color;
        lb.overflow = Label.Overflow.SHRINK;
        lb.horizontalAlign = Label.HorizontalAlign.CENTER;
        return n;
    }
}
