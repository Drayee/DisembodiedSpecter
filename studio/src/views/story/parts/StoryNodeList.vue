<script setup lang="ts">
/**
 * StoryNodeList — 左栏：段内节点列表
 * 支持点击选中、拖拽排序、上移/下移/复制/删除，以及按 5 种类型新增节点。
 */
import { computed, ref } from 'vue'
import {
    ArrowDown,
    ArrowUp,
    Copy,
    FileText,
    GripVertical,
    Layers,
    ListTree,
    Plus,
    Trash,
} from '@lucide/vue'
import { TYPE_LABEL, NODE_TYPES } from '@/story/model'
import { useStoryStore } from '@/story/store'
import type { StoryNodeType } from '@/story/types'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

const store = useStoryStore()

const dragIndex = ref(-1)
const overIndex = ref(-1)

const typeTone: Record<StoryNodeType, 'accent' | 'default' | 'ok' | 'warn' | 'info'> = {
    dialogue: 'accent',
    narration: 'default',
    choice: 'info',
    stage: 'ok',
    action: 'warn',
}

/** 节点首行摘要：让列表一眼能看出内容 */
function summary(text: string | undefined, max = 34): string {
    const s = (text || '').replace(/\s+/g, ' ').trim()
    if (!s) return '（空文本）'
    return s.length > max ? s.slice(0, max) + '…' : s
}

function addNode(type: StoryNodeType) {
    store.addNode(type)
}

function onDragStart(index: number) {
    dragIndex.value = index
}

function onDragOver(index: number) {
    overIndex.value = index
}

function onDrop(index: number) {
    const from = dragIndex.value
    dragIndex.value = -1
    overIndex.value = -1
    if (from < 0 || from === index) return
    const seg = store.segment
    if (!seg) return
    const [n] = seg.nodes.splice(from, 1)
    seg.nodes.splice(index, 0, n)
}

const speakingCount = computed(() => store.nodes.filter((n) => n.type === 'dialogue').length)
</script>

<template>
    <div class="panel h-full rounded-none border-0 border-r border-line bg-transparent">
        <div class="panel-header flex-col items-stretch gap-2">
            <div class="flex items-center gap-2">
                <h3 class="panel-title">
                    <ListTree :size="15" class="text-phantom-200" />
                    节点
                </h3>
                <span class="tabular text-[11px] text-faint">{{ store.nodes.length }} 个 · {{ speakingCount }} 句对白</span>
            </div>
            <div class="flex flex-wrap gap-1">
                <button
                    v-for="t in NODE_TYPES"
                    :key="t"
                    class="btn btn-sm"
                    type="button"
                    :title="`新增${TYPE_LABEL[t]}节点`"
                    @click="addNode(t)"
                >
                    <Plus :size="12" />
                    {{ TYPE_LABEL[t] }}
                </button>
            </div>
        </div>

        <div class="panel-body-tight">
            <UiEmpty
                v-if="!store.nodes.length"
                title="这一段还没有节点"
                hint="用上方按钮新增一个「对白」开始编排；节点顺序即默认推进顺序。"
                compact
            >
                <template #icon><FileText :size="22" /></template>
            </UiEmpty>

            <ul v-else class="flex flex-col gap-1">
                <li
                    v-for="(node, index) in store.nodes"
                    :key="node.id"
                    draggable="true"
                    class="group cursor-pointer rounded-sm border px-2 py-2 transition-colors duration-100"
                    :class="[
                        node.id === store.selectedId ? 'border-accent-line bg-accent-soft' : 'border-transparent hover:bg-surface-3',
                        overIndex === index && dragIndex >= 0 && dragIndex !== index ? 'border-t-2 border-t-accent' : '',
                    ]"
                    @click="store.selectedId = node.id"
                    @dragstart="onDragStart(index)"
                    @dragover.prevent="onDragOver(index)"
                    @drop.prevent="onDrop(index)"
                    @dragend="dragIndex = -1"
                >
                    <div class="flex items-center gap-2">
                        <GripVertical :size="13" class="shrink-0 cursor-grab text-faint opacity-0 group-hover:opacity-100" />
                        <span class="tabular w-6 shrink-0 text-[11px] text-faint">#{{ index + 1 }}</span>
                        <span class="truncate font-mono text-[12px] text-soft" :title="node.id">{{ node.id }}</span>
                        <UiBadge :tone="typeTone[node.type]">{{ TYPE_LABEL[node.type] }}</UiBadge>
                        <span class="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button class="btn btn-ghost btn-icon" type="button" title="上移" @click.stop="store.moveNode(node.id, -1)">
                                <ArrowUp :size="12" />
                            </button>
                            <button class="btn btn-ghost btn-icon" type="button" title="下移" @click.stop="store.moveNode(node.id, 1)">
                                <ArrowDown :size="12" />
                            </button>
                            <button class="btn btn-ghost btn-icon" type="button" title="复制" @click.stop="store.duplicateNode(node.id)">
                                <Copy :size="12" />
                            </button>
                            <button class="btn btn-ghost btn-icon" type="button" title="删除" @click.stop="store.removeNode(node.id)">
                                <Trash :size="12" />
                            </button>
                        </span>
                    </div>

                    <p class="mt-1 pl-[46px] text-[12px] leading-snug text-muted">
                        <span v-if="node.type === 'dialogue' && node.speaker" class="text-phantom-200">{{ node.speaker }}：</span>
                        {{ summary(node.text) }}
                    </p>

                    <p v-if="node.next" class="mt-0.5 pl-[46px] font-mono text-[10px] text-faint">→ {{ node.next }}</p>
                    <p v-else-if="node.options && node.options.length" class="mt-0.5 pl-[46px] font-mono text-[10px] text-faint">
                        <Layers :size="10" class="mr-1 inline" />{{ node.options.length }} 个分支
                    </p>
                </li>
            </ul>
        </div>
    </div>
</template>
