<script setup lang="ts">
/**
 * StoryFlow — 中栏「流程图」标签
 * 分层布局 + next/选项连线；选中「连线模式」后点目标节点即写入跳转地址（可跨段，跨段会标 ↗）。
 */
import { computed, ref } from 'vue'
import { Link, Minus, Plus, Route, X } from '@lucide/vue'
import { TYPE_LABEL, nextKeyInFile, nodeAddr, parseAddr } from '@/story/model'
import { useStoryStore } from '@/story/store'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

const store = useStoryStore()
const feedback = useFeedbackStore()

const NODE_W = 200
const NODE_H = 58
const GAP_X = 250
const GAP_Y = 96

const zoom = ref(1)
type LinkMode = { kind: 'next' } | { kind: 'option'; index: number } | null
const linkMode = ref<LinkMode>(null)

const nodes = computed(() => store.nodes)

const selectedOptions = computed(() => store.currentNode?.options || [])

/** 简化分层：按段内顺序起步，跳转目标至少排在来源之后 +1 列，迭代到收敛（带 guard） */
const layout = computed(() => {
    const list = nodes.value
    const depth = new Map<string, number>()
    list.forEach((n, i) => depth.set(n.id, i))

    let changed = true
    let guard = 0
    while (changed && guard++ < 50) {
        changed = false
        for (const n of list) {
            const targets: string[] = []
            if (n.next) targets.push(n.next)
            ;(n.options || []).forEach((o) => {
                if (o.next) targets.push(o.next)
            })
            for (const t of targets) {
                const p = parseAddr(t)
                if (!p || p.terminal || p.file !== store.currentFile || !p.key) continue
                if (!depth.has(p.key)) continue
                const want = (depth.get(n.id) || 0) + 1
                if ((depth.get(p.key) || 0) < want) {
                    depth.set(p.key, want)
                    changed = true
                }
            }
        }
    }

    const cols = new Map<number, number>()
    const pos = new Map<string, { x: number; y: number }>()
    for (const n of list) {
        const d = depth.get(n.id) || 0
        const r = cols.get(d) || 0
        cols.set(d, r + 1)
        pos.set(n.id, { x: 40 + d * GAP_X, y: 40 + r * GAP_Y })
    }
    const maxDepth = Math.max(0, ...Array.from(cols.keys()))
    const maxRows = Math.max(1, ...Array.from(cols.values()))
    return { pos, width: 120 + (maxDepth + 1) * GAP_X, height: 120 + maxRows * GAP_Y }
})

const edges = computed(() => {
    const out: {
        key: string
        x1: number
        y1: number
        x2: number
        y2: number
        label: string
        external: boolean
        option: boolean
        target: string
    }[] = []

    for (const n of nodes.value) {
        const from = layout.value.pos.get(n.id)
        if (!from) continue
        const push = (target: string | undefined, label: string, option: boolean) => {
            if (!target) return
            const p = parseAddr(target)
            const to = p && !p.terminal && p.file === store.currentFile && p.key ? layout.value.pos.get(p.key) : null
            out.push({
                key: `${n.id}-${label}-${target}`,
                x1: from.x + NODE_W - 10,
                y1: from.y + NODE_H / 2,
                x2: to ? to.x : from.x + NODE_W + 20,
                y2: to ? to.y + NODE_H / 2 : from.y + NODE_H / 2 + 40,
                label,
                external: !to,
                option,
                target,
            })
        }
        if (n.next) push(n.next, 'next', false)
        else {
            const nx = nextKeyInFile(store.segment, n.id)
            if (nx) push(nodeAddr(store.currentFile, nx), '顺序', false)
        }
        ;(n.options || []).forEach((o, i) => push(o.next, `选项${i + 1}`, true))
    }
    return out
})

function issueLevel(id: string): '' | 'error' | 'warn' {
    const hit = store.issues.find((i) => i.file === store.currentFile && i.nodeId === id)
    return hit ? hit.level : ''
}

/** 节点底/描边：直接用 CSS 变量，避免在模板里拼复杂类名 */
function rectFill(id: string): string {
    if (id === store.selectedId) return 'var(--s-accent-soft)'
    const level = issueLevel(id)
    if (level === 'error') return 'rgba(251,113,133,0.10)'
    if (level === 'warn') return 'rgba(251,191,36,0.10)'
    return 'var(--s-surface-2)'
}

function rectStroke(id: string): string {
    if (id === store.selectedId) return 'var(--s-accent)'
    const level = issueLevel(id)
    if (level === 'error') return 'var(--color-rose-glow)'
    if (level === 'warn') return 'var(--color-amber-glow)'
    return 'var(--s-line-strong)'
}

function posX(id: string): number {
    return layout.value.pos.get(id)?.x ?? 0
}

function posY(id: string): number {
    return layout.value.pos.get(id)?.y ?? 0
}

function clickNode(id: string) {
    const n = nodes.value.find((x) => x.id === id)
    if (!n) return
    if (!linkMode.value) {
        store.selectedId = id
        return
    }
    const addr = nodeAddr(store.currentFile, id)
    if (linkMode.value.kind === 'next') {
        n.next = addr
        feedback.toast.success(`已设置 ${n.id}.next = ${addr}`)
    } else {
        if (!n.options) return
        const o = n.options[linkMode.value.index]
        if (o) {
            o.next = addr
            feedback.toast.success(`已设置选项${linkMode.value.index + 1}.next = ${addr}`)
        }
    }
    linkMode.value = null
}

function jumpExternal(target: string) {
    const p = parseAddr(target)
    if (p && store.project.files[p.file]) {
        store.currentFile = p.file
        store.selectedId = p.key || ''
    }
}

const edgeColor = (e: { option: boolean; external: boolean }) =>
    e.option ? 'var(--color-phantom-300)' : e.external ? 'var(--color-amber-glow)' : 'var(--color-sky-glow)'
</script>

<template>
    <div class="flex h-full min-h-0 flex-col gap-3 p-3">
        <div class="flex flex-wrap items-center gap-2">
            <button
                class="btn btn-sm"
                :class="linkMode && linkMode.kind === 'next' ? 'btn-primary' : ''"
                type="button"
                @click="linkMode = { kind: 'next' }"
            >
                <Link :size="13" />
                连线：next
            </button>

            <template v-if="store.selectedId && selectedOptions.length">
                <span class="text-[11px] text-faint">为 {{ store.selectedId }} 的选项连线：</span>
                <button
                    v-for="(o, i) in selectedOptions"
                    :key="i"
                    class="btn btn-sm"
                    :class="linkMode && linkMode.kind === 'option' && linkMode.index === i ? 'btn-primary' : ''"
                    type="button"
                    @click="linkMode = { kind: 'option', index: i }"
                >
                    选项{{ i + 1 }}
                </button>
            </template>

            <UiBadge v-if="linkMode" tone="warn">
                <Route :size="11" />
                连线模式：点击目标节点即可写入
                <button class="ml-1 cursor-pointer underline" type="button" @click="linkMode = null">取消</button>
            </UiBadge>

            <div class="ml-auto flex items-center gap-1">
                <button class="btn btn-sm btn-icon" type="button" title="缩小" @click="zoom = Math.max(0.5, zoom - 0.1)">
                    <Minus :size="13" />
                </button>
                <span class="tabular w-10 text-center text-[11px] text-muted">{{ (zoom * 100).toFixed(0) }}%</span>
                <button class="btn btn-sm btn-icon" type="button" title="放大" @click="zoom = Math.min(1.6, zoom + 0.1)">
                    <Plus :size="13" />
                </button>
            </div>
        </div>

        <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-line bg-surface-2/40 p-3">
            <UiEmpty v-if="!nodes.length" title="当前段没有节点" hint="先在左侧新增节点，流程图会自动分层排布。" compact />

            <div v-else :style="{ width: `${layout.width * zoom}px`, height: `${layout.height * zoom}px` }">
                <svg
                    :width="layout.width"
                    :height="layout.height"
                    :viewBox="`0 0 ${layout.width} ${layout.height}`"
                    :style="{ transform: `scale(${zoom})`, transformOrigin: 'top left' }"
                >
                    <defs>
                        <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                        </marker>
                    </defs>

                    <g v-for="e in edges" :key="e.key" :color="edgeColor(e)">
                        <line
                            :x1="e.x1"
                            :y1="e.y1"
                            :x2="e.x2"
                            :y2="e.y2"
                            :stroke="edgeColor(e)"
                            :stroke-width="1.6"
                            :stroke-dasharray="e.option ? '6,4' : ''"
                            marker-end="url(#flow-arrow)"
                        />
                        <text
                            :x="(e.x1 + e.x2) / 2"
                            :y="(e.y1 + e.y2) / 2 - 6"
                            class="fill-[var(--s-text-muted)] text-[10px]"
                            :class="e.external ? 'cursor-pointer' : ''"
                            text-anchor="middle"
                            @click="e.external && jumpExternal(e.target)"
                        >
                            {{ e.label }}{{ e.external ? ` ↗${e.target}` : '' }}
                        </text>
                    </g>

                    <g v-for="n in nodes" :key="n.id" class="cursor-pointer" @click="clickNode(n.id)">
                        <rect
                            :x="posX(n.id)"
                            :y="posY(n.id)"
                            :width="NODE_W"
                            :height="NODE_H"
                            rx="10"
                            :fill="rectFill(n.id)"
                            :stroke="rectStroke(n.id)"
                            stroke-width="1.4"
                        />
                        <text :x="posX(n.id) + 12" :y="posY(n.id) + 23" class="fill-[var(--s-text)] text-[12px] font-medium">
                            {{ n.id }} · {{ TYPE_LABEL[n.type] || n.type }}
                        </text>
                        <text :x="posX(n.id) + 12" :y="posY(n.id) + 43" class="fill-[var(--s-text-muted)] text-[11px]">
                            {{ (n.text || '（空文本）').slice(0, 16) }}
                        </text>
                        <circle
                            v-if="(n.options || []).length"
                            :cx="posX(n.id) + NODE_W - 14"
                            :cy="posY(n.id) + 14"
                            r="4"
                            fill="var(--color-phantom-300)"
                        />
                    </g>
                </svg>
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-[11px] text-muted">
            <span class="flex items-center gap-1.5"><span class="h-0.5 w-6 rounded-full bg-sky-glow" />next / 顺序</span>
            <span class="flex items-center gap-1.5"><span class="h-0.5 w-6 rounded-full border-t border-dashed border-phantom-300" />选项连线</span>
            <span class="flex items-center gap-1.5"><span class="h-0.5 w-6 rounded-full bg-amber-glow" />跨段跳转（点标签可跳过去）</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-xs border border-rose-glow" />校验错误</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-xs border border-amber-glow" />校验警告</span>
            <span v-if="linkMode" class="flex items-center gap-1 text-amber-glow">
                <X :size="11" />连线模式下点击节点会改写地址，不会切换选中
            </span>
        </div>
    </div>
</template>
