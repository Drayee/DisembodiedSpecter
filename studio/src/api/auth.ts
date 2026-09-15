/**
 * auth.ts — 认证接口（/api/v1/*，白名单，无需 token）
 * 来源：internal/handlers/router.go + auth_handle.go
 */
import { api } from './client'
import type { TokenPair } from './types'

export interface LoginPayload {
    username: string
    password: string
}

export interface RegisterPayload {
    name: string
    password: string
    email: string
    code: string
}

export interface VerifyCodePayload {
    verifier_type: 'email' | 'phone'
    verifier: string
}

export const authApi = {
    login: (payload: LoginPayload) => api.post<TokenPair>('/api/v1/login', payload),
    register: (payload: RegisterPayload) => api.post<TokenPair>('/api/v1/register', payload),
    refresh: (refreshToken: string) => api.post<TokenPair>('/api/v1/refresh', { refresh_token: refreshToken }),
    logout: () => api.post<null>('/api/v1/logout'),
    sendVerifyCode: (payload: VerifyCodePayload) => api.post<null>('/api/v1/verify-code', payload),
    /** 校验当前 token 是否仍有效 */
    checkToken: () => api.get<unknown>('/api/v2/token/check'),
}
