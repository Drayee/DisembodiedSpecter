<script setup lang="ts">
/**
 * AppShell — 应用外壳：左侧导航 + 顶栏 + 内容区
 * 布局要点：外层 h-full flex，内容区 min-h-0 flex-1 overflow-hidden，
 * 各页面自行决定是「整页滚动」还是「多栏内滚」，避免出现嵌套滚动条错位。
 */
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
    ChevronLeft,
    Cog,
    Ghost,
    LayoutDashboard,
    LogOut,
    Mail,
    Moon,
    Package,
    PanelLeft,
    ScrollText,
    Shield,
    Skull,
    Sparkles,
    Sun,
    Swords,
    Users,
    Wand,
} from '@lucide/vue'
import { API_BASE } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useFeedbackStore } from '@/stores/feedback'
import { useThemeStore } from '@/stores/theme'
import UiBadge from '@/components/ui/UiBadge.vue'

interface NavItem {
    name: string
    label: string
    icon: unknown
    /** 与路由 meta 匹配的辅助文案 */
    hint?: string
}

interface NavGroup {
    label: string
    items: NavItem[]
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()
const feedback = useFeedbackStore()

const COLLAPSE_KEY = 'ds.studio.nav.collapsed'
const collapsed = ref(localStorage.getItem(COLLAPSE_KEY) === '1')

function toggleCollapse() {
    collapsed.value = !collapsed.value
    try {
        localStorage.setItem(COLLAPSE_KEY, collapsed.value ? '1' : '0')
    } catch {
        /* ignore */
    }
}

const groups: NavGroup[] = [
    {
        label: '创作',
        items: [{ name: 'story', label: '剧情编排', icon: ScrollText, hint: '节点 / 分支 / 立绘 / 导出' }],
    },
    {
        label: '运营',
        items: [
            { name: 'admin-overview', label: '数据概览', icon: LayoutDashboard },
            { name: 'admin-users', label: '用户管理', icon: Users },
            { name: 'admin-players', label: '玩家管理', icon: Shield },
        ],
    },
    {
        label: '内容',
        items: [
            { name: 'admin-characters', label: '角色', icon: Swords },
            { name: 'admin-enemies', label: '敌人', icon: Skull },
            { name: 'admin-tools', label: '道具', icon: Package },
            { name: 'admin-skills', label: '技能', icon: Sparkles },
            { name: 'admin-buffs', label: 'Buff', icon: Wand },
        ],
    },
    {
        label: '系统',
        items: [{ name: 'admin-emails', label: '邮箱配置', icon: Mail }],
    },
]

const pageTitle = computed(() => (route.meta.title as string) || '工作台')
const apiLabel = computed(() => API_BASE || '同源 / 开发代理 → 8080')

async function onLogout() {
    const ok = await feedback.confirm({
        title: '退出登录',
        message: '将清除本地保存的令牌，需要重新登录才能进入后台管理。',
        confirmText: '退出',
    })
    if (!ok) return
    await auth.logout()
    feedback.toast.info('已退出登录')
    router.replace({ name: 'login' })
}
</script>

<template>
    <div class="flex h-full min-h-0">
        <!-- 侧边导航 -->
        <aside
            class="flex shrink-0 flex-col border-r border-line glass transition-[width] duration-200"
            :style="{ width: collapsed ? '68px' : '220px' }"
        >
            <div class="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4">
                <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-phantom-200"
                >
                    <Ghost :size="17" />
                </span>
                <div v-if="!collapsed" class="min-w-0">
                    <p class="truncate text-[13px] font-semibold text-strong">幽影工坊</p>
                    <p class="truncate text-[10px] tracking-wide text-faint">DISEMBODIED SPECTER</p>
                </div>
            </div>

            <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-3 no-scrollbar">
                <template v-for="group in groups" :key="group.label">
                    <p v-if="!collapsed" class="px-2.5 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-faint uppercase">
                        {{ group.label }}
                    </p>
                    <div v-else class="my-2 h-px bg-line" />
                    <RouterLink
                        v-for="item in group.items"
                        :key="item.name"
                        :to="{ name: item.name }"
                        class="row-item mb-0.5"
                        :class="route.name === item.name ? 'row-item-active' : ''"
                        :title="collapsed ? item.label : undefined"
                    >
                        <component :is="item.icon" :size="16" class="shrink-0" />
                        <span v-if="!collapsed" class="min-w-0 flex-1">
                            <span class="block truncate text-[13px]">{{ item.label }}</span>
                            <span v-if="item.hint" class="block truncate text-[10px] text-faint">{{ item.hint }}</span>
                        </span>
                    </RouterLink>
                </template>
            </nav>

            <div class="shrink-0 border-t border-line p-2">
                <button class="row-item w-full justify-center" type="button" :title="collapsed ? '展开导航' : '收起导航'" @click="toggleCollapse">
                    <component :is="collapsed ? PanelLeft : ChevronLeft" :size="16" />
                    <span v-if="!collapsed" class="text-[12px]">收起导航</span>
                </button>
            </div>
        </aside>

        <!-- 主区域 -->
        <div class="flex min-w-0 flex-1 flex-col">
            <header class="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-5 glass">
                <div class="flex min-w-0 items-center gap-3">
                    <h2 class="truncate text-[15px] font-semibold text-strong">{{ pageTitle }}</h2>
                    <UiBadge tone="default">
                        <Cog :size="11" />
                        {{ apiLabel }}
                    </UiBadge>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                    <UiBadge v-if="auth.isLogged" tone="ok">
                        <Shield :size="11" />
                        管理令牌 uid {{ auth.userId }}
                    </UiBadge>
                    <button class="btn btn-ghost btn-sm" type="button" :title="theme.mode === 'dark' ? '切换浅色' : '切换深色'" @click="theme.toggle()">
                        <component :is="theme.mode === 'dark' ? Sun : Moon" :size="15" />
                    </button>
                    <RouterLink v-if="!auth.isLogged" class="btn btn-sm" :to="{ name: 'login' }">
                        <Shield :size="14" />
                        登录后台
                    </RouterLink>
                    <button v-else class="btn btn-sm" type="button" @click="onLogout">
                        <LogOut :size="14" />
                        退出
                    </button>
                </div>
            </header>

            <main class="min-h-0 flex-1 overflow-hidden">
                <RouterView v-slot="{ Component }">
                    <component :is="Component" />
                </RouterView>
            </main>
        </div>
    </div>
</template>
