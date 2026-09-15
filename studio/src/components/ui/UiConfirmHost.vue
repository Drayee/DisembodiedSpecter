<script setup lang="ts">
/** UiConfirmHost — 全局确认弹窗宿主，把原生 confirm 换成统一观感的模态 */
import { TriangleAlert } from '@lucide/vue'
import { useFeedbackStore } from '@/stores/feedback'

const feedback = useFeedbackStore()
</script>

<template>
    <Teleport to="body">
        <div v-if="feedback.confirmState" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 animate-fade-in" :style="{ background: 'var(--s-overlay)' }" @click="feedback.resolveConfirm(false)" />
            <div class="relative z-10 w-full max-w-[440px] animate-slide-up rounded-lg border border-line bg-elevated p-5 shadow-modal">
                <div class="flex items-start gap-3">
                    <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border"
                        :class="feedback.confirmState.danger ? 'border-rose-glow/40 bg-rose-glow/12 text-rose-glow' : 'border-accent-line bg-accent-soft text-phantom-200'"
                    >
                        <TriangleAlert :size="17" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="text-[15px] font-semibold text-strong">{{ feedback.confirmState.title }}</h3>
                        <p v-if="feedback.confirmState.message" class="mt-1.5 text-[13px] leading-relaxed text-soft">
                            {{ feedback.confirmState.message }}
                        </p>
                        <p v-if="feedback.confirmState.detail" class="mt-1.5 text-xs leading-relaxed text-faint">
                            {{ feedback.confirmState.detail }}
                        </p>
                    </div>
                </div>

                <div class="mt-5 flex justify-end gap-2">
                    <button class="btn" type="button" @click="feedback.resolveConfirm(false)">
                        {{ feedback.confirmState.cancelText || '取消' }}
                    </button>
                    <button
                        class="btn"
                        :class="feedback.confirmState.danger ? 'btn-danger' : 'btn-primary'"
                        type="button"
                        @click="feedback.resolveConfirm(true)"
                    >
                        {{ feedback.confirmState.confirmText || '确认' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
