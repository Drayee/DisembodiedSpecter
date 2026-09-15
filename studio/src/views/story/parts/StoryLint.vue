<script setup lang="ts">
/** StoryLint — 中栏「校验」标签：全工程问题清单，点击跳到对应节点 */
import { computed, ref } from 'vue'
import { CircleAlert, CircleCheck, RefreshCw, TriangleAlert } from '@lucide/vue'
import { useStoryStore } from '@/story/store'
import type { LintIssue } from '@/story/types'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'

const store = useStoryStore()

const filter = ref<'all' | 'error' | 'warn'>('all')

const rows = computed(() => (filter.value === 'all' ? store.issues : store.issues.filter((i) => i.level === filter.value)))

function addrOf(issue: LintIssue): string {
    if (!issue.file) return '（全局）'
    return issue.nodeId ? `${issue.file}.${issue.nodeId}` : issue.file
}
</script>

<template>
    <div class="flex h-full min-h-0 flex-col gap-3 p-3">
        <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-sm" type="button" @click="store.runLint(false)">
                <RefreshCw :size="13" />重新校验
            </button>
            <UiSegmented
                v-model="filter"
                :options="[
                    { value: 'all', label: '全部', count: store.issues.length },
                    { value: 'error', label: '错误', count: store.errorCount },
                    { value: 'warn', label: '警告', count: store.warnCount },
                ]"
            />
            <UiBadge v-if="store.errorCount" tone="danger">
                <CircleAlert :size="11" />{{ store.errorCount }} 个错误
            </UiBadge>
            <UiBadge v-else-if="store.issues.length" tone="ok">
                <CircleCheck :size="11" />没有错误
            </UiBadge>
            <span class="ml-auto text-[11px] text-faint">点击条目跳到对应节点</span>
        </div>

        <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
            <UiEmpty
                v-if="!store.issues.length"
                title="还没有校验结果"
                hint="点「重新校验」检查地址悬空、孤立节点、跳转环、slot 越界、资源缺失、文本超长等问题。"
                compact
            >
                <template #icon><CircleCheck :size="24" class="text-emerald-glow" /></template>
            </UiEmpty>

            <UiEmpty v-else-if="!rows.length" title="该分类下没有问题" compact />

            <ul v-else class="divide-y divide-[var(--s-line)]">
                <li
                    v-for="(issue, i) in rows"
                    :key="`${issue.file}-${issue.nodeId}-${i}`"
                    class="flex cursor-pointer items-start gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-3"
                    @click="store.selectIssue(issue)"
                >
                    <span
                        class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-xs"
                        :class="issue.level === 'error' ? 'bg-rose-glow/15 text-rose-glow' : 'bg-amber-glow/15 text-amber-glow'"
                    >
                        <component :is="issue.level === 'error' ? CircleAlert : TriangleAlert" :size="12" />
                    </span>
                    <span class="min-w-0 flex-1">
                        <span class="block text-[13px] leading-snug text-soft">{{ issue.msg }}</span>
                        <span class="mt-0.5 block font-mono text-[11px] text-faint">{{ addrOf(issue) }}</span>
                    </span>
                    <UiBadge :tone="issue.level === 'error' ? 'danger' : 'warn'" class="mt-0.5 shrink-0">
                        {{ issue.level === 'error' ? '错误' : '警告' }}
                    </UiBadge>
                </li>
            </ul>
        </div>
    </div>
</template>
