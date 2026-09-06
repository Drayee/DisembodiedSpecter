// WsClient.ts
// 基于 Cocos Creator 内置 WebSocket（跨 Web / 原生平台）的客户端封装：
// 连接 / 自动重连 / 二进制与文本收发 / 生命周期回调。
// 消息体为二进制（protobuf），收到后以 Uint8Array 交给 onMessage。

export interface WsOptions {
    reconnect?: boolean;          // 是否自动重连，默认 true
    maxReconnectAttempts?: number; // 最大重连次数，默认 10
    reconnectDelayMs?: number;     // 重连基础延迟，默认 1000（指数退避）
    authHeader?: string;           // 预留：服务端无需 Bearer（ws-code 校验），浏览器也无法自定义 WS 头
    binary?: boolean;              // 二进制消息，默认 true
}

export class WsClient {
    private ws: any = null;
    private url = '';
    private opts: WsOptions = {};
    private manualClose = false;
    private reconnectCount = 0;
    private reconnectTimer: any = null;

    // 生命周期回调
    public onOpen?: () => void;
    public onMessage?: (data: Uint8Array) => void;
    public onText?: (text: string) => void;
    public onClose?: (code?: number, reason?: string) => void;
    public onError?: (err: any) => void;

    constructor(url: string = '', opts: WsOptions = {}) {
        this.url = url;
        this.opts = { reconnect: true, maxReconnectAttempts: 10, reconnectDelayMs: 1000, binary: true, ...opts };
    }

    public get connected(): boolean {
        return !!this.ws && this.ws.readyState === 1; // WebSocket.OPEN
    }

    /** 连接（可随时换 url） */
    public connect(url?: string) {
        if (url) this.url = url;
        if (!this.url) {
            console.warn('[WsClient] 缺少连接地址');
            return;
        }
        this.manualClose = false;
        this.reconnectCount = 0;
        this.open();
    }

    private open() {
        if (this.ws) {
            try { this.ws.close(); } catch { /* ignore */ }
            this.ws = null;
        }
        try {
            const WS = (globalThis as any).WebSocket;
            this.ws = new WS(this.url);
            if (this.opts.binary) {
                this.ws.binaryType = 'arraybuffer';
            }
            this.ws.onopen = () => {
                this.reconnectCount = 0;
                this.onOpen?.();
            };
            this.ws.onmessage = (ev: any) => {
                if (typeof ev.data === 'string') {
                    this.onText?.(ev.data);
                } else {
                    const bytes = ev.data instanceof ArrayBuffer
                        ? new Uint8Array(ev.data)
                        : new Uint8Array(ev.data as ArrayBuffer);
                    this.onMessage?.(bytes);
                }
            };
            this.ws.onclose = (ev: any) => {
                const code = ev?.code;
                const reason = ev?.reason || '';
                this.onClose?.(code, reason);
                if (!this.manualClose && this.opts.reconnect && this.reconnectCount < (this.opts.maxReconnectAttempts || 10)) {
                    this.scheduleReconnect();
                }
            };
            this.ws.onerror = (ev: any) => {
                this.onError?.(ev);
            };
        } catch (e) {
            console.error('[WsClient] 连接失败', e);
            this.onError?.(e);
            if (!this.manualClose && this.opts.reconnect && this.reconnectCount < (this.opts.maxReconnectAttempts || 10)) {
                this.scheduleReconnect();
            }
        }
    }

    private scheduleReconnect() {
        const delay = (this.opts.reconnectDelayMs || 1000) * Math.pow(2, this.reconnectCount);
        this.reconnectCount++;
        console.warn(`[WsClient] ${delay}ms 后重连（第 ${this.reconnectCount} 次）`);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.open(), delay);
    }

    /** 发送二进制消息 */
    public sendBinary(data: Uint8Array | ArrayBuffer) {
        if (!this.connected) {
            console.warn('[WsClient] 未连接，消息丢弃');
            return false;
        }
        try {
            this.ws.send(data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data);
            return true;
        } catch (e) {
            console.error('[WsClient] 发送失败', e);
            return false;
        }
    }

    /** 发送文本消息 */
    public sendText(text: string): boolean {
        if (!this.connected) return false;
        try {
            this.ws.send(text);
            return true;
        } catch (e) {
            console.error('[WsClient] 发送失败', e);
            return false;
        }
    }

    /** 手动关闭（不自动重连） */
    public close(code?: number, reason?: string) {
        this.manualClose = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            try { this.ws.close(code, reason); } catch { /* ignore */ }
            this.ws = null;
        }
    }
}
