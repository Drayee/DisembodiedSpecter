<script setup lang="ts">
/** UiSplitter — 可拖拽的竖直分隔条，用于工作台三栏布局调节宽度 */
import { onBeforeUnmount, ref } from 'vue'

const props = withDefaults(defineProps<{ modelValue: number; min?: number; max?: number; /** 反向：向右拖变窄 */ reverse?: boolean }>(), {
    min: 180,
    max: 640,
    reverse: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()

const dragging = ref(false)

function onPointerDown(e: PointerEvent) {
    e.preventDefault()
    dragging.value = true
    const startX = e.clientX
    const startValue = props.modelValue

    function onMove(ev: PointerEvent) {
        const delta = (ev.clientX - startX) * (props.reverse ? -1 : 1)
        const next = Math.min(props.max, Math.max(props.min, startValue + delta))
        emit('update:modelValue', next)
    }

    function onUp() {
        dragging.value = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
}

onBeforeUnmount(() => {
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
})
</script>

<template>
    <div
        class="splitter"
        :class="dragging ? 'bg-accent' : ''"
        role="separator"
        aria-orientation="vertical"
        @pointerdown="onPointerDown"
    />
</template>
