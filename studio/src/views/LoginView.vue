<script setup lang="ts">
/** LoginView — 后台登录（POST /api/v1/login），成功后跳转 redirect 或数据概览 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, Ghost, LoaderCircle, Lock, Shield, User } from '@lucide/vue'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useFeedbackStore } from '@/stores/feedback'
import { useThemeStore } from '@/stores/theme'
import UiField from '@/components/ui/UiField.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const feedback = useFeedbackStore()
const theme = useThemeStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

async function submit() {
    error.value = ''
    if (!username.value.trim() || !password.value) {
        error.value = '请填写用户名与密码'
        return
    }
    try {
        await auth.login({ username: username.value.trim(), password: password.value })
        feedback.toast.success('登录成功', '令牌已保存到本地')
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
        router.replace(redirect || { name: 'admin-overview' })
    } catch (e) {
        const err = e as ApiError
        error.value = err.message || '登录失败'
        feedback.toast.error('登录失败', error.value)
    }
}

const features = [
    { title: '统一响应体拆包', desc: 'axios 拦截器自动处理 code/message/data 与 401 刷新' },
    { title: '全量 admin 接口', desc: '用户 / 玩家 / 统计 / 内容 / 配置 共 40 个端点' },
    { title: '剧情编排工坊', desc: '节点 · 分支 · 立绘 · 校验 · zip 导出，无需登录' },
]
</script>

<template>
    <div class="relative flex min-h-full items-stretch">
        <button class="btn btn-ghost btn-sm absolute top-5 right-5 z-10" type="button" @click="theme.toggle()">
            {{ theme.mode === 'dark' ? '浅色' : '深色' }}
        </button>

        <!-- 品牌侧 -->
        <section class="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-line p-10 lg:flex grid-bg">
            <div class="flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-phantom-200">
                    <Ghost :size="20" />
                </span>
                <div>
                    <p class="text-sm font-semibold text-strong">幽影工坊</p>
                    <p class="text-[10px] tracking-widest text-faint">DISEMBODIED SPECTER STUDIO</p>
                </div>
            </div>

            <div class="max-w-[440px]">
                <h1 class="text-3xl leading-tight font-semibold text-strong">剧情编排与运营后台，<br />一处搞定。</h1>
                <p class="mt-3 text-sm leading-relaxed text-muted">
                    左侧编排剧情节点与分支立绘，右侧管理玩家与游戏内容表。所有后台请求都走
                    <code class="mx-1 rounded-xs border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">/api/v3/admin</code>
                    路由，需要 admin 角色的令牌。
                </p>

                <ul class="mt-7 flex flex-col gap-4">
                    <li v-for="f in features" :key="f.title" class="flex gap-3">
                        <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <div>
                            <p class="text-[13px] font-medium text-soft">{{ f.title }}</p>
                            <p class="text-xs text-muted">{{ f.desc }}</p>
                        </div>
                    </li>
                </ul>
            </div>

            <p class="text-[11px] text-faint">Vue 3 · Vite · Tailwind CSS 4 · Pinia · axios</p>
        </section>

        <!-- 表单侧 -->
        <section class="flex w-full items-center justify-center p-6 lg:w-[560px] lg:shrink-0">
            <div class="w-full max-w-[380px] animate-slide-up">
                <div class="mb-6 lg:hidden">
                    <span class="flex h-10 w-10 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-phantom-200">
                        <Ghost :size="20" />
                    </span>
                </div>

                <UiBadge tone="accent">
                    <Shield :size="11" />
                    后台管理
                </UiBadge>
                <h2 class="mt-3 text-2xl font-semibold text-strong">登录</h2>
                <p class="mt-1.5 text-xs leading-relaxed text-muted">
                    使用后端 <code class="font-mono">/api/v1/login</code> 校验。账号需具备 admin 角色，否则后台接口会返回 4003。
                </p>

                <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
                    <UiField label="用户名" required>
                        <span class="relative flex items-center">
                            <User :size="15" class="pointer-events-none absolute left-3 text-faint" />
                            <input
                                v-model="username"
                                class="input pl-9"
                                type="text"
                                autocomplete="username"
                                placeholder="用户名"
                                :disabled="auth.loading"
                            />
                        </span>
                    </UiField>

                    <UiField label="密码" required>
                        <span class="relative flex items-center">
                            <Lock :size="15" class="pointer-events-none absolute left-3 text-faint" />
                            <input
                                v-model="password"
                                class="input pr-9 pl-9"
                                :type="showPassword ? 'text' : 'password'"
                                autocomplete="current-password"
                                placeholder="密码"
                                :disabled="auth.loading"
                            />
                            <button
                                class="btn btn-ghost btn-icon absolute right-1.5"
                                type="button"
                                :title="showPassword ? '隐藏密码' : '显示密码'"
                                @click="showPassword = !showPassword"
                            >
                                <component :is="showPassword ? EyeOff : Eye" :size="14" />
                            </button>
                        </span>
                    </UiField>

                    <p v-if="error" class="rounded-sm border border-rose-glow/35 bg-rose-glow/10 px-3 py-2 text-xs text-rose-glow">
                        {{ error }}
                    </p>

                    <button class="btn btn-primary w-full py-2" type="submit" :disabled="auth.loading">
                        <LoaderCircle v-if="auth.loading" :size="15" class="animate-spin" />
                        <Shield v-else :size="15" />
                        {{ auth.loading ? '登录中…' : '进入后台' }}
                    </button>
                </form>

                <RouterLink class="mt-5 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-soft" :to="{ name: 'story' }">
                    先不登录，直接去剧情编排 →
                </RouterLink>
            </div>
        </section>
    </div>
</template>
