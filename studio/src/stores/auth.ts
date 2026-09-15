/**
 * auth.ts — 登录态：令牌持久化 + 登录/登出 + 会话失效响应
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, type LoginPayload } from '@/api/auth'
import { emitSessionExpired, onSessionExpired, session } from '@/api/session'

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref(session.accessToken)
    const userId = ref<number | null>(session.user?.userId ?? null)
    const loginAt = ref<number | null>(session.user?.loginAt ?? null)
    const loading = ref(false)
    const expiredReason = ref('')

    const isLogged = computed(() => !!accessToken.value)
    const isAdmin = computed(() => isLogged.value)

    function syncFromSession() {
        accessToken.value = session.accessToken
        userId.value = session.user?.userId ?? null
        loginAt.value = session.user?.loginAt ?? null
    }

    async function login(payload: LoginPayload) {
        loading.value = true
        expiredReason.value = ''
        try {
            const pair = await authApi.login(payload)
            session.save(pair)
            syncFromSession()
            return pair
        } finally {
            loading.value = false
        }
    }

    async function logout(notifyServer = true) {
        if (notifyServer && session.isLogged) {
            try {
                await authApi.logout()
            } catch {
                /* 后端登出失败不阻塞本地清理 */
            }
        }
        emitSessionExpired('你已退出登录')
        syncFromSession()
    }

    function clearLocal(reason = '') {
        expiredReason.value = reason
        syncFromSession()
    }

    onSessionExpired((reason) => clearLocal(reason))

    return { accessToken, userId, loginAt, loading, expiredReason, isLogged, isAdmin, login, logout, clearLocal, syncFromSession }
})
