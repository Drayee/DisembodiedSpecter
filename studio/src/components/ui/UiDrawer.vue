<script setup lang="ts">
/** UiDrawer — 右侧抽屉：适合「列表 + 详情编辑」这类不打断上下文的表单 */
import { onBeforeUnmount, watch } from 'vue'
import { X } from '@lucide/vue'

const props = withDefaults(
    defineProps<{
        open: boolean
        title?: string
        description?: string
        width?: string
    }>(),
    { title: '', description: '', width: '640px' },
)

const emit = defineEmits<{ (e: 'close'): void }>()

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') emit('close')
}

watch(
    () => props.open,
    (open) => {
        if (open) {
            document.addEventListener('keydown', onKeydown)
            document.body.style.overflow = 'hidden'
        } else {
            document.removeEventListener('keydown', onKeydown)
            document.body.style.overflow = ''
        }
    },
    { immediate: true },
)

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
})
</script>

<template>
    <Teleport to="body">
        <div v-if="open" class="fixed inset-0 z-40 flex justify-end">
            <div class="absolute inset-0 animate-fade-in" :style="{ background: 'var(--s-overlay)' }" @click="emit('close')" />
            <aside
                class="relative flex h-full w-full flex-col border-l border-line bg-elevated shadow-float animate-slide-left"
                :style="{ maxWidth: width }"
                role="dialog"
                aria-modal="true"
            >
                <header class="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <div class="min-w-0">
                        <slot name="header">
                            <h2 class="truncate text-[15px] font-semibold text-strong">{{ title }}</h2>
                            <p v-if="description" class="mt-1 text-xs leading-relaxed text-muted">{{ description }}</p>
                        </slot>
                    </div>
                    <button class="btn btn-ghost btn-icon" type="button" title="关闭" @click="emit('close')">
                        <X :size="16" />
                    </button>
                </header>

                <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <slot />
                </div>

                <footer v-if="$slots.footer" class="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3">
                    <slot name="footer" />
                </footer>
            </aside>
        </div>
    </Teleport>
</template>
