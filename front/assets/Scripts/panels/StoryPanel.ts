// StoryPanel.ts
// 剧情表现层：挂载在 StoryOverlay 节点上，全屏叠加于 UIRoot。
// 功能：对话框 + 说话人名字 + 逐字打字机 + 选项按钮 + 背景/立绘切换。
// 说明：UI 全部运行时构建（不依赖编辑器绑定），图片资源缺失自动降级隐藏。
import { _decorator, Color, Component, EventTouch, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { StoryNode } from '../story/StoryTypes';

const { ccclass } = _decorator;

/** present() 的返回值：普通推进 或 玩家选中的选项下标 */
export type StoryAdvance = { kind: 'next' } | { kind: 'option'; index: number };

const TYPE_INTERVAL = 0.02; // 打字机逐字间隔（秒）

@ccclass('StoryPanel')
export class StoryPanel extends Component {
    private whiteSf: SpriteFrame | null = null;

    private bgArt: Sprite | null = null;       // 舞台背景（stage.bg）
    private avatarArt: Sprite | null = null;   // 说话人立绘/头像
    private nameLabel: Label | null = null;
    private textLabel: Label | null = null;
    private hintLabel: Label | null = null;
    private choiceRoot: Node | null = null;

    private resolver: ((r: StoryAdvance) => void) | null = null;
    private readyPromise: Promise<void> | null = null;

    private typing = false;
    private fullText = '';
    private typeDone: (() => void) | null = null;

    private choiceMode = false;
    private pendingOptions: StoryNode['options'] | null = null;

    // ==================== 初始化 ====================

    /** 加载白色贴图并搭建 UI；幂等。 */
    public ensureReady(): Promise<void> {
        if (!this.readyPromise) {
            this.readyPromise = this.buildUI();
        }
        return this.readyPromise;
    }

    private buildUI(): Promise<void> {
        return new Promise<void>((resolve) => {
            resources.load('image/white/spriteFrame', SpriteFrame, (err, sf) => {
                if (err || !sf) {
                    console.warn('[StoryPanel] 白色贴图加载失败（背景将透明）', err);
                } else {
                    this.whiteSf = sf;
                }
                this.createNodes();
                resolve();
            });
        });
    }

    private createNodes() {
        const root = this.node;
        const t = root.getComponent(UITransform);
        const w = t ? t.width : 1280;
        const h = t ? t.height : 720;

        // 1. 全屏暗幕（盖住大世界）
        const dim = this.mkSprite(root, 'Dim', w, h, new Color(0, 0, 0, 180));
        dim.node.setPosition(0, 0);

        // 2. 舞台背景（默认透明，stage.bg 切换）
        const bg = this.mkSprite(root, 'BgArt', w, h, new Color(255, 255, 255, 255));
        bg.node.setPosition(0, 0);
        bg.node.active = false;
        this.bgArt = bg;

        // 3. 底部对话框
        const panelW = w * 0.92;
        const panelH = h * 0.26;
        const panelY = -h / 2 + panelH / 2 + 18;
        const panel = this.mkSprite(root, 'DialogBox', panelW, panelH, new Color(8, 10, 16, 235));
        panel.node.setPosition(0, panelY);

        // 说话人名字（对话框左上）
        this.nameLabel = this.mkLabel(panel.node, 'NameLabel', '', 24, new Color(255, 214, 130, 255), panelW * 0.9);
        this.nameLabel.node.setPosition(-panelW / 2 + 40, panelH / 2 - 26);
        this.nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.nameLabel.node.active = false;

        // 正文（对话框内）
        this.textLabel = this.mkLabel(panel.node, 'TextLabel', '', 26, new Color(238, 238, 238, 255), panelW * 0.9);
        this.textLabel.node.setPosition(0, -4);
        this.textLabel.verticalAlign = Label.VerticalAlign.CENTER;

        // 提示（右下角）
        this.hintLabel = this.mkLabel(panel.node, 'HintLabel', '点击继续 ▾', 16, new Color(150, 150, 150, 255), 220);
        this.hintLabel.node.setPosition(panelW / 2 - 120, -panelH / 2 + 18);
        this.hintLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;

        // 4. 说话人立绘/头像（对话框上方左侧，默认隐藏）
        const avatarSize = Math.min(w * 0.2, h * 0.26);
        const avatarN = new Node('AvatarArt');
        root.addChild(avatarN);
        avatarN.setPosition(-w * 0.3, panelY + panelH / 2 + avatarSize / 2 + 24);
        const at = avatarN.addComponent(UITransform);
        at.setContentSize(avatarSize, avatarSize);
        this.avatarArt = avatarN.addComponent(Sprite);
        this.avatarArt.sizeMode = Sprite.SizeMode.CUSTOM;
        this.avatarArt.type = Sprite.Type.SIMPLE;
        avatarN.active = false;

        // 5. 选项容器（屏幕中部，默认隐藏）
        this.choiceRoot = new Node('ChoiceRoot');
        root.addChild(this.choiceRoot);
        this.choiceRoot.active = false;

        // 6. 点击推进
        root.on(Node.EventType.TOUCH_END, this.onRootTap, this);
    }

    // ==================== 展示 ====================

    /**
     * 展示一个节点并等待玩家操作。
     * dialogue/narration/stage：点击 → {kind:'next'}
     * choice：选中选项 → {kind:'option', index}
     */
    public present(node: StoryNode): Promise<StoryAdvance> {
        this.resetView();
        return new Promise<StoryAdvance>((resolve) => {
            this.resolver = resolve;
            switch (node.type) {
                case 'dialogue': {
                    if (this.nameLabel) {
                        this.nameLabel.node.active = !!node.speaker;
                        this.nameLabel.string = node.speaker || '';
                    }
                    this.tryShowAvatar(node.avatar);
                    this.startTyping(node.text || '', null);
                    break;
                }
                case 'narration': {
                    if (this.nameLabel) this.nameLabel.node.active = false;
                    this.hideAvatar();
                    this.startTyping(node.text || '', null);
                    break;
                }
                case 'choice': {
                    if (this.nameLabel) this.nameLabel.node.active = false;
                    this.hideAvatar();
                    this.choiceMode = true;
                    this.pendingOptions = node.options || [];
                    this.startTyping(node.text || '（请选择）', () => this.showChoices());
                    break;
                }
                case 'stage': {
                    if (this.nameLabel) this.nameLabel.node.active = false;
                    this.applyStage(node);
                    this.startTyping(node.text || '', null);
                    break;
                }
                default: {
                    // 引擎不会为 action 调用 present；防御性直接推进
                    resolve({ kind: 'next' });
                    break;
                }
            }
        });
    }

    // ==================== 打字机 ====================

    private startTyping(text: string, onDone: (() => void) | null) {
        this.stopTyping();
        this.fullText = text || '';
        this.typing = true;
        this.typeDone = onDone;
        if (this.textLabel) {
            this.textLabel.string = '';
        }
        if (this.hintLabel) this.hintLabel.string = this.fullText ? '打字中…（点击加速）' : '点击继续 ▾';
        if (!this.fullText) {
            this.finishTyping();
            return;
        }
        this.typedLen = 0;
        this.schedule(this.onTypeTick, TYPE_INTERVAL);
    }

    private typedLen = 0;

    private onTypeTick() {
        if (!this.typing) return;
        this.typedLen += 2; // 每帧两字，避免过长对白过慢
        if (this.textLabel) this.textLabel.string = this.fullText.slice(0, this.typedLen);
        if (this.typedLen >= this.fullText.length) {
            this.finishTyping();
        }
    }

    private finishTyping() {
        this.stopTyping();
        if (this.textLabel) this.textLabel.string = this.fullText;
        if (this.hintLabel) {
            this.hintLabel.string = this.choiceMode ? '请选择' : '点击继续 ▾';
        }
        if (this.typeDone) {
            const done = this.typeDone;
            this.typeDone = null;
            done();
        }
    }

    private skipTyping() {
        if (!this.typing) return;
        this.typedLen = this.fullText.length;
        if (this.textLabel) this.textLabel.string = this.fullText;
        this.finishTyping();
    }

    private stopTyping() {
        this.typing = false;
        if (this.unschedule) this.unschedule(this.onTypeTick);
    }

    // ==================== 选项 ====================

    private showChoices() {
        if (!this.choiceRoot) return;
        this.clearChoices();
        const opts = this.pendingOptions || [];
        if (opts.length === 0) {
            // 没有选项的 choice 视为普通文本，点击继续
            this.choiceMode = false;
            return;
        }
        this.choiceRoot.active = true;
        const t = this.node.getComponent(UITransform);
        const w = t ? t.width : 1280;
        const btnW = Math.min(w * 0.7, 720);
        const btnH = 62;
        const gap = 12;
        const startY = ((opts.length - 1) * (btnH + gap)) / 2;
        opts.forEach((opt, i) => {
            const btn = this.mkSprite(this.choiceRoot!, `Option${i}`, btnW, btnH, new Color(20, 26, 40, 235));
            btn.node.setPosition(0, startY - i * (btnH + gap));
            const lb = this.mkLabel(btn.node, 'Text', opt.text, 24, new Color(240, 240, 240, 255), btnW - 40);
            lb.node.setPosition(0, 0);
            const idx = i;
            btn.node.on(Node.EventType.TOUCH_END, (ev: EventTouch) => {
                if (ev) ev.propagationStopped = true;
                this.onChoose(idx);
            });
        });
    }

    private onChoose(index: number) {
        const r = this.resolver;
        this.resolver = null;
        r?.({ kind: 'option', index });
    }

    private clearChoices() {
        if (this.choiceRoot) {
            this.choiceRoot.removeAllChildren();
            this.choiceRoot.active = false;
        }
    }

    // ==================== 演出资源 ====================

    private tryShowAvatar(key: string | undefined) {
        if (!key) {
            this.hideAvatar();
            return;
        }
        resources.load(`story/image/${key}/spriteFrame`, SpriteFrame, (err, sf) => {
            if (!this.avatarArt || !this.isValid) return;
            if (err || !sf) {
                this.hideAvatar();
                return;
            }
            this.avatarArt.spriteFrame = sf;
            this.avatarArt.node.active = true;
        });
    }

    private hideAvatar() {
        if (this.avatarArt) this.avatarArt.node.active = false;
    }

    private applyStage(node: StoryNode) {
        const stage = node.stage;
        if (!stage) return;
        if (stage.video) {
            console.warn(`[StoryPanel] 视频演出尚未支持，跳过 video=${stage.video}`);
        }
        if (stage.bg) {
            resources.load(`story/image/${stage.bg}/spriteFrame`, SpriteFrame, (err, sf) => {
                if (!this.bgArt || !this.isValid) return;
                if (err || !sf) {
                    console.warn(`[StoryPanel] 背景资源缺失，跳过 bg=${stage.bg}`);
                    return;
                }
                this.bgArt.spriteFrame = sf;
                this.bgArt.node.active = true;
            });
        }
        if (stage.avatar) this.tryShowAvatar(stage.avatar);
    }

    // ==================== 点击推进 ====================

    private onRootTap() {
        if (this.typing) {
            this.skipTyping();
            return;
        }
        if (this.choiceMode) return; // 选项模式由按钮处理
        const r = this.resolver;
        this.resolver = null;
        r?.({ kind: 'next' });
    }

    // ==================== 重置/清理 ====================

    private resetView() {
        this.stopTyping();
        this.choiceMode = false;
        this.pendingOptions = null;
        this.clearChoices();
        this.hideAvatar();
    }

    protected onDestroy() {
        this.stopTyping();
        if (this.node) this.node.off(Node.EventType.TOUCH_END, this.onRootTap, this);
        const r = this.resolver;
        this.resolver = null;
        r?.({ kind: 'next' }); // 唤醒等待中的引擎循环（token 会拦下旧会话）
    }

    // ==================== 构建辅助 ====================

    private mkSprite(parent: Node, name: string, w: number, h: number, color?: Color): Sprite {
        const n = new Node(name);
        parent.addChild(n);
        const t = n.addComponent(UITransform);
        t.setContentSize(w, h);
        const s = n.addComponent(Sprite);
        s.sizeMode = Sprite.SizeMode.CUSTOM;
        s.type = Sprite.Type.SIMPLE;
        if (this.whiteSf) s.spriteFrame = this.whiteSf;
        if (color) s.color = color;
        return s;
    }

    private mkLabel(parent: Node, name: string, str: string, size: number, color: Color, wrapW: number): Label {
        const n = new Node(name);
        parent.addChild(n);
        const t = n.addComponent(UITransform);
        t.setContentSize(wrapW, size * 2.4);
        const lb = n.addComponent(Label);
        lb.string = str;
        lb.fontSize = size;
        lb.lineHeight = Math.round(size * 1.5);
        lb.color = color;
        lb.overflow = Label.Overflow.SHRINK;
        lb.enableWrapText = true;
        lb.horizontalAlign = Label.HorizontalAlign.CENTER;
        lb.verticalAlign = Label.VerticalAlign.CENTER;
        return lb;
    }
}
