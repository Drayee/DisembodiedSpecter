<script setup lang="ts">
/**
 * SkillsView — 技能管理（skills）
 * 接口：
 *   GET  /api/v3/admin/game/skills/list?page&page_size
 *   GET  /api/v3/admin/game/skills/:id
 *   POST /api/v3/admin/game/skills
 *   PUT  /api/v3/admin/game/skills/:id
 * 另外为了把 character_id 显示成可读名字，会加载一次角色列表：
 *   GET  /api/v3/admin/game/characters/list?page=1&page_size=100
 * 后端没有删除接口，所以列表操作列只有「编辑」。
 *
 * ⚠️ 后端 PUT 是「整体替换」语义，不会做字段合并：
 *    因此编辑前必须先调 detail(id) 拉全量字段回填，提交时把 character_id / name /
 *    type / description 全部带上，否则没带的字段会被清空。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { Link2, LoaderCircle, Pencil, Plus, RefreshCw, Sparkles } from '@lucide/vue'
import { charactersApi, skillsApi } from '@/api/admin'
import { ApiError } from '@/api/client'
import type { Character, Skill, SkillCreate } from '@/api/types'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiDataTable from '@/components/ui/UiDataTable.vue'
import UiDrawer from '@/components/ui/UiDrawer.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiPagination from '@/components/ui/UiPagination.vue'
import type { TableColumn } from '@/components/ui/types'

/** 表单值统一存字符串：Number('') === 0 会掩盖「什么都没填」这种输入错误，提交前再转数字 */
interface SkillForm {
    characterId: string
    name: string
    type: string
    description: string
}

/** 下拉里的「手动输入」哨兵值：用于 skill.character_id 不在已加载的前 100 个角色里的情况 */
const MANUAL_PICK = 'manual'

const feedback = useFeedbackStore()

const rows = ref<Skill[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// —— 角色下拉数据源（后端 page_size 上限 100）——
const characterOptions = ref<Character[]>([])
const characterTotal = ref(0)
const characterLoading = ref(false)

const drawerOpen = ref(false)
/** null 表示新建，非 null 表示正在编辑该技能 */
const editing = ref<Skill | null>(null)
/** 详情加载中：此时禁用表单，避免用户在空表单上改动后把空值 PUT 回去 */
const detailLoading = ref(false)
const saving = ref(false)

const form = ref<SkillForm>(emptyForm())
const errors = ref<Partial<Record<keyof SkillForm, string>>>({})
/** 下拉当前值：'' = 未选择，'manual' = 手动输入模式，其它 = 角色 ID 字符串 */
const characterPick = ref('')

const columns: TableColumn[] = [
    { key: 'id', title: 'ID', width: '72px', mono: true },
    { key: 'character_id', title: '关联角色', width: '200px' },
    { key: 'name', title: '名称' },
    { key: 'type', title: '类型', width: '140px' },
    { key: 'description', title: '描述', width: '280px' },
    { key: 'created_at', title: '创建时间', width: '170px', mono: true },
    { key: 'actions', title: '操作', width: '100px', align: 'right' },
]

/** character_id → 角色名，仅包含已加载（前 100 个）的角色 */
const characterNameMap = computed(() => {
    const map = new Map<number, string>()
    for (const item of characterOptions.value) map.set(item.id, item.name)
    return map
})

const characterHint = computed(() => {
    if (characterLoading.value) return '正在加载角色列表…'
    if (!characterOptions.value.length) return '角色列表为空或加载失败，可选择「手动输入 ID」直接填写数字。'
    if (characterTotal.value > 100) return '仅显示前 100 个角色，可手动输入 ID'
    return '下拉列出前 100 个角色；找不到目标角色时可选择「手动输入 ID」。'
})

/** 列表/表单一律用这个函数显示关联角色：映射得到就显示「名称 #id」，否则只显示 #id */
function characterLabel(id: number): string {
    const name = characterNameMap.value.get(id)
    return name ? `${name} #${id}` : `#${id}`
}

function emptyForm(): SkillForm {
    return { characterId: '', name: '', type: '', description: '' }
}

/** 下拉切换时同步到表单值；「手动输入」模式下值由数字输入框维护，这里不动它 */
watch(characterPick, (value) => {
    if (value === MANUAL_PICK) return
    form.value.characterId = value
})

async function load() {
    loading.value = true
    try {
        const res = await skillsApi.list({ page: page.value, page_size: pageSize.value })
        rows.value = res?.list ?? []
        total.value = res?.total ?? 0
    } catch (e) {
        // 失败时清空列表，避免残留上一页的脏数据
        feedback.toast.error('加载技能列表失败', (e as ApiError).message)
        rows.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

async function loadCharacters() {
    characterLoading.value = true
    try {
        // 后端 page_size 上限 100，这里取满；超出部分在界面上提示可手动输入 ID
        const res = await charactersApi.list({ page: 1, page_size: 100 })
        characterOptions.value = res?.list ?? []
        characterTotal.value = res?.total ?? 0
    } catch (e) {
        feedback.toast.error('加载角色列表失败', `${(e as ApiError).message}（技能仍可手动输入角色 ID）`)
        characterOptions.value = []
        characterTotal.value = 0
    } finally {
        characterLoading.value = false
    }
}

async function refreshAll() {
    await Promise.all([load(), loadCharacters()])
}

function openCreate() {
    editing.value = null
    errors.value = {}
    form.value = emptyForm()
    characterPick.value = ''
    drawerOpen.value = true
}

async function openEdit(row: Skill) {
    editing.value = row
    errors.value = {}
    form.value = emptyForm()
    characterPick.value = ''
    drawerOpen.value = true
    detailLoading.value = true
    try {
        // ⚠️ PUT 整体替换：必须先拉全量字段，不能用列表行数据（列表字段不保证完整）
        const detail = await skillsApi.detail(row.id)
        const idText = detail.character_id === null || detail.character_id === undefined ? '' : String(detail.character_id)
        form.value = {
            characterId: idText,
            name: detail.name ?? '',
            type: detail.type ?? '',
            description: detail.description ?? '',
        }
        // 关联角色在前 100 个里就由下拉回显，否则切到「手动输入」以免下拉显示成空值
        characterPick.value = idText && characterNameMap.value.has(Number(idText)) ? idText : MANUAL_PICK
    } catch (e) {
        // 详情拉不到就不要让用户提交，否则整表字段会被清空
        feedback.toast.error('读取技能详情失败', (e as ApiError).message)
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

function validate(): boolean {
    const next: Partial<Record<keyof SkillForm, string>> = {}

    const characterId = form.value.characterId.trim()
    if (!characterId) next.characterId = '请选择或输入关联角色 ID'
    else if (!/^\d+$/.test(characterId) || Number(characterId) < 1) next.characterId = '关联角色 ID 必须是 >= 1 的整数'

    const name = form.value.name.trim()
    if (!name) next.name = '名称不能为空'
    else if (name.length > 50) next.name = '名称长度不能超过 50 个字符'

    const type = form.value.type.trim()
    if (!type) next.type = '类型不能为空'

    errors.value = next
    return Object.keys(next).length === 0
}

/** 组装写入体：PUT / POST 共用，字段必须齐全 */
function buildPayload(): SkillCreate {
    return {
        character_id: Number(form.value.characterId.trim()),
        name: form.value.name.trim(),
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
            await skillsApi.update(editing.value.id, payload)
            feedback.toast.success('技能已更新', `#${editing.value.id} ${payload.name}`)
        } else {
            await skillsApi.create(payload)
            feedback.toast.success('技能已创建', payload.name)
        }
        drawerOpen.value = false
        editing.value = null
        await load()
    } catch (e) {
        feedback.toast.error(editing.value ? '保存技能失败' : '创建技能失败', (e as ApiError).message)
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
    void refreshAll()
})
</script>

<template>
    <UiPage>
        <UiPageHeader
            title="技能管理"
            description="维护技能（skills）。接口：GET /api/v3/admin/game/skills/list · GET /api/v3/admin/game/skills/:id · POST /api/v3/admin/game/skills · PUT /api/v3/admin/game/skills/:id。关联角色下拉来自 GET /api/v3/admin/game/characters/list?page=1&page_size=100。后端未提供删除接口。"
        >
            <template #actions>
                <button class="btn btn-primary" type="button" @click="openCreate">
                    <Plus :size="14" />
                    新建
                </button>
                <button class="btn" type="button" :disabled="loading || characterLoading" @click="refreshAll">
                    <RefreshCw :size="14" :class="loading || characterLoading ? 'animate-spin' : ''" />
                    刷新
                </button>
            </template>
        </UiPageHeader>

        <section class="panel">
            <div class="panel-header flex-wrap gap-3">
                <h3 class="panel-title">
                    <Sparkles :size="15" class="text-phantom-200" />
                    技能列表
                </h3>
                <span class="text-[11px] text-faint">共 {{ total }} 个技能</span>
                <span class="ml-auto text-[11px] text-faint">
                    关联角色列由已加载的前 100 个角色映射；映射不到时只显示 #id
                </span>
            </div>

            <UiDataTable
                :columns="columns"
                :rows="rows"
                :loading="loading"
                :row-key="(row) => row.id"
                empty-text="没有技能数据"
                empty-hint="skills 表为空，或后端返回的 list 为空数组。点击右上角「新建」创建第一个技能。"
            >
                <template #cell-id="{ row }">
                    <span class="text-muted">#{{ (row as Skill).id }}</span>
                </template>

                <template #cell-character_id="{ row }">
                    <UiBadge
                        :tone="characterNameMap.has((row as Skill).character_id) ? 'accent' : 'default'"
                        :title="`character_id = ${(row as Skill).character_id}`"
                    >
                        <Link2 :size="11" />
                        {{ characterLabel((row as Skill).character_id) }}
                    </UiBadge>
                </template>

                <template #cell-name="{ row }">
                    <span class="font-medium text-strong">{{ (row as Skill).name }}</span>
                </template>

                <template #cell-type="{ row }">
                    <span class="text-xs text-soft">{{ (row as Skill).type || '—' }}</span>
                </template>

                <template #cell-description="{ row }">
                    <span class="block max-w-[280px] truncate" :title="(row as Skill).description || ''">
                        {{ (row as Skill).description || '—' }}
                    </span>
                </template>

                <template #cell-created_at="{ row }">
                    <span class="text-xs text-faint">{{ (row as Skill).created_at || '—' }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn btn-sm" type="button" @click="openEdit(row as Skill)">
                            <Pencil :size="13" />
                            编辑
                        </button>
                    </div>
                </template>

                <template #empty>
                    <UiEmpty
                        title="没有技能数据"
                        hint="GET /api/v3/admin/game/skills/list 返回空列表；可点击右上角「新建」创建技能。"
                        compact
                    />
                </template>
            </UiDataTable>

            <UiPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
        </section>

        <!-- 新建 / 编辑表单 -->
        <UiDrawer
            :open="drawerOpen"
            :title="editing ? `编辑技能 #${editing.id}` : '新建技能'"
            :description="
                editing
                    ? 'PUT /api/v3/admin/game/skills/:id —— 后端为整体替换，提交时会带上全部写入字段'
                    : 'POST /api/v3/admin/game/skills —— 创建新技能'
            "
            width="560px"
            @close="closeDrawer"
        >
            <div v-if="detailLoading" class="empty-state min-h-[140px] py-6">
                <LoaderCircle :size="16" class="animate-spin" />
                <span class="text-xs text-muted">正在读取技能详情…</span>
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
                        字段已通过 GET /api/v3/admin/game/skills/{{ editing.id }} 全量回填；PUT 会整体替换，请确认 character_id 也是期望值。
                    </p>
                </div>

                <UiField label="关联角色" required :error="errors.characterId" :hint="characterHint">
                    <select v-model="characterPick" class="select" :disabled="characterLoading">
                        <option value="">{{ characterLoading ? '加载中…' : '请选择角色' }}</option>
                        <option v-for="item in characterOptions" :key="item.id" :value="String(item.id)">
                            #{{ item.id }} · {{ item.name }}
                        </option>
                        <option :value="MANUAL_PICK">手动输入 ID…</option>
                    </select>
                    <input
                        v-if="characterPick === MANUAL_PICK"
                        v-model="form.characterId"
                        class="input input-mono mt-1.5"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="请输入角色 ID（>= 1）"
                    />
                </UiField>

                <UiField label="名称" required :error="errors.name">
                    <input v-model="form.name" class="input" type="text" placeholder="例如：幽影斩" />
                </UiField>

                <UiField label="类型" required :error="errors.type">
                    <input v-model="form.type" class="input" type="text" placeholder="例如：attack / buff" />
                </UiField>

                <UiField label="描述" hint="可留空">
                    <textarea v-model="form.description" class="textarea" rows="4" placeholder="技能说明，可留空" />
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
