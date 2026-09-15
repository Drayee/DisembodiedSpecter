<script setup lang="ts">
/** UiField — 表单字段容器：标签 / 提示 / 错误三段式，保证垂直间距一致 */
withDefaults(
    defineProps<{
        label?: string
        hint?: string
        error?: string
        required?: boolean
        /** 标签与控件左右排布（窄表单用） */
        inline?: boolean
    }>(),
    { label: '', hint: '', error: '', required: false, inline: false },
)
</script>

<template>
    <label class="field" :class="inline ? 'flex-row items-center gap-3' : ''">
        <span v-if="label" class="field-label" :class="inline ? 'w-28 shrink-0 justify-end normal-case' : ''">
            {{ label }}
            <span v-if="required" class="text-rose-glow">*</span>
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-1.5">
            <slot />
            <span v-if="error" class="text-[11px] text-rose-glow">{{ error }}</span>
            <span v-else-if="hint" class="field-hint">{{ hint }}</span>
        </span>
    </label>
</template>
