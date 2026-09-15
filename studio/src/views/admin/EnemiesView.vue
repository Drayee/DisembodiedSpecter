<script setup lang="ts">
/**
 * EnemiesView — 敌人管理（enemies）
 * 接口：
 *   GET  /api/v3/admin/game/enemies/list?page&page_size
 *   GET  /api/v3/admin/game/enemies/:id
 *   POST /api/v3/admin/game/enemies
 *   PUT  /api/v3/admin/game/enemies/:id
 * 后端没有删除接口，所以列表操作列只有「编辑」。
 *
 * ⚠️ 后端 PUT 是「整体替换」语义，不会做字段合并：
 *    因此编辑前必须先调 detail(id) 拉全量字段回填，提交时把 name / health /
 *    type / description 全部带上，否则没带的字段会被清空。
 */
import { onMounted, ref, watch } from 'vue'
import { LoaderCircle, Pencil, Plus, RefreshCw, Skull } from '@lucide/vue'
import { enemiesApi } from '@/api/admin'
import { ApiError } from '@/api/client'
import type { Enemy, EnemyCreate } from '@/api/types'
import { useFeedbackStore } from '@/stores/feedback'
import UiDataTable from '@/components/ui/UiDataTable.vue'
import UiDrawer from '@/components/ui/UiDrawer.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiPagination from '@/components/ui/UiPagination.vue'
import type { TableColumn } from '@/components/ui/types'

/** 表单值统一存字符串：Number('') === 0 会掩盖「什么都没填」这种输入错误，提交前再转数字 */
interface EnemyForm {
    name: string
    health: string
    type: string
    description: string
}

const feedback = useFeedbackStore()

const rows = ref<Enemy[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const drawerOpen = ref(false)
/** null 表示新建，非 null 表示正在编辑该敌人 */
const editing = ref<Enemy | null>(null)
/** 详情加载中：此时禁用表单，避免用户在空表单上改动后把空值 PUT 回去 */
const detailLoading = ref(false)
const saving = ref(false)

const form = ref<EnemyForm>(emptyForm())
const errors = ref<Partial<Record<keyof EnemyForm, string>>>({})

const columns: TableColumn[] = [
    { key: 'id', title: 'ID', width: '72px', mono: true },
    { key: 'name', title: '名称' },
    { key: 'health', title: '生命', width: '100px', numeric: true },
    { key: 'type', title: '类型', width: '140px' },
    { key: 'description', title: '描述', width: '280px' },
    { key: 'created_at', title: '创建时间', width: '170px', mono: true },
    { key: 'actions', title: '操作', width: '100px', align: 'right' },
]

function emptyForm(): EnemyForm {
    return { name: '', health: '', type: '', description: '' }
}

async function load() {
    loading.value = true
    try {
        const res = await enemiesApi.list({ page: page.value, page_size: pageSize.value })
        rows.value = res?.list ?? []
        total.value = res?.total ?? 0
    } catch (e) {
        // 失败时清空列表，避免残留上一页的脏数据
        feedback.toast.error('加载敌人列表失败', (e as ApiError).message)
        rows.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

function openCreate() {
    editing.value = null
    errors.value = {}
    form.value = emptyForm()
    drawerOpen.value = true
}

async function openEdit(row: Enemy) {
    editing.value = row
    errors.value = {}
    form.value = emptyForm()
    drawerOpen.value = true
    detailLoading.value = true
    try {
        // ⚠️ PUT 整体替换：必须先拉全量字段，不能用列表行数据（列表字段不保证完整）
        const detail = await enemiesApi.detail(row.id)
        form.value = {
            name: detail.name ?? '',
            health: detail.health === null || detail.health === undefined ? '' : String(detail.health),
            type: detail.type ?? '',
            description: detail.description ?? '',
        }
    } catch (e) {
        // 详情拉不到就不要让用户提交，否则整表字段会被清空
        feedback.toast.error('读取敌人详情失败', (e as ApiError).message)
        drawerOpen.value = false
        editing.value = null
    } finally {
        detailLoading.value = false
    }
}

function closeDrawer() {
    if (saving.value) return
    drawerOpen.value = false
}

/** 非负整数校验：只接受纯数字（避免 '1.5' / '-1' / '1e3' 这类输入） */
function isNonNegativeInt(raw: string): boolean {
    const text = raw.trim()
    if (!/^\d+$/.test(text)) return false
    return Number.isSafeInteger(Number(text))
}

function validate(): boolean {
    const next: Partial<Record<keyof EnemyForm, string>> = {}

    const name = form.value.name.trim()
    if (!name) next.name = '名称不能为空'
    else if (name.length > 50) next.name = '名称长度不能超过 50 个字符'

    const health = form.value.health.trim()
    if (!health) next.health = '生命不能为空'
    else if (!isNonNegativeInt(health)) next.health = '生命必须是非负整数（>= 0，不支持小数）'

    const type = form.value.type.trim()
    if (!type) next.type = '类型不能为空'

    errors.value = next
    return Object.keys(next).length === 0
}

/** 组装写入体：PUT / POST 共用，字段必须齐全 */
function buildPayload(): EnemyCreate {
    return {
        name: form.value.name.trim(),
        health: Number(form.value.health.trim()),
        type: form.value.type.trim(),
        description: form.value.description,
    }
}

async function save() {
    if (!validate()) {
        feedback.toast.warning('表单校验未通过', '请先修正标红的字段再保存')
        return
    }
    const payload = buildPayload()
    saving.value = true
    try {
        if (editing.value) {
            // 整体替换：payload 里带上全部写入字段
            await enemiesApi.update(editing.value.id, payload)
            feedback.toast.success('敌人已更新', `#${editing.value.id} ${payload.name}`)
        } else {
            await enemiesApi.create(payload)
            feedback.toast.success('敌人已创建', payload.name)
        }
        drawerOpen.value = false
        editing.value = null
        await load()
    } catch (e) {
        feedback.toast.error(editing.value ? '保存敌人失败' : '创建敌人失败', (e as ApiError).message)
    } finally {
        saving.value = false
    }
}

watch(page, () => {
    void load()
})
watch(pageSize, () => {
    // 每页条数变化要回到第 1 页；若本来就在第 1 页，page 不变，这里主动拉一次
    if (page.value === 1) void load()
    else page.value = 1
})
onMounted(() => {
    void load()
})
</script>

<template>
    <UiPage>
        <UiPageHeader
            title="敌人管理"
            description="维护敌人模板（enemies）。接口：GET /api/v3/admin/game/enemies/list · GET /api/v3/admin/game/enemies/:id · POST /api/v3/admin/game/enemies · PUT /api/v3/admin/game/enemies/:id。后端未提供删除接口。"
        >
            <template #actions>
                <button class="btn btn-primary" type="button" @click="openCreate">
                    <Plus :size="14" />
                    新建
                </button>
                <button class="btn" type="button" :disabled="loading" @click="load">
                    <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" />
                    刷新
                </button>
            </template>
        </UiPageHeader>

        <section class="panel">
            <div class="panel-header flex-wrap gap-3">
                <h3 class="panel-title">
                    <Skull :size="15" class="text-phantom-200" />
                    敌人列表
                </h3>
                <span class="text-[11px] text-faint">共 {{ total }} 个敌人</span>
                <span class="ml-auto text-[11px] text-faint">编辑会先读取详情再整体提交，避免字段被清空</span>
            </div>

            <UiDataTable
                :columns="columns"
                :rows="rows"
                :loading="loading"
                :row-key="(row) => row.id"
                empty-text="没有敌人数据"
                empty-hint="enemies 表为空，或后端返回的 list 为空数组。点击右上角「新建」创建第一个敌人。"
            >
                <template #cell-id="{ row }">
                    <span class="text-muted">#{{ (row as Enemy).id }}</span>
                </template>

                <template #cell-name="{ row }">
                    <span class="font-medium text-strong">{{ (row as Enemy).name }}</span>
                </template>

                <template #cell-health="{ row }">
                    <span class="tabular text-soft">{{ (row as Enemy).health }}</span>
                </template>

                <template #cell-type="{ row }">
                    <span class="text-xs text-soft">{{ (row as Enemy).type || '—' }}</span>
                </template>

                <template #cell-description="{ row }">
                    <span class="block max-w-[280px] truncate" :title="(row as Enemy).description || ''">
                        {{ (row as Enemy).description || '—' }}
                    </span>
                </template>

                <template #cell-created_at="{ row }">
                    <span class="text-xs text-faint">{{ (row as Enemy).created_at || '—' }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn btn-sm" type="button" @click="openEdit(row as Enemy)">
                            <Pencil :size="13" />
                            编辑
                        </button>
                    </div>
                </template>

                <template #empty>
                    <UiEmpty
                        title="没有敌人数据"
                        hint="GET /api/v3/admin/game/enemies/list 返回空列表；可点击右上角「新建」创建敌人。"
                        compact
                    />
                </template>
            </UiDataTable>

            <UiPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
        </section>

        <!-- 新建 / 编辑表单 -->
        <UiDrawer
            :open="drawerOpen"
            :title="editing ? `编辑敌人 #${editing.id}` : '新建敌人'"
            :description="
                editing
                    ? 'PUT /api/v3/admin/game/enemies/:id —— 后端为整体替换，提交时会带上全部写入字段'
                    : 'POST /api/v3/admin/game/enemies —— 创建新敌人'
            "
            width="560px"
            @close="closeDrawer"
        >
            <div v-if="detailLoading" class="empty-state min-h-[140px] py-6">
                <LoaderCircle :size="16" class="animate-spin" />
                <span class="text-xs text-muted">正在读取敌人详情…</span>
            </div>

            <div v-else class="flex flex-col gap-4">
                <div v-if="editing" class="rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-xs text-muted">
                    <div class="flex items-center justify-between gap-3">
                        <span>创建时间</span>
                        <span class="font-mono text-[11px] text-faint">{{ editing.created_at || '—' }}</span>
                    </div>
                    <div class="mt-1 flex items-center justify-between gap-3">
                        <span>更新时间</span>
                        <span class="font-mono text-[11px] text-faint">{{ editing.updated_at || '—' }}</span>
                    </div>
                    <p class="mt-2 text-[11px] leading-snug text-faint">
                        字段已通过 GET /api/v3/admin/game/enemies/{{ editing.id }} 全量回填；PUT 会整体替换，请确认每个字段都是期望值。
                    </p>
                </div>

                <UiField label="名称" required :error="errors.name">
                    <input v-model="form.name" class="input" type="text" placeholder="例如：幽影狼" />
                </UiField>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <UiField label="生命" required :error="errors.health">
                        <input
                            v-model="form.health"
                            class="input tabular"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="非负整数"
                        />
                    </UiField>

                    <UiField label="类型" required :error="errors.type">
                        <input v-model="form.type" class="input" type="text" placeholder="例如：beast / undead" />
                    </UiField>
                </div>

                <UiField label="描述" hint="可留空">
                    <textarea v-model="form.description" class="textarea" rows="4" placeholder="敌人说明，可留空" />
                </UiField>
            </div>

            <template #footer>
                <button class="btn" type="button" :disabled="saving" @click="closeDrawer">取消</button>
                <button class="btn btn-primary" type="button" :disabled="saving || detailLoading" @click="save">
                    <LoaderCircle v-if="saving" :size="14" class="animate-spin" />
                    保存
                </button>
            </template>
        </UiDrawer>
    </UiPage>
</template>
