// Storage.ts
// 本地存储平台解耦工具：业务代码只依赖 IStorage 接口，
// 后续切换平台（微信小游戏 / 原生 / 浏览器）只需替换实现，不改业务逻辑。
import { sys } from 'cc';

export interface IStorage {
    getString(key: string): string | null;
    setString(key: string, value: string): void;
    remove(key: string): void;
}

// Cocos 默认实现（浏览器 localStorage / 原生 sys.localStorage）
class CocosLocalStorage implements IStorage {
    getString(key: string): string | null {
        try {
            return sys.localStorage.getItem(key);
        } catch (e) {
            console.warn('[Storage] 读取失败', key, e);
            return null;
        }
    }

    setString(key: string, value: string): void {
        try {
            sys.localStorage.setItem(key, value);
        } catch (e) {
            console.warn('[Storage] 写入失败', key, e);
        }
    }

    remove(key: string): void {
        try {
            sys.localStorage.removeItem(key);
        } catch (e) {
            console.warn('[Storage] 删除失败', key, e);
        }
    }
}

// 可选：内存实现（测试/无持久化环境）
export class MemoryStorage implements IStorage {
    private map: Record<string, string> = {};

    getString(key: string): string | null {
        return this.map[key] ?? null;
    }

    setString(key: string, value: string): void {
        this.map[key] = value;
    }

    remove(key: string): void {
        delete this.map[key];
    }
}

// 全局存储实例：切换平台时替换为对应实现（如 WeChatStorage）
export const Storage: IStorage = new CocosLocalStorage();

// ==================== 便捷 JSON 封装 ====================

export function saveJSON(key: string, value: any): void {
    Storage.setString(key, JSON.stringify(value));
}

export function loadJSON<T>(key: string): T | null {
    const raw = Storage.getString(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function saveString(key: string, value: string): void {
    Storage.setString(key, value);
}

export function loadString(key: string): string | null {
    return Storage.getString(key);
}

export function removeKey(key: string): void {
    Storage.remove(key);
}
