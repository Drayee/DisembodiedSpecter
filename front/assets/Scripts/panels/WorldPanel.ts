// WorldPanel.ts
// 世界面板：进入时连接全局状态 WebSocket（globalWs）。
// 挂载位置：WorldPanel 预制体根节点。
import { _decorator, Component } from 'cc';
import { NetworkManager } from 'db://assets/Scripts/managers/NetworkManager';
const { ccclass } = _decorator;

@ccclass('WorldPanel')
export class WorldPanel extends Component {
    private connecting = false;

    onEnable() {
        this.connectGlobalWs();
    }

    onDisable() {
        // 离开世界面板时断开全局连接（重连策略由 WsClient 控制，手动 close 不再重连）
        const nm = NetworkManager.getInstance();
        if (nm) {
            nm.worldWs.close();
        }
    }

    private async connectGlobalWs() {
        if (this.connecting) return;
        this.connecting = true;
        try {
            const nm = NetworkManager.getInstance();
            if (!nm || !nm.userId) {
                console.error('[WorldPanel] NetworkManager 未初始化或缺少 userId');
                return;
            }
            // 获取一次性 ws-code 并连接全局状态 WebSocket
            const wsCode = await nm.getWsCode();
            console.log('[WorldPanel] ws-code =', wsCode);
            nm.connectWorldWS(nm.userId, wsCode, (bytes) => {
                // TODO: 解析全局状态消息（当前后端 global 连接仅保持在线，暂无消息协议）
                console.log('[WorldPanel] 收到全局消息', bytes.byteLength, '字节');
            });
        } catch (e) {
            console.error('[WorldPanel] 连接全局失败', e);
        } finally {
            this.connecting = false;
        }
    }
}
