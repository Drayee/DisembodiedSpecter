// StoryLoader.ts
// 按段加载剧情 JSON（resources/story/data/{篇}.{章}.{片}.{段}.json）并做内存缓存。
import { JsonAsset, resources } from 'cc';
import { StoryNode, StorySegment } from './StoryTypes';

const segCache = new Map<string, Promise<StorySegment | null>>();

function loadOnce(file: string): Promise<StorySegment | null> {
    const hit = segCache.get(file);
    if (hit) return hit;
    const p = new Promise<StorySegment | null>((resolve) => {
        resources.load(`story/data/${file}`, JsonAsset, (err, asset) => {
            if (err || !asset) {
                console.error(`[Story] 加载段文件失败: story/data/${file}`, err);
                resolve(null);
                return;
            }
            const seg = (asset.json ?? asset) as unknown as StorySegment;
            if (!seg || !Array.isArray(seg.nodes) || seg.nodes.length === 0) {
                console.error(`[Story] 段文件格式错误（缺少 nodes 数组）: story/data/${file}`);
                resolve(null);
                return;
            }
            resolve(seg);
        });
    });
    segCache.set(file, p);
    return p;
}

/** 按段文件地址（如 "1.0.0.1"）加载一段剧情；失败返回 null。 */
export function loadSegment(file: string): Promise<StorySegment | null> {
    return loadOnce(file);
}

/** 段内按节点键查找（如 "3.a"）；找不到返回 null。 */
export function nodeById(seg: StorySegment | null, key: string): StoryNode | null {
    if (!seg) return null;
    const n = seg.nodes.find((x) => String(x.id) === String(key));
    return n ?? null;
}

/** 段内顺序下一节点键（文件内分支变体不打断主线顺序：变体节点通常由选项显式跳转）。 */
export function nextNodeIdInFile(seg: StorySegment | null, key: string): string | null {
    if (!seg) return null;
    const i = seg.nodes.findIndex((x) => String(x.id) === String(key));
    if (i < 0) return null;
    const next = seg.nodes[i + 1];
    return next ? String(next.id) : null;
}

/** 清空段文件缓存（热更/测试用） */
export function clearStoryCache(): void {
    segCache.clear();
}
