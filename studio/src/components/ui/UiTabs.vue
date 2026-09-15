<script setup lang="ts">
/** UiTabs — 标签栏（不含内容区，内容由父级决定） */
export interface TabOption {
    key: string
    label: string
    icon?: unknown
    count?: number
    tone?: 'default' | 'warn' | 'danger'
}

defineProps<{ modelValue: string; tabs: TabOption[] }>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
    <div class="flex shrink-0 items-center gap-1 overflow-x-auto no-scrollbar">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="tab"
            :class="tab.key === modelValue ? 'tab-active' : ''"
            @click="emit('update:modelValue', tab.key)"
        >
            <span class="inline-flex items-center gap-1.5">
                <component :is="tab.icon" v-if="tab.icon" :size="14" />
                {{ tab.label }}
                <span
                    v-if="typeof tab.count === 'number'"
                    class="tabular rounded-xs px-1 text-[10px]"
                    :class="{
                        'bg-surface-3 text-muted': tab.tone === 'default' || !tab.tone,
                        'bg-amber-glow/15 text-amber-glow': tab.tone === 'warn',
                        'bg-rose-glow/15 text-rose-glow': tab.tone === 'danger',
                    }"
                >
                    {{ tab.count }}
                </span>
            </span>
        </button>
    </div>
</template>
