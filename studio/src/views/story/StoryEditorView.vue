<script setup lang="ts">
/**
 * StoryEditorView — 剧情编排工作台
 * 结构：顶部工具栏（段管理 + 工程操作） / 中部标签栏 / 三栏工作区（节点列表 · 工作区 · 属性面板）
 * 布局要点：整体 h-full + flex，中部 min-h-0 flex-1，左右两栏用可拖拽分隔条调宽，
 * 每个面板自带滚动，绝不出现面板互相覆盖。
 */
import { computed, onMounted, ref } from 'vue'
import {
    BookOpen,
    CircleAlert,
    Download,
    FileCode,
    FolderOpen,
    Image as ImageIcon,
    Play,
    Plus,
    RefreshCw,
    Route,
    ScrollText,
    ShieldCheck,
    Sparkles,
    Table as TableIcon,
    Trash,
    Upload,
} from '@lucide/vue'
import { isLegalFile } from '@/story/model'
import { useStoryStore, type StoryTab } from '@/story/store'
import { useFeedbackStore } from '@/stores/feedback'
import type { TabOption } from '@/components/ui/types'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiSplitter from '@/components/ui/UiSplitter.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import UiTabs from '@/components/ui/UiTabs.vue'
import StoryNodeList from './parts/StoryNodeList.vue'
import StoryInspector from './parts/StoryInspector.vue'
import StoryPreview from './parts/StoryPreview.vue'
import StoryFlow from './parts/StoryFlow.vue'
import StoryTable from './parts/StoryTable.vue'
import StoryAssets from './parts/StoryAssets.vue'
import StoryExtra from './parts/StoryExtra.vue'
import StoryLint from './parts/StoryLint.vue'

const store = useStoryStore()
const feedback = useFeedbackStore()

// ==================== 面板宽度（记忆到 localStorage） ====================

const WIDTH_KEY = 'ds-studio.story.widths'

function loadWidths(): { left: number; right: number } {
    try {
        const raw = localStorage.getItem(WIDTH_KEY)
        if (raw) {
            const v = JSON.parse(raw)
            return { left: Number(v.left) || 290, right: Number(v.right) || 360 }
        }
    } catch {
        /* ignore */
    }
    return { left: 290, right: 360 }
}

const initialWidths = loadWidths()
const leftWidth = ref(initialWidths.left)
const rightWidth = ref(initialWidths.right)

function persistWidths() {
    try {
        localStorage.setItem(WIDTH_KEY, JSON.stringify({ left: leftWidth.value, right: rightWidth.value }))
    } catch {
        /* ignore */
    }
}

const zipInput = ref<HTMLInputElement | null>(null)

// ==================== 段管理 ====================

const newFileModal = ref({ open: false, name: '', title: '' })

/** 依据现有段名猜一个下一个段号：1.0.0.1 → 1.0.0.2 */
function suggestFileName(): string {
    const names = store.fileNames.filter(isLegalFile)
    if (!names.length) return '1.0.0.1'
    const last = names
        .map((n) => n.split('.').map(Number))
        .sort((a, b) => a[3] - b[3])
        .pop()
    if (!last) return '1.0.0.1'
    return `${last[0]}.${last[1]}.${last[2]}.${last[3] + 1}`
}

function openNewFile() {
    newFileModal.value = { open: true, name: suggestFileName(), title: '' }
}

function submitNewFile() {
    const name = newFileModal.value.name.trim()
    if (!name) return
    if (!isLegalFile(name)) {
        feedback.toast.error('段文件名格式不对', '需要「篇.章.片.段」四段数字，例如 1.0.0.2')
        return
    }
    store.addFile(name, newFileModal.value.title.trim())
    newFileModal.value.open = false
}

// ==================== 导出 / 导入 ====================

const exportModal = ref({
    open: false,
    projectName: 'story',
    includeAssets: true,
    includeManifest: true,
    includeDialogue: true,
})

function openExport() {
    exportModal.value = { ...exportModal.value, open: true }
}

async function submitExport() {
    const opts = {
        projectName: exportModal.value.projectName.trim() || 'story',
        includeAssets: exportModal.value.includeAssets,
        includeManifest: exportModal.value.includeManifest,
        includeDialogue: exportModal.value.includeDialogue,
    }
    exportModal.value.open = false
    await store.exportZip(opts)
}

function pickZip() {
    zipInput.value?.click()
}

async function onZipPicked(ev: Event) {
    const input = ev.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const ok = await feedback.confirm({
        title: `导入 ${file.name}？`,
        message: '同名段会被包内文件覆盖（资源库为增量合并，不会清空原有资源）。',
        confirmText: '导入',
    })
    if (!ok) return
    await store.importZip(file, true)
}

// ==================== 标签 ====================

const tabs = computed<TabOption[]>(() => [
    { key: 'preview', label: '预览', icon: Play },
    { key: 'flow', label: '流程图', icon: Route },
    { key: 'table', label: '表格', icon: TableIcon },
    { key: 'assets', label: '资源库', icon: ImageIcon, count: Object.keys(store.project.assets || {}).length },
    { key: 'extra', label: '词典·物品', icon: BookOpen },
    {
        key: 'lint',
        label: '校验',
        icon: CircleAlert,
        count: store.issues.length,
        tone: store.errorCount ? 'danger' : store.warnCount ? 'warn' : 'default',
    },
])

const tabComponents: Record<StoryTab, unknown> = {
    preview: StoryPreview,
    flow: StoryFlow,
    table: StoryTable,
    assets: StoryAssets,
    extra: StoryExtra,
    lint: StoryLint,
}

const currentTab = computed(() => tabComponents[store.tab] || StoryPreview)

onMounted(async () => {
    await store.init()
})
</script>

<template>
    <div class="flex h-full min-h-0 flex-col">
        <!-- 工具栏 -->
        <header class="flex shrink-0 flex-col gap-2.5 border-b border-line px-4 py-3">
            <div class="flex flex-wrap items-center gap-2">
                <span class="flex items-center gap-1.5 text-[13px] font-semibold text-strong">
                    <ScrollText :size="15" class="text-phantom-200" />
                    剧情编排
                </span>

                <span class="toolbar-sep" />

                <select
                    class="select w-40 py-1 text-xs"
                    :value="store.currentFile"
                    @change="store.selectFile(($event.target as HTMLSelectElement).value)"
                >
                    <option v-for="name in store.fileNames" :key="name" :value="name">{{ name }}</option>
                    <option v-if="!store.fileNames.length" value="">（还没有段）</option>
                </select>

                <input
                    v-if="store.segment"
                    class="input w-40 py-1 text-xs"
                    placeholder="段标题（作者备注）"
                    :value="store.segment.meta?.title || ''"
                    @change="store.renameFileTitle(store.currentFile, ($event.target as HTMLInputElement).value)"
                />

                <button class="btn btn-sm" type="button" @click="openNewFile"><Plus :size="13" />新建段</button>
                <button
                    class="btn btn-sm btn-danger"
                    type="button"
                    :disabled="!store.segment"
                    @click="store.removeFile(store.currentFile)"
                >
                    <Trash :size="13" />删除段
                </button>

                <div class="ml-auto flex flex-wrap items-center gap-2">
                    <span class="hidden items-center gap-1.5 text-[11px] text-faint xl:flex">
                        <ShieldCheck :size="12" />
                        {{ store.dirty ? '有未保存改动…' : store.lastSavedAt ? `已自动保存 ${store.lastSavedAt}` : '尚未保存' }}
                    </span>

                    <button class="btn btn-sm" type="button" @click="store.loadSample()"><Sparkles :size="13" />载入示例</button>
                    <button class="btn btn-sm" type="button" @click="store.newProject()"><FileCode :size="13" />新建工程</button>
                    <button class="btn btn-sm" type="button" @click="pickZip"><Upload :size="13" />导入 zip</button>
                    <input ref="zipInput" class="hidden" type="file" accept=".zip,application/zip" @change="onZipPicked" />

                    <button class="btn btn-sm" type="button" :disabled="!store.segment" @click="store.exportCurrentJson()">
                        <FolderOpen :size="13" />导出本段
                    </button>
                    <button class="btn btn-sm btn-primary" type="button" @click="openExport">
                        <Download :size="13" />导出 zip
                    </button>
                    <button class="btn btn-sm" type="button" @click="store.runLint()">
                        <RefreshCw :size="13" />校验
                    </button>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <UiTabs :model-value="store.tab" :tabs="tabs" @update:model-value="store.tab = $event as StoryTab" />
                <div class="ml-auto flex flex-wrap items-center gap-2">
                    <UiBadge tone="default">{{ store.fileNames.length }} 段 · {{ store.nodes.length }} 节点</UiBadge>
                    <UiBadge v-if="store.errorCount" tone="danger">{{ store.errorCount }} 个错误</UiBadge>
                    <UiBadge v-if="store.warnCount" tone="warn">{{ store.warnCount }} 个警告</UiBadge>
                    <UiBadge v-if="store.playing" tone="ok" dot>{{ store.playAddr }}</UiBadge>
                </div>
            </div>
        </header>

        <!-- 三栏工作区 -->
        <div class="flex min-h-0 flex-1">
            <aside class="min-h-0 shrink-0" :style="{ width: `${leftWidth}px` }">
                <StoryNodeList />
            </aside>

            <UiSplitter v-model="leftWidth" :min="220" :max="460" @update:model-value="persistWidths" />

            <section class="flex min-h-0 min-w-0 flex-1 flex-col">
                <UiEmpty
                    v-if="!store.fileNames.length"
                    title="还没有任何剧情段"
                    hint="点工具栏「新建段」创建 1.0.0.1，或用「导入 zip」载入既有剧情包。"
                >
                    <template #action>
                        <button class="btn btn-primary btn-sm" type="button" @click="openNewFile"><Plus :size="13" />新建段</button>
                    </template>
                </UiEmpty>

                <KeepAlive v-else>
                    <component :is="currentTab" />
                </KeepAlive>
            </section>

            <UiSplitter v-model="rightWidth" :min="300" :max="600" reverse @update:model-value="persistWidths" />

            <aside class="min-h-0 shrink-0" :style="{ width: `${rightWidth}px` }">
                <StoryInspector />
            </aside>
        </div>

        <!-- 新建段 -->
        <UiModal
            :open="newFileModal.open"
            title="新建剧情段"
            description="段文件名必须符合「篇.章.片.段」四段数字，它直接决定导出路径 story/data/{文件名}.json。"
            width="440px"
            @close="newFileModal.open = false"
        >
            <div class="flex flex-col gap-4">
                <UiField label="段文件名" required hint="例：1.0.0.2 表示主线第 1 篇第 2 段；0.1.0.1 表示第 1 号支线。">
                    <input v-model="newFileModal.name" class="input input-mono" placeholder="1.0.0.2" @keydown.enter="submitNewFile" />
                </UiField>
                <UiField label="段标题" hint="仅作作者备注，不影响引擎解析。">
                    <input v-model="newFileModal.title" class="input" placeholder="如：古木之下" @keydown.enter="submitNewFile" />
                </UiField>
            </div>
            <template #footer>
                <button class="btn" type="button" @click="newFileModal.open = false">取消</button>
                <button class="btn btn-primary" type="button" @click="submitNewFile"><Plus :size="14" />创建</button>
            </template>
        </UiModal>

        <!-- 导出 zip -->
        <UiModal
            :open="exportModal.open"
            title="导出剧情包"
            description="生成可直接覆盖到 front/assets/resources/story/ 的 zip。"
            width="540px"
            @close="exportModal.open = false"
        >
            <div class="flex flex-col gap-4">
                <UiField label="包名" hint="下载文件名将是 {包名}.zip">
                    <input v-model="exportModal.projectName" class="input" placeholder="story" />
                </UiField>

                <div class="flex flex-col gap-3 rounded-sm border border-line bg-surface-2 p-3.5">
                    <UiSwitch v-model="exportModal.includeAssets" label="打包 story/image/{key}/* 资源图片" />
                    <UiSwitch v-model="exportModal.includeManifest" label="附带 assets-manifest.csv（美术清单）" />
                    <UiSwitch v-model="exportModal.includeDialogue" label="附带 dialogue-list.csv（本地化 / 配音台词表）" />
                </div>

                <p class="field-hint">
                    包内结构：<code class="font-mono">story/data/*.json</code> · <code class="font-mono">story/image/{key}/*</code> ·
                    可选两份 CSV。引擎按 <code class="font-mono">story/image/{key}/spriteFrame</code> 加载，所以一个 key 只放一张图。
                </p>
            </div>
            <template #footer>
                <button class="btn" type="button" @click="exportModal.open = false">取消</button>
                <button class="btn btn-primary" type="button" @click="submitExport"><Download :size="14" />导出</button>
            </template>
        </UiModal>
    </div>
</template>
