<script setup lang="ts">
/** UiSwitch — 开关；用于布尔字段与「只读/编辑」这类模式切换 */
withDefaults(defineProps<{ modelValue: boolean; disabled?: boolean; label?: string }>(), {
    disabled: false,
    label: '',
})

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<template>
    <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-2 text-[13px] text-soft disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled"
        role="switch"
        :aria-checked="modelValue"
        @click="emit('update:modelValue', !modelValue)"
    >
        <span
            class="relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200"
            :class="modelValue ? 'border-accent bg-accent' : 'border-line-strong bg-surface-3'"
        >
            <span
                class="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all duration-200"
                :class="modelValue ? 'left-[18px]' : 'left-0.5'"
            />
        </span>
        <span v-if="label">{{ label }}</span>
    </button>
</template>
