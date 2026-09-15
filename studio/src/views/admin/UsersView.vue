<script setup lang="ts">
/**
 * UsersView — 用户管理
 * 接口：GET  /api/v3/admin/users/list?page&page_size
 *       PUT  /api/v3/admin/users/:id/role  { role: 'admin' | 'user' }
 *       PUT  /api/v3/admin/users/:id/disable | /enable
 * 后端未提供搜索参数，因此这里的搜索框只过滤「当前页」，界面上已注明。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { Ban, CircleCheck, LoaderCircle, RefreshCw, Search, ShieldCheck, Users } from '@lucide/vue'
import { usersApi } from '@/api/admin'
import { ApiError } from '@/api/client'
import { UserStatus, type AdminUserItem, type UserRole } from '@/api/types'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiDataTable from '@/components/ui/UiDataTable.vue'
import type { TableColumn } from '@/components/ui/types'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiPagination from '@/components/ui/UiPagination.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'

const feedback = useFeedbackStore()

const rows = ref<AdminUserItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const keyword = ref('')
const acting = ref<number | null>(null)

const roleModal = ref<{ open: boolean; user: AdminUserItem | null; role: UserRole }>({
    open: false,
    user: null,
    role: 'user',
})

const columns: TableColumn[] = [
    { key: 'id', title: 'ID', width: '72px', mono: true },
    { key: 'name', title: '用户名' },
    { key: 'email', title: '邮箱', width: '220px' },
    { key: 'role', title: '角色', width: '120px' },
    { key: 'status', title: '状态', width: '110px' },
    { key: 'created_at', title: '创建时间', width: '170px', mono: true },
    { key: 'actions', title: '操作', width: '220px', align: 'right' },
]

/** 仅过滤当前页数据（后端 list 接口无关键字参数） */
const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return rows.value
    return rows.value.filter(
        (u) => u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw) || String(u.id) === kw,
    )
})

async function load() {
    loading.value = true
    try {
        const res = await usersApi.list({ page: page.value, page_size: pageSize.value })
        rows.value = res?.list ?? []
        total.value = res?.total ?? 0
    } catch (e) {
        feedback.toast.error('加载用户列表失败', (e as ApiError).message)
        rows.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

function openRoleModal(user: AdminUserItem) {
    roleModal.value = { open: true, user, role: user.role }
}

async function submitRole() {
    const target = roleModal.value.user
    if (!target) return
    if (target.role === roleModal.value.role) {
        roleModal.value.open = false
        return
    }
    acting.value = target.id
    try {
        await usersApi.setRole(target.id, roleModal.value.role)
        target.role = roleModal.value.role
        roleModal.value.open = false
        feedback.toast.success('角色已更新', `${target.name} → ${roleModal.value.role}`)
    } catch (e) {
        feedback.toast.error('修改角色失败', (e as ApiError).message)
    } finally {
        acting.value = null
    }
}

async function toggleStatus(user: AdminUserItem) {
    const nextDisabled = user.status === UserStatus.Active
    const ok = await feedback.confirm({
        title: nextDisabled ? `禁用用户「${user.name}」？` : `启用用户「${user.name}」？`,
        message: nextDisabled ? '禁用后该用户将无法登录（POST /api/v1/login 会被拒绝）。' : '启用后该用户可以正常登录。',
        confirmText: nextDisabled ? '禁用' : '启用',
        danger: nextDisabled,
    })
    if (!ok) return
    acting.value = user.id
    try {
        if (nextDisabled) await usersApi.disable(user.id)
        else await usersApi.enable(user.id)
        user.status = nextDisabled ? UserStatus.Disabled : UserStatus.Active
        feedback.toast.success(nextDisabled ? '已禁用' : '已启用', user.name)
    } catch (e) {
        feedback.toast.error('操作失败', (e as ApiError).message)
    } finally {
        acting.value = null
    }
}

function statusLabel(status: number) {
    return status === UserStatus.Active ? '正常' : '已禁用'
}

watch([page, pageSize], load)
watch(pageSize, () => (page.value = 1))
onMounted(load)
</script>

<template>
    <UiPage>
        <UiPageHeader title="用户管理" description="管理账号角色与启用状态；角色变更会影响该账号能否访问 /api/v3/admin 接口。">
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
                    账号列表
                </h3>
                <span class="text-[11px] text-faint">共 {{ total }} 个账号</span>

                <div class="ml-auto flex flex-wrap items-center gap-2">
                    <span class="relative flex items-center">
                        <Search :size="14" class="pointer-events-none absolute left-2.5 text-faint" />
                        <input v-model="keyword" class="input w-56 py-1 pl-8 text-xs" placeholder="筛选当前页：用户名 / 邮箱 / ID" />
                    </span>
                </div>
            </div>

            <UiDataTable
                :columns="columns"
                :rows="filtered"
                :loading="loading"
                :row-key="(row) => row.id"
                empty-text="没有用户数据"
                empty-hint="users 表为空，或后端返回的 list 为空数组。"
            >
                <template #cell-id="{ row }">
                    <span class="text-muted">#{{ (row as AdminUserItem).id }}</span>
                </template>

                <template #cell-name="{ row }">
                    <span class="font-medium text-strong">{{ (row as AdminUserItem).name }}</span>
                </template>

                <template #cell-email="{ row }">
                    <span class="truncate text-xs text-muted">{{ (row as AdminUserItem).email }}</span>
                </template>

                <template #cell-role="{ row }">
                    <UiBadge :tone="(row as AdminUserItem).role === 'admin' ? 'accent' : 'default'">
                        <ShieldCheck v-if="(row as AdminUserItem).role === 'admin'" :size="11" />
                        {{ (row as AdminUserItem).role }}
                    </UiBadge>
                </template>

                <template #cell-status="{ row }">
                    <UiBadge :tone="(row as AdminUserItem).status === UserStatus.Active ? 'ok' : 'danger'" dot>
                        {{ statusLabel((row as AdminUserItem).status) }}
                    </UiBadge>
                </template>

                <template #cell-created_at="{ row }">
                    <span class="text-xs text-faint">{{ (row as AdminUserItem).created_at || '—' }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn btn-sm" type="button" :disabled="acting === (row as AdminUserItem).id" @click="openRoleModal(row as AdminUserItem)">
                            <ShieldCheck :size="13" />
                            改角色
                        </button>
                        <button
                            class="btn btn-sm"
                            :class="(row as AdminUserItem).status === UserStatus.Active ? 'btn-danger' : 'btn-success'"
                            type="button"
                            :disabled="acting === (row as AdminUserItem).id"
                            @click="toggleStatus(row as AdminUserItem)"
                        >
                            <LoaderCircle v-if="acting === (row as AdminUserItem).id" :size="13" class="animate-spin" />
                            <component
                                :is="(row as AdminUserItem).status === UserStatus.Active ? Ban : CircleCheck"
                                v-else
                                :size="13"
                            />
                            {{ (row as AdminUserItem).status === UserStatus.Active ? '禁用' : '启用' }}
                        </button>
                    </div>
                </template>

                <template #empty>
                    <UiEmpty title="没有匹配的账号" :hint="keyword ? '搜索只作用于当前页数据，可清空关键字或翻页查看。' : '后端 users 表为空。'" compact />
                </template>
            </UiDataTable>

            <UiPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
        </section>

        <!-- 改角色 -->
        <UiModal
            :open="roleModal.open"
            title="修改用户角色"
            description="role=admin 才能调用 /api/v3/admin 下的全部接口，请谨慎授予。"
            width="440px"
            @close="roleModal.open = false"
        >
            <div class="flex flex-col gap-4">
                <div class="rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-xs text-muted">
                    <span class="font-medium text-strong">{{ roleModal.user?.name }}</span>
                    <span class="ml-2">#{{ roleModal.user?.id }}</span>
                    <span class="ml-2">{{ roleModal.user?.email }}</span>
                </div>
                <UiField label="目标角色">
                    <UiSegmented
                        :model-value="roleModal.role"
                        :options="[
                            { value: 'user', label: '普通用户 user' },
                            { value: 'admin', label: '管理员 admin' },
                        ]"
                        @update:model-value="roleModal.role = $event as UserRole"
                    />
                </UiField>
            </div>

            <template #footer>
                <button class="btn" type="button" @click="roleModal.open = false">取消</button>
                <button class="btn btn-primary" type="button" :disabled="acting === roleModal.user?.id" @click="submitRole">
                    <LoaderCircle v-if="acting === roleModal.user?.id" :size="14" class="animate-spin" />
                    保存
                </button>
            </template>
        </UiModal>
    </UiPage>
</template>
