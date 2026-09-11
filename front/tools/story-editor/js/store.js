// store.js — 响应式状态 / 项目管理 / 自动保存 / 预览播放状态
import { reactive, computed, watch } from '../vendor/vue.esm-browser.prod.js';
import {
    emptyProject, emptyFile, emptyNode, emptyAvatar, emptyOption,
    lintProject, nodeIndex, nodeAddr, parseAddr, resolveAvatarLayout, nextKeyInFile, usedAssetKeys,
} from './model.js';

const LS_KEY = 'story-editor-project-v1';

export const state = reactive({
    project: emptyProject(),
    currentFile: '',
    selectedId: '',
    tab: 'preview',        // preview | flow | table | assets | extra | lint
    playing: false,
    playAddr: '',          // 当前播放地址：file.key
    issues: [],
    busy: '',
    message: '',
    dirty: false,
    lastSavedAt: '',
    /** 预览页舞台累积状态（与引擎一致：缺省继承上一幕、'' 隐藏） */
    playStage: { bg: null, cg: null, avatars: [] },
    assetUrls: {},         // key -> objectURL（预览用）
});

export const currentFile = computed(() => state.project.files[state.currentFile] || null);
export const currentNode = computed(() => {
    const seg = currentFile.value;
    if (!seg) return null;
    return (seg.nodes || []).find((n) => n.id === state.selectedId) || null;
});
export const usedKeys = computed(() => usedAssetKeys(state.project));

export function notify(msg) {
    state.message = msg;
    setTimeout(() => { if (state.message === msg) state.message = ''; }, 4000);
}

// ==================== 文件管理 ====================

export function ensureFirstFile() {
    const names = Object.keys(state.project.files);
    if (!names.length) {
        const name = '1.0.0.1';
        state.project.files[name] = emptyFile('序章');
        state.currentFile = name;
        return;
    }
    if (!state.currentFile || !state.project.files[state.currentFile]) state.currentFile = names[0];
}

export function addFile(name, title = '') {
    const n = String(name || '').trim();
    if (!n) { notify('段文件名不能为空'); return; }
    if (state.project.files[n]) { notify(`段已存在：${n}`); return; }
    state.project.files[n] = emptyFile(title);
    state.currentFile = n;
    state.selectedId = '';
}

export function removeFile(name) {
    if (!state.project.files[name]) return;
    if (!confirm(`删除段 ${name}？该段下的节点会一并删除。`)) return;
    delete state.project.files[name];
    ensureFirstFile();
}

export function selectFile(name) {
    state.currentFile = name;
    state.selectedId = '';
}

// ==================== 节点管理 ====================

export function addNode(type = 'dialogue') {
    const seg = currentFile.value;
    if (!seg) { notify('请先创建/选择一个段'); return; }
    const n = emptyNode(type);
    n.id = uniqueId(seg, n.id);
    seg.nodes.push(n);
    state.selectedId = n.id;
    state.tab = state.tab === 'preview' ? 'preview' : state.tab;
}

function uniqueId(seg, base) {
    let id = String(base).replace(/[^A-Za-z0-9_.]/g, '') || '1';
    const taken = new Set((seg.nodes || []).map((n) => n.id));
    if (!taken.has(id)) return id;
    let i = 2;
    while (taken.has(`${id}_${i}`)) i++;
    return `${id}_${i}`;
}

export function removeNode(id) {
    const seg = currentFile.value;
    if (!seg) return;
    const i = nodeIndex(seg, id);
    if (i < 0) return;
    if (!confirm(`删除节点 ${id}？`)) return;
    seg.nodes.splice(i, 1);
    if (state.selectedId === id) state.selectedId = seg.nodes[i] ? seg.nodes[i].id : (seg.nodes[0] ? seg.nodes[0].id : '');
}

export function moveNode(id, dir) {
    const seg = currentFile.value;
    if (!seg) return;
    const i = nodeIndex(seg, id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= seg.nodes.length) return;
    const [n] = seg.nodes.splice(i, 1);
    seg.nodes.splice(j, 0, n);
}

export function duplicateNode(id) {
    const seg = currentFile.value;
    if (!seg) return;
    const i = nodeIndex(seg, id);
    if (i < 0) return;
    const copy = JSON.parse(JSON.stringify(seg.nodes[i]));
    copy.id = uniqueId(seg, `${copy.id}_c`);
    copy.next = '';
    seg.nodes.splice(i + 1, 0, copy);
    state.selectedId = copy.id;
}

export function changeNodeId(oldId, newIdRaw) {
    const seg = currentFile.value;
    if (!seg) return;
    const clean = String(newIdRaw || '').trim();
    if (!clean) return;
    if (clean === oldId) return;
    if (seg.nodes.some((n) => n.id === clean)) { notify(`节点 id 已存在：${clean}`); return; }
    const n = seg.nodes.find((x) => x.id === oldId);
    if (!n) return;
    n.id = clean;
    // 段内引用同步（本段 next 与选项 next）
    const oldAddr = nodeAddr(state.currentFile, oldId);
    const newAddr = nodeAddr(state.currentFile, clean);
    for (const m of seg.nodes) {
        if (m.next === oldAddr) m.next = newAddr;
        (m.options || []).forEach((o) => { if (o.next === oldAddr) o.next = newAddr; });
    }
    if (state.selectedId === oldId) state.selectedId = clean;
}

// ==================== 立绘 / 选项辅助 ====================

export function avatarListOf(node) {
    if (!node) return [];
    if (node.avatars && node.avatars.length) return node.avatars;
    if (node.stage && node.stage.avatars && node.stage.avatars.length) return node.stage.avatars;
    if (node.avatar) return [{ key: node.avatar }];
    if (node.stage && node.stage.avatar) return [{ key: node.stage.avatar }];
    return [];
}

export function addAvatar(node) {
    if (!node) return;
    if (!node.avatars) node.avatars = [];
    node.avatars.push(emptyAvatar());
}

export function addOption(node) {
    if (!node) return;
    if (!node.options) node.options = [];
    node.options.push(emptyOption());
}

// ==================== 校验 ====================

export function runLint() {
    state.issues = lintProject(state.project);
    state.tab = 'lint';
    const errs = state.issues.filter((i) => i.level === 'error').length;
    notify(`校验完成：${errs} 个错误 / ${state.issues.length - errs} 个警告`);
}

export function selectIssue(issue) {
    if (issue.file && state.project.files[issue.file]) state.currentFile = issue.file;
    if (issue.nodeId) state.selectedId = issue.nodeId;
}

// ==================== 播放（预览） ====================

export function findNode(addr) {
    const p = parseAddr(addr);
    if (!p || p.terminal) return null;
    const seg = state.project.files[p.file];
    if (!seg) return null;
    const node = (seg.nodes || []).find((n) => n.id === p.key);
    return node ? { file: p.file, key: p.key, node } : null;
}

/** 从段首推演到目标节点，累积舞台状态（与引擎 StoryPanel 的语义一致） */
export function computeStageState(fileName, targetKey) {
    const seg = state.project.files[fileName];
    const stage = { bg: null, cg: null, avatars: [] };
    if (!seg) return stage;
    for (const n of seg.nodes || []) {
        if (n.avatars && n.avatars.length) stage.avatars = JSON.parse(JSON.stringify(n.avatars));
        else if (n.avatar) stage.avatars = [{ key: n.avatar }];
        if (n.stage) {
            if (n.stage.bg !== undefined && n.stage.bg !== null) stage.bg = n.stage.bg;
            if (n.stage.cg !== undefined && n.stage.cg !== null) stage.cg = n.stage.cg;
            if (n.stage.avatars && n.stage.avatars.length) stage.avatars = JSON.parse(JSON.stringify(n.stage.avatars));
            else if (n.stage.avatar) stage.avatars = [{ key: n.stage.avatar }];
        }
        if (n.id === targetKey) break;
    }
    return stage;
}

export function playFromSelection() {
    const seg = currentFile.value;
    if (!seg) return;
    const node = currentNode.value || seg.nodes[0];
    if (!node) { notify('当前段没有节点'); return; }
    state.playing = true;
    state.playAddr = nodeAddr(state.currentFile, node.id);
    refreshPlayStage();
    state.tab = 'preview';
}

export function playAdvance(optionIndex) {
    const cur = state.playAddr;
    const found = findNode(cur);
    if (!found) { state.playing = false; return; }
    const node = found.node;
    let next = '';
    if (node.type === 'choice' && typeof optionIndex === 'number') {
        const opt = (node.options || [])[optionIndex];
        next = (opt && opt.next) || node.next || '';
    } else {
        next = node.next || '';
    }
    if (!next) {
        const nx = nextKeyInFile(state.project.files[found.file], node.id);
        next = nx ? nodeAddr(found.file, nx) : '';
    }
    if (!next) {
        state.playing = false;
        notify(`本段播放结束（游标终态 ${found.file}.end）`);
        return;
    }
    state.playAddr = next;
    const nf = findNode(next);
    if (!nf) {
        state.playing = false;
        notify(`跳转目标不存在：${next}`);
        return;
    }
    state.currentFile = nf.file;
    state.selectedId = nf.key;
    refreshPlayStage();
}

export function refreshPlayStage() {
    const p = parseAddr(state.playAddr);
    if (!p || p.terminal) return;
    state.playStage = computeStageState(p.file, p.key);
}

export function stopPlay() {
    state.playing = false;
}

/** 当前预览节点（未播放时=选中的节点） */
export const previewNode = computed(() => {
    const addr = state.playing ? state.playAddr : (state.currentFile && state.selectedId ? nodeAddr(state.currentFile, state.selectedId) : '');
    if (!addr) return null;
    return findNode(addr);
});

export function previewStageState() {
    const pv = previewNode.value;
    if (!pv) return { bg: null, cg: null, avatars: [] };
    if (state.playing) return state.playStage;
    return computeStageState(pv.file, pv.key);
}

export function avatarPlans(node) {
    return resolveAvatarLayout(avatarListOf(node));
}

// ==================== 持久化 ====================

export function saveLocal() {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify({ project: state.project, at: new Date().toISOString() }));
        state.lastSavedAt = new Date().toLocaleTimeString();
        state.dirty = false;
    } catch (e) {
        console.warn('本地保存失败', e);
    }
}

export function loadLocal() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || !data.project) return false;
        state.project = Object.assign(emptyProject(), data.project);
        state.lastSavedAt = data.at ? new Date(data.at).toLocaleTimeString() : '';
        return true;
    } catch (e) {
        console.warn('本地读取失败', e);
        return false;
    }
}

export function newProject() {
    if (!confirm('新建项目会清空当前编辑内容（资源库保留）。继续？')) return;
    state.project = emptyProject();
    state.currentFile = '';
    state.selectedId = '';
    state.playing = false;
    ensureFirstFile();
    saveLocal();
}

let saveTimer = null;
watch(() => state.project, () => {
    state.dirty = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLocal, 800);
}, { deep: true });

// 初始化
loadLocal();
ensureFirstFile();
