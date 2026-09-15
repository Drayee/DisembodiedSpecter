<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * UiDataTable — 通用数据表格
 * 约定：列的渲染交给具名插槽 `cell-<key>`，没有插槽则按 `row[key]` 原样输出。
 * 表格自身只负责：吸顶表头、加载态、空态、横向滚动、行点击、行高一致。
 */
import { LoaderCircle } from '@lucide/vue'

export interface TableColumn {
    key: string
    title: string
    width?: string
    align?: 'left' | 'center' | 'right'
    mono?: boolean
    /** 数值列使用等宽数字，避免抖动 */
    numeric?: boolean
}

const props = withDefaults(
    defineProps<{
        columns: TableColumn[]
        rows: T[]
        loading?: boolean
        emptyText?: string
        emptyHint?: string
        rowKey?: (row: T) => string | number
        clickable?: boolean
    }>(),
    {
        loading: false,
        emptyText: '暂无数据',
        emptyHint: '',
        rowKey: undefined,
        clickable: false,
    },
)

const emit = defineEmits<{ (e: 'row-click', row: T, index: number): void }>()

function keyOf(row: T, index: number): string | number {
    return props.rowKey ? props.rowKey(row) : index
}

function alignClass(col: TableColumn): string {
    if (col.align === 'right') return 'text-right'
    if (col.align === 'center') return 'text-center'
    return 'text-left'
}
</script>

<template>
    <div class="relative min-h-0 flex-1 overflow-auto">
        <table class="data-table">
            <thead>
                <tr>
                    <th
                        v-for="col in columns"
                        :key="col.key"
                        :style="col.width ? { width: col.width } : undefined"
                        :class="alignClass(col)"
                    >
                        {{ col.title }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="loading" class="pointer-events-none">
                    <td :colspan="columns.length" class="py-10 text-center">
                        <span class="inline-flex items-center gap-2 text-xs text-muted">
                            <LoaderCircle :size="15" class="animate-spin" />
                            加载中…
                        </span>
                    </td>
                </tr>

                <tr v-else-if="!rows.length">
                    <td :colspan="columns.length" class="p-0">
                        <div class="empty-state">
                            <slot name="empty">
                                <span class="text-sm text-soft">{{ emptyText }}</span>
                                <span v-if="emptyHint" class="text-xs text-faint">{{ emptyHint }}</span>
                            </slot>
                        </div>
                    </td>
                </tr>

                <tr
                    v-for="(row, index) in rows"
                    v-else
                    :key="keyOf(row, index)"
                    :class="clickable ? 'cursor-pointer' : ''"
                    @click="emit('row-click', row, index)"
                >
                    <td
                        v-for="col in columns"
                        :key="col.key"
                        :class="[alignClass(col), col.mono ? 'font-mono text-xs' : '', col.numeric ? 'tabular' : '']"
                    >
                        <slot :name="`cell-${col.key}`" :row="row" :index="index" :value="row[col.key]">
                            {{ row[col.key] }}
                        </slot>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
