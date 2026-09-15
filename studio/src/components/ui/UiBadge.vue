<script setup lang="ts">
/** UiBadge — 状态徽标；tone 对应设计系统里的语义色 */
withDefaults(
    defineProps<{
        tone?: 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'info'
        dot?: boolean
    }>(),
    { tone: 'default', dot: false },
)

const toneClass: Record<string, string> = {
    default: 'badge',
    accent: 'badge badge-accent',
    ok: 'badge badge-ok',
    warn: 'badge badge-warn',
    danger: 'badge badge-danger',
    info: 'badge badge-info',
}
</script>

<template>
    <span :class="toneClass[tone]">
        <span v-if="dot" class="h-1.5 w-1.5 rounded-full bg-current" />
        <slot />
    </span>
</template>
