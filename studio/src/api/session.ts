/**
 * session.ts — 令牌与当前用户的本地持久化
 * 独立成模块，避免 client.ts 与 store 之间循环依赖。
 */

const KEY_ACCESS = 'ds.studio.access_token'
const KEY_REFRESH = 'ds.studio.refresh_token'
const KEY_USER = 'ds.studio.user'

export interface SessionUser {
    userId: number
    loginAt: number
}

export interface TokenPair {
    access_token: string
    refresh_token: string
    user_id: number
}

function read(key: string): string {
    try {
        return localStorage.getItem(key) || ''
    } catch {
        return ''
    }
}

function write(key: string, value: string) {
    try {
        if (value) localStorage.setItem(key, value)
        else localStorage.removeItem(key)
    } catch {
        /* 隐私模式下忽略 */
    }
}

export const session = {
    get accessToken(): string {
        return read(KEY_ACCESS)
    },
    get refreshToken(): string {
        return read(KEY_REFRESH)
    },
    get user(): SessionUser | null {
        const raw = read(KEY_USER)
        if (!raw) return null
        try {
            return JSON.parse(raw) as SessionUser
        } catch {
            return null
        }
    },
    get isLogged(): boolean {
        return !!read(KEY_ACCESS)
    },
    save(pair: TokenPair) {
        write(KEY_ACCESS, pair.access_token || '')
        write(KEY_REFRESH, pair.refresh_token || '')
        write(KEY_USER, JSON.stringify({ userId: pair.user_id, loginAt: Date.now() } satisfies SessionUser))
    },
    clear() {
        write(KEY_ACCESS, '')
        write(KEY_REFRESH, '')
        write(KEY_USER, '')
    },
}

/** 会话失效回调（client.ts 在 401 且刷新失败时触发，由 main/router 注册跳登录） */
type Listener = (reason: string) => void
const listeners = new Set<Listener>()

export function onSessionExpired(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

export function emitSessionExpired(reason: string) {
    session.clear()
    for (const fn of listeners) fn(reason)
}
