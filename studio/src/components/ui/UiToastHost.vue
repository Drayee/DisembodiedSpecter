<script setup lang="ts">
/** UiToastHost — 右下角通知堆栈 */
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from '@lucide/vue'
import { useFeedbackStore, type ToastKind } from '@/stores/feedback'

const feedback = useFeedbackStore()

const styleOf: Record<ToastKind, { icon: unknown; cls: string; ring: string }> = {
    success: { icon: CircleCheck, cls: 'text-emerald-glow', ring: 'border-emerald-glow/40' },
    error: { icon: CircleAlert, cls: 'text-rose-glow', ring: 'border-rose-glow/40' },
    warning: { icon: TriangleAlert, cls: 'text-amber-glow', ring: 'border-amber-glow/40' },
    info: { icon: Info, cls: 'text-sky-glow', ring: 'border-sky-glow/40' },
}
</script>

<template>
    <Teleport to="body">
        <div class="pointer-events-none fixed right-4 bottom-4 z-60 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
            <TransitionGroup
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 translate-y-2"
                leave-active-class="transition duration-150 ease-in absolute"
                leave-to-class="opacity-0 translate-x-4"
            >
                <div
                    v-for="t in feedback.toasts"
                    :key="t.id"
                    class="pointer-events-auto flex items-start gap-3 rounded-md border bg-elevated/95 px-3.5 py-3 shadow-float backdrop-blur"
                    :class="styleOf[t.kind].ring"
                >
                    <component :is="styleOf[t.kind].icon" :size="16" class="mt-0.5 shrink-0" :class="styleOf[t.kind].cls" />
                    <div class="min-w-0 flex-1">
                        <p class="text-[13px] leading-snug font-medium text-strong">{{ t.title }}</p>
                        <p v-if="t.detail" class="mt-0.5 text-xs leading-snug break-words text-muted">{{ t.detail }}</p>
                    </div>
                    <button class="btn btn-ghost btn-icon shrink-0" type="button" title="关闭" @click="feedback.dismiss(t.id)">
                        <X :size="13" />
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>
