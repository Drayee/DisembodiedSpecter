<script setup lang="ts">
/** UiEmpty — 空状态占位 */
withDefaults(defineProps<{ title: string; hint?: string; compact?: boolean }>(), { hint: '', compact: false })
</script>

<template>
    <div class="empty-state" :class="compact ? 'min-h-[100px] py-6' : ''">
        <div v-if="$slots.icon" class="mb-1 text-faint">
            <slot name="icon" />
        </div>
        <p class="text-sm text-soft">{{ title }}</p>
        <p v-if="hint" class="max-w-[420px] text-xs leading-relaxed text-faint">{{ hint }}</p>
        <div v-if="$slots.action" class="mt-2">
            <slot name="action" />
        </div>
    </div>
</template>
