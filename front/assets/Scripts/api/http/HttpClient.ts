// HttpClient.ts
// 基于 Cocos Creator 内置 XMLHttpRequest 的 HTTP 客户端（跨 Web / 原生平台）。
// 后端统一响应体: { code: 0 成功 / 非 0 失败, message, data }
import { saveJSON, loadJSON, removeKey } from 'db://assets/Scripts/utils/Storage';
import {NetworkManager} from "db://assets/Scripts/managers/NetworkManager";

export interface ApiResponse<T = any> {
    code: number;
    message?: string;
    data?: T;
}

export interface HttpError extends Error {
    status?: number;   // HTTP 状态码
    code?: number;     // 业务码
}

// 带 ETag 条件请求的结果
export interface EtagResult<T> {
    data?: T;              // notModified=false 时为最新数据
    etag?: string;         // 响应 ETag（W/"version"）
    notModified: boolean;  // 304 未变化
}

export interface RequestOptions {
    /** 额外请求头 */
    headers?: Record<string, string>;
    /** 401 时是否跳过"自动刷新+重试"（token 校验等需显式控制刷新的场景用） */
    noAutoRefresh?: boolean;
}

export class HttpClient {
    private readonly baseURL: string;
    private readonly timeout: number;
    private refreshing = false;

    constructor(baseURL: string = 'http://localhost:8080', timeout: number = 15000) {
        this.baseURL = baseURL.replace(/\/+$/, '');
        this.timeout = timeout;
    }

    // ==================== Token 获取（由 NetworkManager 注入） ====================

    private getAccessToken(): string {
        return NetworkManager.getInstance().getAccessToken() || '';
    }

    private getRefreshToken(): string {
        return NetworkManager.getInstance().getRefreshToken() || '';
    }

    // ==================== 核心请求（XHR） ====================

    private request<T>(method: string, url: string, data?: any, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, this.baseURL + url, true);
            xhr.timeout = this.timeout;
            xhr.responseType = 'text';
            xhr.setRequestHeader('Content-Type', 'application/json');

            const token = this.getAccessToken();
            console.log(token);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            if (extraHeaders) {
                for (const k in extraHeaders) {
                    if (extraHeaders[k] != null) {
                        xhr.setRequestHeader(k, extraHeaders[k]);
                    }
                }
            }

            xhr.onload = () => {
                // 解析响应
                let parsed: ApiResponse<T> | null = null;
                if (xhr.responseText) {
                    try {
                        parsed = JSON.parse(xhr.responseText);
                    } catch {
                        parsed = null;
                    }
                }
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (parsed && typeof parsed.code === 'number') {
                        if (parsed.code !== 0) {
                            const e = new Error(parsed.message || `业务错误: ${parsed.code}`) as HttpError;
                            e.code = parsed.code;
                            e.status = xhr.status;
                            reject(e);
                            return;
                        }
                        resolve(parsed);
                    } else {
                        // 非统一结构（如 304 无 body 之外的场景），透传
                        resolve({ code: 0, data: parsed as any } as ApiResponse<T>);
                    }
                } else {
                    const e = new Error(parsed?.message || `HTTP ${xhr.status}`) as HttpError;
                    e.status = xhr.status;
                    e.code = parsed?.code;
                    reject(e);
                }
            };
            xhr.onerror = () => reject(Object.assign(new Error('网络错误'), { status: 0 }) as HttpError);
            xhr.ontimeout = () => reject(Object.assign(new Error('请求超时'), { status: 0 }) as HttpError);

            xhr.send(data !== undefined ? JSON.stringify(data) : undefined);
        });
    }

    // 带 401 → 刷新 → 重试 的请求（noAutoRefresh 时跳过刷新与跳登录，由调用方显式控制）
    private async requestWithAuth<T>(method: string, url: string, data?: any, opts?: RequestOptions): Promise<ApiResponse<T>> {
        try {
            return await this.request<T>(method, url, data, opts?.headers);
        } catch (e) {
            const err = e as HttpError;
            if (err.status === 401 && !opts?.noAutoRefresh && !this.refreshing) {
                this.refreshing = true;
                try {
                    if (await this.refreshToken()) {
                        return await this.request<T>(method, url, data, opts?.headers);
                    }
                } finally {
                    this.refreshing = false;
                }
            }
            if (err.status === 401 && !opts?.noAutoRefresh) {
                this.redirectToLogin();
            }
            throw err;
        }
    }

    // ==================== 刷新 / 登出跳转 ====================

    // 刷新 Token（内部使用，避免循环刷新）
    private async refreshToken(): Promise<boolean> {
        const rt = this.getRefreshToken();
        if (!rt) return false;
        try {
            const res = await this.request<{ access_token: string; refresh_token: string }>(
                'POST', '/api/v1/refresh', { refresh_token: rt });
            if (res.code === 0 && res.data) {
                const nm = (globalThis as any).NetworkManager?.getInstance?.();
                nm?.saveTokens?.(res.data.access_token, res.data.refresh_token);
                return true;
            }
        } catch (e) {
            console.error('[HttpClient] 刷新Token失败', e);
        }
        return false;
    }

    // 刷新失败 → 清 Token 并回登录界面
    private redirectToLogin() {
        const nm = (globalThis as any).NetworkManager?.getInstance?.();
        nm?.clearTokens?.();
        const uiMgr = (globalThis as any).UIManager?.getInstance?.();
        if (uiMgr?.openPanel) {
            uiMgr.openPanel('LoginPanel', { overlay: true });
        }
        console.warn('[HttpClient] Token 失效，已跳转登录');
    }

    // ==================== 对外方法 ====================

    public async get<T>(url: string, opts?: RequestOptions): Promise<ApiResponse<T>> {
        return this.requestWithAuth<T>('GET', url, undefined, opts);
    }

    public async post<T>(url: string, data?: any, opts?: RequestOptions): Promise<ApiResponse<T>> {
        return this.requestWithAuth<T>('POST', url, data, opts);
    }

    public async put<T>(url: string, data?: any, opts?: RequestOptions): Promise<ApiResponse<T>> {
        return this.requestWithAuth<T>('PUT', url, data, opts);
    }

    public async delete<T>(url: string, opts?: RequestOptions): Promise<ApiResponse<T>> {
        return this.requestWithAuth<T>('DELETE', url, undefined, opts);
    }

    /**
     * 带 ETag 的条件请求（玩家数据同步用）：
     * 传入上次的 etag，数据未变化时返回 notModified=true 且不带 body。
     */
    public async getWithEtag<T>(url: string, etag?: string): Promise<EtagResult<T>> {
        const headers: Record<string, string> = {};
        if (etag) {
            headers['If-None-Match'] = etag;
        }
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.baseURL + url, true);
            xhr.timeout = this.timeout;
            xhr.responseType = 'text';
            const token = this.getAccessToken();
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            if (etag) {
                xhr.setRequestHeader('If-None-Match', etag);
            }
            xhr.onload = () => {
                const resEtag = xhr.getResponseHeader('ETag') || undefined;
                if (xhr.status === 304) {
                    resolve({ notModified: true, etag: resEtag });
                    return;
                }
                if (xhr.status >= 200 && xhr.status < 300) {
                    const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    if (parsed && parsed.code !== undefined && parsed.code !== 0) {
                        reject(Object.assign(new Error(parsed.message || '业务错误'), { code: parsed.code, status: xhr.status }));
                        return;
                    }
                    resolve({ notModified: false, etag: resEtag, data: parsed?.data as T });
                } else {
                    reject(Object.assign(new Error(`HTTP ${xhr.status}`), { status: xhr.status }));
                }
            };
            xhr.onerror = () => reject(Object.assign(new Error('网络错误'), { status: 0 }));
            xhr.ontimeout = () => reject(Object.assign(new Error('请求超时'), { status: 0 }));
            xhr.send();
        });
    }
}

// 本地持久化辅助（平台解耦：底层由 utils/Storage 提供）
export function saveLocal(key: string, value: any) {
    saveJSON(key, value);
}

export function loadLocal<T>(key: string): T | null {
    return loadJSON<T>(key);
}

export function removeLocal(key: string) {
    removeKey(key);
}
