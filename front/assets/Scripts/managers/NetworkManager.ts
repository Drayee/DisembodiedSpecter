// NetworkManager.ts
// 网络管理器：HTTP（登录/注册/登出/刷新/ws-code/玩家数据）+ WebSocket（战斗/全局）。
import { _decorator, Component } from 'cc';
import { HttpClient, EtagResult } from 'db://assets/Scripts/api/http/HttpClient';
import { WsClient } from 'db://assets/Scripts/api/websocket/WsClient';
import * as fightProto from 'db://assets/Scripts/api/websocket/proto/fight_message.js';
import * as globalProto from 'db://assets/Scripts/api/websocket/proto/global_message.js';
import { saveJSON, loadJSON, removeKey } from 'db://assets/Scripts/utils/Storage';
import { StoryProgress } from 'db://assets/Scripts/story/StoryTypes';
const FightMessage = fightProto.proto.FightMessage;
const GlobalMessage = globalProto.proto.GlobalMessage;

const { ccclass } = _decorator;

export interface LoginData {
    access_token: string;
    refresh_token: string;
    user_id: number;
}

export interface WsCodeData {
    wsCode: string;
}

/** 双 token 校验结果 */
export type TokenStatus = 'valid' | 'invalid';

@ccclass('NetworkManager')
export class NetworkManager extends Component {
    private static _instance: NetworkManager;

    public http!: HttpClient;
    public battleWs: WsClient = new WsClient('', { reconnect: true, maxReconnectAttempts: 5 });
    public worldWs: WsClient = new WsClient('', { reconnect: true, maxReconnectAttempts: 5 });

    public serverURL = 'http://localhost:8080';

    private accessToken = '';
    private refreshToken = '';
    private tokenKey = 'game_token';
    private dataEtagKey = 'game_data_etag';

    userId: number | null = null;

    /** 待上报的全局消息二进制（worldWs 未连接时暂存最新一份，连接后冲刷） */
    private pendingGlobalBytes: Uint8Array | null = null;

    onLoad() {
        NetworkManager._instance = this;
        this.http = new HttpClient(this.serverURL);
        this.loadTokens();
        (globalThis as any).NetworkManager = this;
    }

    static getInstance(): NetworkManager {
        return this._instance;
    }

    // ==================== Token ====================

    public getAccessToken(): string {
        return this.accessToken;
    }

    public getRefreshToken(): string {
        return this.refreshToken;
    }

    public saveTokens(access: string, refresh: string,id: number) {
        this.accessToken = access;
        this.refreshToken = refresh;
        this.userId = id;
        saveJSON(this.tokenKey, { access, refresh, id});
    }

    public loadTokens(): boolean {
        const data = loadJSON<{ access: string; refresh: string; id: number}>(this.tokenKey);
        if (data?.access && data?.refresh) {
            this.accessToken = data.access;
            this.refreshToken = data.refresh;
            this.userId = data.id
            return true;
        }
        return false;
    }

    public clearTokens() {
        this.accessToken = '';
        this.refreshToken = '';
        this.userId = null;
        removeKey(this.tokenKey);
        removeKey(this.dataEtagKey);
    }

    /** 本地是否存有双 token */
    public hasTokens(): boolean {
        return !!this.accessToken && !!this.refreshToken;
    }

    /**
     * 校验双 token 是否有效（通过后端 /api/v2/token/check）：
     * 1. 双 token 缺失 → invalid
     * 2. 请求后端校验（JWT 签名 + Redis 会话唯一码）→ 200 即 valid
     * 3. 后端判定无效（过期/被顶替/已登出）→ 用 refresh 刷新一次再校验
     */
    public async validateTokens(): Promise<TokenStatus> {
        if (!this.hasTokens()) {
            return 'invalid';
        }
        if (await this.checkTokenWithServer()) {
            return 'valid';
        }
        const ok = await this.refreshAccessToken();
        if (!ok) {
            return 'invalid';
        }
        return (await this.checkTokenWithServer()) ? 'valid' : 'invalid';
    }

    /** 请求后端校验 token 是否有效（noAutoRefresh：401 时不自动刷新/不跳登录） */
    private async checkTokenWithServer(): Promise<boolean> {
        try {
            const res = await this.http.get<{ valid: boolean }>('/api/v2/token/check', { noAutoRefresh: true });
            return res.code === 0 && res.data?.valid !== false;
        } catch {
            return false;
        }
    }

    public getAuthHeaders(): Record<string, string> {
        return { Authorization: `Bearer ${this.accessToken}` };
    }

    // ==================== HTTP 接口 ====================

    public async login(username: string, password: string): Promise<LoginData> {
        const res = await this.http.post<LoginData>('/api/v1/login', { username, password });
        if (res.code === 0 && res.data) {
            this.saveTokens(res.data.access_token, res.data.refresh_token, res.data.user_id);
            return res.data;
        }
        throw new Error(res.message || '登录失败');
    }

    public async sendVerifyCode(email: string): Promise<void> {
        const res = await this.http.post('/api/v1/verify-code', { verifier_type: 'email', verifier: email });
        if (res.code === 0 && res.data) {
            throw new Error(res.message || '发送验证码失败');
        }
    }

    public async register(name: string, password: string, email: string, code: string): Promise<LoginData> {
        const res = await this.http.post<LoginData>('/api/v1/register', { name, password, email, code });
        if (res.code === 0 && res.data) {
            this.saveTokens(res.data.access_token, res.data.refresh_token, res.data.user_id);
            return res.data;
        }
        throw new Error(res.message || '注册失败');
    }

    public async logout(): Promise<void> {
        try {
            await this.http.post('/api/v1/logout', { refresh_token: this.refreshToken });
        } catch (e) {
            console.warn('[NetworkManager] 登出请求失败（仍清理本地）', e);
        } finally {
            this.clearTokens();
            this.battleWs.close();
            this.worldWs.close();
        }
    }

    public async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) return false;
        try {
            const res = await this.http.post<LoginData>('/api/v1/refresh', { refresh_token: this.refreshToken });
            if (res.code === 0 && res.data) {
                this.saveTokens(res.data.access_token, res.data.refresh_token, res.data.user_id);
                return true;
            }
        } catch (e) {
            console.error('[NetworkManager] 刷新Token失败', e);
        }
        return false;
    }

    /** 获取一次性 WebSocket 连接码（后端缓存，同窗口内返回同一个 code） */
    public async getWsCode(): Promise<string> {
        const res = await this.http.get<WsCodeData>('/api/v2/ws-code');
        if (res.code === 0 && res.data?.wsCode) {
            return res.data.wsCode;
        }
        throw new Error(res.message || '获取 ws-code 失败');
    }

    /** 获取玩家数据（带弱 ETag 条件请求：数据未变化返回 notModified=true） */
    public async getPlayerData<T = any>(force?: boolean): Promise<EtagResult<T>> {
        const etag = force ? undefined : loadJSON<string>(this.dataEtagKey) || undefined;
        const res = await this.http.getWithEtag<T>('/api/v2/data', etag);
        if (res.etag) {
            saveJSON(this.dataEtagKey, res.etag);
        }
        return res;
    }

    // ==================== WebSocket ====================

    /**
     * 连接战斗 WebSocket。
     * 流程：getWsCode() → ws://{host}/api/ws/fight/{userId}/{wsCode}
     * @param userId
     * @param wsCode
     * @param onFightMessage 收到战斗消息（已解码为 FightMessage）的回调
     */
    public connectBattleWS(userId: number, wsCode: string, onFightMessage?: (msg: typeof FightMessage) => void): WsClient {
        const host = this.serverURL.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        this.battleWs = new WsClient(`ws://${host}/api/ws/fight/${userId}/${wsCode}`, {
            reconnect: true,
            maxReconnectAttempts: 5,
            binary: true,
        });
        this.battleWs.onMessage = (bytes) => {
            try {
                onFightMessage?.(FightMessage.decode(bytes));
            } catch (e) {
                console.error('[NetworkManager] 解码战斗消息失败', e);
            }
        };
        this.battleWs.onOpen = () => console.log('[Battle] 战斗连接已建立');
        this.battleWs.onClose = (code, reason) => console.warn(`[Battle] 连接关闭 code=${code} reason=${reason}`);
        this.battleWs.connect();
        return this.battleWs;
    }

    /** 连接全局状态 WebSocket：收发 binary GlobalMessage（走动/剧情进度/状态同步） */
    public connectWorldWS(userId: number, wsCode: string, onMessage?: (bytes: Uint8Array) => void): WsClient {
        const host = this.serverURL.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        this.worldWs = new WsClient(`ws://${host}/api/ws/global/${userId}/${wsCode}`, { binary: true });
        this.worldWs.onMessage = (bytes) => {
            onMessage?.(bytes);
            this.handleGlobalBinary(bytes);
        };
        this.worldWs.onOpen = () => {
            console.log('[World] 全局连接已建立');
            this.flushPendingGlobal();
        };
        this.worldWs.connect();
        return this.worldWs;
    }

    // ==================== 全局消息（二进制 global_message） ====================

    /** 收到服务端 S2C_SyncState（交给 GameManager 恢复剧情/位置状态） */
    public onGlobalSyncState?: (state: any) => void;

    /** 收到服务端 S2C_Ack */
    public onGlobalAck?: (ack: any) => void;

    /**
     * 上报剧情进度（C2S_StoryProgress，整体覆盖，后端为权威）。
     * worldWs 未连接时缓存最新一份，连接建立后自动冲刷。
     */
    public sendStoryProgress(progress: StoryProgress) {
        const msg = GlobalMessage.create({
            storyProgress: {
                progress: {
                    main: progress.main || '',
                    branches: progress.branches || {},
                },
            },
        });
        this.enqueueGlobal(GlobalMessage.encode(msg).finish());
    }

    /** 上报大世界走动（C2S_Move） */
    public sendMove(mapName: string, x: number, y: number): boolean {
        if (!this.worldWs.connected) {
            console.warn('[World] 未连接，走动消息丢弃');
            return false;
        }
        const msg = GlobalMessage.create({ move: { pos: { mapName, x, y } } });
        return this.worldWs.sendBinary(GlobalMessage.encode(msg).finish());
    }

    /** 请求服务端补发一次 SyncState（连接建立后服务端已默认先推） */
    public requestGlobalSync(): boolean {
        if (!this.worldWs.connected) return false;
        const msg = GlobalMessage.create({ syncRequest: {} });
        return this.worldWs.sendBinary(GlobalMessage.encode(msg).finish());
    }

    private enqueueGlobal(bytes: Uint8Array) {
        this.pendingGlobalBytes = bytes;
        this.flushPendingGlobal();
    }

    private flushPendingGlobal() {
        if (!this.pendingGlobalBytes) return;
        if (!this.worldWs.connected) return; // 保持待发，等待连接
        if (this.worldWs.sendBinary(this.pendingGlobalBytes)) {
            console.log('[World] 全局消息已发送（含剧情进度）');
            this.pendingGlobalBytes = null;
        }
    }

    private handleGlobalBinary(bytes: Uint8Array) {
        try {
            const msg = GlobalMessage.decode(bytes) as any;
            if (msg.syncState) {
                console.log('[World] 收到 SyncState', msg.syncState);
                this.onGlobalSyncState?.(msg.syncState);
            } else if (msg.ack) {
                console.log(`[World] 收到 Ack ok=${!!msg.ack.ok} code=${msg.ack.code ?? 0} reason=${msg.ack.reason || ''}`);
                this.onGlobalAck?.(msg.ack);
            } else {
                console.log('[World] 收到未知全局消息', msg);
            }
        } catch (e) {
            console.warn('[World] 全局二进制消息解码失败', e);
        }
    }

    /** 发送战斗消息（protobuf 编码） */
    public sendFightMessage(msg: typeof FightMessage): boolean {
        const bytes = FightMessage.encode(msg).finish();
        return this.battleWs.sendBinary(bytes);
    }

}