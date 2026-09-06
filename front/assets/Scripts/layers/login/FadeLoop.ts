import { _decorator, Component, Label, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FadeLoop')
export class FadeLoop extends Component {
    @property(Label)
    label: Label = null; // 如果节点是 Label 则直接引用，否则用 Node

    start() {
        // 获取 UIOpacity 组件（如果没有则自动添加）
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.node.addComponent(UIOpacity);
        }
        uiOpacity.opacity = 255; // 初始完全不透明

        // 创建循环动画：淡出 → 淡入 → 重复
        tween(uiOpacity)
            .to(1.0, { opacity: 0 })   // 1秒淡出到透明
            .to(1.0, { opacity: 255 }) // 1秒淡入到不透明
            .union()                   // 将两个动作合并为一个序列
            .repeatForever()           // 无限循环
            .start();
    }
}