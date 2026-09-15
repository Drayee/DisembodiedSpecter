// FightPanel.ts
// 战斗表现面板：挂在 assets/Prefabs/UI/FightPanel.prefab 根节点（UIManager.openPanel('FightPanel')）。
//
// 数据流（"日志回放"方案，前端不做任何结算）：
//   服务端战斗执行 → 记录战斗日志 → sendFightStatus 时【先发日志、再发权威状态】
//     → GameManager.onFightLogs / onBattleStatus
//     → FightLogPlayer 队列串行演出（BattleActor 播动画/飘字/血条补间）
//     → 队列播空后把权威状态落地（对齐最终数值）
//     → 若处于敌方回合（stateNumber=2）自动发 START_PHASE 让服务端继续跑
//
// 因此前端的血量/伤害永远来自服务端：日志负责"演得好看"，状态负责"数值正确"。
//
// 编辑器约定（节点名，缺失时本脚本会在运行时兜底创建，所以可以先只挂组件）：
//   Background  背景（可选，Sprite）
//   Content     舞台容器（可选，默认用根节点）
//   Character   战斗位容器（我方在左、敌方在右，由本脚本排布）
//   Effect      特效/飘字容器（可选，默认用 Content）
//   HUD         以下 HUD 节点的父节点（可选）
//     RoundLabel  回合数（左上）
//     PhaseLabel  阶段提示（左上第二行）
//     TipLabel    操作提示（底部）
//   SkillRoot   技能按钮容器（按钮运行时生成）
//   AttackBtn   出手按钮、SpeedBtn 倍速、SkipBtn 跳过演出（缺失时兜底创建）
//   ResultRoot>ResultLabel+ExitBtn  结算面板（缺失时结算时兜底创建）
import { _decorator, Color, Component, Graphics, JsonAsset, Label, Node, resources, Sprite, UITransform, view } from 'cc';
import { GameManager } from 'db://assets/Scripts/managers/GameManager';
import { UIManager } from 'db://assets/Scripts/managers/UIManager';
import { BattleActor, clearChildren } from 'db://assets/Scripts/layers/fight/BattleActor';
import { FightLogLike, FightLogPlayer, FightLogType } from 'db://assets/Scripts/layers/fight/FightLogPlayer';

const { ccclass } = _decorator;

/** 战斗状态编号（与后端 structs.Waiting/MyRound/OtherRound 一致） */
const STATE_WAITING = 0;
const STATE_MY_ROUND = 1;
const STATE_OTHER_ROUND = 2;

/** 各日志的演出时长（毫秒）：集中在这里便于调手感与倍速 */
const DURATION = {
    cast: 420,
    attack: 380,
    recover: 380,
    buff: 240,
    death: 560,
    round: 420,
    end: 700,
    unknown: 160,
};

/** 技能配置（展示配置表里的字段） */
interface SkillConfig {
    id: number;
    name: string;
    target?: 'enemy' | 'ally' | 'self';
}

/** 面板局部 UI 尺寸 */
const BTN_W = 150;
const BTN_H = 52;

@ccclass('FightPanel')
export class FightPanel extends Component {
    // ==================== 节点引用（按约定名绑定，缺失则运行时兜底创建） ====================
    private contentRoot: Node = null!;
    private actorRoot: Node = null!;
    private hudRoot: Node = null!;

    private roundLabel: Label = null!;
    private phaseLabel: Label = null!;
    private tipLabel: Label = null!;
    private skillRoot: Node = null!;
    private attackBtn: Node = null!;
    private attackBtnLabel: Label = null!;
    private speedBtnLabel: Label = null!;
    private resultRoot: Node = null!;
    private resultLabel: Label = null!;

    // ==================== 战斗状态 ====================
    private actors: BattleActor[] = [];
    private player = new FightLogPlayer();
    private status: any = null;         // 最近一次权威状态
    private pendingStatus: any = null;  // 演出期间挂起的状态（播完再落地）
    private ended = false;
    private autoAdvanceKey = '';        // 自动推进去重键（round:stateNumber）

    private buffIds: number[][] = [];   // 各战斗位当前展示的 buff（日志增删 + 状态对齐）
    private selection = new Map<number, { skillId: number; targetId: number }>();
    private targeting: { characterId: number; skill: SkillConfig } | null = null;
    private lastSkillSig = '';          // 我方角色集合签名：没变就不重建技能按钮
    private forceRebuild = false;       // 展示配置加载完成后强制重建战斗位

    // ==================== 展示配置 ====================
    private cfg: any = null;

    // ==================== 生命周期 ====================

    onLoad() {
        this.bindNodes();
        const gm = GameManager.getInstance();
        if (!gm) {
            console.error('[FightPanel] GameManager 未初始化，战斗面板无法工作');
            return;
        }

        // 日志 → 播放队列（每条演多久由 playLog 决定）
        this.player.onPlay = (entry) => this.playLog(entry);
        this.player.onDrain = () => this.onPlaybackDrained();

        gm.onFightLogs = (logs) => this.handleLogs(logs);
        gm.onBattleStatus = (status) => this.handleStatus(status);

        this.loadConfig().then(() => {
            // 配置是异步加载的：若它比首个权威状态回来得晚，战斗位已经按默认样式建好了，
            // 这里强制按配置重建一次（名字/颜色/缩放/技能按钮都以配置为准）。
            this.forceRebuild = true;
            this.lastSkillSig = '';
            if (this.status) this.applyStatus(this.status);
            this.refreshUi();
        });
        this.enterBattle();
    }

    onDestroy() {
        const gm = GameManager.getInstance();
        if (gm) {
            gm.onFightLogs = undefined;
            gm.onBattleStatus = undefined;
            // 面板被关闭 = 离开战斗：通知服务端优雅结束（避免连接挂着）
            if (!this.ended) gm.exitFight();
        }
        this.player.clear();
    }

    // ==================== 节点绑定 ====================

    private bindNodes(): void {
        const size = this.rootSize();
        const halfW = size.width / 2;
        const halfH = size.height / 2;

        this.contentRoot = this.findNode('Content') ?? this.node;
        // 战斗位容器必须有独立节点：重建战斗位时会清空它，若退化成 Content/根节点
        // 会把编辑器里排好的其它节点一起清掉。
        this.actorRoot = this.findNode('Character') ?? this.makeNode('CharacterStage', this.contentRoot);
        this.hudRoot = this.findNode('HUD') ?? this.node;

        this.roundLabel = this.ensureLabel('RoundLabel', 0, halfH - 44, 30, new Color(255, 240, 200, 255));
        this.phaseLabel = this.ensureLabel('PhaseLabel', 0, halfH - 82, 22, new Color(200, 220, 255, 255));
        this.tipLabel = this.ensureLabel('TipLabel', 0, -halfH + 104, 20, new Color(230, 230, 230, 255));

        this.skillRoot = this.findNode('SkillRoot') ?? this.makeNode('SkillRoot', this.hudRoot);
        if (!this.findNode('SkillRoot')) this.skillRoot.setPosition(0, -halfH + 48, 0);

        const attackBtn = this.ensureButton('AttackBtn', '出手', halfW - 110, -halfH + 48, () => this.submitSkills());
        this.attackBtn = attackBtn.node;
        this.attackBtnLabel = attackBtn.label;

        const speedBtn = this.ensureButton('SpeedBtn', '倍速 ×1', halfW - 110, halfH - 44, () => this.cycleSpeed());
        this.speedBtnLabel = speedBtn.label;

        this.ensureButton('SkipBtn', '跳过演出', halfW - 110, halfH - 104, () => this.player.flushNow());

        this.resultRoot = this.findNode('ResultRoot');
        if (this.resultRoot) {
            // 编辑器里已经放好的结算面板：先隐藏，等战斗结束再亮出来
            this.resultRoot.active = false;
            const lbl = this.findNode('ResultLabel');
            this.resultLabel = lbl ? lbl.getComponent(Label) : null;
        }
        // 结算面板整体到结束时才兜底创建（不占编辑器工作量）
    }

    /** 面板尺寸（优先用根节点 UITransform，退化为设计分辨率）。 */
    private rootSize(): { width: number; height: number } {
        const ut = this.node.getComponent(UITransform);
        if (ut && ut.width > 1 && ut.height > 1) {
            return { width: ut.width, height: ut.height };
        }
        const vs = view.getVisibleSize();
        return { width: vs.width, height: vs.height };
    }

    /** 深度优先按节点名查找（与 StoryPanel 同一套约定）。 */
    private findNode(name: string): Node | null {
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

    private makeNode(name: string, parent?: Node): Node {
        const n = new Node(name);
        n.addComponent(UITransform);
        (parent ?? this.node).addChild(n);
        return n;
    }

    /**
     * 绑定/兜底创建 HUD 文本。
     * **编辑器里已经存在的节点一律不动它的位置与尺寸**（尊重编辑器排版），
     * 只有本脚本自己创建的兜底节点才按参数摆放。
     */
    private ensureLabel(name: string, x: number, y: number, fontSize: number, color: Color): Label {
        const found = this.findNode(name);
        const node = found ?? this.makeNode(name, this.hudRoot);
        const ut = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        if (!found) {
            node.setPosition(x, y, 0);
            ut.setContentSize(this.rootSize().width * 0.9, fontSize * 3);
        } else if (ut.width < 1 || ut.height < 1) {
            ut.setContentSize(this.rootSize().width * 0.9, fontSize * 3);
        }
        const label = node.getComponent(Label) ?? node.addComponent(Label);
        if (!found) {
            label.fontSize = fontSize;
            label.lineHeight = Math.round(fontSize * 1.3);
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            label.color = color;
        }
        label.string = '';
        return label;
    }

    /**
     * 绑定/兜底创建文字按钮（用触摸事件，不依赖 Sprite 资源）。
     * 节点已在编辑器里存在时保留其位置/尺寸/外观（若挂了 Sprite 就用它的颜色做选中高亮），
     * 只补上必要的组件与点击回调。
     */
    private ensureButton(
        name: string,
        text: string,
        x: number,
        y: number,
        onClick: () => void,
    ): { node: Node; label: Label } {
        const found = this.findNode(name);
        const node = found ?? this.makeNode(name, this.hudRoot);
        const ut = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        if (!found) {
            node.setPosition(x, y, 0);
            ut.setContentSize(BTN_W, BTN_H);
        } else if (ut.width < 1 || ut.height < 1) {
            ut.setContentSize(BTN_W, BTN_H);
        }

        const sprite = node.getComponent(Sprite);
        let g = node.getComponent(Graphics);
        if (!sprite && !found) {
            if (!g) g = node.addComponent(Graphics);
            g.clear();
            g.fillColor = new Color(45, 55, 80, 230);
            g.roundRect(-ut.width / 2, -ut.height / 2, ut.width, ut.height, 8);
            g.fill();
        }

        let labelNode = node.getChildByName('Label');
        if (!labelNode) {
            labelNode = new Node('Label');
            labelNode.addComponent(UITransform);
            node.addChild(labelNode);
        }
        const lut = labelNode.getComponent(UITransform)!;
        if (lut.width < 1 || lut.height < 1) lut.setContentSize(ut.width, ut.height);
        let label = labelNode.getComponent(Label);
        if (!label) {
            // 只有本脚本新建的 Label 才套默认样式，编辑器里调过的样式不动
            label = labelNode.addComponent(Label);
            label.fontSize = 22;
            label.lineHeight = 26;
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            label.color = new Color(240, 240, 240, 255);
        }
        label.string = text;

        node.off(Node.EventType.TOUCH_END);
        node.on(Node.EventType.TOUCH_END, () => {
            try {
                onClick();
            } catch (e) {
                console.error('[FightPanel] 按钮回调异常', e);
            }
        });
        return { node, label };
    }

    // ==================== 展示配置 ====================

    private loadConfig(): Promise<void> {
        return new Promise<void>((resolve) => {
            resources.load('fight/battle', JsonAsset, (err, asset) => {
                if (err || !asset) {
                    console.warn('[FightPanel] 展示配置 resources/fight/battle.json 未加载，使用内置默认值', err);
                    this.cfg = {};
                } else {
                    this.cfg = (asset.json ?? asset) || {};
                }
                resolve();
            });
        });
    }

    private actorConfig(characterId: number, isSelf: boolean): any {
        const table = isSelf ? this.cfg?.characters : this.cfg?.enemies;
        return (table && table[String(characterId)]) || {};
    }

    private skillsOf(characterId: number): SkillConfig[] {
        const own = this.actorConfig(characterId, true).skills;
        if (Array.isArray(own) && own.length > 0) {
            return own.map((s: any) => ({ id: Number(s.id), name: String(s.name ?? `技能${s.id}`), target: s.target ?? 'enemy' }));
        }
        const defaults = this.cfg?.defaultSkills;
        if (Array.isArray(defaults) && defaults.length > 0) {
            return defaults.map((s: any) => ({ id: Number(s.id), name: String(s.name ?? `技能${s.id}`), target: s.target ?? 'enemy' }));
        }
        return [{ id: 1, name: '攻击', target: 'enemy' }];
    }

    private colorOf(raw: any, fallback: Color): Color {
        if (Array.isArray(raw) && raw.length >= 3) {
            return new Color(Number(raw[0]), Number(raw[1]), Number(raw[2]), 255);
        }
        return fallback;
    }

    // ==================== 进战 / 收发 ====================

    private enterBattle(): void {
        const gm = GameManager.getInstance();
        if (!gm) return;
        gm.startBattle().then((ok) => {
            if (!ok) this.setTip('进入战斗失败：请检查登录状态与后端服务');
        }).catch((e) => {
            console.error('[FightPanel] startBattle 异常', e);
            this.setTip('进入战斗异常，详见控制台');
        });
    }

    /** 收到战斗日志批次：入队串行演出。 */
    private handleLogs(logs: FightLogLike[]): void {
        this.player.enqueue(logs);
    }

    /** 收到权威状态：演出中先挂起，播完再落地（避免血条被"跳到最终值"）。 */
    private handleStatus(status: any): void {
        this.status = status;
        if (this.player.busy) {
            this.pendingStatus = status;
            return;
        }
        this.applyStatus(status);
    }

    // ==================== 状态落地 ====================

    private applyStatus(status: any): void {
        const chars = status?.characters ?? [];
        this.syncActors(chars);

        chars.forEach((c: any, i: number) => {
            const actor = this.actors[i];
            if (!actor) return;
            actor.setHealth(Number(c.health) || 0, Number(c.maxHealth) || Math.max(1, Number(c.health) || 1), false);
            const ids = (c.buffs ?? []).map((b: any) => Number(b.buffId));
            this.buffIds[i] = ids;
            actor.setBuffs(ids);
            if ((Number(c.health) || 0) <= 0 && !actor.dead) actor.playAnim('die');
        });

        this.roundLabel.string = `回合 ${status?.round ?? 0}`;
        this.phaseLabel.string = this.phaseText(status?.stateNumber);

        if (status?.stateNumber === STATE_OTHER_ROUND && !this.ended) {
            this.maybeAutoAdvance();
        }
        this.refreshUi();
    }

    private phaseText(stateNumber: number): string {
        switch (stateNumber) {
            case STATE_WAITING: return '阶段：等待选择技能';
            case STATE_MY_ROUND: return '阶段：我方行动结算中';
            case STATE_OTHER_ROUND: return '阶段：敌方回合';
            default: return `阶段：${stateNumber ?? '-'}`;
        }
    }

    /** 按权威状态同步战斗位（人数/身份变化时重建，否则只更新参数）。 */
    private syncActors(chars: any[]): void {
        const selfCount = chars.filter((c) => c.isMyCharacter).length;
        const needRebuild = this.forceRebuild
            || this.actors.length !== chars.length
            || chars.some((c, i) => !this.actors[i] || this.actors[i].characterId !== Number(c.characterId) || this.actors[i].isSelf !== !!c.isMyCharacter);

        if (needRebuild) {
            this.forceRebuild = false;
            for (const a of this.actors) {
                if (a && a.node && a.node.isValid) a.node.destroy();
            }
            this.actors = [];
            this.buffIds = [];
            clearChildren(this.actorRoot);

            const size = this.rootSize();
            const selfIdx: number[] = [];
            const enemyIdx: number[] = [];
            chars.forEach((c, i) => (c.isMyCharacter ? selfIdx : enemyIdx).push(i));

            chars.forEach((c, i) => {
                const isSelf = !!c.isMyCharacter;
                const conf = this.actorConfig(Number(c.characterId), isSelf);
                const node = this.makeNode(`Actor_${i}`, this.actorRoot);
                const actor = node.addComponent(BattleActor);
                actor.setup({
                    index: i,
                    characterId: Number(c.characterId),
                    isSelf,
                    name: String(conf.name ?? (isSelf ? `我方${i + 1}` : `敌人${i + 1}`)),
                    maxHealth: Number(c.maxHealth) || Math.max(1, Number(c.health) || 1),
                    color: this.colorOf(conf.color, isSelf ? new Color(110, 170, 250, 255) : new Color(200, 95, 95, 255)),
                    scale: Number(conf.scale) || 1,
                });
                actor.onTap = (idx) => this.onActorTapped(idx);

                const order = isSelf ? selfIdx.indexOf(i) : enemyIdx.indexOf(i);
                const count = isSelf ? selfIdx.length : enemyIdx.length;
                const gap = Math.min(190, (size.height - 260) / Math.max(1, count));
                const x = (isSelf ? -1 : 1) * size.width * 0.3;
                const y = ((count - 1) / 2 - order) * gap;
                node.setPosition(x, y, 0);

                this.actors[i] = actor;
                this.buffIds[i] = [];
            });
            this.tipLabel.string = `${selfCount} 名我方角色已就位`;
        } else {
            // 人数没变：只按状态refresh身份（血量/buff 在调用方逐个更新）
            chars.forEach((c, i) => {
                const actor = this.actors[i];
                if (actor) actor.isSelf = !!c.isMyCharacter;
            });
        }
    }

    // ==================== 演出 ====================

    /**
     * 播放一条日志，返回该条演出占用的毫秒数。
     * 所有数值都直接用日志里的字段，前端不做任何换算。
     */
    private playLog(entry: FightLogLike): number {
        const source = this.actors[entry.source];
        const target = this.actors[entry.target];

        switch (entry.type) {
            case FightLogType.CAST:
                if (source) source.playAnim(source.isSelf ? 'cast' : 'attack');
                return DURATION.cast;

            case FightLogType.ATTACK:
                // 出手动画由 CAST 负责，这里只演"受击"：结算数值直接用日志给的
                if (target) {
                    target.playAnim('hit');
                    target.float(`-${entry.value}`, target.isSelf ? new Color(255, 140, 120, 255) : new Color(255, 220, 90, 255));
                    target.setHealth(entry.hpAfter, undefined, true);
                }
                return DURATION.attack;

            case FightLogType.RECOVER:
                if (target) {
                    target.playAnim('heal');
                    target.float(`+${entry.value}`, new Color(120, 240, 150, 255));
                    target.setHealth(entry.hpAfter, undefined, true);
                }
                return DURATION.recover;

            case FightLogType.BUFF_ADD:
                if (target) {
                    const ids = (this.buffIds[entry.target] ?? []).slice();
                    if (ids.indexOf(entry.buffId) < 0) ids.push(entry.buffId);
                    this.buffIds[entry.target] = ids;
                    target.setBuffs(ids);
                    target.float(`buff ${entry.buffId}`, new Color(200, 170, 255, 255), 50);
                }
                return DURATION.buff;

            case FightLogType.BUFF_REMOVE:
                if (target) {
                    const ids = (this.buffIds[entry.target] ?? []).filter((id) => id !== entry.buffId);
                    this.buffIds[entry.target] = ids;
                    target.setBuffs(ids);
                    target.float(`buff ${entry.buffId} 结束`, new Color(170, 170, 170, 255), 50);
                }
                return DURATION.buff;

            case FightLogType.DEATH:
                if (target) {
                    target.playAnim('die');
                    target.float('阵亡', new Color(255, 90, 90, 255), 60);
                }
                return DURATION.death;

            case FightLogType.ROUND:
                this.roundLabel.string = `回合 ${entry.round ?? 0}`;
                this.setTip(entry.stateNumber === STATE_OTHER_ROUND ? '敌方行动中…' : '新的回合开始');
                return DURATION.round;

            case FightLogType.END:
                this.showResult(entry.value === 1);
                return DURATION.end;

            default:
                return DURATION.unknown;
        }
    }

    /** 队列播空：落地挂起的状态，并在需要时推进阶段。 */
    private onPlaybackDrained(): void {
        if (this.pendingStatus) {
            const s = this.pendingStatus;
            this.pendingStatus = null;
            this.applyStatus(s);
            return;
        }
        this.maybeAutoAdvance();
        this.refreshUi();
    }

    /**
     * 敌方回合：演出播完后替玩家发 START_PHASE，让服务端继续跑敌方行动。
     * 用 round:stateNumber 去重，服务端重复下发同一状态时不会重复推进。
     */
    private maybeAutoAdvance(): void {
        const gm = GameManager.getInstance();
        if (!gm || !this.status || this.ended) return;
        if (this.status.stateNumber !== STATE_OTHER_ROUND) return;

        const key = `${this.status.round}:${this.status.stateNumber}`;
        if (this.autoAdvanceKey === key) return;
        this.autoAdvanceKey = key;

        this.setTip('敌方回合开始');
        gm.startPhase();
    }

    // ==================== 技能操作 ====================

    /** 依据权威状态重建技能按钮 / 出手按钮可用性。 */
    private refreshUi(): void {
        const waiting = !!this.status && this.status.stateNumber === STATE_WAITING && !this.ended;
        this.buildSkillButtons(waiting);
        this.attackBtn.active = waiting;
        this.attackBtnLabel.string = this.selection.size > 0 ? `出手（${this.selection.size}）` : '出手';

        if (!this.status) {
            this.setTip('等待服务端下发战斗状态…');
        } else if (this.ended) {
            this.setTip(this.phaseLabel.string);
        } else if (waiting && this.targeting) {
            this.setTip('请点击要攻击/支援的目标（点空白处取消）');
        } else if (waiting) {
            this.setTip(this.selection.size > 0 ? '已选好，点「出手」提交本回合行动' : '点击下方技能选择本回合行动');
        } else if (this.status.stateNumber === STATE_OTHER_ROUND) {
            this.setTip('敌方行动中…');
        } else {
            this.setTip('服务端结算中…');
        }
    }

    private buildSkillButtons(waiting: boolean): void {
        if (!this.skillRoot) return;
        const chars = this.status?.characters ?? [];
        const mine = chars.map((c: any, i: number) => ({ c, i })).filter((x: any) => x.c.isMyCharacter && (Number(x.c.health) || 0) > 0);

        // 简单签名：我方角色集合没变就不重建按钮，避免每次刷新都重建导致按钮闪动
        const sig = mine.map((x: any) => `${x.i}:${x.c.characterId}`).join(',');
        if (sig !== this.lastSkillSig) {
            this.lastSkillSig = sig;
            clearChildren(this.skillRoot);
            this.selection.clear();
            this.targeting = null;
            this.clearSelectable();

            const perRow = Math.max(1, Math.min(4, mine.length));
            // 只有唯一技能的角色默认选中。默认选中必须**顺手解析目标**
            // （resolveTarget=true），否则会带着 targetId=-1 提交，
            // 被服务端的"目标战斗位不合法"把整批技能拒绝。
            const autoSelect: { characterId: number; skill: SkillConfig }[] = [];

            mine.forEach((x: any, k: number) => {
                const conf = this.actorConfig(Number(x.c.characterId), true);
                const skills = this.skillsOf(Number(x.c.characterId));
                const name = String(conf.name ?? `我方${x.i + 1}`);
                skills.forEach((skill, s) => {
                    const row = Math.floor(k / perRow);
                    const col = k % perRow;
                    const cx = (col - (perRow - 1) / 2) * (BTN_W + 12);
                    const cy = row * (BTN_H + 10) + s * (BTN_H + 6);
                    const btn = this.ensureButton(`Skill_${x.c.characterId}_${skill.id}`, `${name}·${skill.name}`, cx, cy, () =>
                        this.onSkillClick(Number(x.c.characterId), skill));
                    btn.node.setParent(this.skillRoot);
                    (btn.node as any).__skill = skill;
                    (btn.node as any).__characterId = Number(x.c.characterId);
                    if (skills.length === 1) autoSelect.push({ characterId: Number(x.c.characterId), skill });
                });
            });

            // 默认选中放在按钮都建好之后：applySelection 只改选中表、不触发刷新，
            // 避免在构建过程中递归回到本函数。
            for (const item of autoSelect) {
                this.applySelection(item.characterId, item.skill, true);
            }
        }

        // 可用性 + 选中高亮
        for (const child of this.skillRoot.children) {
            const skill: SkillConfig | undefined = (child as any).__skill;
            const cid = Number((child as any).__characterId);
            const usable = waiting && !!skill;
            child.active = usable;
            const ut = child.getComponent(UITransform);
            if (ut && (ut.width < 1 || ut.height < 1)) ut.setContentSize(BTN_W, BTN_H);
            const sel = this.selection.get(cid);
            this.paintButton(child, !!sel && !!skill && sel.skillId === skill.id);
        }
    }

    /**
     * 技能按钮的选中态高亮。
     * 编辑器给按钮挂了 Sprite 就染色（不动用户的美术），否则用脚本画的 Graphics 底色。
     */
    private paintButton(node: Node, selected: boolean): void {
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            sprite.color = selected ? new Color(255, 240, 200, 255) : new Color(255, 255, 255, 255);
            return;
        }
        const ut = node.getComponent(UITransform);
        const g = node.getComponent(Graphics);
        if (!g || !ut) return;
        const w = ut.width || BTN_W;
        const h = ut.height || BTN_H;
        g.clear();
        g.fillColor = selected ? new Color(120, 90, 40, 240) : new Color(45, 55, 80, 230);
        g.roundRect(-w / 2, -h / 2, w, h, 8);
        g.fill();
        if (selected) {
            g.lineWidth = 3;
            g.strokeColor = new Color(255, 220, 120, 255);
            g.roundRect(-w / 2, -h / 2, w, h, 8);
            g.stroke();
        }
    }

    private onSkillClick(characterId: number, skill: SkillConfig): void {
        const targets = this.legalTargets(characterId, skill);
        if (targets.length === 0) {
            this.setTip('没有合法目标');
            return;
        }
        // 点同一个技能 = 取消选择
        const cur = this.selection.get(characterId);
        if (cur && cur.skillId === skill.id && !this.targeting) {
            this.selection.delete(characterId);
            this.refreshUi();
            return;
        }
        // 目标唯一（或自身技能）→ 直接选中；否则进入选靶
        if (skill.target === 'self') {
            this.selectSkill(characterId, skill, true, this.indexOfCharacter(characterId));
            return;
        }
        if (targets.length === 1) {
            this.selectSkill(characterId, skill, true, targets[0]);
            return;
        }
        this.targeting = { characterId, skill };
        this.clearSelectable();
        for (const t of targets) this.actors[t]?.setSelectable(true);
        this.refreshUi();
    }

    /** 选中技能（会刷新 UI；按钮回调走这里）。 */
    private selectSkill(characterId: number, skill: SkillConfig, targetNeeded: boolean, targetId?: number): void {
        if (!this.applySelection(characterId, skill, targetNeeded, targetId)) return;
        this.targeting = null;
        this.clearSelectable();
        this.refreshUi();
    }

    /**
     * 只改选中表，不触发 UI 刷新（供构建按钮等"正在刷新中"的场景调用）。
     * 返回是否成功选中。targetNeeded 为 true 且未指定目标时会自动挑第一个合法目标。
     */
    private applySelection(characterId: number, skill: SkillConfig, targetNeeded: boolean, targetId?: number): boolean {
        let tid = typeof targetId === 'number' ? targetId : -1;
        if (targetNeeded && tid < 0) {
            const targets = this.legalTargets(characterId, skill);
            if (targets.length === 0) return false;
            tid = targets[0];
        }
        this.selection.set(characterId, { skillId: skill.id, targetId: tid });
        return true;
    }

    private indexOfCharacter(characterId: number): number {
        const chars = this.status?.characters ?? [];
        return chars.findIndex((c: any) => Number(c.characterId) === characterId);
    }

    /** 合法目标战斗位：敌方=存活敌人；我方=存活我方；自身=自己。 */
    private legalTargets(characterId: number, skill: SkillConfig): number[] {
        const chars = this.status?.characters ?? [];
        const kind = skill.target ?? 'enemy';
        if (kind === 'self') return [this.indexOfCharacter(characterId)].filter((i) => i >= 0);
        const wantSelf = kind === 'ally';
        const out: number[] = [];
        chars.forEach((c: any, i: number) => {
            if (!!c.isMyCharacter !== wantSelf) return;
            if ((Number(c.health) || 0) <= 0) return;
            out.push(i);
        });
        return out;
    }

    private onActorTapped(index: number): void {
        if (!this.targeting) return;
        const { characterId, skill } = this.targeting;
        if (this.legalTargets(characterId, skill).indexOf(index) < 0) {
            this.setTip('该目标不合法');
            return;
        }
        this.selectSkill(characterId, skill, true, index);
    }

    private clearSelectable(): void {
        for (const a of this.actors) a?.setSelectable(false);
    }

    private submitSkills(): void {
        const gm = GameManager.getInstance();
        if (!gm) return;
        // 目标没解析出来的条目直接丢掉：服务端会因 target_id 越界把整批技能拒绝
        const list = Array.from(this.selection.entries())
            .filter(([, sel]) => typeof sel.targetId === 'number' && sel.targetId >= 0)
            .map(([characterId, sel]) => ({
                characterId,
                skillId: sel.skillId,
                targetIndex: sel.targetId,
            }));
        if (list.length === 0) {
            this.setTip('请先选择技能并指定目标');
            return;
        }
        // 一个角色的技能不能分两次提交：服务端把"一条消息"当作本回合的全部行动，
        // 提交后立即进入 MyRound，第二条会被"当前状态不允许选择技能"拒绝。
        const ok = gm.useSkills(list);
        this.selection.clear();
        this.targeting = null;
        this.clearSelectable();
        this.setTip(ok ? '已提交本回合行动，等待服务端结算…' : '提交失败：连接未就绪');
        this.refreshUi();
    }

    // ==================== 结算 / 退出 ====================

    private showResult(playerWin: boolean): void {
        this.ended = true;
        const size = this.rootSize();

        // 1) 结算面板容器：编辑器里放好了就用它，否则兜底创建
        if (!this.resultRoot || !this.resultRoot.isValid) {
            this.resultRoot = this.makeNode('ResultRoot', this.hudRoot);
            this.resultRoot.setPosition(0, 0, 0);
            const bg = this.makeNode('ResultBg', this.resultRoot);
            const g = bg.addComponent(Graphics);
            g.fillColor = new Color(0, 0, 0, 180);
            g.rect(-size.width / 2, -110, size.width, 220);
            g.fill();
        }
        this.resultRoot.active = true;

        // 2) 结果文案：绑定编辑器里的 ResultLabel，没有就建一个
        if (!this.resultLabel || !this.resultLabel.isValid) {
            const lblNode = this.findNode('ResultLabel') ?? this.makeNode('ResultLabel', this.resultRoot);
            if (lblNode.parent !== this.resultRoot) lblNode.setParent(this.resultRoot);
            const ut = lblNode.getComponent(UITransform) ?? lblNode.addComponent(UITransform);
            if (ut.width < 1 || ut.height < 1) ut.setContentSize(size.width * 0.8, 80);
            this.resultLabel = lblNode.getComponent(Label) ?? lblNode.addComponent(Label);
            this.resultLabel.fontSize = 48;
            this.resultLabel.lineHeight = 56;
            this.resultLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.resultLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }
        this.resultLabel.color = playerWin ? new Color(255, 230, 160, 255) : new Color(255, 140, 140, 255);
        this.resultLabel.string = playerWin ? '战斗胜利！' : '战斗失败…';

        // 3) 离开按钮：按名字复用（编辑器里放好的会直接被找到）
        const exit = this.ensureButton('ExitBtn', '离开战斗', 0, -60, () => this.leaveBattle());
        if (exit.node.parent !== this.resultRoot) exit.node.setParent(this.resultRoot);

        this.setTip(playerWin ? '战斗胜利，点击「离开战斗」返回' : '战斗失败，点击「离开战斗」返回');
        this.refreshUi();
    }

    private leaveBattle(): void {
        const gm = GameManager.getInstance();
        if (gm) gm.exitFight();
        const ui = UIManager.getInstance();
        if (ui) {
            ui.openPanel('WorldPanel');
        } else if (this.node?.isValid) {
            this.node.destroy();
        }
    }

    // ==================== 杂项 ====================

    private setTip(text: string): void {
        if (this.tipLabel) this.tipLabel.string = text ?? '';
    }

    private cycleSpeed(): void {
        const next = this.player.speed >= 4 ? 1 : this.player.speed * 2;
        this.player.speed = next;
        if (this.speedBtnLabel) this.speedBtnLabel.string = `倍速 ×${next}`;
    }
}
