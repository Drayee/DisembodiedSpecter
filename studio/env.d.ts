/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

interface ImportMetaEnv {
    /** 生产/直连模式下的后端根地址，例如 https://api.example.com（留空则用同源 /api） */
    readonly VITE_API_BASE?: string
    /** 开发服务器代理目标，默认 http://localhost:8080 */
    readonly VITE_PROXY_TARGET?: string
    readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
