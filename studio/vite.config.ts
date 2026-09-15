import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// 开发期把 /api 代理到 Go 后端（config.yaml: app.port=8080），避免 CORS。
// 需要指向别的后端时改 .env.development 里的 VITE_PROXY_TARGET。
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        plugins: [vue(), tailwindcss()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            port: 5273,
            strictPort: false,
            proxy: {
                '/api': {
                    target: env.VITE_PROXY_TARGET || 'http://localhost:8080',
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            chunkSizeWarningLimit: 1600,
        },
    }
})
