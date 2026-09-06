// TooltipManager.ts
import { _decorator, Component, Node, Label, UITransform, Sprite, Color, Vec3, instantiate, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TooltipManager')
export class TooltipManager extends Component {
    private static _instance: TooltipManager = null;
    public static get instance(): TooltipManager {
        return this._instance;
    }

    @property({ type: Prefab, tooltip: 'Tooltip 预制体' })
    public tooltipPrefab: Prefab = null;

    private tooltipNode: Node = null;      // 当前显示的提示节点
    private label: Label = null;
    private sprite: Sprite = null;
    private uiTransform: UITransform = null;

    private isShowing: boolean = false;
    private hideTimer: any = null;
    private parentNode: Node = null;       // 提示的父节点（通常是 Canvas）

    onLoad() {
        if (TooltipManager._instance) {
            this.destroy();
            return;
        }
        TooltipManager._instance = this;
    }

    // 初始化，由 UIManager 调用，传入父节点（Canvas）
    public init(parent: Node) {
        this.parentNode = parent;
        if (!this.tooltipPrefab) {
            console.error('TooltipManager: tooltipPrefab 未设置');
            return;
        }
        // 实例化提示节点
        this.tooltipNode = instantiate(this.tooltipPrefab);
        this.tooltipNode.parent = parent;
        this.tooltipNode.layer = 33554432;   // 继承父节点层
        this.tooltipNode.active = false;

        // 获取组件
        // 获取 TooltipNode（直接子节点）
        const tooltipNode = this.tooltipNode.getChildByName('TooltipNode');
        if (!tooltipNode) {
            console.error('TooltipManager: 未找到 TooltipNode 子节点');
            return;
        }

        // 获取 TooltipNode 上的组件
        this.uiTransform = tooltipNode.getComponent(UITransform);
        this.sprite = tooltipNode.getComponent(Sprite);

        // 获取 Label 子节点
        const labelNode = tooltipNode.getChildByName('Label');
        if (labelNode) {
            this.label = labelNode.getComponent(Label);
        } else {
            console.error('TooltipManager: 未找到 Label 子节点');
        }
    }

    /**
     * 显示提示
     * @param text      文字
     * @param worldPos  鼠标世界坐标
     * @param bgColor   背景色（含透明度）
     * @param textColor 文字颜色
     * @param fontSize  字体大小
     * @param offset    相对于鼠标的偏移量
     * @param duration  自动消失时间（秒），0 表示不自动消失
     */
    public show(
        text: string,
        worldPos: Vec3,
        bgColor: Color,
        textColor: Color,
        fontSize: number,
        offset: Vec3 = new Vec3(20, -20, 0),
        duration: number = 2.5
    ) {
        if (!this.tooltipNode) return;

        // 如果正在显示，先隐藏（确保只有一个）
        this.hide();

        // 更新文字
        this.label.string = text;
        this.label.fontSize = fontSize;
        this.label.color = textColor;
        // 强制刷新 Label 尺寸
        const labelTransform = this.label.node.getComponent(UITransform);
        if (labelTransform) {
            this.label.updateRenderData();
        }

        this.scheduleOnce(() => {
            const labelTransform = this.label.node.getComponent(UITransform);
            if (labelTransform) {
                const labelSize = labelTransform.contentSize;
                const padding = 10;
                const width = Math.max(labelSize.width + padding * 2, 20); // 最小宽度防止太小
                const height = Math.max(labelSize.height + padding * 2, 20);
                this.uiTransform.setContentSize(width, height);
                // 如果背景 Sprite 需要更新，可以重新设置颜色等
                if (this.sprite) {
                    this.sprite.color = bgColor;
                }
                // 确保 Label 居中
                this.label.node.setPosition(0, 0, 0);
            }
            this.tooltipNode.setSiblingIndex(this.node.parent.children.length - 1);
        }, 0);

        // 计算位置（世界坐标 → Canvas 本地坐标）
        const canvas = this.parentNode;
        const canvasUIT = canvas.getComponent(UITransform);
        if (canvasUIT) {
            const localPos = canvasUIT.convertToNodeSpaceAR(worldPos);
            const finalPos = localPos.clone().add(offset);
            // 边界限制，防止超出屏幕
            const size = canvasUIT.contentSize;
            finalPos.x = Math.max(-size.width/2 + 10, Math.min(size.width/2 - 10, finalPos.x));
            finalPos.y = Math.max(-size.height/2 + 10, Math.min(size.height/2 - 10, finalPos.y));
            this.tooltipNode.setPosition(finalPos);
        } else {
            this.tooltipNode.setPosition(worldPos);
        }

        this.isShowing = true;
        this.tooltipNode.active = true;

        // 自动消失定时器
        if (duration > 0) {
            this.hideTimer = setTimeout(() => {
                this.hide();
            }, duration * 1000);
        }
    }

    /** 立即隐藏提示 */
    public hide() {
        if (this.tooltipNode) {
            this.tooltipNode.active = false;
        }
        this.isShowing = false;
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    }

    /** 更新提示位置（鼠标移动时调用） */
    public updatePosition(worldPos: Vec3, offset: Vec3 = new Vec3(20, -20, 0)) {
        if (!this.isShowing || !this.tooltipNode || !this.tooltipNode.active) return;
        const canvas = this.parentNode;
        const canvasUIT = canvas.getComponent(UITransform);
        if (canvasUIT) {
            const localPos = canvasUIT.convertToNodeSpaceAR(worldPos);
            const finalPos = localPos.clone().add(offset);
            const size = canvasUIT.contentSize;
            finalPos.x = Math.max(-size.width/2 + 10, Math.min(size.width/2 - 10, finalPos.x));
            finalPos.y = Math.max(-size.height/2 + 10, Math.min(size.height/2 - 10, finalPos.y));
            this.tooltipNode.setPosition(finalPos);
        }
    }

    onDestroy() {
        if (TooltipManager._instance === this) {
            TooltipManager._instance = null;
        }
        this.hide();
    }
}