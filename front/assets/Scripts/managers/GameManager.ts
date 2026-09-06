// GameManager.ts
// 游戏流程驱动：登录 → 获取 ws-code → 连接战斗 WebSocket →
// 渲染战斗状态 → 出招 / 切阶段 / 请求同步 / 退出。
import { _decorator, Component } from 'cc';
import { NetworkManager } from 'db://assets/Scripts/managers/NetworkManager';
import * as fightProto from 'db://assets/Scripts/api/websocket/proto/fight_message.js';

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

    onLoad() {
        GameManager._instance = this;
        (globalThis as any).GameManager = this;
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
}