// StartPanel.ts
// 开始面板：点击任意位置 → 隐藏 ClickStart 文字 → 校验本地双 token →
//   有效  → 进入 WorldPanel（切换）
//   无效  → 弹出 LoginPanel（overlay 叠加，不摧毁 StartPanel）
// 挂载位置：StartPanel 预制体根节点。
import { _decorator, Component, Node, UITransform, find } from 'cc';
import { NetworkManager } from 'db://assets/Scripts/managers/NetworkManager';
import { UIManager } from 'db://assets/Scripts/managers/UIManager';
const { ccclass, property } = _decorator;

@ccclass('StartPanel')
export class StartPanel extends Component {

    @property(Node)
    private clickStart: Node | null = null;
    private checking = false;

    onLoad() {
        let uiTransform = this.getComponent(UITransform);
        if (!uiTransform) {
            uiTransform = this.addComponent(UITransform);
        }
        const canvas = find('Canvas');
        if (canvas) {
            const canvasSize = canvas.getComponent(UITransform)?.contentSize;
            if (canvasSize) uiTransform.setContentSize(canvasSize);
        }
        this.node.on(Node.EventType.TOUCH_END, this.onTap, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_END, this.onTap, this);
    }

    private async onTap() {
        if (this.checking) return;
        this.checking = true;
        try {
            // 1. 隐藏 ClickStart 提示
            if (this.clickStart) {
                this.clickStart.active = false;
            }

            // 2. 校验本地双 token 是否存在且有效
            const nm = NetworkManager.getInstance();
            if (!nm) {
                console.error('[StartPanel] NetworkManager 未初始化');
                return;
            }
            const status = await nm.validateTokens();

            const ui = UIManager.getInstance();
            if (!ui) {
                console.error('[StartPanel] UIManager 未初始化');
                return;
            }

            if (status === 'valid') {
                // 3a. token 有效 → 直接进入 WorldPanel（切换，清空全部）
                console.log('[StartPanel] token 有效，进入世界');
                ui.openPanel('WorldPanel');
            } else {
                // 3b. token 无效 → 弹出 LoginPanel（overlay，不摧毁 StartPanel）
                console.log('[StartPanel] token 无效，弹出登录');
                ui.openPanel('LoginPanel', { overlay: true });
            }
        } catch (error) {
            console.error('[StartPanel] 校验 token 失败', error);
        }
    }
}
