// BattleActor.ts
// 单个战斗位的展示层（视图）：站位节点 + 占位体 + 血条 + 名字 + buff 图标 + 飘字。
//
// 职责边界：本文件**只做表现，不做任何战斗结算**。
// 所有数值与事件都由 FightPanel 从服务端下发的战斗日志/权威状态喂进来，
// 因此前端不需要（也不允许）自己算伤害——这正是"日志回放"方案的核心。
//
// 动画优先级：Body 节点上若挂了 Animation 组件且存在同名 Clip，就播 Clip；
// 否则用 tween 做程序化占位演出。美术资源到位后只需给 Body 挂 Clip 或调用
// setArt() 换 Sprite，调用方（FightPanel）一行都不用改。
import { _decorator, Animation, Color, Component, Graphics, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec3 } from 'cc';

const { ccclass } = _decorator;

/** 演出动作名（与 Animation Clip 名、日志类型一一对应） */
export type BattleAnim = 'idle' | 'attack' | 'cast' | 'hit' | 'heal' | 'die';

/** 战斗位建场参数（由 FightPanel 依据权威状态 + 展示配置组装） */
export interface ActorOptions {
    index: number;       // 战斗位索引（0..N-1，与协议里的 source/target 一致）
    characterId: number; // 角色/敌人 DB ID
    isSelf: boolean;     // 是否我方（决定朝向与站位）
    name: string;        // 展示名
    maxHealth: number;   // 生命上限
    color: Color;        // 占位体颜色（美术资源缺失时的兜底色）
    scale?: number;      // 整体缩放（不同体型的角色可用）
}

/** 一个 buff 的展示数据：id + 剩余层数/时间（层数由 counter 事件实时更新） */
export interface BuffView {
    id: number;
    time: number;
}

// 占位体尺寸（像素，设计分辨率下）
const BODY_W = 110;
const BODY_H = 170;
const HP_W = 120;
const HP_H = 12;
const HP_OFF_Y = BODY_H / 2 + 26; // 血条相对身体中心的偏移
const BUFF_SIZE = 22;
const BUFF_GAP = 4;
const MAX_BUFF_ICONS = 6;

/**
 * 清空子节点并**真正销毁**它们。
 * Cocos 的 Node.removeAllChildren() 只解除父子关系、不销毁节点，
 * 反复刷新（buff 图标、技能按钮）会不断漏节点，所以统一走这个函数。
 */
export function clearChildren(parent: Node): void {
    if (!parent || !parent.isValid) return;
    for (const child of [...parent.children]) {
        if (child && child.isValid) child.destroy();
    }
}

/**
 * 一个战斗位的视图。
 * 节点树（全部运行时创建，不需要在编辑器里搭；美术资源通过 setArt 注入）：
 *   <槽位节点>
 *     Body      占位体（Graphics）/ 或美术 Sprite —— 演出动画作用在这一层
 *     HpRoot    血条底 + 血条前景（Graphics）
 *     NameLabel 名字
 *     BuffRoot  buff 图标容器
 *     Floating  飘字容器（伤害/治疗数字，用完即销）
 */
@ccclass('BattleActor')
export class BattleActor extends Component {
    public slotIndex = 0;
    public characterId = 0;
    public isSelf = false;
    public maxHealth = 1;
    public health = 1;
    public dead = false;

    private body: Node = null!;
    private bodyArt: Sprite = null!; // 美术资源槽位（默认隐藏，setArt 后启用）
    private bodyGfx: Graphics = null!;
    private hpGfx: Graphics = null!;
    private nameLabel: Label = null!;
    private buffRoot: Node = null!;
    private floatingRoot: Node = null!;

    private bodyColor = new Color(200, 200, 200, 255);
    private baseScale = 1;
    private facing = 1;
    private idleTween: any = null;

    /** 建场：创建节点树并按参数初始化外观。可重复调用（换人/重连重排时复用节点）。 */
    public setup(opts: ActorOptions): void {
        this.slotIndex = opts.index;
        this.characterId = opts.characterId;
        this.isSelf = opts.isSelf;
        this.node.name = `Actor_${opts.index}`; // 节点名带槽位号，便于在编辑器/Hierarchy 里对号
        this.maxHealth = Math.max(1, opts.maxHealth);
        this.health = this.maxHealth;
        this.dead = false;
        this.bodyColor = opts.color ?? this.bodyColor;
        this.baseScale = opts.scale ?? 1;
        this.facing = opts.isSelf ? 1 : -1; // 我方朝右、敌方朝左

        this.ensureNodes();
        this.body.setScale(this.baseScale, this.baseScale, 1);
        this.body.setPosition(0, 0, 0);
        (this.body.getComponent(UIOpacity) ?? this.body.addComponent(UIOpacity)).opacity = 255;
        this.nameLabel.string = opts.name || `#${opts.characterId}`;
        this.drawBody();
        this.setHealth(this.maxHealth, this.maxHealth, false);
        this.setBuffs([]);
        this.playIdle();
    }

    /** 注入美术资源（Spine/Sprite 帧到位后调用即可替换占位体）。 */
    public setArt(spriteFrame: SpriteFrame | null): void {
        this.ensureNodes();
        this.bodyArt.spriteFrame = spriteFrame;
        this.bodyArt.node.active = !!spriteFrame;
        this.bodyGfx.enabled = !spriteFrame; // 有美术就不画占位体
    }

    // ==================== 节点树 ====================

    private ensureNodes(): void {
        if (this.body && this.body.isValid) return;

        // 根节点要有尺寸，否则点选目标时命中测试（UITransform 矩形）接不到事件
        this.node.getComponent(UITransform)!.setContentSize(BODY_W + 40, BODY_H + 140);
        this.node.off(Node.EventType.TOUCH_END, this.handleTap, this);
        this.node.on(Node.EventType.TOUCH_END, this.handleTap, this);

        this.body = this.makeChild('Body');
        this.bodyGfx = this.body.addComponent(Graphics);
        const artNode = this.makeChild('BodyArt', this.body);
        this.bodyArt = artNode.addComponent(Sprite);
        this.bodyArt.sizeMode = Sprite.SizeMode.CUSTOM;
        artNode.getComponent(UITransform)!.setContentSize(BODY_W, BODY_H);
        artNode.active = false;

        const hpNode = this.makeChild('HpRoot');
        this.hpGfx = hpNode.addComponent(Graphics);

        const nameNode = this.makeChild('NameLabel');
        this.nameLabel = nameNode.addComponent(Label);
        this.nameLabel.fontSize = 20;
        this.nameLabel.lineHeight = 24;
        this.nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.nameLabel.color = new Color(240, 240, 240, 255);
        nameNode.setPosition(0, HP_OFF_Y + HP_H + 16, 0);

        this.buffRoot = this.makeChild('BuffRoot');
        this.buffRoot.setPosition(-(MAX_BUFF_ICONS * (BUFF_SIZE + BUFF_GAP)) / 2, -BODY_H / 2 - 24, 0);

        this.floatingRoot = this.makeChild('Floating');
    }

    private makeChild(name: string, parent?: Node): Node {
        const n = new Node(name);
        n.addComponent(UITransform);
        (parent ?? this.node).addChild(n);
        return n;
    }

    /**
     * 画占位体。override 为临时闪烁色（受击白闪/治疗绿闪），不改变角色固有色；
     * 传空则用固有色重画。死亡时调用方直接把固有色改成灰色。
     */
    private drawBody(override?: Color): void {
        if (!this.bodyGfx || !this.bodyGfx.isValid) return;
        const fill = override ?? this.bodyColor;
        const g = this.bodyGfx;
        g.clear();
        g.fillColor = fill;
        g.roundRect(-BODY_W / 2, -BODY_H / 2, BODY_W, BODY_H, 14);
        g.fill();
        // 朝向标记：头顶一个小三角，避免左右站位看不出来
        g.fillColor = override ?? new Color(255, 220, 120, 255);
        g.moveTo(this.facing * 18, BODY_H / 2 - 6);
        g.lineTo(this.facing * 42, BODY_H / 2 + 8);
        g.lineTo(this.facing * 18, BODY_H / 2 + 22);
        g.close();
        g.fill();
    }

    // ==================== 数值 / buff ====================

    /**
     * 更新血量并重画血条。
     * animate=true 时血条做补间（演出用）；数值以参数为准，不做任何本地推算。
     */
    public setHealth(current: number, max?: number, animate = true): void {
        if (typeof max === 'number' && max > 0) this.maxHealth = max;
        const target = Math.max(0, Math.min(current, this.maxHealth));
        if (!animate) {
            this.health = target;
            this.drawHp();
            return;
        }
        // 补间：只动"显示值"，最终仍精确落到 target
        const from = this.health;
        const proxy = { v: from };
        this.health = target;
        tween(proxy)
            .to(0.22, { v: target }, {
                onUpdate: () => {
                    this.health = proxy.v;
                    this.drawHp();
                },
            })
            .call(() => {
                this.health = target;
                this.drawHp();
            })
            .start();
    }

    private drawHp(): void {
        if (!this.hpGfx || !this.hpGfx.isValid) return;
        const ratio = this.maxHealth > 0 ? Math.max(0, Math.min(1, this.health / this.maxHealth)) : 0;
        const g = this.hpGfx;
        g.clear();
        // 底
        g.fillColor = new Color(30, 30, 30, 220);
        g.rect(-HP_W / 2 - 2, HP_OFF_Y - 2, HP_W + 4, HP_H + 4);
        g.fill();
        // 前景：我方绿、敌方红，血量低转黄
        const color = this.isSelf
            ? (ratio > 0.3 ? new Color(90, 210, 110, 255) : new Color(230, 190, 80, 255))
            : (ratio > 0.3 ? new Color(220, 90, 90, 255) : new Color(230, 190, 80, 255));
        g.fillColor = ratio <= 0 ? new Color(70, 70, 70, 255) : color;
        g.rect(-HP_W / 2, HP_OFF_Y, HP_W * ratio, HP_H);
        g.fill();
    }

    /**
     * 刷新 buff 图标（彩色小方块 + 「buffID×层数」文字）。
     * 层数为 1 时只显示 buffID；层数由 counter 事件实时更新，因此这里每次都整体重画。
     */
    public setBuffs(buffs: BuffView[]): void {
        if (!this.buffRoot || !this.buffRoot.isValid) return;
        // 注意：removeAllChildren 只解除父子关系、不销毁节点，重复刷新会漏节点。
        clearChildren(this.buffRoot);
        const list = (buffs || []).slice(0, MAX_BUFF_ICONS);
        list.forEach((buff, i) => {
            const n = this.makeChild(`Buff_${buff.id}`, this.buffRoot);
            n.setPosition(i * (BUFF_SIZE + BUFF_GAP), 0, 0);
            const g = n.addComponent(Graphics);
            g.fillColor = this.buffColor(buff.id);
            g.roundRect(-BUFF_SIZE / 2, -BUFF_SIZE / 2, BUFF_SIZE, BUFF_SIZE, 4);
            g.fill();
            const labelNode = this.makeChild('Id', n);
            const label = labelNode.addComponent(Label);
            label.string = buff.time > 1 ? `${buff.id}×${buff.time}` : `${buff.id}`;
            label.fontSize = 14;
            label.lineHeight = 16;
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.color = new Color(20, 20, 20, 255);
        });
    }

    private buffColor(id: number): Color {
        const palette = [
            new Color(255, 170, 90, 255),
            new Color(150, 200, 255, 255),
            new Color(190, 160, 255, 255),
            new Color(140, 230, 200, 255),
        ];
        return palette[Math.abs(id) % palette.length];
    }

    // ==================== 演出 ====================

    /** 播放一个动作；有同名 Clip 播 Clip，否则 tween 兜底。 */
    public playAnim(kind: BattleAnim): void {
        if (kind === 'die') {
            this.dead = true;
        }
        if (this.playClip(kind)) return;

        this.stopIdle();
        const body = this.body;
        if (!body || !body.isValid) return;

        switch (kind) {
            case 'attack':
                // 前冲再回位（朝敌方位移）
                tween(body)
                    .to(0.12, { position: new Vec3(this.facing * 46, 8, 0) }, { easing: 'quadOut' })
                    .to(0.18, { position: new Vec3(0, 0, 0) }, { easing: 'quadIn' })
                    .call(() => this.playIdle())
                    .start();
                break;
            case 'cast':
                tween(body)
                    .to(0.14, { scale: new Vec3(this.baseScale * 1.16, this.baseScale * 1.16, 1) }, { easing: 'backOut' })
                    .to(0.2, { scale: new Vec3(this.baseScale, this.baseScale, 1) })
                    .call(() => this.playIdle())
                    .start();
                break;
            case 'hit':
                this.flash(true);
                tween(body)
                    .to(0.05, { position: new Vec3(-8 * this.facing, 0, 0) })
                    .to(0.05, { position: new Vec3(8 * this.facing, 0, 0) })
                    .to(0.06, { position: new Vec3(0, 0, 0) })
                    .call(() => {
                        this.flash(false);
                        if (!this.dead) this.playIdle();
                    })
                    .start();
                break;
            case 'heal':
                this.flash(true, new Color(180, 255, 190, 255));
                tween(body)
                    .to(0.14, { scale: new Vec3(this.baseScale * 1.1, this.baseScale * 1.1, 1) })
                    .to(0.2, { scale: new Vec3(this.baseScale, this.baseScale, 1) })
                    .call(() => {
                        this.flash(false);
                        if (!this.dead) this.playIdle();
                    })
                    .start();
                break;
            case 'die':
                tween(body)
                    .to(0.4, { position: new Vec3(-24 * this.facing, -46, 0), scale: new Vec3(this.baseScale, this.baseScale * 0.5, 1) }, { easing: 'quadIn' })
                    .call(() => {
                        const op = body.getComponent(UIOpacity) ?? body.addComponent(UIOpacity);
                        tween(op).to(0.3, { opacity: 120 }).start();
                        this.bodyColor = new Color(90, 90, 90, 255);
                        this.drawBody();
                    })
                    .start();
                break;
            default:
                this.playIdle();
                break;
        }
    }

    /** 待机呼吸（循环）：死亡后不再播放。 */
    public playIdle(): void {
        if (this.dead || !this.body || !this.body.isValid) return;
        if (this.playClip('idle')) return;
        this.stopIdle();
        this.idleTween = tween(this.body)
            .to(0.7, { scale: new Vec3(this.baseScale, this.baseScale * 1.03, 1) }, { easing: 'sineInOut' })
            .to(0.7, { scale: new Vec3(this.baseScale, this.baseScale, 1) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    private stopIdle(): void {
        if (this.idleTween) {
            this.idleTween.stop();
            this.idleTween = null;
        }
    }

    private flash(on: boolean, color?: Color): void {
        this.drawBody(on ? (color ?? new Color(255, 255, 255, 255)) : undefined);
    }

    private playClip(name: string): boolean {
        const anim = this.body ? this.body.getComponent(Animation) : null;
        if (!anim) return false;
        if (!anim.getState(name)) return false;
        anim.play(name);
        return true;
    }

    /**
     * 飘字（伤害/治疗数字、buff 名等）。
     * 数值文本由调用方给定，本层不做任何换算。
     */
    public float(text: string, color: Color, riseTo = 70): void {
        if (!this.floatingRoot || !this.floatingRoot.isValid || !text) return;
        const n = this.makeChild('Float', this.floatingRoot);
        n.setPosition(0, BODY_H / 2 - 10, 0);
        const label = n.addComponent(Label);
        label.string = text;
        label.fontSize = 30;
        label.lineHeight = 34;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.color = color;
        const op = n.addComponent(UIOpacity);
        tween(n)
            .to(0.6, { position: new Vec3(0, riseTo, 0) }, { easing: 'quadOut' })
            .call(() => {
                if (n.isValid) n.destroy();
            })
            .start();
        tween(op).delay(0.32).to(0.28, { opacity: 0 }).start();
    }

    /** 复位到"满血待机"（重连/重排时用）。 */
    public reset(): void {
        this.dead = false;
        this.stopIdle();
        if (!this.body || !this.body.isValid) return;
        this.body.setPosition(0, 0, 0);
        this.body.setScale(this.baseScale, this.baseScale, 1);
        (this.body.getComponent(UIOpacity) ?? this.body.addComponent(UIOpacity)).opacity = 255;
        this.playIdle();
    }

    /** 点击回调：由 FightPanel 注入（用于"选择目标"）。 */
    public onTap: (index: number) => void = () => { /* 默认不处理 */ };

    private handleTap(): void {
        try {
            this.onTap?.(this.slotIndex);
        } catch (e) {
            console.error('[BattleActor] onTap 回调异常', e);
        }
    }

    /** 选靶高亮：用一圈描边标记可选中的战斗位。 */
    public setSelectable(on: boolean): void {
        if (!this.bodyGfx || !this.bodyGfx.isValid) return;
        if (!on) {
            this.drawBody();
            return;
        }
        this.drawBody();
        const g = this.bodyGfx;
        g.lineWidth = 4;
        g.strokeColor = new Color(255, 230, 120, 255);
        g.roundRect(-BODY_W / 2 - 6, -BODY_H / 2 - 6, BODY_W + 12, BODY_H + 12, 16);
        g.stroke();
    }
}
