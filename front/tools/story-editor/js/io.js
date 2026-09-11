// io.js — 资源存储（IndexedDB）、导出/导入 zip、CSV 工具
// 目录结构严格对齐 Cocos：assets/resources/story/data/*.json、assets/resources/story/image/{key}/*
// 导出包内额外附带 assets-manifest.csv（资源清单）与 dialogue-list.csv（台词表），供美术/本地化使用。

import { zipCreate, zipRead, bytesToText, textToBytes } from './zip.js';

const DB_NAME = 'story-editor';
const DB_VER = 1;
const STORE = 'assets';

// ==================== IndexedDB ====================

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VER);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbPut(record) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbGetAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

export async function idbPutAsset(key, filename, blob, mime) {
    await idbPut({ id: `${key}::${filename}`, key, filename, mime: mime || blob.type || '', blob });
}

export async function idbGetAsset(key, filename) {
    const all = await idbGetAll();
    return all.find((r) => r.key === key) || null;
}

export async function idbDeleteKey(key) {
    const all = await idbGetAll();
    const db = await openDb();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        all.filter((r) => r.key === key).forEach((r) => store.delete(r.id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function idbClear() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ==================== 素材 URL 缓存（预览用） ====================

const urlCache = new Map();

export function dropAssetUrl(key) {
    if (urlCache.has(key)) {
        URL.revokeObjectURL(urlCache.get(key));
        urlCache.delete(key);
    }
}

export async function getAssetUrl(key) {
    if (!key) return '';
    if (urlCache.has(key)) return urlCache.get(key);
    const rec = await idbGetAsset(key);
    const url = rec && rec.blob ? URL.createObjectURL(rec.blob) : '';
    urlCache.set(key, url);
    return url;
}

/** 把用户选择的图片写入资源库（不传 key 时用文件名去扩展名作为 key） */
export async function addAssetFromFile(file, project, key) {
    const base = String(file.name || 'image').replace(/\.[^.]+$/, '');
    const k = (key || base).trim();
    if (!k) throw new Error('资源 key 不能为空');
    await idbPutAsset(k, file.name || `${k}.png`, file, file.type);
    project.assets[k] = { filename: file.name || `${k}.png`, mime: file.type || '', size: file.size || 0 };
    dropAssetUrl(k);
    return k;
}

// ==================== 导出 zip ====================

function cleanNode(n) {
    // 去掉空值字段，保证生成 JSON 干净（缺省=保持上一幕 / 自动排布）
    const out = { id: n.id, type: n.type };
    if (n.speaker) out.speaker = n.speaker;
    if (n.text) out.text = n.text;
    if (n.next) out.next = n.next;
    if (n.avatar) out.avatar = n.avatar;
    if (n.avatars && n.avatars.length) {
        out.avatars = n.avatars.map(cleanAvatar);
    }
    if (n.options && n.options.length) {
        out.options = n.options.map((o) => {
            const oo = { text: o.text };
            if (o.next) oo.next = o.next;
            return oo;
        });
    }
    if (n.action) out.action = n.action;
    if (n.stage) {
        const st = {};
        if (n.stage.bg !== undefined && n.stage.bg !== null) st.bg = n.stage.bg;
        if (n.stage.cg !== undefined && n.stage.cg !== null) st.cg = n.stage.cg;
        if (n.stage.avatar) st.avatar = n.stage.avatar;
        if (n.stage.avatars && n.stage.avatars.length) st.avatars = n.stage.avatars.map(cleanAvatar);
        if (n.stage.video) st.video = n.stage.video;
        if (Object.keys(st).length) out.stage = st;
    }
    return out;
}

function cleanAvatar(a) {
    const o = { key: a.key };
    if (a.slot !== null && a.slot !== undefined && a.slot !== '') o.slot = Number(a.slot);
    if (a.x !== null && a.x !== undefined && a.x !== '') o.x = Number(a.x);
    if (Number(a.facing) === -1) o.facing = -1;
    if (a.name) o.name = a.name;
    return o;
}

export function projectToJsonFiles(project) {
    const files = {};
    for (const [name, seg] of Object.entries(project.files || {})) {
        files[name] = { meta: seg.meta || {}, nodes: (seg.nodes || []).map(cleanNode) };
    }
    return files;
}

export function csvOf(rows, headers) {
    const esc = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = headers || (rows[0] ? Object.keys(rows[0]) : []);
    const lines = [head.join(',')];
    for (const r of rows) lines.push(head.map((h) => esc(r[h])).join(','));
    return '\ufeff' + lines.join('\r\n');
}

export function parseCsv(text) {
    const s = String(text || '').replace(/^\ufeff/, '');
    const rows = [];
    let row = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (q) {
            if (c === '"') {
                if (s[i + 1] === '"') { cell += '"'; i++; } else q = false;
            } else cell += c;
        } else if (c === '"') q = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else if (c === '\r') { /* skip */ }
        else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    if (!rows.length) return [];
    const head = rows[0].map((h) => h.trim());
    return rows.slice(1).filter((r) => r.some((v) => v !== '')).map((r) => {
        const o = {};
        head.forEach((h, i) => { o[h] = r[i] === undefined ? '' : r[i]; });
        return o;
    });
}

export function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
    }, 0);
}

export function downloadText(text, filename, mime = 'application/json;charset=utf-8') {
    downloadBlob(new Blob([text], { type: mime }), filename);
}

/**
 * 导出整个项目为 zip
 * @param {object} project
 * @param {{includeAssets?:boolean, includeManifest?:boolean, includeDialogue?:boolean, projectName?:string}} opts
 */
export async function exportProjectZip(project, opts = {}) {
    const { includeAssets = true, includeManifest = true, includeDialogue = true, projectName = 'story' } = opts;
    const entries = [];
    const jsonFiles = projectToJsonFiles(project);

    for (const [name, seg] of Object.entries(jsonFiles)) {
        entries.push({ path: `story/data/${name}.json`, data: textToBytes(JSON.stringify(seg, null, 2)) });
    }

    if (includeAssets) {
        const all = await idbGetAll();
        for (const rec of all) {
            if (!(project.assets || {})[rec.key]) continue; // 已从项目移除的资源不导出
            const buf = new Uint8Array(await rec.blob.arrayBuffer());
            entries.push({ path: `story/image/${rec.key}/${rec.filename}`, data: buf });
        }
    }

    if (includeManifest) {
        const rows = Object.entries(project.assets || {}).map(([key, meta]) => ({
            key,
            filename: meta.filename || '',
            mime: meta.mime || '',
            size: meta.size || '',
            cocos_path: `story/image/${key}/`,
            used: usedText(project, key),
        }));
        entries.push({ path: 'assets-manifest.csv', data: textToBytes(csvOf(rows)) });
    }

    if (includeDialogue) {
        // 延迟引入避免循环依赖
        const { dialogueRows } = await import('./model.js');
        entries.push({ path: 'dialogue-list.csv', data: textToBytes(csvOf(dialogueRows(project))) });
    }

    const blob = await zipCreate(entries);
    downloadBlob(blob, `${projectName}.zip`);
    return entries.length;
}

function usedText(project, key) {
    const hits = [];
    for (const [file, seg] of Object.entries(project.files || {})) {
        for (const n of seg.nodes || []) {
            const list = []
                .concat(n.avatars || [])
                .concat(n.avatar ? [{ key: n.avatar }] : [])
                .concat(n.stage && n.stage.avatars ? n.stage.avatars : [])
                .concat(n.stage && n.stage.avatar ? [{ key: n.stage.avatar }] : []);
            if (list.some((a) => a && a.key === key)) hits.push(`${file}.${n.id}`);
            if (n.stage && (n.stage.bg === key || n.stage.cg === key)) hits.push(`${file}.${n.id}`);
        }
    }
    return hits.slice(0, 5).join(' ');
}

// ==================== 导入 zip ====================

/**
 * 导入 zip（本工具导出格式，或任何含 story/data/*.json、story/image/{key}/* 的包）
 * @returns {Promise<{files:number, assets:number}>}
 */
export async function importProjectZip(file, project, { replaceFiles = true } = {}) {
    const buf = await file.arrayBuffer();
    const entries = await zipRead(buf);
    let fileCount = 0;
    let assetCount = 0;

    for (const e of entries) {
        const path = e.path.replace(/\\/g, '/');
        let m = /^story\/data\/(.+)\.json$/i.exec(path);
        if (m) {
            try {
                const data = JSON.parse(bytesToText(e.data));
                const name = m[1];
                if (replaceFiles || !project.files[name]) project.files[name] = data;
                fileCount++;
            } catch (err) {
                console.warn('解析失败：' + path, err);
            }
            continue;
        }
        m = /^story\/image\/([^/]+)\/(.+)$/i.exec(path);
        if (m) {
            const key = m[1];
            const filename = m[2];
            const blob = new Blob([e.data]);
            await idbPutAsset(key, filename, blob, '');
            project.assets[key] = { filename, mime: '', size: e.data.length };
            dropAssetUrl(key);
            assetCount++;
            continue;
        }
    }
    return { files: fileCount, assets: assetCount };
}
