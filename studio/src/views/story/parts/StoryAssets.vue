<script setup lang="ts">
/**
 * StoryAssets — 中栏「资源库」标签
 * 图片存在 IndexedDB（key → 一张图，与引擎 spriteFrame 加载方式一致）；
 * 工程里只记录 key → {filename, mime, size}，导出 zip 时一并打包。
 */
import { computed, ref } from 'vue'
import { HardDriveDownload, Image as ImageIcon, Pencil, Trash, Upload } from '@lucide/vue'
import { useStoryStore } from '@/story/store'
import { useFeedbackStore } from '@/stores/feedback'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

const store = useStoryStore()
const feedback = useFeedbackStore()

const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const keyword = ref('')
const renaming = ref<string | null>(null)
const renameValue = ref('')

const assets = computed(() => {
    const rows = Object.entries(store.project.assets || {}).map(([key, meta]) => ({
        key,
        meta,
        used: store.usedKeys.get(key)?.size ?? 0,
    }))
    const kw = keyword.value.trim().toLowerCase()
    const filtered = kw ? rows.filter((r) => r.key.toLowerCase().includes(kw) || r.meta.filename.toLowerCase().includes(kw)) : rows
    return filtered.sort((a, b) => a.key.localeCompare(b.key))
})

const totalSize = computed(() =>
    Object.values(store.project.assets || {}).reduce((s, m) => s + (m.size || 0), 0),
)

function humanSize(bytes: number): string {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function pick() {
    fileInput.value?.click()
}

async function onPicked(ev: Event) {
    const input = ev.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''
    if (files.length) await store.uploadAssets(files)
}

async function onDrop(ev: DragEvent) {
    dragOver.value = false
    const files = Array.from(ev.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
    if (!files.length) {
        feedback.toast.warning('没有可用的图片', '只接受 PNG / JPG / WebP 等图片文件')
        return
    }
    await store.uploadAssets(files)
}

function startRename(key: string) {
    renaming.value = key
    renameValue.value = key
}

async function commitRename(key: string) {
    const next = renameValue.value.trim()
    renaming.value = null
    if (!next || next === key) return
    await store.renameAsset(key, next)
}
</script>

<template>
    <div class="flex h-full min-h-0 flex-col gap-3 p-3">
        <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-primary btn-sm" type="button" @click="pick">
                <Upload :size="13" />上传图片
            </button>
            <input ref="fileInput" class="hidden" type="file" accept="image/*" multiple @change="onPicked" />

            <span class="relative flex items-center">
                <input v-model="keyword" class="input w-48 py-1 text-xs" placeholder="搜索 key / 文件名" />
            </span>

            <UiBadge tone="default">
                <HardDriveDownload :size="11" />
                {{ Object.keys(store.project.assets || {}).length }} 个 key · {{ humanSize(totalSize) }}
            </UiBadge>
            <span class="ml-auto text-[11px] text-faint">一个 key 只放一张图（与引擎加载方式一致）</span>
        </div>

        <div
            class="min-h-0 flex-1 overflow-auto rounded-lg border border-dashed p-3 transition-colors"
            :class="dragOver ? 'border-accent bg-accent-soft' : 'border-line'"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
        >
            <UiEmpty
                v-if="!assets.length"
                :title="keyword ? '没有匹配的资源' : '资源库还是空的'"
                hint="把背景 / 立绘 / CG 图片拖到这里，或用「上传图片」。key 就是引擎里 story/image/{key}/spriteFrame 的目录名。"
            >
                <template #icon><ImageIcon :size="26" /></template>
                <template #action>
                    <button class="btn btn-sm" type="button" @click="pick"><Upload :size="13" />选择文件</button>
                </template>
            </UiEmpty>

            <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <div v-for="row in assets" :key="row.key" class="card flex flex-col gap-2.5 p-3">
                    <div class="flex h-[110px] items-center justify-center overflow-hidden rounded-sm border border-line bg-void-950/60">
                        <img v-if="store.assetUrls[row.key]" :src="store.assetUrls[row.key]" class="max-h-full max-w-full object-contain" alt="" />
                        <ImageIcon v-else :size="22" class="text-faint" />
                    </div>

                    <div class="flex items-center gap-2">
                        <template v-if="renaming === row.key">
                            <input
                                v-model="renameValue"
                                class="input py-1 font-mono text-xs"
                                autofocus
                                @keydown.enter="commitRename(row.key)"
                                @keydown.esc="renaming = null"
                                @blur="commitRename(row.key)"
                            />
                        </template>
                        <template v-else>
                            <span class="truncate font-mono text-[13px] font-medium text-strong" :title="row.key">{{ row.key }}</span>
                            <UiBadge :tone="row.used ? 'ok' : 'warn'" class="ml-auto shrink-0">
                                {{ row.used ? `${row.used} 处引用` : '未使用' }}
                            </UiBadge>
                        </template>
                    </div>

                    <p class="truncate text-[11px] text-faint" :title="row.meta.filename">
                        {{ row.meta.filename || '（无文件名）' }} · {{ humanSize(row.meta.size) }}
                    </p>

                    <div class="mt-auto flex items-center gap-2">
                        <button class="btn btn-sm" type="button" @click="startRename(row.key)">
                            <Pencil :size="12" />重命名
                        </button>
                        <button class="btn btn-sm btn-danger ml-auto" type="button" @click="store.removeAsset(row.key)">
                            <Trash :size="12" />删除
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <p class="text-[11px] text-faint">
            重命名 key 会同步改写所有节点里的引用（立绘 / bg / cg / 物品图标）。删除前会提示被引用的位置，导出 zip 时只打包仍被引用的资源。
        </p>
    </div>
</template>
