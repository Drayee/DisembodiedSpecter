<script setup lang="ts">
/**
 * EmailsView — 邮箱配置
 *
 * 接口（对应 internal/handlers/router.go）：
 *   GET /api/v3/admin/config/emails        返回 { list: EmailConfig[] }，无分页参数，一次返回全部
 *   PUT /api/v3/admin/config/emails/:id    整体替换该条配置
 *
 * 说明：
 *   1) 列表接口不分页且数据量很小（SMTP 发信配置），因此本页不提供分页器；
 *   2) 后端只提供 PUT（整体替换），没有单字段更新接口，所以编辑表单里 6 个字段全部参与提交，
 *      漏字段会把该字段写成零值；
 *   3) 状态约定 1=启用 / 0=停用，见 src/api/types.ts 的 EmailStatus（后端未定义该常量，
 *      这里的文案与色调仅为前端展示约定）；
 *   4) 列表中的密码一律显示掩码，只有编辑弹窗里通过眼睛按钮才会展开明文。
 */
import { computed, onMounted, ref } from 'vue'
import { Eye, EyeOff, LoaderCircle, Mail, Pencil, RefreshCw, TriangleAlert } from '@lucide/vue'
import { configApi } from '@/api/admin'
import { ApiError } from '@/api/client'
import { EmailStatus, type EmailConfig, type EmailConfigUpdate } from '@/api/types'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiDataTable from '@/components/ui/UiDataTable.vue'
import type { TableColumn } from '@/components/ui/types'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'

const feedback = useFeedbackStore()

// ==================== 列表 ====================

const rows = ref<EmailConfig[]>([])
const loading = ref(false)

const columns: TableColumn[] = [
    { key: 'id', title: 'ID', width: '72px', mono: true },
    { key: 'host', title: 'SMTP 主机' },
    { key: 'port', title: '端口', width: '90px', numeric: true },
    { key: 'user', title: '账号', width: '200px' },
    { key: 'pass', title: '密码', width: '110px' },
    { key: 'max_count', title: '单次上限', width: '110px', numeric: true },
    { key: 'status', title: '状态', width: '110px' },
    { key: 'updated_at', title: '更新时间', width: '170px', mono: true },
    { key: 'actions', title: '操作', width: '96px', align: 'right' },
]

async function load() {
    loading.value = true
    try {
        const res = await configApi.emails()
        rows.value = res?.list ?? []
    } catch (e) {
        feedback.toast.error('加载邮箱配置失败', (e as ApiError).message)
        rows.value = []
    } finally {
        loading.value = false
    }
}

// ==================== 展示辅助 ====================

/** 状态：后端未定义常量，按 1=启用 / 0=停用 约定展示 */
function statusLabel(status: number): string {
    return status === EmailStatus.Enabled ? '已启用' : '已停用'
}

function statusTone(status: number): 'ok' | 'danger' {
    return status === EmailStatus.Enabled ? 'ok' : 'danger'
}

/** 列表里密码永远只显示掩码，不输出明文 */
function passMask(pass: string): string {
    return pass ? '••••••' : '—'
}

// ==================== 编辑表单 ====================

/** 表单内数字字段用字符串保存输入框原文，提交前再转 number 并校验 */
interface EmailForm {
    id: number
    host: string
    port: string
    user: string
    pass: string
    max_count: string
    status: number
}

const modalOpen = ref(false)
const submitting = ref(false)
const passVisible = ref(false)

const form = ref<EmailForm>({ id: 0, host: '', port: '465', user: '', pass: '', max_count: '0', status: EmailStatus.Enabled })
const formError = ref<{ host: string; port: string; max_count: string }>({ host: '', port: '', max_count: '' })

const segmentedStatus = computed(() => String(form.value.status))

function openEdit(row: EmailConfig) {
    form.value = {
        id: row.id,
        host: row.host ?? '',
        port: String(row.port ?? ''),
        user: row.user ?? '',
        pass: row.pass ?? '',
        max_count: String(row.max_count ?? 0),
        status: row.status ?? EmailStatus.Disabled,
    }
    formError.value = { host: '', port: '', max_count: '' }
    passVisible.value = false
    modalOpen.value = true
}

function closeModal() {
    if (submitting.value) return
    modalOpen.value = false
    passVisible.value = false
}

/** 前端校验：主机非空、端口 1~65535 整数、单次上限 >= 0 整数 */
function validate(): boolean {
    const e = { host: '', port: '', max_count: '' }
    let ok = true

    if (!form.value.host.trim()) {
        e.host = 'SMTP 主机不能为空'
        ok = false
    }

    const portRaw = form.value.port.trim()
    const port = Number(portRaw)
    if (portRaw === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
        e.port = '端口必须是 1 ~ 65535 的整数'
        ok = false
    }

    const maxRaw = form.value.max_count.trim()
    const maxCount = Number(maxRaw)
    if (maxRaw === '' || !Number.isInteger(maxCount) || maxCount < 0) {
        e.max_count = '单次上限必须是 >= 0 的整数'
        ok = false
    }

    formError.value = e
    return ok
}

async function submit() {
    if (!validate()) {
        feedback.toast.warning('表单校验未通过', '请修正标红的字段后再保存。')
        return
    }

    // PUT 是整体替换：6 个字段全部提交
    const payload: EmailConfigUpdate = {
        host: form.value.host.trim(),
        port: Number(form.value.port),
        user: form.value.user.trim(),
        pass: form.value.pass,
        max_count: Number(form.value.max_count),
        status: form.value.status,
    }

    submitting.value = true
    try {
        await configApi.updateEmail(form.value.id, payload)
        feedback.toast.success('邮箱配置已更新', `#${form.value.id} ${payload.host}:${payload.port}`)
        modalOpen.value = false
        passVisible.value = false
        await load()
    } catch (e) {
        feedback.toast.error('保存邮箱配置失败', (e as ApiError).message)
    } finally {
        submitting.value = false
    }
}

onMounted(load)
</script>

<template>
    <UiPage>
        <UiPageHeader
            title="邮箱配置"
            description="管理 SMTP 发信配置：GET /api/v3/admin/config/emails（无分页，一次返回全部）、PUT /api/v3/admin/config/emails/:id（整体替换）。状态按 1=启用 / 0=停用 展示（后端未定义该常量）。"
        >
            <template #actions>
                <button class="btn" type="button" :disabled="loading" @click="load">
                    <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" />
                    刷新
                </button>
            </template>
        </UiPageHeader>

        <section class="panel">
            <div class="panel-header">
                <h3 class="panel-title">
                    <Mail :size="15" class="text-phantom-200" />
                    邮箱配置列表
                </h3>
                <span class="text-[11px] text-faint">共 {{ rows.length }} 条</span>
                <span class="ml-auto text-[11px] text-faint">接口不分页，一次返回全部配置</span>
            </div>

            <UiDataTable
                :columns="columns"
                :rows="rows"
                :loading="loading"
                :row-key="(row) => row.id"
                empty-text="暂无邮箱配置"
                empty-hint="邮箱配置表为空，需先在数据库 / 后管初始化。"
            >
                <template #cell-id="{ row }">
                    <span class="text-muted">#{{ (row as EmailConfig).id }}</span>
                </template>

                <template #cell-host="{ row }">
                    <span class="font-medium text-strong">{{ (row as EmailConfig).host || '—' }}</span>
                </template>

                <template #cell-port="{ row }">
                    <span class="tabular text-soft">{{ (row as EmailConfig).port }}</span>
                </template>

                <template #cell-user="{ row }">
                    <span class="truncate text-xs text-muted">{{ (row as EmailConfig).user || '—' }}</span>
                </template>

                <template #cell-pass="{ row }">
                    <span
                        class="text-xs text-faint"
                        title="出于安全考虑，列表不显示密码明文；需要查看时请在编辑弹窗中点击眼睛按钮"
                    >
                        {{ passMask((row as EmailConfig).pass) }}
                    </span>
                </template>

                <template #cell-max_count="{ row }">
                    <span class="tabular text-soft">{{ (row as EmailConfig).max_count }}</span>
                </template>

                <template #cell-status="{ row }">
                    <UiBadge :tone="statusTone((row as EmailConfig).status)" dot>
                        {{ statusLabel((row as EmailConfig).status) }}
                    </UiBadge>
                </template>

                <template #cell-updated_at="{ row }">
                    <span class="text-xs text-faint">{{ (row as EmailConfig).updated_at || '—' }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn btn-sm" type="button" @click="openEdit(row as EmailConfig)">
                            <Pencil :size="13" />
                            编辑
                        </button>
                    </div>
                </template>

                <template #empty>
                    <UiEmpty
                        title="没有邮箱配置"
                        hint="邮箱配置表为空，需先在数据库 / 后管初始化一条 SMTP 配置后再回到这里编辑。"
                        compact
                    />
                </template>
            </UiDataTable>
        </section>

        <!-- 编辑：PUT 整体替换，6 个字段全部提交 -->
        <UiModal
            :open="modalOpen"
            title="编辑邮箱配置"
            description="PUT /api/v3/admin/config/emails/:id 为整体替换，host、port、user、pass、max_count、status 会一并提交。"
            width="520px"
            @close="closeModal"
        >
            <div class="flex flex-col gap-4">
                <div
                    class="flex items-start gap-2 rounded-sm border border-amber-glow/30 bg-amber-glow/10 px-3 py-2 text-[11px] leading-relaxed text-amber-glow"
                >
                    <TriangleAlert :size="14" class="mt-0.5 shrink-0" />
                    <span>没有单字段更新接口：改动任意一项都会整体覆盖该条记录，请确认其余字段也是期望值。</span>
                </div>

                <div class="rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-xs text-muted">
                    <span class="text-strong">#{{ form.id }}</span>
                    <span class="ml-2">{{ statusLabel(form.status) }}</span>
                    <span class="ml-2">ID 为数据库主键，不可修改</span>
                </div>

                <UiField label="SMTP 主机" required :error="formError.host" hint="如 smtp.qq.com、smtp.exmail.qq.com">
                    <input v-model="form.host" class="input input-mono" type="text" placeholder="smtp.example.com" />
                </UiField>

                <UiField label="端口" required :error="formError.port" hint="常用 465（SSL）、587（STARTTLS）、25；范围 1 ~ 65535。">
                    <input v-model="form.port" class="input input-mono tabular" type="number" min="1" max="65535" step="1" placeholder="465" />
                </UiField>

                <UiField label="账号" hint="SMTP 登录用户名，通常是完整邮箱地址；留空表示匿名发信。">
                    <input v-model="form.user" class="input input-mono" type="text" placeholder="noreply@example.com" autocomplete="off" />
                </UiField>

                <UiField label="密码" hint="后端未提供单独的改密接口，密码随整体替换一同提交（明文）。">
                    <span class="relative flex items-center">
                        <input
                            v-model="form.pass"
                            class="input input-mono pr-9"
                            :type="passVisible ? 'text' : 'password'"
                            placeholder="SMTP 授权码 / 密码"
                            autocomplete="new-password"
                        />
                        <button
                            class="btn btn-ghost btn-icon absolute right-1"
                            type="button"
                            :title="passVisible ? '隐藏密码' : '显示明文密码'"
                            @click="passVisible = !passVisible"
                        >
                            <EyeOff v-if="passVisible" :size="14" />
                            <Eye v-else :size="14" />
                        </button>
                    </span>
                </UiField>

                <UiField label="单次上限" required :error="formError.max_count" hint="单次发送的最大收件人数 / 条数，0 表示不限制（按后端实现解释）。">
                    <input v-model="form.max_count" class="input input-mono tabular" type="number" min="0" step="1" placeholder="0" />
                </UiField>

                <UiField label="状态" hint="1 = 启用，0 = 停用（EmailStatus：后端未定义该常量，此处仅前端展示约定）。">
                    <UiSegmented
                        :model-value="segmentedStatus"
                        :options="[
                            { value: '1', label: '启用' },
                            { value: '0', label: '停用' },
                        ]"
                        :disabled="submitting"
                        @update:model-value="form.status = Number($event)"
                    />
                </UiField>
            </div>

            <template #footer>
                <button class="btn" type="button" :disabled="submitting" @click="closeModal">取消</button>
                <button class="btn btn-primary" type="button" :disabled="submitting" @click="submit">
                    <LoaderCircle v-if="submitting" :size="14" class="animate-spin" />
                    保存
                </button>
            </template>
        </UiModal>
    </UiPage>
</template>
