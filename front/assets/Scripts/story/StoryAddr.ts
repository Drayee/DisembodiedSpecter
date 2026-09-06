// StoryAddr.ts
// 剧情地址解析工具。
// 地址格式：篇.章.片.段.节点[.分支]
//   1.0.0.1.1     主线（篇 1 章 0 片 0 段 1）节点 1
//   1.0.0.1.3.a   同一段内节点 3 的分支 a 变体
//   0.1.0.1.1     支线：篇 0 = 支线集合，0.1 为第 1 号支线
// 段文件：story/data/{篇}.{章}.{片}.{段}.json
// 终端游标：{file}.end（表示该段剧情已完结，之后等待世界交互解锁新内容）
import { StoryProgress } from './StoryTypes';

export interface ParsedAddr {
    v: number;
    ch: number;
    pa: number;
    seg: number;
    /** 段文件地址前缀，如 "1.0.0.1" */
    file: string;
    /** 段内节点键：如 "1"、"3.a" */
    key: string;
    /** 分支后缀（a/b…），无则缺省 */
    branch?: string;
    /** 是否为终端游标（{file}.end） */
    terminal: boolean;
}

const ADDR_MAX_LEN = 64;

/** 解析地址字符串；非法返回 null。 */
export function parseAddr(raw: string | null | undefined): ParsedAddr | null {
    if (!raw) return null;
    const s = raw.trim();
    if (!s || s.length > ADDR_MAX_LEN) return null;
    const parts = s.split('.');
    if (parts.length < 5 || parts.length > 6) return null;
    // 前四段必须是数字（篇.章.片.段）
    for (let i = 0; i < 4; i++) {
        if (!/^\d+$/.test(parts[i])) return null;
    }
    const v = Number(parts[0]);
    const ch = Number(parts[1]);
    const pa = Number(parts[2]);
    const seg = Number(parts[3]);
    const file = `${v}.${ch}.${pa}.${seg}`;

    // 终端游标：{file}.end
    if (parts.length === 5 && parts[4] === 'end') {
        return { v, ch, pa, seg, file, key: 'end', terminal: true };
    }
    // 节点基础号必须为数字
    if (!/^\d+$/.test(parts[4])) return null;
    let key = parts[4];
    let branch: string | undefined;
    if (parts.length === 6) {
        if (!/^[a-z]$/i.test(parts[5])) return null;
        branch = parts[5].toLowerCase();
        key = `${parts[4]}.${branch}`;
    }
    return { v, ch, pa, seg, file, key, branch, terminal: false };
}

/**
 * 判断地址所属的进度作用域：
 * 篇 0 → 支线 key（"0.章"，如 "0.1"）；否则为主线 → null。
 */
export function scopeKeyOf(raw: string | null | undefined): string | null {
    const p = parseAddr(raw);
    if (!p) return null;
    return p.v === 0 ? `0.${p.ch}` : null;
}

/** 是否为终端游标（剧情完结态） */
export function isTerminal(raw: string | null | undefined): boolean {
    const p = parseAddr(raw);
    return !!p && p.terminal;
}

/** 主线剧情默认起点（序章第一段第一节点） */
export const MAIN_START_ADDR = '1.0.0.1.1';

/** 空进度（单人单档，未开始任何剧情） */
export function emptyProgress(): StoryProgress {
    return { main: null, branches: {} };
}

/** 深拷贝进度并归一化字段 */
export function cloneProgress(p: StoryProgress | null | undefined): StoryProgress {
    const base = emptyProgress();
    if (!p) return base;
    base.main = typeof p.main === 'string' && p.main.trim() ? p.main.trim() : null;
    if (p.branches) {
        for (const k of Object.keys(p.branches)) {
            const v = p.branches[k];
            base.branches[k] = typeof v === 'string' && v.trim() ? v.trim() : null;
        }
    }
    return base;
}

/** 为某个作用域生成“下一游标”写入器返回的地址前缀说明（仅日志/文案用） */
export function describeCursor(raw: string | null | undefined): string {
    if (!raw) return '未开始';
    return raw;
}
