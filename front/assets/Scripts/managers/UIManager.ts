// UIManager.ts
// UI 面板管理：按 UUID 加载预制体（不依赖 resources 目录，不移动项目结构），
// 支持两种打开方式：
//   - 切换式（overlay=false）：清空当前所有面板后显示（如 进入 WorldPanel）
//   - 弹窗式（overlay=true）：在当前面板之上叠加，不摧毁下层（如 在 StartPanel 上弹出 LoginPanel）
import { _decorator, Component, Node, Prefab, instantiate, director, assetManager, Canvas, AssetManager  } from 'cc';
import {TooltipManager} from "db://assets/Scripts/managers/TooltipManager";
const { ccclass, property } = _decorator;

/** UI 面板所在的 Asset Bundle（在编辑器中把 assets/Prefabs/UI 配置为 Bundle，名称填 ui） */
const PANEL_BUNDLE = 'ui';
let uiBundlePromise: Promise<AssetManager.Bundle> | null = null;

function ensurePanelBundle(): Promise<AssetManager.Bundle> {
    if (!uiBundlePromise) {
        uiBundlePromise = new Promise((resolve, reject) => {
            assetManager.loadBundle(PANEL_BUNDLE, (err, bundle) => {
                if (err) {
                    uiBundlePromise = null;
                    reject(new Error(`加载 Bundle(${PANEL_BUNDLE}) 失败: ${err.message || err}`));
                } else {
                    resolve(bundle);
                }
            });
        });
    }
    return uiBundlePromise;
}

export interface OpenPanelOptions {
    /** true=弹窗叠加（保留下层面板）；false=切换（清空全部） */
    overlay?: boolean;
}

@ccclass('UIManager')
export class UIManager extends Component {
    private static _instance: UIManager = null;
    public static getInstance(): UIManager {
        return this._instance;
    }

    @property(Node)
    public uiRoot: Node = null; // 在编辑器中关联 UIRoot 节点

    @property({ type: TooltipManager, tooltip: '场景中的 TooltipManager 引用' })
    public tooltipManager: TooltipManager = null;

    // 当前面板栈（栈底为最底层，栈顶为最上层）
    private _panels: Node[] = [];

    onLoad() {
        UIManager._instance = this;
        // uiRoot 兜底：未在编辑器关联时，按场景节点名查找
        if (!this.uiRoot) {
            const scene = director.getScene();
            const node = scene && scene.getChildByName('UIRoot');
            if (node) {
                this.uiRoot = node;
            }
        }
    }

    start() {
        // 进入场景后默认进入 StartPanel（点击任意处开始）；
        // 优先使用场景中关联的 startPanel 引用，否则按 UUID 加载
        this.openPanel('StartPanel', { overlay: true });
        if (this.tooltipManager) {
            const canvas = this.uiRoot?.getComponent(Canvas)?.node || this.uiRoot;
            if (canvas) {
                this.tooltipManager.init(canvas);
            } else {
                console.error('UIManager: 找不到 Canvas，Tooltip 初始化失败');
            }
        } else {
            console.warn('UIManager: tooltipManager 未关联');
        }
    }

    /**
     * 打开面板
     * @param name 面板名（PANEL_UUIDS 中的键）
     * @param options 打开选项参数
     * @param options.overlay true=弹窗叠加保留下层；false=切换清空
     */
    public openPanel(name: string, options?: OpenPanelOptions) {
        const overlay = options?.overlay ?? false;
        ensurePanelBundle().then((bundle) => {
            if (!overlay) {
                this.clearAll();
            }
            bundle.load(name, Prefab, (err, asset) => {
                if (err || !(asset instanceof Prefab)) {
                    console.error(`[UIManager] 加载面板失败: ${name}`, err);
                    return;
                }
                this.pushPanel(instantiate(asset as Prefab));
            });
        }).catch((err) => {
            console.error(`[UIManager] 加载面板失败: ${name}`, err);
        });
    }

    /** 关闭最上层面板（弹窗用） */
    public closeTop() {
        const top = this._panels.pop();
        if (top) {
            top.destroy();
        }
    }

    /** 关闭并清空全部面板 */
    public clearAll() {
        for (const p of this._panels) {
            p.destroy();
        }
        this._panels.length = 0;
    }

    /** 查询某面板是否在栈中 */
    public hasPanel(name: string): boolean {
        return this._panels.some((p) => p.name === name);
    }

    /** 查找栈中的面板节点 */
    public getPanel(name: string): Node | null {
        return this._panels.find((p) => p.name === name) || null;
    }

    private pushPanel(panelNode: Node) {
        if (!this.uiRoot) {
            console.error('[UIManager] uiRoot 未设置，无法显示界面');
            panelNode.destroy();
            return;
        }
        this.uiRoot.addChild(panelNode);
        this._panels.push(panelNode);
    }
}
