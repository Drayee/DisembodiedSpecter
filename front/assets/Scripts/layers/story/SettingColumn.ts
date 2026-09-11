import { _decorator, Component, Node } from 'cc';
import {UIManager} from "db://assets/Scripts/managers/UIManager";
const { ccclass, property } = _decorator;

@ccclass('SettingColumn')
export class SettingColumn extends Component {
    start() {
        this.node.getChildByName('Setting').on('click', this.setting, this);
    }

    update(deltaTime: number) {
        
    }

    onDestroy() {
        this.node.getChildByName('Setting').off('click', this.setting, this);
    }

    setting() {
        UIManager.getInstance().openPanel('SettingPanel', { overlay: true });
    }
}


