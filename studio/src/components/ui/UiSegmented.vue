<script setup lang="ts">
/** UiSegmented — 分段控件；比下拉更直观，适合 3~5 个互斥选项 */
export interface SegmentOption {
    value: string
    label: string
    /** lucide 图标组件（可选） */
    icon?: unknown
    /** 右上角计数 */
    count?: number
}

defineProps<{ modelValue: string; options: SegmentOption[]; disabled?: boolean }>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
    <div class="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-surface-2 p-1">
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            class="relative inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed"
            :class="opt.value === modelValue ? 'bg-accent-soft text-phantom-200 shadow-xs' : 'text-muted hover:bg-surface-3 hover:text-soft'"
            :disabled="disabled"
            @click="emit('update:modelValue', opt.value)"
        >
            <component :is="opt.icon" v-if="opt.icon" :size="14" />
            <span>{{ opt.label }}</span>
            <span v-if="typeof opt.count === 'number'" class="tabular rounded-xs bg-surface-3 px-1 text-[10px] text-muted">
                {{ opt.count }}
            </span>
        </button>
    </div>
</template>
