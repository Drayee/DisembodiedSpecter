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

/** 服务端 FightLog 的最小结构（与 messages.js 生成类型字段一致） */
export interface FightLogLike {
    seq: number;
    type: number;
    source: number;
    target: number;
    skillId: number;
    buffId: number;
    value: number;
    hpBefore: number;
    hpAfter: number;
    round: number;
    stateNumber: number;
    text: string;
}

/** 日志类型常量（与 proto FightLogType 对齐） */
export const FightLogType = {
    UNKNOWN: 0,
    CAST: 1,
    ATTACK: 2,
    RECOVER: 3,
    BUFF_ADD: 4,
    BUFF_REMOVE: 5,
    DEATH: 6,
    ROUND: 7,
    END: 8,
} as const;

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
