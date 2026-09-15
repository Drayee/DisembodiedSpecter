/**
 * client.ts — axios 实例 / 统一响应体拆包 / 401 自动刷新 / 错误归一化
 *
 * 后端约定（internal/dto/response/result.go）：
 *   成功：HTTP 200 + { code: 0, message: 'success', data: ... }
 *   失败：HTTP 400/401/500 + { code: 4001|4002|4003|5000, message: '...' }
 * 因此这里把 code !== 0 一律当业务错误抛出 ApiError，业务代码只面对 data。
 */
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { emitSessionExpired, session, type TokenPair } from './session'

export const API_BASE: string = import.meta.env.VITE_API_BASE || ''

export const BizCode = {
    Success: 0,
    InvalidParam: 4001,
    Unauthorized: 4002,
    Forbidden: 4003,
    ServerError: 5000,
} as const

export interface ApiEnvelope<T> {
    code: number
    message: string
    data?: T
}

export class ApiError extends Error {
    readonly code: number
    readonly httpStatus: number

    constructor(message: string, code: number = BizCode.ServerError, httpStatus: number = 0) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.httpStatus = httpStatus
    }

    get isUnauthorized(): boolean {
        return this.code === BizCode.Unauthorized || this.httpStatus === 401
    }

    get isForbidden(): boolean {
        return this.code === BizCode.Forbidden || this.httpStatus === 403
    }

    get isInvalidParam(): boolean {
        return this.code === BizCode.InvalidParam || this.httpStatus === 400
    }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
    __retried?: boolean
    __silent?: boolean
}

export const http = axios.create({
    baseURL: API_BASE,
    timeout: 20000,
    headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
    const token = session.accessToken
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    return config
})

/** 刷新令牌：并发请求只发一次 */
let refreshing: Promise<void> | null = null

function refreshSession(): Promise<void> {
    if (!refreshing) {
        refreshing = (async () => {
            const rt = session.refreshToken
            if (!rt) throw new ApiError('登录状态已失效，请重新登录', BizCode.Unauthorized, 401)
            // 用裸 axios，避免再次走进拦截器
            const res = await axios.post<ApiEnvelope<TokenPair>>(
                `${API_BASE}/api/v1/refresh`,
                { refresh_token: rt },
                { timeout: 20000 },
            )
            const body = res.data
            if (!body || body.code !== BizCode.Success || !body.data) {
                throw new ApiError(body?.message || '刷新令牌失败', body?.code ?? BizCode.Unauthorized, res.status)
            }
            session.save(body.data)
        })().finally(() => {
            refreshing = null
        })
    }
    return refreshing
}

function normalizeError(error: unknown): ApiError {
    if (error instanceof ApiError) return error
    if (axios.isAxiosError(error)) {
        const err = error as AxiosError<ApiEnvelope<unknown>>
        const status = err.response?.status ?? 0
        const body = err.response?.data
        if (body && typeof body === 'object' && typeof (body as ApiEnvelope<unknown>).code === 'number') {
            return new ApiError((body as ApiEnvelope<unknown>).message || '请求失败', (body as ApiEnvelope<unknown>).code, status)
        }
        if (err.code === 'ECONNABORTED') return new ApiError('请求超时，请检查后端服务是否在运行', BizCode.ServerError, status)
        if (!err.response) return new ApiError('无法连接后端服务（开发期请确认 8080 已启动 / 代理配置正确）', BizCode.ServerError, 0)
        return new ApiError(err.message || `请求失败（HTTP ${status}）`, BizCode.ServerError, status)
    }
    return new ApiError(error instanceof Error ? error.message : '未知错误', BizCode.ServerError, 0)
}

http.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        const err = error as AxiosError
        const config = err.config as RetriableConfig | undefined
        const status = err.response?.status
        const body = err.response?.data as ApiEnvelope<unknown> | undefined
        const unauthorized = status === 401 || body?.code === BizCode.Unauthorized

        if (unauthorized && config && !config.__retried && !/\/api\/v1\/(login|refresh)$/.test(config.url || '')) {
            config.__retried = true
            // 刷新成功则原样重放一次；失败则清空会话并通知外部跳登录
            try {
                await refreshSession()
                return await http.request(config)
            } catch (refreshError) {
                emitSessionExpired(normalizeError(refreshError).message)
                return Promise.reject(normalizeError(refreshError))
            }
        }
        if (unauthorized && status === 401) {
            emitSessionExpired(body?.message || '登录状态已失效，请重新登录')
        }
        return Promise.reject(normalizeError(error))
    },
)

/** 发起请求并拆掉统一响应体外壳，直接返回 data */
export async function request<T>(config: AxiosRequestConfig & { __silent?: boolean }): Promise<T> {
    const res = await http.request<ApiEnvelope<T>>(config as AxiosRequestConfig)
    const body = res.data
    if (!body || typeof body.code !== 'number') {
        // 兜底：非标准响应体（例如被网关改写）时直接返回原始内容
        return body as unknown as T
    }
    if (body.code !== BizCode.Success) {
        throw new ApiError(body.message || '请求失败', body.code, res.status)
    }
    return body.data as T
}

export const api = {
    get: <T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) =>
        request<T>({ ...config, method: 'GET', url, params }),
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        request<T>({ ...config, method: 'POST', url, data }),
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        request<T>({ ...config, method: 'PUT', url, data }),
    del: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'DELETE', url }),
}
