/**
 * store.ts — 剧情编辑器状态（Pinia）
 * 由旧工具 front/tools/story-editor/js/store.js 移植：工程管理 / 自动保存 / 校验 / 预览播放。
 */
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useFeedbackStore } from '@/stores/feedback'
import {
    emptyAvatar,
    emptyFile,
    emptyNode,
    emptyOption,
    emptyProject,
    lintProject,
    nextKeyInFile,
    nodeAddr,
    nodeIndex,
    parseAddr,
    resolveAvatarLayout,
    usedAssetKeys,
    type NodeRow,
    nodeRows,
} from './model'
import {
    downloadText,
    addAssetFromFile,
    dropAssetUrl,
    exportProjectZip,
    getAssetUrls,
    idbDeleteKey,
    idbGetAll,
    idbPutAsset,
    importProjectZip,
    parseCsv,
    projectToJsonFiles,
    renameAssetKey,
    type ExportOptions,
} from './io'
import { sampleAssets, sampleProject } from './sample'
import type { AvatarPlan, LintIssue, StageState, StoryAvatarEntry, StoryNode, StoryNodeType, StoryProject } from './types'

const LS_KEY = 'ds-studio.story.project.v1'
export type StoryTab = 'preview' | 'flow' | 'table' | 'assets' | 'extra' | 'lint'

export const useStoryStore = defineStore('story', () => {
    const feedback = useFeedbackStore()

    const project = ref<StoryProject>(emptyProject())
    const currentFile = ref('')
    const selectedId = ref('')
    const tab = ref<StoryTab>('preview')
    const issues = ref<LintIssue[]>([])
    const dirty = ref(false)
    const lastSavedAt = ref('')

    // 预览播放状态
    const playing = ref(false)
    const playAddr = ref('')
    const playStage = ref<StageState>({ bg: null, cg: null, avatars: [] })
    /** key → objectURL（预览用） */
    const assetUrls = ref<Record<string, string>>({})

    // ==================== 派生 ====================

    const fileNames = computed(() => Object.keys(project.value.files || {}))
    const segment = computed(() => project.value.files[currentFile.value] || null)
    const nodes = computed<StoryNode[]>(() => segment.value?.nodes ?? [])
    const currentNode = computed<StoryNode | null>(() => nodes.value.find((n) => n.id === selectedId.value) || null)
    const usedKeys = computed(() => usedAssetKeys(project.value))

    const errorCount = computed(() => issues.value.filter((i) => i.level === 'error').length)
    const warnCount = computed(() => issues.value.filter((i) => i.level === 'warn').length)

    const columns = computed<NodeRow[]>(() => nodeRows(project.value, currentFile.value))

    // ==================== 工程 / 段 ====================

    function ensureFirstFile() {
        const names = Object.keys(project.value.files)
        if (!names.length) {
            const name = '1.0.0.1'
            project.value.files[name] = emptyFile('序章')
            currentFile.value = name
            return
        }
        if (!currentFile.value || !project.value.files[currentFile.value]) currentFile.value = names[0]
    }

    function addFile(name: string, title = '') {
        const n = String(name || '').trim()
        if (!n) {
            feedback.toast.warning('段文件名不能为空')
            return
        }
        if (project.value.files[n]) {
            feedback.toast.warning(`段已存在：${n}`)
            return
        }
        project.value.files[n] = emptyFile(title)
        currentFile.value = n
        selectedId.value = ''
    }

    async function removeFile(name: string) {
        if (!project.value.files[name]) return
        const ok = await feedback.confirm({
            title: `删除段 ${name}？`,
            message: '该段下的所有节点会一并删除，且无法撤销。',
            confirmText: '删除',
            danger: true,
        })
        if (!ok) return
        delete project.value.files[name]
        ensureFirstFile()
        selectedId.value = ''
    }

    function selectFile(name: string) {
        currentFile.value = name
        selectedId.value = ''
    }

    function renameFileTitle(name: string, title: string) {
        const seg = project.value.files[name]
        if (!seg) return
        seg.meta = { ...(seg.meta || {}), title }
    }

    // ==================== 节点 ====================

    function uniqueId(seg: { nodes: StoryNode[] }, base: string): string {
        const id = String(base).replace(/[^A-Za-z0-9_.]/g, '') || '1'
        const taken = new Set((seg.nodes || []).map((n) => n.id))
        if (!taken.has(id)) return id
        let i = 2
        while (taken.has(`${id}_${i}`)) i++
        return `${id}_${i}`
    }

    function addNode(type: StoryNodeType = 'dialogue') {
        const seg = segment.value
        if (!seg) {
            feedback.toast.warning('请先创建或选择一个段')
            return
        }
        const n = emptyNode(type)
        n.id = uniqueId(seg, n.id)
        seg.nodes.push(n)
        selectedId.value = n.id
    }

    async function removeNode(id: string) {
        const seg = segment.value
        if (!seg) return
        const i = nodeIndex(seg, id)
        if (i < 0) return
        const ok = await feedback.confirm({ title: `删除节点 ${id}？`, message: '该节点的台词、立绘与分支设置会一并删除。', confirmText: '删除', danger: true })
        if (!ok) return
        seg.nodes.splice(i, 1)
        if (selectedId.value === id) {
            selectedId.value = seg.nodes[i] ? seg.nodes[i].id : seg.nodes[0] ? seg.nodes[0].id : ''
        }
    }

    function moveNode(id: string, dir: number) {
        const seg = segment.value
        if (!seg) return
        const i = nodeIndex(seg, id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= seg.nodes.length) return
        const [n] = seg.nodes.splice(i, 1)
        seg.nodes.splice(j, 0, n)
    }

    function duplicateNode(id: string) {
        const seg = segment.value
        if (!seg) return
        const i = nodeIndex(seg, id)
        if (i < 0) return
        const copy: StoryNode = JSON.parse(JSON.stringify(seg.nodes[i]))
        copy.id = uniqueId(seg, `${copy.id}_c`)
        copy.next = ''
        seg.nodes.splice(i + 1, 0, copy)
        selectedId.value = copy.id
    }

    function changeNodeId(oldId: string, newIdRaw: string) {
        const seg = segment.value
        if (!seg) return
        const clean = String(newIdRaw || '').trim()
        if (!clean || clean === oldId) return
        if (seg.nodes.some((n) => n.id === clean)) {
            feedback.toast.warning(`节点 id 已存在：${clean}`)
            return
        }
        const n = seg.nodes.find((x) => x.id === oldId)
        if (!n) return
        n.id = clean
        // 段内引用同步（本段 next 与选项 next）
        const oldAddr = nodeAddr(currentFile.value, oldId)
        const newAddr = nodeAddr(currentFile.value, clean)
        for (const m of seg.nodes) {
            if (m.next === oldAddr) m.next = newAddr
            ;(m.options || []).forEach((o) => {
                if (o.next === oldAddr) o.next = newAddr
            })
        }
        if (selectedId.value === oldId) selectedId.value = clean
    }

    function changeNodeType(id: string, type: StoryNodeType) {
        const seg = segment.value
        if (!seg) return
        const n = seg.nodes.find((x) => x.id === id)
        if (!n || n.type === type) return
        n.type = type
        if (type === 'dialogue' && !n.avatars) n.avatars = []
        if (type === 'choice' && (!n.options || !n.options.length)) n.options = [emptyOption()]
        if (type === 'action' && !n.action) n.action = 'end'
        if (type === 'stage' && !n.stage) n.stage = { avatars: [] }
    }

    // ==================== 立绘 / 选项 ====================

    function avatarListOf(node: StoryNode | null): StoryAvatarEntry[] {
        if (!node) return []
        if (node.avatars && node.avatars.length) return node.avatars
        if (node.stage && node.stage.avatars && node.stage.avatars.length) return node.stage.avatars
        if (node.avatar) return [{ key: node.avatar }]
        if (node.stage && node.stage.avatar) return [{ key: node.stage.avatar }]
        return []
    }

    function addAvatar(node: StoryNode) {
        if (!node.avatars) node.avatars = []
        node.avatars.push(emptyAvatar())
    }

    function removeAvatar(node: StoryNode, index: number) {
        node.avatars?.splice(index, 1)
    }

    function addOption(node: StoryNode) {
        if (!node.options) node.options = []
        node.options.push(emptyOption())
    }

    function removeOption(node: StoryNode, index: number) {
        node.options?.splice(index, 1)
    }

    // ==================== 校验 ====================

    function runLint(focus = true) {
        issues.value = lintProject(project.value)
        if (focus) tab.value = 'lint'
        feedback.toast.info(`校验完成：${errorCount.value} 个错误 / ${warnCount.value} 个警告`)
    }

    function selectIssue(issue: LintIssue) {
        if (issue.file && project.value.files[issue.file]) currentFile.value = issue.file
        if (issue.nodeId) selectedId.value = issue.nodeId
        tab.value = 'preview'
    }

    // ==================== 播放（预览） ====================

    function findNode(addr: string): { file: string; key: string; node: StoryNode } | null {
        const p = parseAddr(addr)
        if (!p || p.terminal || !p.key) return null
        const seg = project.value.files[p.file]
        if (!seg) return null
        const node = (seg.nodes || []).find((n) => n.id === p.key)
        return node ? { file: p.file, key: p.key, node } : null
    }

    /** 从段首推演到目标节点，累积舞台状态（与引擎 StoryPanel 的语义一致） */
    function computeStageState(fileName: string, targetKey: string): StageState {
        const seg = project.value.files[fileName]
        const stage: StageState = { bg: null, cg: null, avatars: [] }
        if (!seg) return stage
        for (const n of seg.nodes || []) {
            if (n.avatars && n.avatars.length) stage.avatars = JSON.parse(JSON.stringify(n.avatars))
            else if (n.avatar) stage.avatars = [{ key: n.avatar }]
            if (n.stage) {
                if (n.stage.bg !== undefined && n.stage.bg !== null) stage.bg = n.stage.bg
                if (n.stage.cg !== undefined && n.stage.cg !== null) stage.cg = n.stage.cg
                if (n.stage.avatars && n.stage.avatars.length) stage.avatars = JSON.parse(JSON.stringify(n.stage.avatars))
                else if (n.stage.avatar) stage.avatars = [{ key: n.stage.avatar }]
            }
            if (n.id === targetKey) break
        }
        return stage
    }

    const previewNode = computed(() => {
        const addr = playing.value
            ? playAddr.value
            : currentFile.value && selectedId.value
              ? nodeAddr(currentFile.value, selectedId.value)
              : ''
        if (!addr) return null
        return findNode(addr)
    })

    function previewStageState(): StageState {
        const pv = previewNode.value
        if (!pv) return { bg: null, cg: null, avatars: [] }
        if (playing.value) return playStage.value
        return computeStageState(pv.file, pv.key)
    }

    function refreshPlayStage() {
        const p = parseAddr(playAddr.value)
        if (!p || p.terminal || !p.key) return
        playStage.value = computeStageState(p.file, p.key)
    }

    function playFromSelection() {
        const seg = segment.value
        if (!seg) return
        const node = currentNode.value || seg.nodes[0]
        if (!node) {
            feedback.toast.warning('当前段没有节点')
            return
        }
        playing.value = true
        playAddr.value = nodeAddr(currentFile.value, node.id)
        refreshPlayStage()
        tab.value = 'preview'
    }

    function playAdvance(optionIndex?: number) {
        const cur = playAddr.value
        const found = findNode(cur)
        if (!found) {
            playing.value = false
            return
        }
        const node = found.node
        let next = ''
        if (node.type === 'choice' && typeof optionIndex === 'number') {
            const opt = (node.options || [])[optionIndex]
            next = (opt && opt.next) || node.next || ''
        } else {
            next = node.next || ''
        }
        if (!next) {
            const nx = nextKeyInFile(project.value.files[found.file], node.id)
            next = nx ? nodeAddr(found.file, nx) : ''
        }
        if (!next) {
            playing.value = false
            feedback.toast.info(`本段播放结束（游标终态 ${found.file}.end）`)
            return
        }
        playAddr.value = next
        const nf = findNode(next)
        if (!nf) {
            playing.value = false
            feedback.toast.error(`跳转目标不存在：${next}`)
            return
        }
        currentFile.value = nf.file
        selectedId.value = nf.key
        refreshPlayStage()
    }

    function stopPlay() {
        playing.value = false
    }

    function avatarPlans(node: StoryNode | null): AvatarPlan[] {
        return resolveAvatarLayout(avatarListOf(node))
    }

    // ==================== 资源库 ====================

    async function refreshAssetUrls() {
        const keys = Object.keys(project.value.assets || {})
        assetUrls.value = await getAssetUrls(keys)
    }

    async function uploadAsset(file: File, key?: string): Promise<string | null> {
        try {
            const k = await addAssetFromFile(file, project.value, key)
            await refreshAssetUrls()
            feedback.toast.success('资源已加入库', `${k}（${file.name}）`)
            return k
        } catch (e) {
            feedback.toast.error('上传失败', (e as Error).message)
            return null
        }
    }

    async function uploadAssets(files: File[]): Promise<number> {
        let n = 0
        for (const f of files) {
            try {
                await addAssetFromFile(f, project.value)
                n++
            } catch (e) {
                feedback.toast.error(`上传失败：${f.name}`, (e as Error).message)
            }
        }
        if (n) {
            await refreshAssetUrls()
            feedback.toast.success(`已上传 ${n} 个资源`)
        }
        return n
    }

    async function removeAsset(key: string) {
        const used = usedKeys.value.get(key)
        const ok = await feedback.confirm({
            title: `删除资源 ${key}？`,
            message: used ? `该资源正被 ${used.size} 处引用（${Array.from(used).slice(0, 3).join('、')}），删除后预览会显示占位。` : '该资源未被任何节点引用。',
            confirmText: '删除',
            danger: true,
        })
        if (!ok) return
        await idbDeleteKey(key)
        delete project.value.assets[key]
        dropAssetUrl(key)
        await refreshAssetUrls()
    }

    async function renameAsset(oldKey: string, newKey: string) {
        try {
            const k = await renameAssetKey(project.value, oldKey, newKey)
            await refreshAssetUrls()
            feedback.toast.success('资源 key 已重命名', `${oldKey} → ${k}`)
        } catch (e) {
            feedback.toast.error('重命名失败', (e as Error).message)
        }
    }

    async function assetStats(): Promise<{ total: number; bytes: number }> {
        const all = await idbGetAll()
        return { total: all.length, bytes: all.reduce((s, r) => s + (r.blob?.size || 0), 0) }
    }

    // ==================== 导入 / 导出 ====================

    async function exportZip(opts: ExportOptions = {}) {
        try {
            const n = await exportProjectZip(project.value, opts)
            feedback.toast.success('导出完成', `共 ${n} 个文件，已开始下载`)
        } catch (e) {
            feedback.toast.error('导出失败', (e as Error).message)
        }
    }

    function exportCurrentJson() {
        const name = currentFile.value || 'segment'
        const seg = project.value.files[name]
        if (!seg) {
            feedback.toast.warning('当前没有可导出的段')
            return
        }
        const clean = (projectToJsonFiles({ ...project.value, files: { [name]: seg } })[name] as object) ?? seg
        downloadText(JSON.stringify(clean, null, 2), `${name}.json`)
        feedback.toast.success('已导出本段 JSON', `${name}.json`)
    }

    async function importZip(file: File, replaceFiles = true) {
        try {
            const res = await importProjectZip(file, project.value, { replaceFiles })
            ensureFirstFile()
            await refreshAssetUrls()
            feedback.toast.success('导入完成', `${res.files} 个段文件 · ${res.assets} 个资源`)
        } catch (e) {
            feedback.toast.error('导入失败', (e as Error).message)
        }
    }

    /** 表格视图：导入台词 CSV（列：file,id,text 或 addr,text） */
    function importDialogueCsv(text: string): number {
        const rows = parseCsv(text)
        let n = 0
        for (const r of rows) {
            const addr = (r.addr || '').trim()
            const p = addr ? parseAddr(addr) : null
            const file = p && !p.terminal ? p.file : (r.file || '').trim()
            const id = p && !p.terminal ? String(p.key) : (r.id || '').trim()
            if (!file || !id) continue
            const node = (project.value.files[file]?.nodes || []).find((x) => x.id === id)
            if (!node) continue
            if (r.text !== undefined) node.text = r.text
            if (r.speaker !== undefined && node.type === 'dialogue') node.speaker = r.speaker
            n++
        }
        if (n) feedback.toast.success(`已从 CSV 更新 ${n} 条台词`)
        else feedback.toast.warning('CSV 没有匹配到任何节点', '需要 addr 或 file+id 列')
        return n
    }

    // ==================== 持久化 ====================

    function saveLocal() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ project: project.value, at: new Date().toISOString() }))
            lastSavedAt.value = new Date().toLocaleTimeString()
            dirty.value = false
        } catch (e) {
            console.warn('本地保存失败', e)
        }
    }

    function loadLocal(): boolean {
        try {
            const raw = localStorage.getItem(LS_KEY)
            if (!raw) return false
            const data = JSON.parse(raw)
            if (!data || !data.project) return false
            project.value = Object.assign(emptyProject(), data.project)
            lastSavedAt.value = data.at ? new Date(data.at).toLocaleTimeString() : ''
            return true
        } catch (e) {
            console.warn('本地读取失败', e)
            return false
        }
    }

    async function newProject() {
        const ok = await feedback.confirm({
            title: '新建工程？',
            message: '会清空当前编辑内容（资源库保留，可在资源库页单独清理）。',
            confirmText: '新建',
        })
        if (!ok) return
        project.value = emptyProject()
        currentFile.value = ''
        selectedId.value = ''
        playing.value = false
        ensureFirstFile()
        saveLocal()
    }

    /** 载入示例剧情（含 canvas 现场生成的占位美术），用于快速理解数据模型 */
    async function loadSample(silent = false) {
        if (!silent) {
            const ok = await feedback.confirm({
                title: '载入示例剧情？',
                message: '会替换当前工程内容（资源库保留，并补充示例用的 3 张占位图）。',
                confirmText: '载入',
            })
            if (!ok) return
        }

        // 先生成/落盘资源，再整体替换工程：避免编辑器的自动保存抢在资源写入之前把「无资源的工程」落盘
        let generated: { key: string; filename: string; blob: Blob }[] = []
        try {
            generated = await sampleAssets()
        } catch (e) {
            // 占位图生成失败不影响剧情数据本身，明确告知而不是静默失败
            feedback.toast.warning('示例占位图生成失败', `剧情数据仍会载入：${(e as Error).message}`)
        }

        for (const a of generated) {
            await idbPutAsset(a.key, a.filename, a.blob, 'image/png')
        }

        const next = sampleProject()
        for (const a of generated) {
            next.assets[a.key] = { filename: a.filename, mime: 'image/png', size: a.blob.size }
        }
        project.value = next

        currentFile.value = '1.0.0.1'
        // 默认选中第一个有立绘（或带舞台）的节点，打开示例就能直接看到画面
        const nodesOfDemo = next.files['1.0.0.1']?.nodes ?? []
        const firstVisual = nodesOfDemo.find((n) => (n.avatars && n.avatars.length) || n.stage?.bg)
        selectedId.value = firstVisual?.id || nodesOfDemo[0]?.id || ''
        playing.value = false
        issues.value = []
        await refreshAssetUrls()
        saveLocal()
        if (!silent) feedback.toast.success('示例已载入', '点「试跑」可以直接看播放效果')
    }

    /** 解析 hash 里的查询参数（支持 #/story?demo=1&tab=flow 这类深链） */
    function hashParams(): URLSearchParams {
        const h = window.location.hash
        const i = h.indexOf('?')
        return new URLSearchParams(i >= 0 ? h.slice(i + 1) : '')
    }

    const TAB_KEYS: StoryTab[] = ['preview', 'flow', 'table', 'assets', 'extra', 'lint']

    /** 初始化：读本地 + 保证至少一个段 + 载入资源 URL + 处理深链参数 */
    async function init() {
        loadLocal()
        ensureFirstFile()

        const params = hashParams()
        const tabParam = params.get('tab') as StoryTab | null
        if (tabParam && TAB_KEYS.includes(tabParam)) tab.value = tabParam

        // 空工程 + ?demo=1 → 直接载入示例，方便分享「打开就能看」的链接
        if (params.get('demo') === '1') {
            const empty = Object.values(project.value.files).every((f) => !(f.nodes || []).length)
            if (empty) await loadSample(true)
        }

        await refreshAssetUrls()
    }

    let saveTimer: number | null = null
    watch(
        project,
        () => {
            dirty.value = true
            if (saveTimer) window.clearTimeout(saveTimer)
            saveTimer = window.setTimeout(saveLocal, 800)
        },
        { deep: true },
    )

    return {
        // state
        project,
        currentFile,
        selectedId,
        tab,
        issues,
        dirty,
        lastSavedAt,
        playing,
        playAddr,
        playStage,
        assetUrls,
        // derived
        fileNames,
        segment,
        nodes,
        currentNode,
        usedKeys,
        errorCount,
        warnCount,
        columns,
        previewNode,
        // files
        ensureFirstFile,
        addFile,
        removeFile,
        selectFile,
        renameFileTitle,
        // nodes
        addNode,
        removeNode,
        moveNode,
        duplicateNode,
        changeNodeId,
        changeNodeType,
        // avatars / options
        avatarListOf,
        addAvatar,
        removeAvatar,
        addOption,
        removeOption,
        // lint
        runLint,
        selectIssue,
        // playback
        findNode,
        computeStageState,
        previewStageState,
        playFromSelection,
        playAdvance,
        refreshPlayStage,
        stopPlay,
        avatarPlans,
        // assets
        refreshAssetUrls,
        uploadAsset,
        uploadAssets,
        removeAsset,
        renameAsset,
        assetStats,
        // io
        exportZip,
        exportCurrentJson,
        importZip,
        importDialogueCsv,
        // persistence
        saveLocal,
        loadLocal,
        newProject,
        loadSample,
        init,
    }
})
