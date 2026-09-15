<script setup lang="ts">
/**
 * StoryTable — 中栏「表格」标签：批量改台词
 * 直接在表格里改文本/说话人/去向，右侧可导出/导入 CSV（列：addr,type,speaker,text）。
 */
import { computed, ref } from 'vue'
import { Download, Search, Table as TableIcon, Upload } from '@lucide/vue'
import { TYPE_LABEL } from '@/story/model'
import { useStoryStore } from '@/story/store'
import { useFeedbackStore } from '@/stores/feedback'
import { csvOf, downloadText, parseCsv } from '@/story/io'
import type { StoryNode, StoryNodeType } from '@/story/types'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'

const store = useStoryStore()
const feedback = useFeedbackStore()

const filter = ref<'all' | StoryNodeType>('all')
const keyword = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const typeFilters = [
    { value: 'all', label: '全部' },
    { value: 'dialogue', label: TYPE_LABEL.dialogue },
    { value: 'narration', label: TYPE_LABEL.narration },
    { value: 'choice', label: TYPE_LABEL.choice },
    { value: 'stage', label: TYPE_LABEL.stage },
    { value: 'action', label: TYPE_LABEL.action },
]

const rows = computed(() =>
    store.nodes
        .map((n, index) => ({ node: n, index }))
        .filter(({ node }) => filter.value === 'all' || node.type === filter.value)
        .filter(({ node }) => {
            const kw = keyword.value.trim()
            if (!kw) return true
            return (node.text || '').includes(kw) || (node.speaker || '').includes(kw) || node.id.includes(kw)
        }),
)

function exportCsv() {
    const data = store.nodes.map((n) => ({
        addr: `${store.currentFile}.${n.id}`,
        file: store.currentFile,
        id: n.id,
        type: n.type,
        speaker: n.speaker || '',
        text: n.text || '',
        next: n.next || '',
    }))
    downloadText(csvOf(data), `${store.currentFile || 'segment'}-dialogue.csv`, 'text/csv;charset=utf-8')
    feedback.toast.success('已导出本段台词表', `${data.length} 行`)
}

function pickCsv() {
    fileInput.value?.click()
}

async function onCsvPicked(ev: Event) {
    const input = ev.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const text = await file.text()
    const n = store.importDialogueCsv(text)
    if (n === 0) {
        // 给一个可操作的提示：列出期望的列名
        const head = parseCsv(text)[0]
        feedback.toast.warning('未匹配到节点', head ? `CSV 列：${Object.keys(head).join(', ')}（需要 addr 或 file+id 列）` : 'CSV 为空')
    }
}

function jump(index: number) {
    store.selectedId = store.nodes[index]?.id || ''
    store.tab = 'preview'
}

/**
 * 表格里的舞台字段是三态的：空 = 保持上一幕（删字段）、`-` = 本幕隐藏（空串）、其它 = 指定资源 key。
 * 展示时把空串渲染成 `-`，让「隐藏」这个状态可见。
 */
function stageDisplay(node: StoryNode, field: 'bg' | 'cg'): string {
    const v = node.stage?.[field]
    if (v === undefined || v === null) return ''
    return v === '' ? '-' : v
}

function setStageField(node: StoryNode, field: 'bg' | 'cg', raw: string) {
    if (!node.stage) node.stage = {}
    const v = raw.trim()
    if (v === '') delete node.stage[field]
    else if (v === '-') node.stage[field] = ''
    else node.stage[field] = v
}
</script>

<template>
    <div class="flex h-full min-h-0 flex-col gap-3 p-3">
        <div class="flex flex-wrap items-center gap-2">
            <UiSegmented v-model="filter" :options="typeFilters" />
            <span class="relative flex items-center">
                <Search :size="14" class="pointer-events-none absolute left-2.5 text-faint" />
                <input v-model="keyword" class="input w-52 py-1 pl-8 text-xs" placeholder="搜索文本 / 说话人 / id" />
            </span>

            <div class="ml-auto flex items-center gap-2">
                <button class="btn btn-sm" type="button" @click="exportCsv">
                    <Download :size="13" />导出 CSV
                </button>
                <button class="btn btn-sm" type="button" @click="pickCsv">
                    <Upload :size="13" />导入 CSV
                </button>
                <input ref="fileInput" class="hidden" type="file" accept=".csv,text/csv" @change="onCsvPicked" />
            </div>
        </div>

        <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
            <UiEmpty v-if="!rows.length" title="没有匹配的节点" hint="换个类型筛选或清空搜索关键字。" compact />
            <table v-else class="data-table">
                <thead>
                    <tr>
                        <th style="width: 52px">#</th>
                        <th style="width: 90px">id</th>
                        <th style="width: 84px">类型</th>
                        <th style="width: 130px">说话人</th>
                        <th>文本</th>
                        <th style="width: 170px">去向 next</th>
                        <th style="width: 150px">舞台 bg / cg</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="{ node, index } in rows" :key="node.id" :class="node.id === store.selectedId ? 'bg-accent-soft' : ''">
                        <td class="tabular text-faint">
                            <button class="cursor-pointer hover:text-soft" type="button" :title="'跳到预览'" @click="jump(index)">
                                {{ index + 1 }}
                            </button>
                        </td>
                        <td class="font-mono text-xs text-soft">{{ node.id }}</td>
                        <td><UiBadge>{{ TYPE_LABEL[node.type] }}</UiBadge></td>
                        <td>
                            <input
                                v-if="node.type === 'dialogue'"
                                v-model="node.speaker"
                                class="input py-1 text-xs"
                                placeholder="说话人"
                                @focus="store.selectedId = node.id"
                            />
                            <span v-else class="text-faint">—</span>
                        </td>
                        <td>
                            <textarea
                                v-if="node.type !== 'action'"
                                v-model="node.text"
                                class="textarea min-h-[38px] py-1 text-xs"
                                rows="1"
                                placeholder="文本"
                                @focus="store.selectedId = node.id"
                            />
                            <span v-else class="font-mono text-xs text-faint">action: {{ node.action || 'end' }}</span>
                        </td>
                        <td>
                            <input
                                v-model="node.next"
                                class="input input-mono py-1 text-[11px]"
                                placeholder="留空=顺序"
                                @focus="store.selectedId = node.id"
                            />
                        </td>
                        <td class="space-y-1">
                            <input
                                :value="stageDisplay(node, 'bg')"
                                class="input input-mono py-1 text-[11px]"
                                placeholder="bg：空=保持"
                                @focus="store.selectedId = node.id"
                                @change="setStageField(node, 'bg', ($event.target as HTMLInputElement).value)"
                            />
                            <input
                                :value="stageDisplay(node, 'cg')"
                                class="input input-mono py-1 text-[11px]"
                                placeholder="cg：空=保持"
                                @focus="store.selectedId = node.id"
                                @change="setStageField(node, 'cg', ($event.target as HTMLInputElement).value)"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p class="flex items-center gap-2 text-[11px] text-faint">
            <TableIcon :size="12" />
            表格改动即时写回工程（自动保存到 localStorage）。bg/cg 三态：<code class="font-mono">空</code>=保持上一幕、
            <code class="font-mono">-</code>=本幕隐藏、<code class="font-mono">key</code>=指定资源。导入 CSV 需要
            <code class="font-mono">addr</code> 或 <code class="font-mono">file</code>+<code class="font-mono">id</code> 列定位节点，可选 speaker / text 列。
        </p>
    </div>
</template>
