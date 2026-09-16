// FightLogPlayer.ts
// 战斗日志播放队列：把服务端下发的日志**按顺序串行演出**。
//
// 为什么需要队列：一条日志对应一段演出（出手/命中/飘字/血条补间），
// 服务端一次会下发一整批（例如"施放技能 → 伤害 → 获得 buff"），
// 必须一段一段播，否则动画会互相覆盖、血条只看到最终值。
//
// 设计要点：
//   - 本类不关心"日志是什么"，只关心"每条演多久"：时长由 onPlay 返回；
//   - 演出期间 busy 为 true，调用方据此把权威状态挂起（播完再落地）；
//   - 队列播空后回调一次 onDrain（恰好一次，不会因为空转反复触发）。

/** 攻击事件详情（对应 proto AttackLog） */
export interface AttackLogLike {
    source: number;   // 出手方战斗位（-1 = 无来源）
    target: number;   // 受击方战斗位
    damage: number;   // 最终伤害（实际掉血量；被抵消的不计入）
    hpBefore: number;
    hpAfter: number;
    ref: number;      // 伤害来源：>0 技能ID；<0 −buffID；0 被动
    special: number;  // 本次触发的被动/特殊受击：>0 角色DB ID；<0 −buffID；0 无
    other: string;    // 原始 other（JSON 原文）
}

/** 恢复事件详情（对应 proto RecoverLog） */
export interface RecoverLogLike {
    source: number;
    target: number;
    recover: number;  // 实际恢复量
    hpBefore: number;
    hpAfter: number;
    ref: number;
    special: number;
    other: string;
}

/** 计数器变化详情（对应 proto CounterLog）。buff 层数用 key = "buff:<buffID>:<战斗位>" */
export interface CounterLogLike {
    key: string;
    delta: number;    // 变化值（正=增加，负=减少）
    value: number;    // 变化后的值（buff 归零即失效）
    ref: number;
}

/** 获得/刷新 buff 详情（对应 proto BuffLog） */
export interface BuffLogLike {
    source: number;
    target: number;
    buffId: number;
    time: number;     // 本次时长/层数
    ref: number;
    special: number;
    other: string;
}

/** 阵亡详情（对应 proto DeathLog） */
export interface DeathLogLike {
    source: number;
    target: number;
    ref: number;
}

/** 其他事件详情（对应 proto OtherLog） */
export interface OtherLogLike {
    detail: string;   // JSON 原文，例如 {"op":"end","win":1}
}

/**
 * 一条战斗日志：信封（通用字段）+ 详情。
 * detail 是 pbjs 为 oneof 生成的**判别键**（'attack'|'recover'|...），
 * 用它分发比用 type 数字更直观，也不会因为数字写错而静默走错分支。
 */
export interface FightLogLike {
    seq: number;
    type: number;
    round: number;
    stateNumber: number;

    detail?: 'attack' | 'recover' | 'counter' | 'buff' | 'death' | 'other';
    attack?: AttackLogLike;
    recover?: RecoverLogLike;
    counter?: CounterLogLike;
    buff?: BuffLogLike;
    death?: DeathLogLike;
    other?: OtherLogLike;
}

/** 日志类型常量（与 proto FightLogType 对齐；请以 detail 判别键为准分发） */
export const FightLogType = {
    UNKNOWN: 0,
    ATTACK: 1,
    RECOVER: 2,
    COUNTER: 3,
    BUFF: 4,
    DEATH: 5,
    OTHER: 6,
} as const;

/** buff 计数器键的前缀与解析：键格式 "buff:<buffID>:<战斗位>" */
export const BUFF_COUNTER_PREFIX = 'buff:';

export function parseBuffCounterKey(key: string): { buffId: number; index: number } | null {
    if (!key || key.indexOf(BUFF_COUNTER_PREFIX) !== 0) return null;
    const parts = key.split(':');
    if (parts.length !== 3) return null;
    const buffId = Number(parts[1]);
    const index = Number(parts[2]);
    if (!isFinite(buffId) || !isFinite(index)) return null;
    return { buffId, index };
}

/** 兜底演出时长（毫秒）：onPlay 未给出有效时长时用它 */
const DEFAULT_DURATION_MS = 200;

export class FightLogPlayer {
    /** 播放倍速：>1 更快（调试/快进用），<=0 视为 1 */
    public speed = 1;

    /** 单条日志的演出回调；返回该条演出需要占用的毫秒数（<=0 表示不占时间） */
    public onPlay: (entry: FightLogLike) => number = () => DEFAULT_DURATION_MS;

    /** 队列播空时回调（恰好一次接一次：每次从"有"变"无"时触发） */
    public onDrain: () => void = () => { /* 默认空实现 */ };

    private queue: FightLogLike[] = [];
    private timer: any = null;
    private playing = false;
    private drained = true; // 初始视为空

    /** 是否正在演出或还有排队（调用方据此挂起权威状态） */
    public get busy(): boolean {
        return this.playing || this.queue.length > 0;
    }

    /** 待播条目数（调试/UI 用） */
    public get pending(): number {
        return this.queue.length + (this.playing ? 1 : 0);
    }

    /** 追加一批日志并开始（或继续）演出。 */
    public enqueue(logs: FightLogLike[] | null | undefined): void {
        if (!logs || logs.length === 0) return;
        for (const entry of logs) {
            if (entry) this.queue.push(entry);
        }
        this.drained = false;
        this.next();
    }

    /**
     * 跳过当前条目的剩余等待，立刻演下一条（点击快进）。
     * 只缩短等待，不改变演出顺序，也不丢日志。
     */
    public skipCurrent(): void {
        if (!this.playing) return;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.playing = false;
        this.next();
    }

    /** 立即播完队列里剩下的全部日志（不做等待，只触发 onPlay）。 */
    public flushNow(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.playing = false;
        while (this.queue.length > 0) {
            const entry = this.queue.shift()!;
            this.onPlay(entry);
        }
        this.markDrained();
    }

    /** 清空队列并停止演出（退出战斗/重连时用），不触发 onDrain。 */
    public clear(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.queue.length = 0;
        this.playing = false;
        this.drained = true;
    }

    private next(): void {
        if (this.playing) return;

        const entry = this.queue.shift();
        if (!entry) {
            this.markDrained();
            return;
        }

        this.playing = true;
        let duration = 0;
        try {
            duration = this.onPlay(entry) || 0;
        } catch (e) {
            console.error('[FightLogPlayer] 日志演出回调异常', e);
        }
        const speed = this.speed > 0 ? this.speed : 1;
        const waitMs = Math.max(0, duration) / speed;

        if (waitMs <= 0) {
            this.playing = false;
            this.next();
            return;
        }
        this.timer = setTimeout(() => {
            this.timer = null;
            this.playing = false;
            this.next();
        }, waitMs);
    }

    private markDrained(): void {
        if (this.drained) return; // 只在"从有到无"的那一次通知
        this.drained = true;
        try {
            this.onDrain();
        } catch (e) {
            console.error('[FightLogPlayer] onDrain 回调异常', e);
        }
    }
}
