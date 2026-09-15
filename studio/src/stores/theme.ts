/**
 * theme.ts — 深色 / 浅色主题，写入 <html data-theme>，CSS 变量随之切换
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'dark' | 'light'

const KEY = 'ds.studio.theme'

function initial(): ThemeMode {
    try {
        const saved = localStorage.getItem(KEY)
        if (saved === 'dark' || saved === 'light') return saved
    } catch {
        /* ignore */
    }
    return 'dark'
}

export const useThemeStore = defineStore('theme', () => {
    const mode = ref<ThemeMode>(initial())

    function apply(m: ThemeMode) {
        document.documentElement.dataset.theme = m
    }

    function toggle() {
        mode.value = mode.value === 'dark' ? 'light' : 'dark'
    }

    watch(
        mode,
        (m) => {
            apply(m)
            try {
                localStorage.setItem(KEY, m)
            } catch {
                /* ignore */
            }
        },
        { immediate: true },
    )

    return { mode, toggle, apply }
})
