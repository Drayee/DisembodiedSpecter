<script setup lang="ts">
/**
 * PlayersView — 玩家管理
 * 接口：GET  /api/v3/admin/players/list?page&page_size
 *       GET  /api/v3/admin/players/:id
 *       PUT  /api/v3/admin/players/:id/ban | /unban
 *       PUT  /api/v3/admin/players/:id/level  { level }
 *       PUT  /api/v3/admin/players/:id/exp    { exp }
 * 后端 list 接口没有搜索参数，因此这里的搜索框只过滤「当前页」，界面上已注明。
 */
import { computed, onMounted, ref, watch } from 'vue'
import {
    Ban,
    Eye,
    LoaderCircle,
    LockOpen,
    MapPin,
    RefreshCw,
    ScrollText,
    Search,
    SlidersHorizontal,
    UserRound,
    Users,
} from '@lucide/vue'
import { playersApi } from '@/api/admin'
import { ApiError } from '@/api/client'
import type { AdminPlayerDetail, AdminPlayerItem } from '@/api/types'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiDataTable from '@/components/ui/UiDataTable.vue'
import type { TableColumn } from '@/components/ui/types'
import UiDrawer from '@/components/ui/UiDrawer.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiPagination from '@/components/ui/UiPagination.vue'

const feedback = useFeedbackStore()

// ==================== 列表状态 ====================

const rows = ref<AdminPlayerItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
/** 关键字只作用于当前页数据（后端无搜索参数） */
const keyword = ref('')
/** 正在执行写操作的玩家 ID：用于禁用按钮 + 显示转圈，避免重复提交 */
const acting = ref<number | null>(null)

// ==================== 详情抽屉状态 ====================

const detailOpen = ref(false)
const detailLoading = ref(false)
const detailId = ref<number | null>(null)
const detail = ref<AdminPlayerDetail | null>(null)

// ==================== 改数值模态状态 ====================

const editModal = ref<{
    open: boolean
    player: AdminPlayerItem | null
    level: string
    exp: string
    levelError: string
    expError: string
}>({ open: false, player: null, level: '', exp: '', levelError: '', expError: '' })

const columns: TableColumn[] = [
    { key: 'id', title: 'ID', width: '72px', mono: true },
    { key: 'description', title: '描述' },
    { key: 'level', title: '等级', width: '86px', numeric: true },
    { key: 'exp', title: '经验', width: '110px', numeric: true },
    { key: 'is_active', title: '状态', width: '110px' },
    { key: 'least_active', title: '最近活跃', width: '200px' },
    { key: 'actions', title: '操作', width: '280px', align: 'right' },
]

/** 仅过滤当前页数据（后端 players/list 无关键字参数） */
const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return rows.value
    return rows.value.filter((p) => String(p.id).includes(kw) || (p.description ?? '').toLowerCase().includes(kw))
})

const detailTitle = computed(() =>
    detail.value ? `玩家 #${detail.value.id} · ${detail.value.description || '无描述'}` : '玩家详情',
)

/** story_progress 是后端存的 JSON 文本：能解析就格式化，否则原样显示 */
const story = computed<{ text: string; parsed: boolean }>(() => {
    const raw = detail.value?.story_progress ?? ''
    if (!raw.trim()) return { text: '（空）', parsed: false }
    try {
        const parsed: unknown = JSON.parse(raw)
        return { text: JSON.stringify(parsed, null, 2), parsed: true }
    } catch {
        return { text: raw, parsed: false }
    }
})

async function load() {
    loading.value = true
    try {
        const res = await playersApi.list({ page: page.value, page_size: pageSize.value })
        rows.value = res?.list ?? []
        total.value = res?.total ?? 0
    } catch (e) {
        feedback.toast.error('加载玩家列表失败', (e as ApiError).message)
        rows.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

// ==================== 封禁 / 解封 ====================

async function toggleBan(player: { id: number; description: string; is_active: boolean }) {
    const banning = player.is_active
    const label = player.description || `无描述玩家 #${player.id}`
    const ok = await feedback.confirm({
        title: banning ? `封禁玩家「${label}」？` : `解封玩家「${label}」？`,
        message: banning
            ? '封禁后该玩家无法继续游戏：后端会拒绝该玩家的登录与游戏内接口调用，正在进行的会话也会失效。'
            : '解封后该玩家可以重新登录并继续游戏。',
        confirmText: banning ? '封禁' : '解封',
        danger: banning,
    })
    if (!ok) return

    acting.value = player.id
    try {
        if (banning) await playersApi.ban(player.id)
        else await playersApi.unban(player.id)
        // 就地更新，避免整页刷新导致的滚动位置丢失
        const next = !banning
        player.is_active = next
        const row = rows.value.find((r) => r.id === player.id)
        if (row) row.is_active = next
        if (detail.value && detail.value.id === player.id) detail.value.is_active = next
        feedback.toast.success(banning ? '玩家已封禁' : '玩家已解封', `#${player.id} ${label}`)
    } catch (e) {
        feedback.toast.error(banning ? '封禁失败' : '解封失败', (e as ApiError).message)
    } finally {
        acting.value = null
    }
}

// ==================== 详情抽屉 ====================

async function openDetail(player: AdminPlayerItem) {
    detailOpen.value = true
    await loadDetail(player.id)
}

async function loadDetail(id: number) {
    detailId.value = id
    detailLoading.value = true
    detail.value = null
    try {
        detail.value = await playersApi.detail(id)
    } catch (e) {
        feedback.toast.error('加载玩家详情失败', (e as ApiError).message)
        detail.value = null
    } finally {
        detailLoading.value = false
    }
}

function closeDetail() {
    detailOpen.value = false
    detail.value = null
    detailId.value = null
}

// ==================== 改数值 ====================

function openEdit(player: AdminPlayerItem) {
    editModal.value = {
        open: true,
        player,
        level: String(player.level),
        exp: String(player.exp),
        levelError: '',
        expError: '',
    }
}

/** 前端校验：必须是非负整数（不接受小数、负数、科学计数法、空白） */
function parseNonNegativeInt(raw: string): number | null {
    const text = raw.trim()
    if (!/^\d+$/.test(text)) return null
    const value = Number(text)
    return Number.isSafeInteger(value) ? value : null
}

async function submitEdit() {
    const target = editModal.value.player
    if (!target) return

    editModal.value.levelError = ''
    editModal.value.expError = ''
    const level = parseNonNegativeInt(editModal.value.level)
    const exp = parseNonNegativeInt(editModal.value.exp)
    if (level === null) editModal.value.levelError = '等级必须是非负整数（例如 0、12）'
    if (exp === null) editModal.value.expError = '经验必须是非负整数（例如 0、1500）'
    // 校验不通过：内联报错，不发请求
    if (level === null || exp === null) return

    const levelChanged = level !== target.level
    const expChanged = exp !== target.exp
    if (!levelChanged && !expChanged) {
        editModal.value.open = false
        feedback.toast.info('没有需要保存的改动', `#${target.id} 等级与经验均未变化`)
        return
    }

    acting.value = target.id
    try {
        // 只提交真正变化的字段
        if (levelChanged) await playersApi.setLevel(target.id, level)
        if (expChanged) await playersApi.setExp(target.id, exp)
        target.level = level
        target.exp = exp
        const row = rows.value.find((r) => r.id === target.id)
        if (row) {
            row.level = level
            row.exp = exp
        }
        if (detail.value && detail.value.id === target.id) {
            detail.value.level = level
            detail.value.exp = exp
        }
        editModal.value.open = false
        const changed: string[] = []
        if (levelChanged) changed.push(`等级 ${level}`)
        if (expChanged) changed.push(`经验 ${exp}`)
        feedback.toast.success('玩家数值已更新', `#${target.id} ${changed.join(' · ')}`)
        await load()
    } catch (e) {
        feedback.toast.error('修改玩家数值失败', (e as ApiError).message)
        // 可能只有其中一个字段写入成功，重新拉取以对齐服务端真实值
        await load()
    } finally {
        acting.value = null
    }
}

// 每页数量变化要回到第 1 页，避免停留在超出范围的空页
watch(pageSize, () => {
    if (page.value === 1) load()
    else page.value = 1
})
watch(page, load)
onMounted(load)
</script>

<template>
    <UiPage>
        <UiPageHeader
            title="玩家管理"
            description="接口：GET /api/v3/admin/players/list · GET /api/v3/admin/players/:id · PUT /api/v3/admin/players/:id/ban | /unban | /level | /exp。列表接口没有搜索参数，搜索框只筛选当前页。"
        >
            <template #actions>
                <button class="btn" type="button" :disabled="loading" @click="load">
                    <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" />
                    刷新
                </button>
            </template>
        </UiPageHeader>

        <section class="panel">
            <div class="panel-header flex-wrap gap-3">
                <h3 class="panel-title">
                    <Users :size="15" class="text-phantom-200" />
                    玩家列表
                </h3>
                <span class="text-[11px] text-faint">
                    共 {{ total }} 名玩家<template v-if="keyword"> · 当前页匹配 {{ filtered.length }} 条</template>
                </span>

                <div class="ml-auto flex flex-wrap items-center gap-2">
                    <span class="relative flex items-center">
                        <Search :size="14" class="pointer-events-none absolute left-2.5 text-faint" />
                        <input
                            v-model="keyword"
                            class="input w-64 py-1 pl-8 text-xs"
                            placeholder="筛选当前页：玩家 ID / 描述"
                        />
                    </span>
                </div>
            </div>

            <UiDataTable
                :columns="columns"
                :rows="filtered"
                :loading="loading"
                :row-key="(row) => row.id"
                empty-text="没有玩家数据"
                empty-hint="players 表为空，或后端返回的 list 为空数组。"
            >
                <template #cell-id="{ row }">
                    <span class="text-muted">#{{ (row as AdminPlayerItem).id }}</span>
                </template>

                <template #cell-description="{ row }">
                    <span class="block max-w-[260px] truncate font-medium text-strong">
                        {{ (row as AdminPlayerItem).description || '（无描述）' }}
                    </span>
                </template>

                <template #cell-level="{ row }">
                    <span class="tabular text-soft">{{ (row as AdminPlayerItem).level }}</span>
                </template>

                <template #cell-exp="{ row }">
                    <span class="tabular text-soft">{{ (row as AdminPlayerItem).exp }}</span>
                </template>

                <template #cell-is_active="{ row }">
                    <UiBadge :tone="(row as AdminPlayerItem).is_active ? 'ok' : 'danger'" dot>
                        {{ (row as AdminPlayerItem).is_active ? '正常' : '已封禁' }}
                    </UiBadge>
                </template>

                <template #cell-least_active="{ row }">
                    <div class="flex flex-col gap-0.5 text-[11px] leading-snug">
                        <span class="text-soft">{{ (row as AdminPlayerItem).least_active_type || '—' }}</span>
                        <span class="font-mono text-faint">{{ (row as AdminPlayerItem).least_active_ip || '—' }}</span>
                        <span class="font-mono text-faint">{{ (row as AdminPlayerItem).least_active_at || '—' }}</span>
                    </div>
                </template>

                <template #cell-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            class="btn btn-sm"
                            type="button"
                            :disabled="acting === (row as AdminPlayerItem).id"
                            @click="openDetail(row as AdminPlayerItem)"
                        >
                            <LoaderCircle
                                v-if="detailLoading && detailId === (row as AdminPlayerItem).id"
                                :size="13"
                                class="animate-spin"
                            />
                            <Eye v-else :size="13" />
                            详情
                        </button>

                        <button
                            class="btn btn-sm"
                            :class="(row as AdminPlayerItem).is_active ? 'btn-danger' : 'btn-success'"
                            type="button"
                            :disabled="acting === (row as AdminPlayerItem).id"
                            @click="toggleBan(row as AdminPlayerItem)"
                        >
                            <LoaderCircle v-if="acting === (row as AdminPlayerItem).id" :size="13" class="animate-spin" />
                            <component :is="(row as AdminPlayerItem).is_active ? Ban : LockOpen" v-else :size="13" />
                            {{ (row as AdminPlayerItem).is_active ? '封禁' : '解封' }}
                        </button>

                        <button
                            class="btn btn-sm"
                            type="button"
                            :disabled="acting === (row as AdminPlayerItem).id"
                            @click="openEdit(row as AdminPlayerItem)"
                        >
                            <SlidersHorizontal :size="13" />
                            改数值
                        </button>
                    </div>
                </template>

                <template #empty>
                    <UiEmpty
                        title="没有匹配的玩家"
                        :hint="
                            keyword
                                ? '搜索只作用于当前页数据，可清空关键字或翻页后重试。'
                                : '后端 players 表为空，或当前页没有数据。'
                        "
                        compact
                    />
                </template>
            </UiDataTable>

            <UiPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
        </section>

        <!-- 玩家详情 -->
        <UiDrawer
            :open="detailOpen"
            :title="detailTitle"
            description="GET /api/v3/admin/players/:id — 含坐标与剧情进度等全量字段。"
            width="620px"
            @close="closeDetail"
        >
            <div v-if="detailLoading" class="flex items-center justify-center gap-2 py-16 text-xs text-muted">
                <LoaderCircle :size="16" class="animate-spin" />
                加载玩家详情…
            </div>

            <UiEmpty
                v-else-if="!detail"
                title="未获取到玩家详情"
                hint="可能是玩家不存在，或接口返回了错误；可关闭抽屉后重试。"
                compact
            />

            <div v-else class="flex flex-col gap-4">
                <section class="rounded-md border border-line bg-surface-2 p-3.5">
                    <h3 class="panel-title mb-3 text-[12px]">
                        <UserRound :size="14" class="text-phantom-200" />
                        基本信息
                    </h3>

                    <dl class="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">玩家 ID</dt>
                            <dd class="font-mono text-strong">#{{ detail.id }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">状态</dt>
                            <dd>
                                <UiBadge :tone="detail.is_active ? 'ok' : 'danger'" dot>
                                    {{ detail.is_active ? '正常' : '已封禁' }}
                                </UiBadge>
                            </dd>
                        </div>
                        <div class="col-span-2 flex flex-col gap-0.5">
                            <dt class="text-faint">描述</dt>
                            <dd class="break-words text-strong">{{ detail.description || '（空）' }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">等级</dt>
                            <dd class="tabular text-strong">{{ detail.level }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">经验</dt>
                            <dd class="tabular text-strong">{{ detail.exp }}</dd>
                        </div>
                    </dl>
                </section>

                <section class="rounded-md border border-line bg-surface-2 p-3.5">
                    <h3 class="panel-title mb-3 text-[12px]">
                        <Users :size="14" class="text-phantom-200" />
                        最近活跃
                    </h3>

                    <dl class="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">活跃类型</dt>
                            <dd class="text-strong">{{ detail.least_active_type || '—' }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">IP 地址</dt>
                            <dd class="font-mono text-strong">{{ detail.least_active_ip || '—' }}</dd>
                        </div>
                        <div class="col-span-2 flex flex-col gap-0.5">
                            <dt class="text-faint">时间</dt>
                            <dd class="font-mono text-strong">{{ detail.least_active_at || '—' }}</dd>
                        </div>
                    </dl>
                </section>

                <section class="rounded-md border border-line bg-surface-2 p-3.5">
                    <h3 class="panel-title mb-3 text-[12px]">
                        <MapPin :size="14" class="text-phantom-200" />
                        坐标位置
                    </h3>

                    <dl class="grid grid-cols-3 gap-x-4 gap-y-2.5 text-xs">
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">X</dt>
                            <dd class="tabular text-strong">{{ detail.location?.x ?? '—' }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">Y</dt>
                            <dd class="tabular text-strong">{{ detail.location?.y ?? '—' }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-faint">地图 map</dt>
                            <dd class="break-words font-mono text-strong">{{ detail.location?.map || '—' }}</dd>
                        </div>
                    </dl>
                </section>

                <section class="rounded-md border border-line bg-surface-2 p-3.5">
                    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 class="panel-title text-[12px]">
                            <ScrollText :size="14" class="text-phantom-200" />
                            剧情进度 story_progress
                        </h3>
                        <span class="text-[11px] text-faint">
                            {{ story.parsed ? '已按 JSON 格式化显示' : '不是合法 JSON，按原文显示' }}
                        </span>
                    </div>

                    <pre
                        class="max-h-72 overflow-auto rounded-sm border border-line bg-surface-3 p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-soft"
                    >{{ story.text }}</pre>
                </section>
            </div>

            <template #footer>
                <button class="btn btn-ghost" type="button" @click="closeDetail">关闭</button>

                <template v-if="detail">
                    <button class="btn" type="button" :disabled="acting === detail.id" @click="openEdit(detail)">
                        <SlidersHorizontal :size="13" />
                        改数值
                    </button>
                    <button
                        class="btn"
                        :class="detail.is_active ? 'btn-danger' : 'btn-success'"
                        type="button"
                        :disabled="acting === detail.id"
                        @click="toggleBan(detail)"
                    >
                        <LoaderCircle v-if="acting === detail.id" :size="13" class="animate-spin" />
                        <component :is="detail.is_active ? Ban : LockOpen" v-else :size="13" />
                        {{ detail.is_active ? '封禁' : '解封' }}
                    </button>
                </template>
            </template>
        </UiDrawer>

        <!-- 改数值：等级 + 经验 -->
        <UiModal
            :open="editModal.open"
            title="修改玩家数值"
            description="分别调用 PUT /api/v3/admin/players/:id/level 与 /exp，只有值发生变化的项才会提交。"
            width="460px"
            @close="editModal.open = false"
        >
            <div class="flex flex-col gap-4">
                <div class="rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-xs text-muted">
                    <span class="font-medium text-strong">{{ editModal.player?.description || '（无描述）' }}</span>
                    <span class="ml-2 font-mono">#{{ editModal.player?.id }}</span>
                    <span class="ml-2">
                        当前：等级 {{ editModal.player?.level }} · 经验 {{ editModal.player?.exp }}
                    </span>
                </div>

                <UiField label="等级 level" :error="editModal.levelError" hint="非负整数（min=0），不接受小数或负数">
                    <input
                        v-model="editModal.level"
                        class="input input-mono tabular"
                        type="number"
                        min="0"
                        step="1"
                        inputmode="numeric"
                        placeholder="0"
                    />
                </UiField>

                <UiField label="经验 exp" :error="editModal.expError" hint="非负整数（min=0），不接受小数或负数">
                    <input
                        v-model="editModal.exp"
                        class="input input-mono tabular"
                        type="number"
                        min="0"
                        step="1"
                        inputmode="numeric"
                        placeholder="0"
                    />
                </UiField>
            </div>

            <template #footer>
                <button class="btn" type="button" :disabled="acting === editModal.player?.id" @click="editModal.open = false">
                    取消
                </button>
                <button class="btn btn-primary" type="button" :disabled="acting === editModal.player?.id" @click="submitEdit">
                    <LoaderCircle v-if="acting === editModal.player?.id" :size="14" class="animate-spin" />
                    保存
                </button>
            </template>
        </UiModal>
    </UiPage>
</template>
