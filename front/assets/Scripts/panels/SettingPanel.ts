import { _decorator, Component, Node } from 'cc';
import {NetworkManager} from "db://assets/Scripts/managers/NetworkManager";
import {UIManager} from "db://assets/Scripts/managers/UIManager";
const { ccclass, property } = _decorator;

@ccclass('SettingPanel')
export class SettingPanel extends Component {

    networkManager: NetworkManager = NetworkManager.getInstance();

    @property({type: Node})
    content: Node;

    @property({type: Node})
    options: Node;

    start() {
        this.registerButtons();
    }

    update(deltaTime: number) {
        
    }

    onDestroy() {
        this.unregisterButtons();
    }

    private Logout() {
        this.networkManager.logout().then(r => {
            console.log('logout success');
        }).catch(err => {
            console.error('logout error:', err);
        });
        UIManager.getInstance().clearAll();
        UIManager.getInstance().openPanel('StartPanel');
    }

    private registerButtons() {
        const user = this.content.getChildByName('user');
        if (!user) {
            return;
        }
        user.getChildByName("Logout").on('click', this.Logout, this);
    }

    private unregisterButtons() {
        const user = this.content.getChildByName('user');
        user.getChildByName("Logout").off('click', this.Logout, this);
    }
}


