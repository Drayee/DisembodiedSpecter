// model.js — 剧情数据模型 / 地址规则 / 布局规则 / 校验器
// 与 Cocos 侧 StoryTypes.ts、StoryPanel.ts 严格对齐：
//   - 段文件名 = 篇.章.片.段（如 1.0.0.1），节点键 = 段内 id（如 3 / 3.a）
//   - 地址 = {file}.{key}（如 1.0.0.1.3.a）；终态 = {file}.end
//   - 立绘：avatars[] = {slot?:1..8, key, x?, facing?:1|-1, name?}
//     未给 x → 1 个居中，多个按“左、右、左、右…”向外排开；name===speaker 高亮
//   - 舞台：stage{bg, cg, avatar(s), video}；bg/cg 有值=显示、''=隐藏、缺省=保持上一幕

export const NODE_TYPES = ['dialogue', 'narration', 'choice', 'stage', 'action'];
export const TYPE_LABEL = { dialogue: '对白', narration: '旁白', choice: '选项', stage: '演出', action: '动作' };
export const SLOT_MAX = 8;
export const DIM_ALPHA = 120;
export const TEXT_WARN_LEN = 120;
export const AVATAR_BASE_GAP = 190;
export const AVATAR_PAIR_GAP = 300;
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

let idSeq = 0;

export function emptyProject() {
    return { files: {}, assets: {}, glossary: {}, items: {} };
}

export function emptyFile(title = '') {
    return { meta: { title }, nodes: [] };
}

export function emptyNode(type = 'dialogue') {
    const base = { id: String(++idSeq), type, next: '' };
    if (type === 'dialogue') return { ...base, speaker: '', text: '', avatars: [] };
    if (type === 'narration') return { ...base, text: '' };
    if (type === 'choice') return { ...base, text: '', options: [{ text: '', next: '' }] };
    if (type === 'stage') return { ...base, text: '', stage: { avatars: [] } };
    if (type === 'action') return { ...base, action: 'end' };
    return base;
}

export function emptyAvatar() {
    return { slot: null, key: '', x: null, facing: 1, name: '' };
}

export function emptyOption() {
    return { text: '', next: '' };
}

// ==================== 地址 ====================

const KEY_RE = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?$/;
const ADDR_RE = /^(\d+\.\d+\.\d+\.\d+)\.([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?)$/;

/** 解析地址 → {file, key} 或 {file, key:null, terminal:true}；非法返回 null */
export function parseAddr(addr) {
    if (!addr || typeof addr !== 'string') return null;
    const s = addr.trim();
    if (!s) return null;
    if (/\.end$/.test(s)) {
        const file = s.slice(0, -4);
        return /^\d+\.\d+\.\d+\.\d+$/.test(file) ? { file, key: null, terminal: true } : null;
    }
    const m = ADDR_RE.exec(s);
    return m ? { file: m[1], key: m[2], terminal: false } : null;
}

export function isLegalFile(name) {
    return /^\d+\.\d+\.\d+\.\d+$/.test(String(name || '').trim());
}

export function isLegalKey(key) {
    return KEY_RE.test(String(key || '').trim());
}

export function nodeAddr(file, key) {
    return `${file}.${key}`;
}

export function nodeIndex(file, id) {
    if (!file) return -1;
    return file.nodes.findIndex((n) => n.id === id);
}

/** 段内下一个节点键（缺省推进顺序），无则 null */
export function nextKeyInFile(file, id) {
    const i = nodeIndex(file, id);
    if (i < 0 || i >= file.nodes.length - 1) return null;
    return file.nodes[i + 1].id;
}

/** 节点缺省去向：显式 next > 段内下一节点 > null（= 完结为 {file}.end） */
export function resolveNext(fileName, file, node) {
    if (node && node.next) return node.next;
    const nx = nextKeyInFile(file, node ? node.id : '');
    return nx ? nodeAddr(fileName, nx) : null;
}

// ==================== 立绘布局（与 StoryPanel.ts 完全一致） ====================

export function resolveAvatarLayout(entries) {
    const list = Array.isArray(entries) ? entries : [];
    const used = new Set();
    const plans = [];
    for (const e of list) {
        if (!e || !e.key) continue;
        let slot = e.slot === null || e.slot === undefined || e.slot === '' ? null : Number(e.slot);
        if (slot === null) {
            for (let s = 1; s <= SLOT_MAX; s++) {
                if (!used.has(s)) { slot = s; break; }
            }
        }
        if (slot === null || !(slot >= 1 && slot <= SLOT_MAX) || used.has(slot)) continue;
        used.add(slot);
        const hasX = e.x !== null && e.x !== undefined && e.x !== '';
        plans.push({
            slot,
            key: e.key,
            x: hasX ? Number(e.x) : null,
            facing: Number(e.facing) === -1 ? -1 : 1,
            name: e.name || '',
        });
    }
    const auto = plans.filter((p) => p.x === null);
    if (auto.length === 1) {
        auto[0].x = 0;
    } else {
        auto.forEach((p, j) => {
            const side = j % 2 === 0 ? -1 : 1;
            p.x = side * (AVATAR_BASE_GAP + Math.floor(j / 2) * AVATAR_PAIR_GAP);
        });
    }
    return plans;
}

/** 收集项目里用到的所有资源 key（含物品图标） */
export function usedAssetKeys(project) {
    const used = new Map(); // key -> Set(说明)
    const add = (key, from) => {
        if (!key) return;
        if (!used.has(key)) used.set(key, new Set());
        used.get(key).add(from);
    };
    for (const [file, seg] of Object.entries(project.files || {})) {
        for (const n of seg.nodes || []) {
            (n.avatars || []).forEach((a) => add(a && a.key, `${file}.${n.id}`));
            if (n.avatar) add(n.avatar, `${file}.${n.id}`);
            const st = n.stage || {};
            add(st.bg, `${file}.${n.id}`);
            add(st.cg, `${file}.${n.id}`);
            (st.avatars || []).forEach((a) => add(a && a.key, `${file}.${n.id}`));
            if (st.avatar) add(st.avatar, `${file}.${n.id}`);
        }
    }
    for (const it of Object.values(project.items || {})) {
        add(it && it.iconKey, `物品:${it && it.name}`);
    }
    return used;
}

// ==================== 校验 ====================

/**
 * 全项目校验。返回 [{level:'error'|'warn', file, nodeId, msg}]
 */
export function lintProject(project) {
    const out = [];
    const push = (level, file, nodeId, msg) => out.push({ level, file, nodeId: nodeId || '', msg });
    const files = project.files || {};

    // 1) 逐文件逐节点
    for (const [file, seg] of Object.entries(files)) {
        if (!isLegalFile(file)) push('warn', file, '', `段文件名不是「篇.章.片.段」格式：${file}`);
        const ids = new Set();
        for (const n of seg.nodes || []) {
            if (!n.id) push('error', file, '', '节点缺少 id');
            if (ids.has(n.id)) push('error', file, n.id, `节点 id 重复：${n.id}`);
            ids.add(n.id);
            if (!isLegalKey(n.id)) push('warn', file, n.id, `节点 id 含特殊字符（建议数字或 3.a 形式）：${n.id}`);
            if (!NODE_TYPES.includes(n.type)) push('error', file, n.id, `未知节点类型：${n.type}`);

            if ((n.type === 'dialogue' || n.type === 'narration' || n.type === 'choice') && !n.text) {
                push('warn', file, n.id, '文本为空');
            }
            if (n.text && String(n.text).length > TEXT_WARN_LEN) {
                push('warn', file, n.id, `文本较长（${String(n.text).length} 字），可能超出对话框`);
            }
            if (n.type === 'dialogue' && !n.speaker) push('warn', file, n.id, '对白没有说话人');
            if (n.type === 'choice') {
                if (!n.options || n.options.length === 0) push('warn', file, n.id, '选项节点没有任何选项');
                (n.options || []).forEach((o, i) => {
                    if (!o.text) push('warn', file, n.id, `选项 ${i + 1} 文本为空`);
                });
            }
            if (n.type === 'action' && n.action && n.action !== 'end') {
                push('warn', file, n.id, `动作「${n.action}」引擎未实现（当前仅支持 end）`);
            }

            // next / options.next 地址
            const checkAddr = (addr, label) => {
                if (!addr) return;
                const p = parseAddr(addr);
                if (!p) { push('error', file, n.id, `${label} 地址格式非法：${addr}`); return; }
                if (p.terminal) return;
                const target = files[p.file];
                if (!target) { push('error', file, n.id, `${label} 指向不存在的段：${p.file}`); return; }
                if (!(target.nodes || []).some((x) => x.id === p.key)) {
                    push('error', file, n.id, `${label} 指向不存在的节点：${addr}`);
                }
            };
            checkAddr(n.next, 'next');
            (n.options || []).forEach((o, i) => checkAddr(o.next, `选项${i + 1}.next`));

            // 立绘
            const checkAvatars = (list, label) => {
                const seen = new Set();
                (list || []).forEach((a, i) => {
                    if (!a || !a.key) { push('warn', file, n.id, `${label} 第 ${i + 1} 项缺少立绘 key`); return; }
                    if (a.slot !== null && a.slot !== undefined && a.slot !== '') {
                        const s = Number(a.slot);
                        if (!(s >= 1 && s <= SLOT_MAX)) push('error', file, n.id, `${label} slot 越界（1~${SLOT_MAX}）：${a.slot}`);
                        if (seen.has(s)) push('warn', file, n.id, `${label} slot 重复：${s}`);
                        seen.add(s);
                    }
                    if (a.facing !== undefined && a.facing !== null && a.facing !== '' && ![1, -1].includes(Number(a.facing))) {
                        push('warn', file, n.id, `${label} facing 只能是 1 或 -1`);
                    }
                    if (a.x !== undefined && a.x !== null && a.x !== '' && Number.isNaN(Number(a.x))) {
                        push('warn', file, n.id, `${label} x 不是数字`);
                    }
                });
            };
            checkAvatars(n.avatars, 'avatars');
            if (n.stage) checkAvatars(n.stage.avatars, 'stage.avatars');
        }
    }

    // 2) 图检查：可达性 + 环
    const edges = new Map(); // addr -> [addr]
    const allNodes = [];
    for (const [file, seg] of Object.entries(files)) {
        (seg.nodes || []).forEach((n, i) => {
            const from = nodeAddr(file, n.id);
            if (edges.has(from)) return; // id 重复时只取第一个，避免图被覆盖
            allNodes.push(from);
            const targets = [];
            if (n.next) targets.push(n.next);
            (n.options || []).forEach((o) => { if (o.next) targets.push(o.next); });
            if (!n.next && i < seg.nodes.length - 1) targets.push(nodeAddr(file, seg.nodes[i + 1].id));
            edges.set(from, targets.filter((t) => !/\.end$/.test(t)));
        });
    }
    const reachable = new Set();
    const stack = [];
    for (const [file, seg] of Object.entries(files)) {
        if ((seg.nodes || []).length) stack.push(nodeAddr(file, seg.nodes[0].id));
    }
    while (stack.length) {
        const cur = stack.pop();
        if (reachable.has(cur)) continue;
        reachable.add(cur);
        for (const t of edges.get(cur) || []) {
            if (!reachable.has(t) && edges.has(t)) stack.push(t);
        }
    }
    for (const addr of allNodes) {
        if (!reachable.has(addr)) push('warn', addr.split('.').slice(0, 4).join('.'), addr.split('.').slice(4).join('.'), '该节点无法从段首到达（可能是孤立节点）');
    }

    // 环检测（DFS 灰/黑）
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    const cycleReported = new Set();
    const dfs = (node) => {
        color.set(node, GRAY);
        for (const t of edges.get(node) || []) {
            if (!edges.has(t)) continue;
            const c = color.get(t) || WHITE;
            if (c === GRAY) {
                if (!cycleReported.has(node)) {
                    cycleReported.add(node);
                    push('warn', node.split('.').slice(0, 4).join('.'), node.split('.').slice(4).join('.'), '检测到跳转环（可能死循环；引擎有 500 步保护）');
                }
            } else if (c === WHITE) {
                dfs(t);
            }
        }
        color.set(node, BLACK);
    };
    for (const addr of allNodes) if ((color.get(addr) || WHITE) === WHITE) dfs(addr);

    // 3) 资源缺失
    const keys = usedAssetKeys(project);
    for (const [key, from] of keys.entries()) {
        if (!(project.assets || {})[key]) {
            push('warn', '', '', `资源缺失：${key}（被 ${Array.from(from).slice(0, 3).join('、')} 引用）`);
        }
    }
    for (const [key, meta] of Object.entries(project.assets || {})) {
        if (!keys.has(key)) push('warn', '', '', `资源未被使用：${key}${meta && meta.filename ? '（' + meta.filename + '）' : ''}`);
    }

    return out;
}

// ==================== 表格 / CSV 行 ====================

export function nodeRows(project, file) {
    const seg = (project.files || {})[file];
    if (!seg) return [];
    return (seg.nodes || []).map((n, i) => ({
        index: i + 1,
        id: n.id,
        type: n.type,
        speaker: n.speaker || '',
        text: n.text || '',
        next: n.next || '',
        bg: (n.stage && n.stage.bg) || '',
        cg: (n.stage && n.stage.cg) || '',
        avatars: (n.avatars || (n.stage && n.stage.avatars) || []).map((a) => `${a.slot || 'auto'}:${a.key}${a.name ? '(' + a.name + ')' : ''}`).join(' '),
        options: (n.options || []).map((o) => `${o.text}→${o.next || '顺序'}`).join(' | '),
    }));
}

/** 台词表（导出给本地化/配音） */
export function dialogueRows(project) {
    const rows = [];
    for (const [file, seg] of Object.entries(project.files || {})) {
        for (const n of seg.nodes || []) {
            if (!n.text) continue;
            rows.push({
                file,
                id: n.id,
                addr: `${file}.${n.id}`,
                type: n.type,
                speaker: n.speaker || '',
                text: n.text,
                chars: String(n.text).length,
            });
        }
    }
    return rows;
}
