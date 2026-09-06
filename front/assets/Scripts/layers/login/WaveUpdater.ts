import { _decorator, Component, Material } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WaveUpdater')
export class WaveUpdater extends Component {
    @property(Material)
    waveMat: Material = null;

    private elapsed: number = 0;

    update(deltaTime: number) {
        this.elapsed += deltaTime;
        if (this.waveMat) {
            this.waveMat.setProperty('u_time', this.elapsed);
        }
    }
}