<script setup lang="ts">
/**
 * OverviewView — 数据概览
 * 数据源：/api/v3/admin/stats/overview · /stats/online · /stats/items
 * 注意：后端 stats/online 的 online_count 目前恒为 0（TODO：接 WebSocket 连接数），
 * 这里如实展示并标注，不伪造数据。
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Activity, LoaderCircle, Mail, Package, RefreshCw, ScrollText, Shield, Users, Wand } from '@lucide/vue'
import { statsApi } from '@/api/admin'
import { ApiError } from '@/api/client'
import type { ItemStat, StatsOnline, StatsOverview } from '@/api/types'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'

const feedback = useFeedbackStore()

const overview = ref<StatsOverview | null>(null)
const online = ref<StatsOnline | null>(null)
const items = ref<ItemStat[]>([])
const loading = ref(false)
const loadedAt = ref('')

const kpis = computed(() => [
    { key: 'users', label: '注册用户', value: overview.value?.user_count ?? 0, icon: Users, tone: 'accent' as const, hint: 'users/list 总数' },
    { key: 'players', label: '玩家档案', value: overview.value?.player_count ?? 0, icon: Shield, tone: 'info' as const, hint: 'players/list 总数' },
    { key: 'items', label: '道具种类', value: overview.value?.item_count ?? 0, icon: Package, tone: 'ok' as const, hint: 'items 表条数' },
    { key: 'emails', label: '邮箱配置', value: overview.value?.email_count ?? 0, icon: Mail, tone: 'warn' as const, hint: 'config/emails 条数' },
])

const onlineRate = computed(() => {
    const total = online.value?.total_count ?? 0
    if (!total) return 0
    return Math.round(((online.value?.online_count ?? 0) / total) * 1000) / 10
})

/** 道具按 type 聚合，用于分布条 */
const itemsByType = computed(() => {
    const map = new Map<string, number>()
    for (const it of items.value) {
        const key = it.type || '未分类'
        map.set(key, (map.get(key) || 0) + 1)
    }
    const rows = [...map.entries()].map(([type, count]) => ({ type, count }))
    rows.sort((a, b) => b.count - a.count)
    return rows
})

const maxTypeCount = computed(() => itemsByType.value.reduce((m, r) => Math.max(m, r.count), 0) || 1)

const toneClass: Record<string, string> = {
    accent: 'border-accent-line bg-accent-soft text-phantom-200',
    info: 'border-sky-glow/35 bg-sky-glow/12 text-sky-glow',
    ok: 'border-emerald-glow/35 bg-emerald-glow/12 text-emerald-glow',
    warn: 'border-amber-glow/35 bg-amber-glow/12 text-amber-glow',
}

async function load() {
    loading.value = true
    try {
        const [o, on, it] = await Promise.all([statsApi.overview(), statsApi.online(), statsApi.items()])
        overview.value = o
        online.value = on
        items.value = it?.items ?? []
        loadedAt.value = new Date().toLocaleTimeString()
    } catch (e) {
        feedback.toast.error('加载统计失败', (e as ApiError).message)
    } finally {
        loading.value = false
    }
}

const shortcuts = [
    { name: 'admin-users', label: '用户管理', desc: '改角色 / 禁用 / 启用', icon: Users },
    { name: 'admin-players', label: '玩家管理', desc: '封禁 / 等级 / 经验', icon: Shield },
    { name: 'admin-buffs', label: 'Buff 管理', desc: '效果与损耗方式', icon: Wand },
    { name: 'story', label: '剧情编排', desc: '节点 · 分支 · 导出 zip', icon: ScrollText },
]

onMounted(load)
</script>

<template>
    <UiPage>
        <UiPageHeader title="数据概览" description="汇总用户、玩家、道具与邮箱配置的规模；数据实时取自 admin 统计接口。">
            <template #actions>
                <span v-if="loadedAt" class="text-[11px] text-faint">更新于 {{ loadedAt }}</span>
                <button class="btn" type="button" :disabled="loading" @click="load">
                    <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" />
                    刷新
                </button>
            </template>
        </UiPageHeader>

        <!-- KPI -->
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="kpi in kpis" :key="kpi.key" class="panel overflow-hidden">
                <div class="flex items-start justify-between gap-3 p-4">
                    <div class="min-w-0">
                        <p class="text-[11px] font-medium tracking-wide text-muted uppercase">{{ kpi.label }}</p>
                        <p class="tabular mt-2 text-2xl leading-none font-semibold text-strong">
                            <LoaderCircle v-if="loading && !overview" :size="18" class="animate-spin text-muted" />
                            <template v-else>{{ kpi.value.toLocaleString() }}</template>
                        </p>
                        <p class="mt-2 truncate text-[11px] text-faint">{{ kpi.hint }}</p>
                    </div>
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border" :class="toneClass[kpi.tone]">
                        <component :is="kpi.icon" :size="17" />
                    </span>
                </div>
            </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <!-- 在线概况 -->
            <section class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">
                        <Activity :size="15" class="text-phantom-200" />
                        在线概况
                    </h3>
                    <UiBadge tone="warn" class="ml-auto">online_count 待后端接入</UiBadge>
                </div>
                <div class="panel-body flex flex-col gap-5">
                    <div class="flex items-center gap-6">
                        <div class="relative h-[104px] w-[104px] shrink-0">
                            <svg viewBox="0 0 36 36" class="h-full w-full -rotate-90">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--s-line)" stroke-width="3" />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="15.5"
                                    fill="none"
                                    stroke="var(--s-accent)"
                                    stroke-width="3"
                                    stroke-linecap="round"
                                    :stroke-dasharray="`${(onlineRate / 100) * 97.4} 97.4`"
                                    class="transition-all duration-500"
                                />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="tabular text-lg font-semibold text-strong">{{ onlineRate }}%</span>
                                <span class="text-[10px] text-faint">在线率</span>
                            </div>
                        </div>
                        <dl class="flex min-w-0 flex-1 flex-col gap-3">
                            <div class="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                                <dt class="text-xs text-muted">在线人数</dt>
                                <dd class="tabular text-sm font-semibold text-strong">{{ online?.online_count ?? 0 }}</dd>
                            </div>
                            <div class="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                                <dt class="text-xs text-muted">玩家总数</dt>
                                <dd class="tabular text-sm font-semibold text-strong">{{ online?.total_count ?? 0 }}</dd>
                            </div>
                            <div class="flex items-baseline justify-between gap-3">
                                <dt class="text-xs text-muted">离线</dt>
                                <dd class="tabular text-sm font-semibold text-soft">
                                    {{ Math.max(0, (online?.total_count ?? 0) - (online?.online_count ?? 0)) }}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <p class="field-hint">
                        说明：后端 <code class="font-mono">GetStatsOnline</code> 目前以
                        <code class="font-mono">online_count = 0</code> 占位，待接入 WebSocket 连接管理器后此处会显示真实在线数。
                    </p>
                </div>
            </section>

            <!-- 道具分布 -->
            <section class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">
                        <Package :size="15" class="text-emerald-glow" />
                        道具类型分布
                    </h3>
                    <span class="ml-auto text-[11px] text-faint">共 {{ items.length }} 条</span>
                </div>
                <div class="panel-body">
                    <ul v-if="itemsByType.length" class="flex flex-col gap-3.5">
                        <li v-for="row in itemsByType" :key="row.type" class="flex items-center gap-3">
                            <span class="w-24 shrink-0 truncate text-xs text-soft" :title="row.type">{{ row.type }}</span>
                            <span class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
                                <span
                                    class="block h-full rounded-full bg-accent transition-all duration-500"
                                    :style="{ width: `${Math.max(4, (row.count / maxTypeCount) * 100)}%` }"
                                />
                            </span>
                            <span class="tabular w-10 shrink-0 text-right text-xs text-muted">{{ row.count }}</span>
                        </li>
                    </ul>
                    <p v-else class="py-6 text-center text-xs text-faint">
                        {{ loading ? '加载中…' : '暂无道具数据（items 表为空）' }}
                    </p>
                </div>
            </section>
        </div>

        <!-- 快捷入口 -->
        <section class="flex flex-col gap-3">
            <h3 class="text-[13px] font-semibold text-soft">快捷入口</h3>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <RouterLink
                    v-for="s in shortcuts"
                    :key="s.name"
                    :to="{ name: s.name }"
                    class="card flex items-center gap-3 transition-colors duration-150 hover:border-accent-line hover:bg-surface-3"
                >
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface-3 text-soft">
                        <component :is="s.icon" :size="16" />
                    </span>
                    <span class="min-w-0">
                        <span class="block truncate text-[13px] font-medium text-strong">{{ s.label }}</span>
                        <span class="block truncate text-[11px] text-muted">{{ s.desc }}</span>
                    </span>
                </RouterLink>
            </div>
        </section>
    </UiPage>
</template>
