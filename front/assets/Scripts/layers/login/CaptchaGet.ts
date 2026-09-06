import { _decorator, Component, Node, EditBox, EventTouch, EventMouse, Button, Sprite, UITransform, Texture2D, ImageAsset, SpriteFrame } from 'cc';
import { NetworkManager } from "db://assets/Scripts/managers/NetworkManager";
const { ccclass, property } = _decorator;

@ccclass('CaptchaGet')
export class CaptchaGet extends Component {
    private static _instance: CaptchaGet;

    photoNode: Node = null;
    inputBox: EditBox = null;
    submitBtn: Button = null;

    private captchaText: string = '';
    private captchaWidth: number = 200;
    private captchaHeight: number = 80;

    public email: string = null;
    public showStatus: (msg: string, isError: boolean) => void = null;
    public getCaptchaTextSuccess: (email: string) => void = null;
    public getCaptchaTextCancel: () => void = null;

    // ---------- 长按检测 ----------
    private touchStartTime: number = 0;
    private isPressed: boolean = false;
    private readonly longPressThreshold: number = 500; // 毫秒

    static getInstance(): CaptchaGet {
        return this._instance;
    }

    onLoad() {
        console.log("CaptchaGet onLoad");
        CaptchaGet._instance = this;
        this.photoNode = this.node.getChildByName('PhotoCaptcha');
        this.inputBox = this.node.getChildByName('PhotoCaptchaInput')?.getComponent(EditBox);
        this.submitBtn = this.node.getChildByName('SureButton')?.getComponent(Button);
    }

    start() {
        const uiTransform = this.photoNode?.getComponent(UITransform);
        if (uiTransform) {
            this.captchaWidth = uiTransform.width;
            this.captchaHeight = uiTransform.height;
        }

        this.generateCaptcha();

        // 绑定提交按钮
        this.submitBtn?.node.on(Node.EventType.TOUCH_END, this.onSubmitBtnClick, this);

        if (this.photoNode) {
            // ① 触摸事件：记录开始时间
            this.photoNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            // ② 触摸结束：短按刷新，长按取消
            this.photoNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

            // ③ 鼠标事件：专门处理右键（取消），左键不处理（因为左键会触发 TOUCH_END）
            this.photoNode.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);

            // 阻止浏览器右键菜单
            this.photoNode.on('contextmenu', (e: Event) => e.preventDefault(), this);
        }
    }

    // ---------- 触摸事件处理 ----------
    private onTouchStart(event: EventTouch): void {
        this.touchStartTime = Date.now();
        this.isPressed = true;
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this.isPressed) return;
        this.isPressed = false;

        // 计算按压时长
        const duration = Date.now() - this.touchStartTime;
        if (duration >= this.longPressThreshold) {
            // 长按 → 取消
            this.onBackBtnClick();
        } else {
            // 短按 → 刷新
            this.onRefreshClick();
        }
    }

    // ---------- 鼠标事件处理 ----------
    private onMouseDown(event: EventMouse): void {
        // 只处理右键（BUTTON_RIGHT = 2）
        if (event.getButton() === EventMouse.BUTTON_RIGHT) {
            // 阻止事件冒泡，避免触发其他处理
            event.propagationStopped = true;
            this.onBackBtnClick();
        }
        // 左键和中键忽略（左键会通过触摸事件处理）
    }

    // ---------- 业务方法 ----------
    private onBackBtnClick(): void {
        this.node.active = false;
        this.getCaptchaTextCancel();
    }

    private onRefreshClick(): void {
        this.generateCaptcha();
        if (this.inputBox) {
            this.inputBox.string = '';
        }
        this.showStatus?.('验证码已刷新', false);
    }

    // ---------- 以下为原有方法（未改动） ----------
    private generateRandomString(length: number = 4): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    private generateCaptcha(): void {
        this.captchaText = this.generateRandomString(4);
        const canvas = document.createElement('canvas');
        canvas.width = this.captchaWidth;
        canvas.height = this.captchaHeight;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
            ctx.lineWidth = 2 + Math.random() * 3;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        for (let i = 0; i < 80; i++) {
            ctx.fillStyle = `rgba(${Math.random()*255|0}, ${Math.random()*255|0}, ${Math.random()*255|0}, ${0.3+Math.random()*0.5})`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }

        const chars = this.captchaText.split('');
        const fontSize = 30 + Math.random() * 10;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const startX = 20;
        const spacing = (canvas.width - 40) / chars.length;
        chars.forEach((char, index) => {
            const x = startX + index * spacing + spacing / 2;
            const y = canvas.height / 2 + (Math.random() - 0.5) * 15;
            const rotate = (Math.random() - 0.5) * 0.4;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotate);
            ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 40%)`;
            ctx.fillText(char, 0, 0);
            ctx.restore();
        });

        const imageAsset = new ImageAsset(canvas);
        const texture2d = new Texture2D();
        texture2d.image = imageAsset;
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture2d;

        const sprite = this.photoNode?.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = spriteFrame;
        } else if (this.photoNode) {
            const newSprite = this.photoNode.addComponent(Sprite);
            newSprite.spriteFrame = spriteFrame;
            const uiTransform = this.photoNode.getComponent(UITransform);
            if (uiTransform) {
                uiTransform.setContentSize(this.captchaWidth, this.captchaHeight);
            }
        }
    }

    private onSubmitBtnClick(): void {
        if (!this.inputBox) return;
        const input = this.inputBox.string.trim();
        if (input === '') {
            this.showStatus?.('请输入验证码', true);
            return;
        }
        if (input.toUpperCase() === this.captchaText.toUpperCase()) {
            this.showStatus?.('验证码正确', false);
            NetworkManager.getInstance().sendVerifyCode(this.email)
                .then(() => {
                    this.showStatus?.('验证码发送成功', false);
                    this.node.active = false;
                    this.getCaptchaTextSuccess?.(this.email);
                })
                .catch(e => {
                    this.showStatus?.(e.message || '验证码发送失败', true);
                });
        } else {
            this.showStatus?.('验证码错误，请重新输入', true);
        }
    }

    public resetCaptcha(): void {
        this.onRefreshClick();
    }
}