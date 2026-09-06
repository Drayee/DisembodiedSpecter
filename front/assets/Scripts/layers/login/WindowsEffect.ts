import { _decorator, Component, Graphics, UITransform } from 'cc';
const { ccclass, property } = _decorator;

export enum EffectType {
    None = -1,
    WhiteBorder = 0,
    GrayFill = 1,
    RandomSquares = 2,
}

@ccclass('EffectSwitcher')
export class EffectSwitcher extends Component {
    // ---------- 闪烁参数 ----------
    @property({ min: 2, max: 5 })
    flashCountMin: number = 2;
    @property({ min: 2, max: 5 })
    flashCountMax: number = 5;

    @property({ min: 0.05 })
    flashInterval: number = 0.15; // 每次闪烁切换间隔（秒）

    // ---------- 停顿参数（随机范围） ----------
    @property({ min: 0.1 })
    minPause: number = 1.0;
    @property({ min: 0.1 })
    maxPause: number = 3.0;

    // ---------- 随机方块参数 ----------
    @property
    squareCountMin: number = 3;
    @property
    squareCountMax: number = 10;
    @property
    squareMinSize: number = 10;
    @property
    squareMaxSize: number = 50;

    @property({ type: Graphics })
    graphics: Graphics | null = null;

    // ---------- 内部状态 ----------
    private state: 'idle' | 'flashing' | 'pausing' = 'idle';
    private targetEffect: EffectType = EffectType.WhiteBorder; // 当前轮的目标效果
    private flashCounter: number = 0;          // 已执行闪烁次数
    private totalFlashCount: number = 0;        // 本次应闪烁总次数
    private timer: number = 0;
    private pauseDuration: number = 1.5;        // 本次停顿时长

    start() {
        // 确保 Graphics 组件
        if (!this.graphics) {
            this.graphics = this.getComponent(Graphics);
            if (!this.graphics) {
                this.graphics = this.addComponent(Graphics);
            }
        }

        // 初始触发第一次效果
        this.state = 'idle';
        this.timer = 0;
        // 直接进入下一轮
        this.enterNextEffect();
    }

    update(deltaTime: number) {
        this.timer += deltaTime;

        switch (this.state) {
            case 'idle':
                // 空闲状态不会在这里处理，由 enterNextEffect 触发切换
                break;

            case 'flashing':
                if (this.timer >= this.flashInterval) {
                    this.timer = 0;
                    this.flashCounter++;
                    // 奇数次显示目标效果，偶数次隐藏（显示 None）
                    if (this.flashCounter % 2 === 1) {
                        this.currentEffect = this.targetEffect;
                    } else {
                        this.currentEffect = EffectType.None;
                    }
                    this.redraw();

                    // 检查是否达到总次数
                    if (this.flashCounter >= this.totalFlashCount) {
                        // 闪烁结束，进入停顿状态，并确保最后显示目标效果
                        this.currentEffect = EffectType.None;
                        this.redraw();
                        this.state = 'pausing';
                        this.timer = 0;
                        // 生成随机停顿时间
                        this.pauseDuration = this.getRandomPause();
                    }
                }
                break;

            case 'pausing':
                if (this.timer >= this.pauseDuration) {
                    // 停顿结束，进入下一轮
                    this.state = 'idle';
                    this.timer = 0;
                    this.enterNextEffect();
                }
                break;
        }
    }

    // ---------- 流程控制 ----------
    private enterNextEffect() {
        // 轮询到下一个效果（三种循环）
        let next = (this.targetEffect + 1) % 3;
        this.targetEffect = next;
        // 生成闪烁次数
        this.totalFlashCount = Math.floor(Math.random() * (this.flashCountMax - this.flashCountMin + 1)) + this.flashCountMin;
        this.flashCounter = 0;
        // 进入闪烁状态，立即显示目标效果（第一次出现）
        this.currentEffect = this.targetEffect;
        this.redraw();
        this.state = 'flashing';
        this.timer = 0;
    }

    private getRandomPause(): number {
        const min = Math.min(this.minPause, this.maxPause);
        const max = Math.max(this.minPause, this.maxPause);
        return Math.random() * (max - min) + min;
    }

    // ---------- 外部调用接口 ----------
    private currentEffect: EffectType = EffectType.None;

    /**
     * 手动切换到指定效果，并立即停止自动闪烁流程（重置状态）
     */
    public switchToEffect(effect: EffectType) {
        this.state = 'idle';
        this.timer = 0;
        this.targetEffect = effect;
        this.currentEffect = effect;
        this.redraw();
        // 不自动进入下一轮，等待下次自动触发（或外部调用 resumeAutoPlay）
    }

    /**
     * 恢复自动播放（如果之前被手动切换中断）
     */
    public resumeAutoPlay() {
        if (this.state === 'idle') {
            this.enterNextEffect();
        }
    }

    // ---------- 绘制逻辑 ----------
    public redraw() {
        if (!this.graphics) return;
        const g = this.graphics;
        g.clear();

        const uiTransform = this.getComponent(UITransform);
        const width = uiTransform.width;
        const height = uiTransform.height;
        const halfW = width / 2;
        const halfH = height / 2;

        switch (this.currentEffect) {
            case EffectType.WhiteBorder:
                this.drawBorder(g, halfW, halfH);
                break;
            case EffectType.GrayFill:
                this.drawGrayFill(g, halfW, halfH);
                break;
            case EffectType.RandomSquares:
                this.drawRandomSquares(g, halfW, halfH);
                break;
            default:
                break;
        }
    }

    private drawBorder(g: Graphics, hw: number, hh: number) {
        g.lineWidth = 2;
        g.strokeColor.fromHEX('#ffffff');
        g.rect(-hw, -hh, hw * 2, hh * 2);
        g.stroke();
    }

    private drawGrayFill(g: Graphics, hw: number, hh: number) {
        g.fillColor.set(204, 204, 204, 128);
        g.rect(-hw, -hh, hw * 2, hh * 2);
        g.fill();
    }

    private drawRandomSquares(g: Graphics, hw: number, hh: number) {
        const count = Math.floor(Math.random() * (this.squareCountMax - this.squareCountMin + 1)) + this.squareCountMin;
        g.fillColor.set(136, 136, 136, 200);

        for (let i = 0; i < count; i++) {
            const size = Math.random() * (this.squareMaxSize - this.squareMinSize) + this.squareMinSize;
            const maxX = hw - size / 2;
            const minX = -hw + size / 2;
            const maxY = hh - size / 2;
            const minY = -hh + size / 2;
            if (maxX < minX || maxY < minY) continue;

            const x = Math.random() * (maxX - minX) + minX;
            const y = Math.random() * (maxY - minY) + minY;
            g.rect(x - size/2, y - size/2, size, size);
            g.fill();
        }
    }
}