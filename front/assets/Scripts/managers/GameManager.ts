// GameManager.ts
// 游戏流程驱动：登录 → 获取 ws-code → 连接战斗 WebSocket →
// 渲染战斗状态 → 出招 / 切阶段 / 请求同步 / 退出。
import { _decorator, Component } from 'cc';
import { NetworkManager } from 'db://assets/Scripts/managers/NetworkManager';
import * as messagesNS from '../api/websocket/proto/messages.js';
import { StoryController } from 'db://assets/Scripts/layers/story/StoryController';
import { StoryProgress } from 'db://assets/Scripts/layers/story/StoryTypes';
import { cloneProgress, emptyProgress, MAIN_START_ADDR, isTerminal } from 'db://assets/Scripts/layers/story/StoryAddr';

// Cocos 把 assets 下的 CJS .js 资产统一包装成“仅 default 导出”的模块（default === module.exports），
// 命名空间上拿不到 proto，因此统一从 default 取 $root（其 .proto 属性才是消息命名空间）。
const messages: typeof messagesNS = ((messagesNS as { default?: typeof messagesNS }).default ?? messagesNS);

// 从命名空间中提取类型
type FightMessage = InstanceType<typeof messages.proto.FightMessage>;
type FightStatus = InstanceType<typeof messages.proto.FightStatus>;

// 定义阶段枚举（使用 protobuf 生成的枚举值）
const FightPhase = {
    START: 0,           // START_PHASE
    EXIT: 1,            // EXIT_FIGHT
    RETURN_PREV: 2,     // RETURN_PREV_PHASE
} as const;

const { ccclass } = _decorator;

export interface BattleSnapshot {
    status?: FightStatus;
    updatedAt: number;
}

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager;

    /** 世界交互锁状态（剧情等全屏演出播放中为 true） */
    private _worldLocked = false;
    private _worldLockReason: string | null = null;

    public battleSnapshot: BattleSnapshot = { updatedAt: 0 };

    /** 单人单档剧情进度（主线游标 + 支线游标；后端 WS 为权威） */
    public storyProgress: StoryProgress = emptyProgress();

    /** 大世界状态（来自 S2C_SyncState / 本地移动镜像）：doing 0剧情 1战斗 2无事 3移动 */
    public worldState: { doing: number; doingMap: Record<string, string>; location: { map: string; x: number; y: number } | null } = {
        doing: 2,
        doingMap: {},
        location: null,
    };

    onLoad() {
        GameManager._instance = this;
        (globalThis as any).GameManager = this;
        // 剧情引擎每推进一个节点，都回调这里做内存镜像 + WS 上报
        StoryController.instance.onCursor = (scope, cursor) => this.applyStoryCursor(scope, cursor);
        // 剧情全屏播放期间锁定世界交互，结束/中止后自动解锁
        StoryController.instance.onPlayback = (playing) => this.setWorldLock('story', playing);
        this.ensureNetworkHooks();
    }

    static getInstance(): GameManager {
        return this._instance;
    }

    // ==================== 辅助消息构造 ====================

    /**
     * 构造“选择技能”消息
     */
    private buildChoseSkill(skills: { skillId: number; targetId: number; characterId: number }[]): FightMessage {
        const c2s = messages.proto.C2S_ChoseSkills.create({ skills });
        return messages.proto.FightMessage.create({ choseSkill: c2s });
    }

    /**
     * 构造“切换阶段”消息
     */
    private buildSwitchPhase(phase: number): FightMessage {
        const c2s = messages.proto.C2S_SwitchPhase.create({ phase });
        return messages.proto.FightMessage.create({ switchPhase: c2s });
    }

    /**
     * 构造“请求同步”消息：把本地镜像的权威状态回带，让服务端做逐字段比对。
     * 没带状态（或状态过期）时服务端会判定 needSync 并重发权威状态——
     * 这正是"客户端状态不一致时由服务端纠正"的入口。
     */
    private buildSyncRequest(): FightMessage {
        const sync = messages.proto.Msg_SyncFightStatus.create({
            status: this.battleSnapshot.status ?? undefined,
            timestamp: Date.now(),
        });
        return messages.proto.FightMessage.create({ syncFightStatus: sync });
    }

    // ==================== 战斗流程 ====================

    public async startBattle(userId?: number): Promise<boolean> {
        const nm = NetworkManager.getInstance();
        if (!nm) {
            console.error('[GameManager] NetworkManager 未初始化');
            return false;
        }

        if (!nm.getAccessToken()) {
            try {
                await nm.login('testuser', 'test123456');
                console.log('[GameManager] 演示登录成功, userId =', nm.userId);
            } catch (e) {
                console.error('[GameManager] 登录失败', e);
                return false;
            }
        } else if (!userId && nm.userId) {
            userId = nm.userId;
        }

        const wsCode = await nm.getWsCode();
        console.log('[GameManager] ws-code =', wsCode);

        const uid = userId || nm.userId || 0;
        nm.connectBattleWS(uid, wsCode, (msg) => this.handleFightMessage(msg));

        // 请求同步
        nm.sendFightMessage(this.buildSyncRequest());
        return true;
    }

    /**
     * 处理一条战斗消息。
     * 服务端战斗通道上有两类下行消息，顺序保证是「先日志、后状态」：
     *   - fightLogs：本批一次性事件（出手/伤害/治疗/buff/回合/结束）→ 交给表现层回放动画；
     *   - syncFightStatus：权威状态快照 → 由表现层在演出播完后落地对齐。
     */
    public handleFightMessage(msg: FightMessage) {
        const logs = msg.fightLogs?.logs as any[] | undefined;
        if (logs && logs.length > 0) {
            this.onFightLogs?.(logs);
            return; // 日志批次与状态批次是两条独立消息，这里不当作状态处理
        }

        const status = msg.syncFightStatus?.status as FightStatus | undefined;  // ① 断言
        if (status) {
            this.battleSnapshot = { status, updatedAt: Date.now() };
            this.onBattleStatus?.(status);
        }
    }

    public onBattleStatus?: (status: FightStatus) => void;

    /** 收到服务端战斗日志批次（表现层按顺序回放演出） */
    public onFightLogs?: (logs: any[]) => void;

    // ==================== 玩家操作 ====================

    public useSkill(skillId: number, characterId: number, targetIndex: number): boolean {
        const nm = NetworkManager.getInstance();
        if (!nm) return false;
        const msg = this.buildChoseSkill([{ skillId, targetId: targetIndex, characterId }]);
        return nm.sendFightMessage(msg);
    }

    /**
     * 一次性提交本回合全部角色的技能（一条消息 = 本回合的全部行动）。
     *
     * 为什么必须一起提交：服务端把一条 C2S_ChoseSkills 当作"本回合的行动"整体校验并执行，
     * 处理完立刻进入 MyRound；若分两次提交，第二条会被
     * "当前状态（1）不允许选择技能"拒绝。所以前端的技能选择要先攒好再发。
     */
    public useSkills(skills: { skillId: number; characterId: number; targetIndex: number }[]): boolean {
        const nm = NetworkManager.getInstance();
        if (!nm || !skills || skills.length === 0) return false;
        const msg = this.buildChoseSkill(skills.map((s) => ({
            skillId: s.skillId,
            targetId: s.targetIndex,
            characterId: s.characterId,
        })));
        return nm.sendFightMessage(msg);
    }

    public startPhase(): boolean {
        const nm = NetworkManager.getInstance();
        if (!nm) return false;
        return nm.sendFightMessage(this.buildSwitchPhase(FightPhase.START));
    }

    public exitFight(): boolean {
        const nm = NetworkManager.getInstance();
        if (!nm) return false;
        return nm.sendFightMessage(this.buildSwitchPhase(FightPhase.EXIT));
    }

    public returnPrevPhase(): boolean {
        const nm = NetworkManager.getInstance();
        if (!nm) return false;
        return nm.sendFightMessage(this.buildSwitchPhase(FightPhase.RETURN_PREV));
    }

    public requestSync(): boolean {
        const nm = NetworkManager.getInstance();
        if (!nm) return false;
        return nm.sendFightMessage(this.buildSyncRequest());
    }

    public async syncPlayerData<T = any>(force?: boolean): Promise<T | null> {
        const nm = NetworkManager.getInstance();
        if (!nm) return null;
        const res = await nm.getPlayerData<T>(force);
        if (res.notModified) {
            console.log('[GameManager] 玩家数据未变化（304）');
            return null;
        }
        console.log('[GameManager] 玩家数据已更新', res.data);
        return res.data ?? null;
    }

    // ==================== 渲染辅助 ====================

    public static formatStatus(status: FightStatus): string {
        const stateName = ['等待选择', '我方回合', '敌方回合'][status.stateNumber] || String(status.stateNumber);
        const lines = [`回合 ${status.round} | 阶段: ${stateName}`];
        status.characters.forEach((c, i) => {
            lines.push(`[${i}] ${c.isMyCharacter ? '我方' : '敌方'} HP:${c.health} 攻:${c.attack.toFixed(1)} 防:${c.defense} buff:${c.buffs.length}`);
        });
        return lines.join('\n');
    }

    // ==================== 世界交互锁 ====================

    /**
     * 剧情等全屏演出播放期间锁定大世界交互（移动等）。
     * reason 标识锁来源；解锁时必须传入同一 reason，避免误解除他人之锁。
     */
    public setWorldLock(reason: string, locked: boolean) {
        if (locked) {
            this._worldLocked = true;
            this._worldLockReason = reason;
        } else if (this._worldLockReason === reason) {
            this._worldLocked = false;
            this._worldLockReason = null;
        }
    }

    /** 世界交互当前是否被锁（未来所有世界操作统一检查此闸口） */
    public isWorldLocked(): boolean {
        return this._worldLocked;
    }

    // ==================== 剧情进度 ====================

    /** 注册网络层 S2C_SyncState 回调（幂等；连接后用于恢复剧情/位置状态） */
    public ensureNetworkHooks() {
        const nm = NetworkManager.getInstance();
        if (!nm) return;
        nm.onGlobalSyncState = (st: any) => this.applyGlobalSyncState(st);
    }

    /** S2C_SyncState 到达：以服务端为准覆盖本地剧情游标与世界状态 */
    private applyGlobalSyncState(st: any) {
        if (!st) return;
        if (st.story) {
            const branches: Record<string, string | null> = {};
            if (st.story.branches) {
                for (const k of Object.keys(st.story.branches)) branches[k] = st.story.branches[k] || null;
            }
            this.storyProgress = cloneProgress({ main: st.story.main || null, branches });
        }
        this.worldState.doing = typeof st.doing === 'number' ? st.doing : this.worldState.doing;
        if (st.doingMap && typeof st.doingMap === 'object') this.worldState.doingMap = st.doingMap;
        if (st.location) {
            this.worldState.location = { map: st.location.mapName || '', x: st.location.x || 0, y: st.location.y || 0 };
        }
    }

    /** 上报大世界走动（C2S_Move）并同步本地 worldState */
    public moveTo(mapName: string, x: number, y: number): boolean {
        if (this._worldLocked) {
            console.warn('[GameManager] 剧情播放中（世界锁），拒绝移动上报');
            return false;
        }
        const nm = NetworkManager.getInstance();
        if (!nm) return false;
        if (!nm.sendMove(mapName, x, y)) return false;
        this.worldState.doing = 3;
        this.worldState.doingMap = { map: mapName, x: String(x), y: String(y) };
        this.worldState.location = { map: mapName, x, y };
        return true;
    }

    /** 剧情引擎推进回调：scope=null 主线，否则支线 key（如 "0.1"） */
    private applyStoryCursor(scope: string | null, cursor: string) {
        const p = cloneProgress(this.storyProgress);
        if (scope) {
            p.branches[scope] = cursor;
        } else {
            p.main = cursor;
        }
        this.setStoryProgress(p);
    }

    public getStoryProgress(): StoryProgress {
        return cloneProgress(this.storyProgress);
    }

    /** 更新本地镜像并上报后端（global WS；未连接时由 NetworkManager 缓冲） */
    public setStoryProgress(p: StoryProgress) {
        this.storyProgress = cloneProgress(p);
        const nm = NetworkManager.getInstance();
        if (nm) {
            nm.sendStoryProgress(cloneProgress(this.storyProgress));
        }
    }

    /**
     * 拉取玩家数据后用服务端进度覆盖本地镜像（服务端为权威）。
     * data 为 GET /api/v2/data 的 data 对象。
     * @returns 是否成功解析到服务端剧情进度
     */
    public ingestStoryFromServer(data: any): boolean {
        const raw = data && typeof data === 'object' ? (data as any).story_progress : null;
        if (typeof raw !== 'string' || !raw) return false;
        try {
            const parsed = JSON.parse(raw);
            this.storyProgress = cloneProgress({ main: parsed?.main, branches: parsed?.branches });
            return true;
        } catch (e) {
            console.warn('[GameManager] 服务端剧情进度解析失败', raw, e);
            return false;
        }
    }

    /** 重置主线进度（新游戏）；支线进度不受影响 */
    public resetMainStory() {
        const p = cloneProgress(this.storyProgress);
        p.main = null;
        this.setStoryProgress(p);
    }

    /** 主线是否还有可播内容（未开始 或 游标未到终态） */
    public hasMainStoryRemaining(): boolean {
        return !isTerminal(this.storyProgress.main);
    }

    /** 主线起点：已有进度则续播游标，否则从序章开始 */
    public beginMainStory(): boolean {
        const cursor = this.storyProgress.main || MAIN_START_ADDR;
        return StoryController.instance.play(cursor);
    }

    /** 支线起点：续播该支线游标，无进度则从默认起点开始 */
    public beginBranchStory(branchKey: string, defaultStart: string): boolean {
        const cursor = this.storyProgress.branches[branchKey] || defaultStart;
        return StoryController.instance.play(cursor);
    }

    /** 从任意地址开始（调试/世界交互入口使用） */
    public beginStoryAt(address: string | null): boolean {
        if (!address) return false;
        return StoryController.instance.play(address);
    }

    /** 强行中止当前剧情（离开世界时调用） */
    public abortStory() {
        StoryController.instance.abort();
    }
}