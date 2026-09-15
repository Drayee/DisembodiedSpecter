<script setup lang="ts">
/** UiPagination — 分页器：与后端 page/page_size 约定一致（page 从 1 开始） */
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = withDefaults(
    defineProps<{
        page: number
        pageSize: number
        total: number
        pageSizeOptions?: number[]
    }>(),
    { pageSizeOptions: () => [10, 20, 50, 100] },
)

const emit = defineEmits<{
    (e: 'update:page', value: number): void
    (e: 'update:pageSize', value: number): void
}>()

const pageCount = computed(() => Math.max(1, Math.ceil((props.total || 0) / Math.max(1, props.pageSize))))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.total, props.page * props.pageSize))

/** 页码窗口：始终显示首尾 + 当前附近，中间用省略号 */
const pages = computed<(number | '…')[]>(() => {
    const last = pageCount.value
    const cur = props.page
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
    const out: (number | '…')[] = [1]
    const start = Math.max(2, cur - 1)
    const end = Math.min(last - 1, cur + 1)
    if (start > 2) out.push('…')
    for (let i = start; i <= end; i++) out.push(i)
    if (end < last - 1) out.push('…')
    out.push(last)
    return out
})

function go(p: number) {
    const next = Math.min(Math.max(1, p), pageCount.value)
    if (next !== props.page) emit('update:page', next)
}
</script>

<template>
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5">
        <div class="flex items-center gap-3 text-xs text-muted">
            <span class="tabular">共 {{ total }} 条 · {{ from }}-{{ to }}</span>
            <select
                class="select w-auto py-1 text-xs"
                :value="pageSize"
                @change="emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
            >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">每页 {{ size }}</option>
            </select>
        </div>

        <div class="flex items-center gap-1">
            <button class="btn btn-ghost btn-sm" type="button" :disabled="page <= 1" @click="go(page - 1)">
                <ChevronLeft :size="14" />
            </button>
            <template v-for="(p, i) in pages" :key="`${p}-${i}`">
                <span v-if="p === '…'" class="px-1 text-xs text-faint">…</span>
                <button
                    v-else
                    type="button"
                    class="btn btn-sm min-w-8 tabular"
                    :class="p === page ? 'btn-primary' : 'btn-ghost'"
                    @click="go(p as number)"
                >
                    {{ p }}
                </button>
            </template>
            <button class="btn btn-ghost btn-sm" type="button" :disabled="page >= pageCount" @click="go(page + 1)">
                <ChevronRight :size="14" />
            </button>
        </div>
    </div>
</template>
