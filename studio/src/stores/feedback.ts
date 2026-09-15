/**
 * feedback.ts — 全局反馈：Toast 通知 + 确认弹窗（替代原生 alert/confirm）
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
    id: number
    kind: ToastKind
    title: string
    detail?: string
    timeout: number
}

export interface ConfirmOptions {
    title: string
    message?: string
    detail?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
    id: number
    resolve: (ok: boolean) => void
}

let seq = 0

export const useFeedbackStore = defineStore('feedback', () => {
    const toasts = ref<ToastItem[]>([])
    const confirmState = ref<ConfirmState | null>(null)

    function dismiss(id: number) {
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    function push(kind: ToastKind, title: string, detail = '', timeout = 3600) {
        const id = ++seq
        toasts.value = [...toasts.value.slice(-4), { id, kind, title, detail, timeout }]
        if (timeout > 0) window.setTimeout(() => dismiss(id), timeout)
        return id
    }

    const toast = {
        success: (title: string, detail = '') => push('success', title, detail),
        error: (title: string, detail = '') => push('error', title, detail, 5200),
        info: (title: string, detail = '') => push('info', title, detail),
        warning: (title: string, detail = '') => push('warning', title, detail, 4400),
    }

    /** 确认弹窗；返回 Promise<boolean>，等待用户选择 */
    function confirm(options: ConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            // 上一个未关闭的直接按取消处理，避免悬空 Promise
            confirmState.value?.resolve(false)
            confirmState.value = { ...options, id: ++seq, resolve }
        })
    }

    function resolveConfirm(ok: boolean) {
        const cur = confirmState.value
        confirmState.value = null
        cur?.resolve(ok)
    }

    return { toasts, confirmState, dismiss, toast, confirm, resolveConfirm }
})
