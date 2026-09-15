<script setup lang="ts">
/** UiModal — 居中模态：遮罩 + ESC 关闭 + 滚动锁 + 淡入动画 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { X } from '@lucide/vue'

const props = withDefaults(
    defineProps<{
        open: boolean
        title?: string
        description?: string
        width?: string
        closeOnOverlay?: boolean
    }>(),
    { title: '', description: '', width: '560px', closeOnOverlay: true },
)

const emit = defineEmits<{ (e: 'close'): void }>()

const panel = ref<HTMLElement | null>(null)

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
        <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
            <div class="fixed inset-0 animate-fade-in" :style="{ background: 'var(--s-overlay)' }" @click="closeOnOverlay && emit('close')" />
            <div
                ref="panel"
                class="relative z-10 my-auto flex max-h-[calc(100vh-4rem)] w-full flex-col overflow-hidden rounded-lg border border-line bg-elevated shadow-modal animate-slide-up"
                :style="{ maxWidth: width }"
                role="dialog"
                aria-modal="true"
            >
                <header v-if="title || $slots.header" class="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
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
            </div>
        </div>
    </Teleport>
</template>
