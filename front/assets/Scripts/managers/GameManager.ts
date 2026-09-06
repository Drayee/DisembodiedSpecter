// GameManager.ts
// 游戏流程驱动：登录 → 获取 ws-code → 连接战斗 WebSocket →
// 渲染战斗状态 → 出招 / 切阶段 / 请求同步 / 退出。
import { _decorator, Component } from 'cc';
import { NetworkManager } from 'db://assets/Scripts/managers/NetworkManager';
import * as fightProto from 'db://assets/Scripts/api/websocket/proto/fight_message.js';
import { StoryController } from 'db://assets/Scripts/story/StoryController';
import { StoryProgress } from 'db://assets/Scripts/story/StoryTypes';
import { cloneProgress, emptyProgress, MAIN_START_ADDR, isTerminal } from 'db://assets/Scripts/story/StoryAddr';

// 从命名空间中提取类型
type FightMessage = fightProto.proto.FightMessage;
type FightStatus = fightProto.proto.FightStatus;

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

    public battleSnapshot: BattleSnapshot = { updatedAt: 0 };

    /** 单人单档剧情进度（主线游标 + 支线游标；后端 WS 为权威） */
    public storyProgress: StoryProgress = emptyProgress();

    onLoad() {
        GameManager._instance = this;
        (globalThis as any).GameManager = this;
        // 剧情引擎每推进一个节点，都回调这里做内存镜像 + WS 上报
        StoryController.instance.onCursor = (scope, cursor) => this.applyStoryCursor(scope, cursor);
    }

    static getInstance(): GameManager {
        return this._instance;
    }

    // ==================== 辅助消息构造 ====================

    /**
     * 构造“选择技能”消息
     */
    private buildChoseSkill(skills: { skillId: number; targetId: number; characterId: number }[]): FightMessage {
        const c2s = fightProto.C2S_ChoseSkills.create({ skills });
        return fightProto.FightMessage.create({ choseSkill: c2s });
    }

    /**
     * 构造“切换阶段”消息
     */
    private buildSwitchPhase(phase: number): FightMessage {
        const c2s = fightProto.C2S_SwitchPhase.create({ phase });
        return fightProto.FightMessage.create({ switchPhase: c2s });
    }

    /**
     * 构造“请求同步”消息（通常包含一个空 syncFightStatus）
     */
    private buildSyncRequest(): FightMessage {
        // 如果需要填充 timestamp 等，可在此添加
        const sync = fightProto.Msg_SyncFightStatus.create({});
        return fightProto.FightMessage.create({ syncFightStatus: sync });
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

    public handleFightMessage(msg: FightMessage) {
        const status = msg.syncFightStatus?.status;
        if (status) {
            this.battleSnapshot = { status, updatedAt: Date.now() };
            this.onBattleStatus?.(status);
        }
    }

    public onBattleStatus?: (status: FightStatus) => void;

    // ==================== 玩家操作 ====================

    public useSkill(skillId: number, characterId: number, targetIndex: number): boolean {
        const nm = NetworkManager.getInstance();
        if (!nm) return false;
        const msg = this.buildChoseSkill([{ skillId, targetId: targetIndex, characterId }]);
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

    // ==================== 剧情进度 ====================

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