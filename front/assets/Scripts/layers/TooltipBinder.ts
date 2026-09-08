// TooltipBinder.ts
import { _decorator, Component, Node, EventMouse, Vec3, Color } from 'cc';
import { TooltipManager } from '../managers/TooltipManager';
const { ccclass, property } = _decorator;

@ccclass('TooltipBinder')
export class TooltipBinder extends Component {
    @property({ tooltip: '提示文字' })
    public text: string = '提示';

    @property({tooltip: '背景色（可透明）' })
    public bgColor: Color = new Color(50, 50, 50, 220);

    @property({tooltip: '文字颜色' })
    public textColor: Color = new Color(255, 255, 255, 255);

    @property({ tooltip: '字体大小' })
    public fontSize: number = 24;

    @property({ tooltip: '相对于鼠标的偏移量' })
    public offset: Vec3 = new Vec3(20, -20, 0);

    @property({ min: 0, tooltip: '鼠标悬停延迟（秒）' })
    public delay: number = 1.0;

    @property({ min: 0, tooltip: '显示持续时间（秒），0为不自动消失' })
    public duration: number = 2.5;

    private isHovering: boolean = false;
    private delayTimer: any = null;

    onLoad() {
        this.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }

    onMouseEnter(event: EventMouse) {
        this.isHovering = true;
        const mgr = TooltipManager.instance;
        if (!mgr) return;

        // 清除之前的延迟定时器
        if (this.delayTimer) clearTimeout(this.delayTimer);

        this.delayTimer = setTimeout(() => {
            if (this.isHovering) {
                const worldPos = event.getLocation().toVec3();
                mgr.show(
                    this.text,
                    worldPos,
                    this.bgColor,
                    this.textColor,
                    this.fontSize,
                    this.offset,
                    this.duration
                );
            }
        }, this.delay * 1000);
    }

    onMouseLeave() {
        this.isHovering = false;
        if (this.delayTimer) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
        // 鼠标离开时立即隐藏提示
        const mgr = TooltipManager.instance;
        if (mgr) mgr.hide();
    }

    onDestroy() {
        this.node.off(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
        if (this.delayTimer) clearTimeout(this.delayTimer);
    }
}