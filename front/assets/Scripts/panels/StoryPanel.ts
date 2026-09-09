// StoryPanel.ts
// 剧情表现层（预制体驱动版）：挂载于 assets/Prefabs/UI/StoryPanel.prefab 根节点
// （编辑器已配好 UITransform 与本脚本组件）。
//
// 所有可见节点都在编辑器中排布，本脚本只按“约定角色”绑定并驱动它们：
//   Background  = 暗幕/底图（仅视觉，逻辑不触碰）
//   CGDisplay   = 舞台背景 CG（stage.bg 切图 / 显示隐藏，Sprite）
//   Person      = 说话人立绘/头像（Sprite，可位于自身或其子级）
//   Text > Label= 对白/旁白正文（打字机）
//   NameLabel   = 说话人名字
//   HintLabel   = “打字中… / 点击继续”提示
//   ChoiceRoot  = 选项按钮容器（容器在编辑器建好；按钮数量不定，运行时生成到其中）
//
// 说明：角色节点缺失时仅告警降级、不自动补建（以编辑器配置为准）；图片资源缺失自动降级隐藏。
import { _decorator, Color, Component, EventTouch, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { StoryNode } from 'db://assets/Scripts/layers/story/StoryTypes';

const { ccclass } = _decorator;

/** present() 的返回值：普通推进 或 玩家选中的选项下标 */
export type StoryAdvance = { kind: 'next' } | { kind: 'option'; index: number };

const TYPE_INTERVAL = 0.02; // 打字机逐字间隔（秒）

@ccclass('StoryPanel')
export class StoryPanel extends Component {
    // 编辑器角色节点（绑定得到，可能为 null → 功能降级）
    private bgArt: Sprite | null = null;         // CGDisplay
    private avatarArt: Sprite | null = null;     // Person（自身或子级上的 Sprite）
    private nameLabel: Label | null = null;
    private textLabel: Label | null = null;
    private hintLabel: Label | null = null;
    private choiceRoot: Node | null = null;

    private whiteSf: SpriteFrame | null = null;  // 用于选项按钮底色（缺失则按钮透明、仅文字）

    private resolver: ((r: StoryAdvance) => void) | null = null;
    private readyPromise: Promise<void> | null = null;

    private typing = false;
    private fullText = '';
    private typeDone: (() => void) | null = null;

    private choiceMode = false;
    private pendingOptions: StoryNode['options'] | null = null;

    // ==================== 初始化 ====================

    /** 绑定编辑器节点 + 白色贴图；幂等。present() 前必须完成。 */
    public ensureReady(): Promise<void> {
        if (!this.readyPromise) {
            this.readyPromise = this.init();
        }
        return this.readyPromise;
    }

    private async init(): Promise<void> {
        this.bindNodes();
        this.bindTap();
        await this.loadWhite();
    }

    /** 按约定名绑定角色节点；缺失时告警，不阻断运行。 */
    private bindNodes() {
        const root = this.node;
        if (!root || !root.isValid) return;

        const cg = this.findNodeByName('CGDisplay');
        this.bgArt = cg ? (cg.getComponent(Sprite) ?? cg.getComponentInChildren(Sprite)) : null;
        if (!this.bgArt) console.warn('[StoryPanel] 缺少角色节点 CGDisplay(Sprite)：舞台背景不可用');

        const person = this.findNodeByName('Person');
        this.avatarArt = person ? (person.getComponent(Sprite) ?? person.getComponentInChildren(Sprite)) : null;
        if (!this.avatarArt) console.warn('[StoryPanel] 缺少角色节点 Person(Sprite)：说话人立绘不可用');

        const textN = this.findNodeByName('Text');
        this.textLabel = textN ? (textN.getComponent(Label) ?? textN.getComponentInChildren(Label)) : null;
        if (!this.textLabel) console.error('[StoryPanel] 缺少角色节点 Text>Label：对白无法显示');

        const nameN = this.findNodeByName('NameLabel');
        this.nameLabel = nameN ? (nameN.getComponent(Label) ?? nameN.getComponentInChildren(Label)) : null;
        if (!this.nameLabel) console.warn('[StoryPanel] 缺少角色节点 NameLabel：说话人名字不可用');

        const hintN = this.findNodeByName('HintLabel');
        this.hintLabel = hintN ? (hintN.getComponent(Label) ?? hintN.getComponentInChildren(Label)) : null;
        if (!this.hintLabel) console.warn('[StoryPanel] 缺少角色节点 HintLabel：操作提示不可用');

        this.choiceRoot = this.findNodeByName('ChoiceRoot');
        if (!this.choiceRoot) console.warn('[StoryPanel] 缺少角色节点 ChoiceRoot：选项按钮不可用');
    }

    /** 深度优先按节点名查找（编辑器里 NameLabel/HintLabel/ChoiceRoot 位于 Content 下）。 */
    private findNodeByName(name: string): Node | null {
        if (!this.node) return null;
        return this.searchNode(this.node, name);
    }

    private searchNode(n: Node, name: string): Node | null {
        for (const c of n.children) {
            if (c.name === name) return c;
            const hit = this.searchNode(c, name);
            if (hit) return hit;
        }
        return null;
    }

    /** 根节点点击推进（StoryPanel 全屏，挡住下层世界交互）。 */
    private bindTap() {
        if (!this.node) return;
        this.node.off(Node.EventType.TOUCH_END, this.onRootTap, this);
        this.node.on(Node.EventType.TOUCH_END, this.onRootTap, this);
    }

    private loadWhite(): Promise<void> {
        return new Promise<void>((resolve) => {
            resources.load('image/white/spriteFrame', SpriteFrame, (err, sf) => {
                if (err || !sf) {
                    console.warn('[StoryPanel] 白色贴图加载失败（选项按钮将无底色）', err);
                } else {
                    this.whiteSf = sf;
                }
                resolve();
            });
        });
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
        if (!this.choiceRoot) {
            // 无选项容器：按普通文本处理（点击继续）
            console.warn('[StoryPanel] 缺少 ChoiceRoot，选项将按点击继续处理');
            this.choiceMode = false;
            return;
        }
        this.clearChoices();
        const opts = this.pendingOptions || [];
        if (opts.length === 0) {
            // 没有选项的 choice 视为普通文本，点击继续
            this.choiceMode = false;
            return;
        }
        const host = this.choiceRoot;
        host.active = true;
        const t = host.getComponent(UITransform) ?? this.node.getComponent(UITransform);
        const w = t?.width ?? 1280;
        const btnW = Math.min(w * 0.7, 720);
        const btnH = 62;
        const gap = 12;
        const startY = ((opts.length - 1) * (btnH + gap)) / 2;
        opts.forEach((opt, i) => {
            const btn = this.mkOptionButton(host, `Option${i}`, btnW, btnH, new Color(20, 26, 40, 235));
            btn.node.setPosition(0, startY - i * (btnH + gap));
            const lb = this.mkOptionLabel(btn.node, opt.text, btnW - 40);
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
        if (!this.avatarArt) return;
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
            if (!this.bgArt) return;
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

    // ==================== 选项构建辅助（仅选项按钮动态生成） ====================

    private mkOptionButton(parent: Node, name: string, w: number, h: number, color: Color): Sprite {
        const n = new Node(name);
        parent.addChild(n);
        const t = n.addComponent(UITransform);
        t.setContentSize(w, h);
        const s = n.addComponent(Sprite);
        s.sizeMode = Sprite.SizeMode.CUSTOM;
        s.type = Sprite.Type.SIMPLE;
        if (this.whiteSf) s.spriteFrame = this.whiteSf;
        s.color = color;
        return s;
    }

    private mkOptionLabel(parent: Node, str: string, wrapW: number): Label {
        const n = new Node('Text');
        parent.addChild(n);
        const t = n.addComponent(UITransform);
        t.setContentSize(wrapW, 62);
        const lb = n.addComponent(Label);
        lb.string = str;
        lb.fontSize = 24;
        lb.lineHeight = Math.round(24 * 1.5);
        lb.color = new Color(240, 240, 240, 255);
        lb.overflow = Label.Overflow.SHRINK;
        lb.enableWrapText = true;
        lb.horizontalAlign = Label.HorizontalAlign.CENTER;
        lb.verticalAlign = Label.VerticalAlign.CENTER;
        return lb;
    }
}
