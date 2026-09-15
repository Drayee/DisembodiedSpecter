<script setup lang="ts">
/** UiPageHeader — 页面标题区：标题 + 说明 + 右侧操作，统一各页面顶部节奏 */
withDefaults(defineProps<{ title: string; description?: string }>(), { description: '' })
</script>

<template>
    <header class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
            <h1 class="text-lg font-semibold tracking-tight text-strong">{{ title }}</h1>
            <p v-if="description" class="mt-1 max-w-[720px] text-xs leading-relaxed text-muted">{{ description }}</p>
        </div>
        <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
            <slot name="actions" />
        </div>
    </header>
</template>
