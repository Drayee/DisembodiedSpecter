<script setup lang="ts">
/**
 * BuffsView — Buff 管理
 *
 * 接口（对应 internal/handlers/router.go）：
 *   GET  /api/v3/admin/game/buffs/list?page&page_size   分页列表
 *   GET  /api/v3/admin/game/buffs/:id                   详情（打开编辑表单前必须调用）
 *   POST /api/v3/admin/game/buffs                       新建
 *   PUT  /api/v3/admin/game/buffs/:id                   更新（整体替换）
 * 后端未提供 DELETE /api/v3/admin/game/buffs/:id，因此本页不提供删除入口。
 *
 * ⚠️ 风险（必须遵守，否则会出现「保存后字段被清空」）：
 *   1) 后端 PUT 是「整体替换」而不是局部更新；
 *   2) name / type / loss_way 在请求 DTO 上都是 binding:"required"，
 *      漏字段会被后端判为参数错误（code 4001）或把枚举字段写成零值。
 *   因此打开编辑表单前先 GET detail 拉全量再填表，提交时固定带全
 *   { name, type, loss_way, default_duration, effects, description } 六个字段。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { LoaderCircle, Pencil, Plus, RefreshCw, Sparkles, Trash, TriangleAlert } from '@lucide/vue'
import { buffsApi } from '@/api/admin'
import { ApiError } from '@/api/client'
import {
    BuffLossWayOptions,
    BuffStatOptions,
    BuffTypeOptions,
    type Buff,
    type BuffCreate,
    type BuffEffect,
    type BuffLossWay,
    type BuffStat,
    type BuffType,
} from '@/api/types'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiDataTable from '@/components/ui/UiDataTable.vue'
import type { TableColumn } from '@/components/ui/types'
import UiDrawer from '@/components/ui/UiDrawer.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiPagination from '@/components/ui/UiPagination.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'

const feedback = useFeedbackStore()

// ==================== 列表 ====================

const rows = ref<Buff[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const columns: TableColumn[] = [
    { key: 'id', title: 'ID', width: '72px', mono: true },
    { key: 'name', title: '名称' },
    { key: 'type', title: '类型', width: '140px' },
    { key: 'loss_way', title: '损耗方式', width: '150px' },
    { key: 'default_duration', title: '默认时长', width: '110px', numeric: true },
    { key: 'effects', title: '效果', width: '280px' },
    { key: 'actions', title: '操作', width: '96px', align: 'right' },
]

async function load() {
    loading.value = true
    try {
        const res = await buffsApi.list({ page: page.value, page_size: pageSize.value })
        rows.value = res?.list ?? []
        total.value = res?.total ?? 0
    } catch (e) {
        feedback.toast.error('加载 Buff 列表失败', (e as ApiError).message)
        rows.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

// ==================== 枚举展示 ====================

type BadgeTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'info'

const TYPE_TONES: Record<BuffType, BadgeTone> = {
    value_change: 'accent',
    percent_change: 'accent',
    listener: 'info',
    tag: 'default',
}

const LOSS_TONES: Record<BuffLossWay, BadgeTone> = {
    time: 'default',
    action: 'warn',
    none: 'ok',
    listener: 'info',
}

/** 从 Options 常量里取中文标签，查不到就退回原始值 */
function optionLabel<T extends string>(options: readonly { readonly value: T; readonly label: string }[], value: T): string {
    return options.find((o) => o.value === value)?.label ?? value
}

function typeLabel(type: BuffType): string {
    return optionLabel(BuffTypeOptions, type)
}

function lossLabel(loss: BuffLossWay): string {
    return optionLabel(BuffLossWayOptions, loss)
}

function statLabel(stat: BuffStat): string {
    return optionLabel(BuffStatOptions, stat)
}

/** 单条效果摘要：percent=true 时 value 是比例（0.1 → +10%），否则是固定值 */
function effectText(effect: BuffEffect): string {
    const raw = Number(effect.value)
    const name = statLabel(effect.stat)
    if (!Number.isFinite(raw)) return `${name} ?`
    // 先换算成展示单位，再保留两位小数，避免 0.1 * 100 = 10.000000000000002
    const shown = Math.round((effect.percent ? raw * 100 : raw) * 100) / 100
    const sign = shown > 0 ? '+' : ''
    return `${name} ${sign}${shown}${effect.percent ? '%' : ''}`
}

/** 效果摘要列：后端可能返回 null，统一按空数组处理 */
function effectsSummary(effects: BuffEffect[] | null): string {
    const list = effects ?? []
    if (!list.length) return '无效果'
    return list.map(effectText).join(' · ')
}

function durationText(duration: number): string {
    return duration > 0 ? String(duration) : '不兜底'
}

// ==================== 表单 ====================

/** 表单内的效果行：value 用字符串保存输入框原文，避免空串被 Number('') 变成 0 */
interface EffectRow {
    /** 仅前端使用的稳定 key，不提交给后端 */
    uid: number
    stat: BuffStat
    value: string
    percent: boolean
}

interface BuffForm {
    /** null = 新建 */
    id: number | null
    name: string
    type: BuffType
    loss_way: BuffLossWay
    default_duration: string
    description: string
    effects: EffectRow[]
}

let effectSeq = 0

function makeEffectRow(stat: BuffStat = 'attack', value = '', percent = false): EffectRow {
    effectSeq += 1
    return { uid: effectSeq, stat, value, percent }
}

const drawerOpen = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)

const form = ref<BuffForm>({
    id: null,
    name: '',
    type: 'value_change',
    loss_way: 'none',
    default_duration: '0',
    description: '',
    effects: [],
})

/** 顶部两个字段的错误信息（效果行错误单独放在 effectErrors 里，按下标对应） */
const formError = ref<{ name: string; default_duration: string }>({ name: '', default_duration: '' })
const effectErrors = ref<string[]>([])

const isEditing = computed(() => form.value.id !== null)
const drawerTitle = computed(() => (isEditing.value ? `编辑 Buff #${form.value.id}` : '新建 Buff'))

/** 新建：默认 type=value_change、loss_way=none、default_duration=0（不兜底）、效果列表为空 */
function openCreate() {
    form.value = {
        id: null,
        name: '',
        type: 'value_change',
        loss_way: 'none',
        default_duration: '0',
        description: '',
        effects: [],
    }
    formError.value = { name: '', default_duration: '' }
    effectErrors.value = []
    drawerOpen.value = true
}

/** 用详情接口返回的完整实体填表 */
function fillForm(buff: Buff) {
    form.value = {
        id: buff.id,
        name: buff.name ?? '',
        type: buff.type ?? 'value_change',
        loss_way: buff.loss_way ?? 'none',
        default_duration: String(buff.default_duration ?? 0),
        description: buff.description ?? '',
        effects: (buff.effects ?? []).map((e) => makeEffectRow(e.stat, String(e.value ?? ''), !!e.percent)),
    }
    formError.value = { name: '', default_duration: '' }
    effectErrors.value = form.value.effects.map(() => '')
}

/**
 * 编辑：先打开抽屉显示 loading，再 GET detail(id) 拉全量字段。
 * 列表项不保证字段完整（effects 可能是 null），直接拿列表数据提交会把字段清空。
 * 详情拉取失败则直接关闭抽屉，避免用不完整数据提交整体替换请求。
 */
async function openEdit(row: Buff) {
    form.value = { ...form.value, id: row.id }
    formError.value = { name: '', default_duration: '' }
    effectErrors.value = []
    detailLoading.value = true
    drawerOpen.value = true
    try {
        const full = (await buffsApi.detail(row.id)) ?? row
        fillForm(full)
    } catch (e) {
        drawerOpen.value = false
        feedback.toast.error('加载 Buff 详情失败', (e as ApiError).message)
    } finally {
        detailLoading.value = false
    }
}

function addEffect() {
    form.value.effects.push(makeEffectRow())
    effectErrors.value.push('')
}

function removeEffect(index: number) {
    form.value.effects.splice(index, 1)
    effectErrors.value.splice(index, 1)
}

/** 表单校验：不通过则不发请求，错误内联显示在 UiField 上 */
function validate(): boolean {
    const e = { name: '', default_duration: '' }
    let ok = true

    if (!form.value.name.trim()) {
        e.name = '名称不能为空'
        ok = false
    }

    const durationRaw = form.value.default_duration.trim()
    const duration = Number(durationRaw)
    if (durationRaw === '' || !Number.isInteger(duration) || duration < 0) {
        e.default_duration = '请输入 >= 0 的整数（0 表示不兜底）'
        ok = false
    }

    // 效果列表：type=tag 时允许为空；其余行必须是有限数字
    // 按比例时只提示范围（-1 ~ 1 为常见用法），后端未约束，因此不阻止提交
    const errs = form.value.effects.map(() => '')
    form.value.effects.forEach((effect, index) => {
        const raw = effect.value.trim()
        if (raw === '' || !Number.isFinite(Number(raw))) {
            errs[index] = '数值必须是有限数字'
            ok = false
        }
    })

    formError.value = e
    effectErrors.value = errs
    return ok
}

async function submit() {
    if (!validate()) {
        feedback.toast.warning('表单校验未通过', '请修正标红的字段后再保存。')
        return
    }

    // PUT 整体替换：六个字段必须全部带上（name / type / loss_way 后端 required）
    const payload: BuffCreate = {
        name: form.value.name.trim(),
        type: form.value.type,
        loss_way: form.value.loss_way,
        default_duration: Number(form.value.default_duration),
        effects: form.value.effects.map<BuffEffect>((effect) => ({
            stat: effect.stat,
            value: Number(effect.value),
            percent: effect.percent,
        })),
        description: form.value.description.trim(),
    }

    submitting.value = true
    try {
        if (form.value.id === null) {
            await buffsApi.create(payload)
            feedback.toast.success('Buff 已创建', payload.name)
        } else {
            await buffsApi.update(form.value.id, payload)
            feedback.toast.success('Buff 已更新', `#${form.value.id} ${payload.name}`)
        }
        drawerOpen.value = false
        await load()
    } catch (e) {
        feedback.toast.error(isEditing.value ? '保存 Buff 失败' : '创建 Buff 失败', (e as ApiError).message)
    } finally {
        submitting.value = false
    }
}

watch([page, pageSize], load)
watch(pageSize, () => (page.value = 1))
onMounted(load)
</script>

<template>
    <UiPage>
        <UiPageHeader
            title="Buff 管理"
            description="维护 Buff 词条：GET /api/v3/admin/game/buffs/list（分页）、GET /api/v3/admin/game/buffs/:id（详情）、POST /api/v3/admin/game/buffs（新建）、PUT /api/v3/admin/game/buffs/:id（整体更新）。后端未提供删除接口，本页只能新建与修改。"
        >
            <template #actions>
                <button class="btn" type="button" :disabled="loading" @click="load">
                    <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" />
                    刷新
                </button>
                <button class="btn btn-primary" type="button" @click="openCreate">
                    <Plus :size="14" />
                    新建
                </button>
            </template>
        </UiPageHeader>

        <section class="panel">
            <div class="panel-header">
                <h3 class="panel-title">
                    <Sparkles :size="15" class="text-phantom-200" />
                    Buff 列表
                </h3>
                <span class="text-[11px] text-faint">共 {{ total }} 条</span>
                <span class="ml-auto text-[11px] text-faint">
                    编辑前会先调用详情接口拉取全量字段（PUT 为整体替换）
                </span>
            </div>

            <UiDataTable
                :columns="columns"
                :rows="rows"
                :loading="loading"
                :row-key="(row) => row.id"
                empty-text="没有 Buff 数据"
                empty-hint="后端 buffs 表为空，或 list 接口返回了空数组。"
            >
                <template #cell-id="{ row }">
                    <span class="text-muted">#{{ (row as Buff).id }}</span>
                </template>

                <template #cell-name="{ row }">
                    <span class="font-medium text-strong">{{ (row as Buff).name }}</span>
                </template>

                <template #cell-type="{ row }">
                    <UiBadge :tone="TYPE_TONES[(row as Buff).type] ?? 'default'">
                        {{ typeLabel((row as Buff).type) }}
                    </UiBadge>
                </template>

                <template #cell-loss_way="{ row }">
                    <UiBadge :tone="LOSS_TONES[(row as Buff).loss_way] ?? 'default'">
                        {{ lossLabel((row as Buff).loss_way) }}
                    </UiBadge>
                </template>

                <template #cell-default_duration="{ row }">
                    <span v-if="(row as Buff).default_duration > 0" class="tabular text-soft">
                        {{ durationText((row as Buff).default_duration) }}
                    </span>
                    <span v-else class="text-xs text-faint" title="default_duration = 0：不做兜底时长，按临时 buff 处理">
                        {{ durationText((row as Buff).default_duration) }}
                    </span>
                </template>

                <template #cell-effects="{ row }">
                    <span
                        class="block truncate text-xs"
                        :class="effectsSummary((row as Buff).effects) === '无效果' ? 'text-faint' : 'text-soft'"
                        :title="effectsSummary((row as Buff).effects)"
                    >
                        {{ effectsSummary((row as Buff).effects) }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn btn-sm" type="button" :disabled="detailLoading" @click="openEdit(row as Buff)">
                            <LoaderCircle v-if="detailLoading && form.id === (row as Buff).id" :size="13" class="animate-spin" />
                            <Pencil v-else :size="13" />
                            编辑
                        </button>
                    </div>
                </template>

                <template #empty>
                    <UiEmpty
                        title="没有 Buff 数据"
                        hint="后端 buffs 表为空，或 list 接口返回空数组。点击右上角「新建」可以创建第一条 Buff。"
                        compact
                    />
                </template>
            </UiDataTable>

            <UiPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
        </section>

        <!-- 新建 / 编辑：抽屉宽度 640px，效果行可动态增删 -->
        <UiDrawer
            :open="drawerOpen"
            :title="drawerTitle"
            description="effects 中 percent=true 时 value 是比例（0.1 表示 +10%），false 时是固定值。"
            width="640px"
            @close="drawerOpen = false"
        >
            <div v-if="detailLoading" class="flex min-h-[220px] items-center justify-center gap-2 text-xs text-muted">
                <LoaderCircle :size="15" class="animate-spin" />
                正在拉取详情（PUT 为整体替换，必须先取回全量字段）…
            </div>

            <div v-else class="flex flex-col gap-4">
                <div
                    class="flex items-start gap-2 rounded-sm border border-amber-glow/30 bg-amber-glow/10 px-3 py-2 text-[11px] leading-relaxed text-amber-glow"
                >
                    <TriangleAlert :size="14" class="mt-0.5 shrink-0" />
                    <span>
                        PUT /api/v3/admin/game/buffs/:id 为整体替换，且 name / type / loss_way 必填；提交时会一并提交
                        name、type、loss_way、default_duration、effects、description 六个字段。
                    </span>
                </div>

                <UiField label="名称" required :error="formError.name" hint="用于战斗日志与详情展示，需唯一且非空。">
                    <input v-model="form.name" class="input" type="text" placeholder="如：灼烧" />
                </UiField>

                <UiField label="类型" hint="type=tag 为纯标签，可以没有效果列表。">
                    <select v-model="form.type" class="select">
                        <option v-for="opt in BuffTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                </UiField>

                <UiField label="损耗方式" hint="time/action 按回合或行动递减，none 为永久，listener 由事件触发移除。">
                    <select v-model="form.loss_way" class="select">
                        <option v-for="opt in BuffLossWayOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                </UiField>

                <UiField
                    label="默认时长"
                    :error="formError.default_duration"
                    hint="0 = 不兜底（按临时 buff 处理），正整数表示默认持续回合数。"
                >
                    <input v-model="form.default_duration" class="input input-mono tabular" type="number" min="0" step="1" placeholder="0" />
                </UiField>

                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between gap-2">
                        <span class="field-label">效果列表</span>
                        <span class="text-[11px] text-faint">type=tag 时可留空，其它类型建议至少一条</span>
                    </div>

                    <p
                        v-if="!form.effects.length"
                        class="rounded-sm border border-dashed border-line bg-surface-2 px-3 py-3 text-center text-[11px] text-faint"
                    >
                        暂无效果，点击下方「添加效果」新增一条。
                    </p>

                    <div
                        v-for="(effect, index) in form.effects"
                        :key="effect.uid"
                        class="flex flex-col gap-2 rounded-md border border-line bg-surface-2 p-3"
                    >
                        <div class="flex items-start gap-2">
                            <div class="w-28 shrink-0">
                                <UiField label="属性">
                                    <select v-model="effect.stat" class="select">
                                        <option v-for="opt in BuffStatOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </UiField>
                            </div>

                            <div class="w-36 shrink-0">
                                <UiField
                                    label="数值"
                                    :error="effectErrors[index] || ''"
                                    :hint="effect.percent ? '0.1 = +10%（范围建议 -1 ~ 1）' : '固定值，可为负数'"
                                >
                                    <input
                                        v-model="effect.value"
                                        class="input input-mono tabular"
                                        type="number"
                                        step="any"
                                        :placeholder="effect.percent ? '0.1' : '5'"
                                    />
                                </UiField>
                            </div>

                            <div class="flex shrink-0 flex-col gap-1.5">
                                <!-- 用与 UiField 标签同结构的占位保持垂直对齐 -->
                                <span class="field-label invisible select-none" aria-hidden="true">占位</span>
                                <div class="flex items-center gap-2">
                                    <UiSwitch v-model="effect.percent" label="按比例(%)" />
                                    <button class="btn btn-danger btn-sm" type="button" title="删除该效果行" @click="removeEffect(index)">
                                        <Trash :size="13" />
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button class="btn btn-sm" type="button" @click="addEffect">
                            <Plus :size="13" />
                            添加效果
                        </button>
                    </div>
                </div>

                <UiField label="描述" hint="可选，说明该 Buff 的用途与来源。">
                    <textarea v-model="form.description" class="textarea" rows="3" placeholder="如：每回合结束时受到 5 点火焰伤害" />
                </UiField>
            </div>

            <template #footer>
                <button class="btn" type="button" :disabled="submitting" @click="drawerOpen = false">取消</button>
                <button class="btn btn-primary" type="button" :disabled="submitting || detailLoading" @click="submit">
                    <LoaderCircle v-if="submitting" :size="14" class="animate-spin" />
                    {{ isEditing ? '保存' : '创建' }}
                </button>
            </template>
        </UiDrawer>
    </UiPage>
</template>
