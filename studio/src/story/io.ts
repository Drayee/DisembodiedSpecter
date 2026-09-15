/**
 * io.ts — 资源库（IndexedDB）、CSV 工具、导出/导入 zip
 * 目录结构与 Cocos 严格对齐：story/data/*.json、story/image/{key}/*
 * 导出包额外附带 assets-manifest.csv（美术清单）与 dialogue-list.csv（本地化/配音台词表）。
 */
import { dialogueRows, usedAssetKeys } from './model'
import type { AssetRecord, StoryAvatarEntry, StoryNode, StoryProject } from './types'
import { bytesToText, textToBytes, zipCreate, zipRead, type ZipEntry } from './zip'

const DB_NAME = 'ds-studio-story'
const DB_VER = 1
const STORE = 'assets'

// ==================== IndexedDB ====================

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VER)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function idbPut(record: AssetRecord): Promise<void> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(record)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

export async function idbGetAll(): Promise<AssetRecord[]> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).getAll()
        req.onsuccess = () => resolve((req.result || []) as AssetRecord[])
        req.onerror = () => reject(req.error)
    })
}

export async function idbPutAsset(key: string, filename: string, blob: Blob, mime: string): Promise<void> {
    await idbPut({ id: `${key}::${filename}`, key, filename, mime: mime || blob.type || '', blob })
}

/** 一个 key 只保留一张图（与引擎 spriteFrame 加载方式一致），因此按 key 取第一条 */
export async function idbGetAsset(key: string): Promise<AssetRecord | null> {
    const all = await idbGetAll()
    return all.find((r) => r.key === key) || null
}

export async function idbDeleteKey(key: string): Promise<void> {
    const all = await idbGetAll()
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        const store = tx.objectStore(STORE)
        all.filter((r) => r.key === key).forEach((r) => store.delete(r.id))
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

export async function idbClear(): Promise<void> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

// ==================== 素材 ObjectURL 缓存（预览用） ====================

const urlCache = new Map<string, string>()

export function dropAssetUrl(key: string): void {
    const url = urlCache.get(key)
    if (url) {
        URL.revokeObjectURL(url)
        urlCache.delete(key)
    }
}

export async function getAssetUrl(key: string): Promise<string> {
    if (!key) return ''
    const cached = urlCache.get(key)
    if (cached !== undefined) return cached
    const rec = await idbGetAsset(key)
    const url = rec && rec.blob ? URL.createObjectURL(rec.blob) : ''
    urlCache.set(key, url)
    return url
}

/** 批量取多个 key 的 URL，返回 key → url 映射（预览画布用） */
export async function getAssetUrls(keys: string[]): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    await Promise.all(
        keys.filter(Boolean).map(async (k) => {
            out[k] = await getAssetUrl(k)
        }),
    )
    return out
}

/** 把用户选择的图片写入资源库（不传 key 时用文件名去扩展名作为 key） */
export async function addAssetFromFile(file: File, project: StoryProject, key?: string): Promise<string> {
    const base = String(file.name || 'image').replace(/\.[^.]+$/, '')
    const k = (key || base).trim()
    if (!k) throw new Error('资源 key 不能为空')
    await idbPutAsset(k, file.name || `${k}.png`, file, file.type)
    project.assets[k] = { filename: file.name || `${k}.png`, mime: file.type || '', size: file.size || 0 }
    dropAssetUrl(k)
    return k
}

/** 资源 key 重命名：IndexedDB 记录、工程引用、manifest 一起改 */
export async function renameAssetKey(project: StoryProject, oldKey: string, newKeyRaw: string): Promise<string> {
    const newKey = newKeyRaw.trim()
    if (!newKey || newKey === oldKey) return oldKey
    if (project.assets[newKey]) throw new Error(`资源 key 已存在：${newKey}`)

    const rec = await idbGetAsset(oldKey)
    if (rec) {
        await idbDeleteKey(oldKey)
        await idbPutAsset(newKey, rec.filename, rec.blob, rec.mime)
    }
    const meta = project.assets[oldKey]
    if (meta) {
        delete project.assets[oldKey]
        project.assets[newKey] = meta
    }
    dropAssetUrl(oldKey)
    dropAssetUrl(newKey)

    // 同步所有引用
    const remapAvatar = (a: StoryAvatarEntry) => {
        if (a.key === oldKey) a.key = newKey
    }
    for (const seg of Object.values(project.files || {})) {
        for (const n of seg.nodes || []) {
            ;(n.avatars || []).forEach(remapAvatar)
            if (n.avatar === oldKey) n.avatar = newKey
            if (n.stage) {
                ;(n.stage.avatars || []).forEach(remapAvatar)
                if (n.stage.avatar === oldKey) n.stage.avatar = newKey
                if (n.stage.bg === oldKey) n.stage.bg = newKey
                if (n.stage.cg === oldKey) n.stage.cg = newKey
            }
        }
    }
    for (const it of Object.values(project.items || {})) {
        if (it.iconKey === oldKey) it.iconKey = newKey
    }
    return newKey
}

// ==================== 导出 zip ====================

function cleanAvatar(a: StoryAvatarEntry) {
    const o: Record<string, unknown> = { key: a.key }
    if (a.slot !== null && a.slot !== undefined && (a.slot as unknown) !== '') o.slot = Number(a.slot)
    if (a.x !== null && a.x !== undefined && (a.x as unknown) !== '') o.x = Number(a.x)
    if (Number(a.facing) === -1) o.facing = -1
    if (a.name) o.name = a.name
    return o
}

function cleanNode(n: StoryNode) {
    // 去掉空值字段，保证生成 JSON 干净（缺省=保持上一幕 / 自动排布）
    const out: Record<string, unknown> = { id: n.id, type: n.type }
    if (n.speaker) out.speaker = n.speaker
    if (n.text) out.text = n.text
    if (n.next) out.next = n.next
    if (n.avatar) out.avatar = n.avatar
    if (n.avatars && n.avatars.length) out.avatars = n.avatars.map(cleanAvatar)
    if (n.options && n.options.length) {
        out.options = n.options.map((o) => {
            const oo: Record<string, unknown> = { text: o.text }
            if (o.next) oo.next = o.next
            return oo
        })
    }
    if (n.action) out.action = n.action
    if (n.stage) {
        const st: Record<string, unknown> = {}
        if (n.stage.bg !== undefined && n.stage.bg !== null) st.bg = n.stage.bg
        if (n.stage.cg !== undefined && n.stage.cg !== null) st.cg = n.stage.cg
        if (n.stage.avatar) st.avatar = n.stage.avatar
        if (n.stage.avatars && n.stage.avatars.length) st.avatars = n.stage.avatars.map(cleanAvatar)
        if (n.stage.video) st.video = n.stage.video
        if (Object.keys(st).length) out.stage = st
    }
    return out
}

export function projectToJsonFiles(project: StoryProject): Record<string, unknown> {
    const files: Record<string, unknown> = {}
    for (const [name, seg] of Object.entries(project.files || {})) {
        files[name] = { meta: seg.meta || {}, nodes: (seg.nodes || []).map(cleanNode) }
    }
    return files
}

// ==================== CSV ====================

/** 生成 CSV 文本（带 BOM + CRLF，Excel 直接打开不乱码） */
export function csvOf(rows: Record<string, unknown>[], headers?: string[]): string {
    const esc = (v: unknown) => {
        const s = v === null || v === undefined ? '' : String(v)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const head = headers || (rows[0] ? Object.keys(rows[0]) : [])
    const lines = [head.join(',')]
    for (const r of rows) lines.push(head.map((h) => esc(r[h])).join(','))
    return '\ufeff' + lines.join('\r\n')
}

export function parseCsv(text: string): Record<string, string>[] {
    const s = String(text || '').replace(/^\ufeff/, '')
    const rows: string[][] = []
    let row: string[] = []
    let cell = ''
    let q = false
    for (let i = 0; i < s.length; i++) {
        const c = s[i]
        if (q) {
            if (c === '"') {
                if (s[i + 1] === '"') {
                    cell += '"'
                    i++
                } else q = false
            } else cell += c
        } else if (c === '"') q = true
        else if (c === ',') {
            row.push(cell)
            cell = ''
        } else if (c === '\n') {
            row.push(cell)
            rows.push(row)
            row = []
            cell = ''
        } else if (c === '\r') {
            /* skip */
        } else cell += c
    }
    if (cell !== '' || row.length) {
        row.push(cell)
        rows.push(row)
    }
    if (!rows.length) return []
    const head = rows[0].map((h) => h.trim())
    return rows
        .slice(1)
        .filter((r) => r.some((v) => v !== ''))
        .map((r) => {
            const o: Record<string, string> = {}
            head.forEach((h, i) => {
                o[h] = r[i] === undefined ? '' : r[i]
            })
            return o
        })
}

// ==================== 下载 ====================

export function downloadBlob(blob: Blob, filename: string): void {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
        URL.revokeObjectURL(a.href)
        a.remove()
    }, 0)
}

export function downloadText(text: string, filename: string, mime = 'application/json;charset=utf-8'): void {
    downloadBlob(new Blob([text], { type: mime }), filename)
}

export interface ExportOptions {
    includeAssets?: boolean
    includeManifest?: boolean
    includeDialogue?: boolean
    projectName?: string
}

function usedText(project: StoryProject, key: string): string {
    const hits: string[] = []
    for (const [file, seg] of Object.entries(project.files || {})) {
        for (const n of seg.nodes || []) {
            const list: StoryAvatarEntry[] = ([] as StoryAvatarEntry[])
                .concat(n.avatars || [])
                .concat(n.avatar ? [{ key: n.avatar }] : [])
                .concat(n.stage && n.stage.avatars ? n.stage.avatars : [])
                .concat(n.stage && n.stage.avatar ? [{ key: n.stage.avatar }] : [])
            if (list.some((a) => a && a.key === key)) hits.push(`${file}.${n.id}`)
            if (n.stage && (n.stage.bg === key || n.stage.cg === key)) hits.push(`${file}.${n.id}`)
        }
    }
    return hits.slice(0, 5).join(' ')
}

/** 导出整个工程为 zip，并触发浏览器下载 */
export async function exportProjectZip(project: StoryProject, opts: ExportOptions = {}): Promise<number> {
    const { includeAssets = true, includeManifest = true, includeDialogue = true, projectName = 'story' } = opts
    const entries: ZipEntry[] = []
    const jsonFiles = projectToJsonFiles(project)

    for (const [name, seg] of Object.entries(jsonFiles)) {
        entries.push({ path: `story/data/${name}.json`, data: textToBytes(JSON.stringify(seg, null, 2)) })
    }

    if (includeAssets) {
        const all = await idbGetAll()
        for (const rec of all) {
            if (!(project.assets || {})[rec.key]) continue // 已从工程移除的资源不导出
            const buf = new Uint8Array(await rec.blob.arrayBuffer())
            entries.push({ path: `story/image/${rec.key}/${rec.filename}`, data: buf })
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
        }))
        entries.push({ path: 'assets-manifest.csv', data: textToBytes(csvOf(rows)) })
    }

    if (includeDialogue) {
        entries.push({ path: 'dialogue-list.csv', data: textToBytes(csvOf(dialogueRows(project) as unknown as Record<string, unknown>[])) })
    }

    const blob = await zipCreate(entries)
    downloadBlob(blob, `${projectName}.zip`)
    return entries.length
}

// ==================== 导入 zip ====================

export interface ImportResult {
    files: number
    assets: number
}

/** 导入 zip（本工具导出格式，或任何含 story/data/*.json、story/image/{key}/* 的包） */
export async function importProjectZip(
    file: File,
    project: StoryProject,
    { replaceFiles = true }: { replaceFiles?: boolean } = {},
): Promise<ImportResult> {
    const buf = await file.arrayBuffer()
    const entries = await zipRead(buf)
    let fileCount = 0
    let assetCount = 0

    for (const e of entries) {
        const path = e.path.replace(/\\/g, '/')
        let m = /^story\/data\/(.+)\.json$/i.exec(path)
        if (m) {
            try {
                const data = JSON.parse(bytesToText(e.data))
                const name = m[1]
                if (replaceFiles || !project.files[name]) project.files[name] = data
                fileCount++
            } catch (err) {
                console.warn('解析失败：' + path, err)
            }
            continue
        }
        m = /^story\/image\/([^/]+)\/(.+)$/i.exec(path)
        if (m) {
            const key = m[1]
            const filename = m[2]
            const blob = new Blob([e.data as unknown as BlobPart])
            await idbPutAsset(key, filename, blob, '')
            project.assets[key] = { filename, mime: '', size: e.data.length }
            dropAssetUrl(key)
            assetCount++
            continue
        }
    }
    return { files: fileCount, assets: assetCount }
}

/** 资源引用计数（key → 引用处数量） */
export function assetUsage(project: StoryProject): Map<string, Set<string>> {
    return usedAssetKeys(project)
}
