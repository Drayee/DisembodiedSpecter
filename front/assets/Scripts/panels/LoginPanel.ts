// LoginPanel.ts
// 登录面板：账号/密码/验证码 + 登录方式切换 + 提交。
// 图形验证码（CaptchaGetWindow）完全由前端生成与校验，不接后端。
// 挂载位置：LoginPanel 预制体根节点。
// 节点约定（按名称查找）：
//   Canvas/UsernameInput            (EditBox)
//   Canvas/PasswordInput            (EditBox)
//   Canvas/CaptchaInput             (EditBox, 注册模式显示)
//   Canvas/CaptchaGet               (Button, 注册模式显示)
//   Canvas/ChangeLoginWayButton     (Button, 登录/注册切换)
//   Canvas/NextStepButton           (Button, 提交)
//   Canvas/CaptchaGetWindow         (窗口, 初始隐藏)
//     ├─ PhotoCaptcha               (图形验证码渲染区)
//     ├─ PhotoCaptchaInput          (EditBox)
//     └─ SureButton                 (Button)
import { _decorator, Component, Node, EditBox, Button, Label, Graphics, UITransform, Color, find } from 'cc';
import { NetworkManager } from 'db://assets/Scripts/managers/NetworkManager';
import { UIManager } from 'db://assets/Scripts/managers/UIManager';
const { ccclass } = _decorator;

type LoginMode = 'login' | 'register';

// 图形验证码字符集（排除易混淆的 0/O、1/I/l）
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@ccclass('LoginPanel')
export class LoginPanel extends Component {
    private mode: LoginMode = 'login';

    private usernameInput: EditBox | null = null;
    private passwordInput: EditBox | null = null;
    private captchaInput: EditBox | null = null;

    private changeWayBtn: Node | null = null;
    private nextStepBtn: Node | null = null;
    private captchaGetBtn: Node | null = null;
    private nextStepLabel: Label | null = null;

    // 图形验证码窗口
    private captchaWindow: Node | null = null;
    private photoCaptcha: Node | null = null;
    private photoCaptchaInput: EditBox | null = null;
    private captchaCode = '';

    onLoad() {
        this.usernameInput = this.findEditBox('Canvas/UsernameInput');
        this.passwordInput = this.findEditBox('Canvas/PasswordInput');
        this.captchaInput = this.findEditBox('Canvas/CaptchaInput');

        this.changeWayBtn = find('Canvas/ChangeLoginWayButton', this.node);
        this.nextStepBtn = find('Canvas/NextStepButton', this.node);
        this.captchaGetBtn = find('Canvas/CaptchaGet', this.node);
        const labelNode = find('Canvas/NextStepButton/Label', this.node);
        this.nextStepLabel = labelNode ? labelNode.getComponent(Label) : null;

        this.changeWayBtn?.getComponent(Button)?.node.on(Button.EventType.CLICK, this.toggleMode, this);
        this.nextStepBtn?.getComponent(Button)?.node.on(Button.EventType.CLICK, this.onSubmit, this);
        this.captchaGetBtn?.getComponent(Button)?.node.on(Button.EventType.CLICK, this.onGetCaptcha, this);

        // 图形验证码窗口（前端生成，不接后端）
        this.captchaWindow = find('Canvas/CaptchaGetWindow', this.node);
        this.photoCaptcha = find('Canvas/CaptchaGetWindow/PhotoCaptcha', this.node);
        this.photoCaptchaInput = this.findEditBox('Canvas/CaptchaGetWindow/PhotoCaptchaInput');
        const sureBtn = find('Canvas/CaptchaGetWindow/SureButton', this.node);
        sureBtn?.getComponent(Button)?.node.on(Button.EventType.CLICK, this.onCaptchaSure, this);
        // 窗口初始隐藏（预制体里可能默认激活）
        if (this.captchaWindow) {
            this.captchaWindow.active = false;
        }

        this.applyModeUI();
    }

    onDestroy() {
        this.changeWayBtn?.getComponent(Button)?.node.off(Button.EventType.CLICK, this.toggleMode, this);
        this.nextStepBtn?.getComponent(Button)?.node.off(Button.EventType.CLICK, this.onSubmit, this);
        this.captchaGetBtn?.getComponent(Button)?.node.off(Button.EventType.CLICK, this.onGetCaptcha, this);
        const sureBtn = find('Canvas/CaptchaGetWindow/SureButton', this.node);
        sureBtn?.getComponent(Button)?.node.off(Button.EventType.CLICK, this.onCaptchaSure, this);
    }

    private findEditBox(path: string): EditBox | null {
        const node = find(path, this.node);
        return node ? node.getComponent(EditBox) : null;
    }

    // ==================== 模式切换 ====================

    private toggleMode() {
        this.mode = this.mode === 'login' ? 'register' : 'login';
        this.applyModeUI();
    }

    private applyModeUI() {
        const isRegister = this.mode === 'register';
        // 注册模式显示验证码输入 + 获取按钮
        if (this.captchaInput) {
            this.captchaInput.node.active = isRegister;
        }
        if (this.captchaGetBtn) {
            this.captchaGetBtn.active = isRegister;
        }
        if (this.nextStepLabel) {
            this.nextStepLabel.string = isRegister ? '注册' : '登录';
        }
        // 切回登录时关闭验证码窗口
        if (!isRegister && this.captchaWindow) {
            this.captchaWindow.active = false;
        }
    }

    // ==================== 提交 ====================

    private async onSubmit() {
        const nm = NetworkManager.getInstance();
        if (!nm) {
            console.error('[LoginPanel] NetworkManager 未初始化');
            return;
        }
        const username = this.usernameInput?.string.trim() || '';
        const password = this.passwordInput?.string || '';
        if (!username || !password) {
            console.warn('[LoginPanel] 请输入账号和密码');
            return;
        }

        try {
            if (this.mode === 'login') {
                await nm.login(username, password);
                console.log('[LoginPanel] 登录成功, userId =', nm.userId);
            } else {
                const code = this.captchaInput?.string.trim() || '';
                if (!code) {
                    console.warn('[LoginPanel] 请输入验证码');
                    return;
                }
                // 后端注册需要 email；界面暂无邮箱输入框，先取用户名并提示
                // TODO: 接入邮箱输入框（需要编辑器中添加 EmailInput 节点）后改为真实邮箱
                const email = username;
                await nm.register(username, password, email, code);
                console.log('[LoginPanel] 注册成功, userId =', nm.userId);
            }
            // 登录/注册成功 → 进入 WorldPanel（切换：清空 StartPanel + LoginPanel）
            UIManager.getInstance()?.openPanel('WorldPanel');
        } catch (e: any) {
            console.error('[LoginPanel] 提交失败', e);
        }
    }

    // ==================== 图形验证码（前端生成，不接后端） ====================

    /** 点击"获取验证码" → 弹出图形验证码窗口 */
    private onGetCaptcha() {
        if (!this.captchaWindow) {
            console.warn('[LoginPanel] 未找到 CaptchaGetWindow 节点');
            return;
        }
        this.refreshCaptcha();
        this.captchaWindow.active = true;
    }

    /** 点击"确定" → 本地校验图形验证码 */
    private onCaptchaSure() {
        const input = this.photoCaptchaInput?.string.trim().toUpperCase() || '';
        if (!input) {
            console.warn('[LoginPanel] 请输入图形验证码');
            return;
        }
        if (input === this.captchaCode) {
            console.log('[LoginPanel] 图形验证码通过');
            if (this.captchaWindow) {
                this.captchaWindow.active = false;
            }
            if (this.photoCaptchaInput) {
                this.photoCaptchaInput.string = '';
            }
            // TODO: 图形验证码通过后，可在此触发后续流程（如发送邮箱验证码）
        } else {
            console.warn('[LoginPanel] 图形验证码错误，已刷新');
            if (this.photoCaptchaInput) {
                this.photoCaptchaInput.string = '';
            }
            this.refreshCaptcha();
        }
    }

    /** 生成新验证码并渲染 */
    private refreshCaptcha() {
        this.captchaCode = this.generateCaptchaCode(4);
        this.renderCaptcha(this.captchaCode);
    }

    private generateCaptchaCode(len: number): string {
        let code = '';
        for (let i = 0; i < len; i++) {
            code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
        }
        return code;
    }

    /** 在 PhotoCaptcha 节点上绘制：干扰线/噪点 + 随机旋转的字符 */
    private renderCaptcha(code: string) {
        const photo = this.photoCaptcha;
        if (!photo) {
            console.warn('[LoginPanel] 未找到 PhotoCaptcha 节点');
            return;
        }
        photo.removeAllChildren();

        const ut = photo.getComponent(UITransform);
        const w = ut ? ut.width : 220;
        const h = ut ? ut.height : 60;
        const rand = (range: number) => (Math.random() - 0.5) * range;

        // 背景干扰线 + 噪点（Graphics 局部坐标，原点在中心）
        const g = photo.getComponent(Graphics) || photo.addComponent(Graphics);
        g.clear();
        g.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            g.strokeColor = new Color(120 + Math.floor(Math.random() * 100), 120 + Math.floor(Math.random() * 100), 120 + Math.floor(Math.random() * 100), 160);
            g.moveTo(rand(w), rand(h));
            g.lineTo(rand(w), rand(h));
            g.stroke();
        }
        for (let i = 0; i < 30; i++) {
            g.fillColor = new Color(140 + Math.floor(Math.random() * 80), 140 + Math.floor(Math.random() * 80), 140 + Math.floor(Math.random() * 80), 140);
            g.circle(rand(w), rand(h), 1 + Math.random() * 2);
            g.fill();
        }

        // 字符：每字符一个 Label，随机颜色/旋转/抖动
        const n = code.length;
        const cell = w / n;
        for (let i = 0; i < n; i++) {
            const chNode = new Node(`ch${i}`);
            chNode.layer = photo.layer;
            const chUt = chNode.addComponent(UITransform);
            chUt.setContentSize(cell, h);
            const label = chNode.addComponent(Label);
            label.string = code[i];
            label.fontSize = h * 0.72;
            label.lineHeight = h * 0.85;
            label.color = new Color(
                30 + Math.floor(Math.random() * 140),
                30 + Math.floor(Math.random() * 140),
                30 + Math.floor(Math.random() * 140),
                255,
            );
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            chNode.setPosition(cell * i + cell / 2 - w / 2 + rand(10), rand(10), 0);
            chNode.setRotationFromEuler(0, 0, rand(40));
            photo.addChild(chNode);
        }
    }
}
