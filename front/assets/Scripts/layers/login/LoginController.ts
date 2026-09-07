// LoginController.ts
import { _decorator, Component, Color, Sprite, SpriteFrame, Button, EditBox, Label, Node } from 'cc';
import { UIManager } from 'db://assets/Scripts/managers/UIManager';
import {NetworkManager} from "db://assets/Scripts/managers/NetworkManager";
import {TooltipBinder} from "db://assets/Scripts/layers/TooltipBinder";
import {CaptchaGet} from "db://assets/Scripts/layers/login/CaptchaGet"; // 如果你的 UIManager 路径不同请调整
const { ccclass, property } = _decorator;

enum Status {
    USERPASS,
    EMAIL,
    REGISTER,
    SET_PASSWORD,
}

const INPUT_TEXT: Record<Status, {first:string[],second:string[]}> = {
    [Status.USERPASS]: {
        first:['请刻下凡尘伪名','请输入用户名'],
        second:['请献上根源密钥','请输入密码'],
    },
    [Status.EMAIL]: {
        first:['请铭刻灵魂信标','请输入邮箱'],
        second:['请献上临时神谕','请输入验证码'],
    },
    [Status.SET_PASSWORD]: {
        first:['请刻下凡尘伪名','请输入新密码'],
        second:['请献上根源密钥','请输入新密码'],
    },
    [Status.REGISTER]: {
        first:['请铭刻灵魂信标','请输入邮箱或手机号'],
        second:['请献上临时神谕','请输入验证码'],
    },
};

@ccclass('LoginController')
export class LoginController extends Component {
    @property({type: EditBox, tooltip: '第一个输入框'})
    FirstInput: EditBox = null;

    @property({type: EditBox, tooltip: '第二个输入框'})
    SecondInput: EditBox = null;

    @property({type: Button, tooltip: '切换按钮'})
    SwitchBtn: Button = null;

    @property({type: [SpriteFrame], tooltip: '切换按钮图片'})
    stateFrames: SpriteFrame[] = [];

    @property({type: Button, tooltip: '注册按钮'})
    RegisterBtn: Button = null;

    @property({type: Node, tooltip: '图形验证码弹窗'})
    captchaPopup: Node = null;

    @property({type: Button, tooltip: '下一步按钮'})
    NextStepBtn: Button = null;

    @property({type: Label, tooltip: '状态提示标签（可选）'})
    statusLabel: Label = null;

    networkManager: NetworkManager = NetworkManager.getInstance();

    captchaEmail: string = null;

    nowStatus: Status = Status.USERPASS;

    private tempCode: string = null;

    onLoad() {
        // 绑定点击事件
        this.NextStepBtn.node.on(Button.EventType.CLICK, this.onNextStepClick, this);
        this.SwitchBtn.node.on(Button.EventType.CLICK, this.onSwitchClick, this);
        this.RegisterBtn.node.on(Button.EventType.CLICK, this.onRegisterClick, this);
    }

    onSwitchClick() {
        switch (this.nowStatus) {
            case Status.USERPASS:
                this.nowStatus = Status.EMAIL;
                this.updateLoginFields();
                this.SwitchBtn.getComponent(Sprite).spriteFrame = this.stateFrames[1];
                break;
            case Status.EMAIL:
            case Status.SET_PASSWORD:
            case Status.REGISTER:
                this.nowStatus = Status.USERPASS;
                this.updateLoginFields();
                this.SwitchBtn.getComponent(Sprite).spriteFrame = this.stateFrames[0];
                break;
        }
    }

    onRegisterClick() {
        this.nowStatus = Status.REGISTER;
        this.updateLoginFields();
    }

    onNextStepClick() {
        let email = '';
        let username = '';
        let password = '';
        switch (this.nowStatus) {
            case Status.USERPASS:
                username = this.FirstInput.string.trim();
                password = this.SecondInput.string.trim();

                // 简单非空校验
                if (!username || !password) {
                    this.showStatus('请输入用户名和密码', true);
                    return;
                }

                this.showStatus('登录中...', false);

                this.networkManager.login(username, password)
                    .then(() => {
                        this.onLoginSuccess(username);
                    }).catch((err) => {
                    this.showStatus(err.message, true);
                    return;
                })
                break;
            case Status.EMAIL:
                email = this.FirstInput.string.trim();
                if (this.captchaEmail !== email) {
                    this.captchaEmail = null;
                    if (!email) {
                        this.showStatus('请输入邮箱', true);
                        return;
                    }
                    this.getCaptcha(email);
                } else {
                    this.showStatus('暂时不支持邮箱登录', true);
                }
                break;
            case Status.REGISTER:
                email = this.FirstInput.string.trim();
                this.tempCode = this.SecondInput.string.trim();
                if (this.captchaEmail !== email) {
                    this.captchaEmail = null;
                    if (!email) {
                        this.showStatus('请输入邮箱', true);
                        return;
                    }
                    this.getCaptcha(email);
                } else {
                    this.FirstInput.string = '';
                    this.SecondInput.string = '';
                    this.nowStatus = Status.SET_PASSWORD;
                }
                break;
            case Status.SET_PASSWORD:
                username = this.FirstInput.string.trim();
                password = this.SecondInput.string.trim();
                if (!password) {
                    this.showStatus('请输入密码', true);
                    return;
                }
                this.showStatus('注册中...', false);
                this.networkManager.register(username, password, this.captchaEmail, this.tempCode)
                    .then(() => {
                        this.onLoginSuccess(username);
                    }).catch((err) => {
                    this.showStatus(err.message, true);
                    return;
                })
                break;
        }
    }

    private onLoginSuccess(username: string) {
        this.showStatus(`欢迎，${username}！`, false);
        // 通过 UIManager 关闭当前面板并打开 WorldPanel
        const uiMgr = UIManager.getInstance();
        if (uiMgr) {
            uiMgr.clearAll();          // 关闭 LoginPanel
            uiMgr.openPanel('WorldPanel', {overlay: false}); // 切换至主界面
        }
    }

    private getCaptcha(email: string) {
        this.captchaPopup.active = true;
        this.FirstInput.node.active = false;
        this.SecondInput.node.active = false;
        this.NextStepBtn.node.active = false;
        this.RegisterBtn.node.active = false;
        this.SwitchBtn.node.active = false;
        console.log("获取验证码", email);

        this.scheduleOnce(() => {
            console.log("获取验证码", email);
            CaptchaGet.getInstance().email = email;
            CaptchaGet.getInstance().showStatus = this.showStatus;
            CaptchaGet.getInstance().getCaptchaTextSuccess = this.getCaptchaTextSuccess;
            CaptchaGet.getInstance().getCaptchaTextCancel = this.getCaptchaTextCancel;
        }, 1);
    }

    public showStatus = (msg: string, isError: boolean) => {
        if (this.statusLabel) {
            this.statusLabel.string = msg;
            this.statusLabel.color = isError ? new Color(255, 0, 0) : new Color(0, 255, 0);
        }
    };

    public getCaptchaTextSuccess = (email: string) => {
        this.resetLoginFields();
        this.captchaEmail = email;
    }

    public getCaptchaTextCancel = () => {
        this.resetLoginFields();
        this.captchaEmail = null;
    }

    private resetLoginFields() {
        this.FirstInput.node.active = true;
        this.SecondInput.node.active = true;
        this.NextStepBtn.node.active = true;
        this.RegisterBtn.node.active = true;
        this.SwitchBtn.node.active = true;
    }

    private updateLoginFields() {
        const t1 = this.FirstInput.getComponent("TooltipBinder") as TooltipBinder;
        const t2 = this.SecondInput.getComponent("TooltipBinder") as TooltipBinder;
        this.FirstInput.placeholder = INPUT_TEXT[this.nowStatus].first[0];
        this.SecondInput.placeholder = INPUT_TEXT[this.nowStatus].second[0];
        t1.text = INPUT_TEXT[this.nowStatus].first[1];
        t2.text = INPUT_TEXT[this.nowStatus].second[1];
    }
}