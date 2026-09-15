<script setup lang="ts">
/**
 * StoryPreview — 中栏「预览」标签：所见即所得的 1280×720 舞台
 *  - 背景层在下、立绘居中、CG 层在上（与引擎 StoryPanel 的层级一致）
 *  - 立绘可直接拖拽摆位（写回 JSON 的 x），双击切换镜像（facing）
 *  - 播放模式下可逐步推进、点选项分支
 * 尺寸策略：用 ResizeObserver 测出可用区域，算出 scale 后对 1280×720 的舞台做 transform 缩放，
 * 外层容器按 scale 占位。这样宽高比恒定（绝不压扁），内部全部用设计分辨率像素书写，可读性最好。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ImageOff, MousePointerClick, Play, SkipForward, Square } from '@lucide/vue'
import { CANVAS_H, CANVAS_W, DIM_ALPHA, TYPE_LABEL } from '@/story/model'
import { useStoryStore } from '@/story/store'
import type { AvatarPlan, StoryAvatarEntry } from '@/story/types'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

const store = useStoryStore()

const host = ref<HTMLElement | null>(null)
const scale = ref(0.5)
const dragging = ref(false)

const node = computed(() => (store.previewNode ? store.previewNode.node : null))
const stage = computed(() => store.previewStageState())
const plans = computed<AvatarPlan[]>(() => (node.value ? store.avatarPlans(node.value) : []))
const urls = computed(() => store.assetUrls)

const address = computed(() => {
    const pv = store.previewNode
    return pv ? `${pv.file}.${pv.key}` : ''
})

/** 立绘高度（设计分辨率像素）：贴底站立 */
const AVATAR_H = 470
const AVATAR_W = 300

let ro: ResizeObserver | null = null

function fit() {
    const el = host.value
    if (!el) return
    const w = el.clientWidth - 24
    const h = el.clientHeight - 24
    if (w <= 0 || h <= 0) return
    scale.value = Math.max(0.12, Math.min(w / CANVAS_W, h / CANVAS_H))
}

onMounted(() => {
    fit()
    ro = new ResizeObserver(fit)
    if (host.value) ro.observe(host.value)
})

onBeforeUnmount(() => {
    ro?.disconnect()
    document.body.style.cursor = ''
})

function isDimmed(p: AvatarPlan): boolean {
    const sp = node.value?.speaker
    return !!(p.name && sp && p.name !== sp)
}

function entryOfPlan(plan: AvatarPlan): StoryAvatarEntry | null {
    const list = store.avatarListOf(node.value)
    return list[plan.srcIndex] || null
}

function onAvatarDown(ev: PointerEvent, plan: AvatarPlan) {
    if (store.playing) return // 播放中不改数据，避免把试跑结果写回 JSON
    const found = entryOfPlan(plan)
    if (!found) return
    // 显式声明为非空类型：TS 不会把收窄结果带进下面的闭包
    const entry: StoryAvatarEntry = found
    ev.preventDefault()
    const startClientX = ev.clientX
    const startX = plan.x || 0
    dragging.value = true

    function onMove(e: PointerEvent) {
        const next = Math.round(startX + (e.clientX - startClientX) / scale.value)
        plan.x = next
        entry.x = next
        entry.slot = plan.slot // 显式定位后固定槽位，避免重排换槽
    }

    function onUp() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        dragging.value = false
    }

    document.body.style.cursor = 'grabbing'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
}

function toggleFacing(plan: AvatarPlan) {
    if (store.playing) return
    const entry = entryOfPlan(plan)
    if (!entry) return
    entry.facing = Number(entry.facing) === -1 ? 1 : -1
}
</script>

<template>
    <div class="flex h-full min-h-0 flex-col gap-3 p-3">
        <!-- 工具条 -->
        <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-primary btn-sm" type="button" @click="store.playFromSelection()">
                <Play :size="13" />试跑
            </button>
            <button class="btn btn-sm" type="button" :disabled="!store.playing" @click="store.playAdvance()">
                <SkipForward :size="13" />下一步
            </button>
            <button class="btn btn-sm" type="button" :disabled="!store.playing" @click="store.stopPlay()">
                <Square :size="13" />停止
            </button>

            <UiBadge :tone="store.playing ? 'ok' : 'default'" dot>
                {{ store.playing ? `播放中 ${store.playAddr}` : '编辑中' }}
            </UiBadge>
            <UiBadge v-if="node" tone="accent">{{ TYPE_LABEL[node.type] }}</UiBadge>

            <span class="ml-auto hidden items-center gap-1.5 text-[11px] text-faint xl:flex">
                <MousePointerClick :size="12" />
                拖拽立绘改 x 并写回 · 双击切镜像
            </span>
        </div>

        <!-- 舞台宿主 -->
        <div ref="host" class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-line grid-bg">
            <UiEmpty
                v-if="!node"
                title="没有可预览的节点"
                hint="在左侧选中一个节点，或点上方「试跑」从当前选中节点开始播放。"
            >
                <template #icon><ImageOff :size="26" /></template>
            </UiEmpty>

            <!-- 按 scale 占位，保证外层布局高度正确 -->
            <div
                v-else
                class="relative overflow-hidden rounded-md border border-line-strong bg-black/70 shadow-float"
                :style="{ width: `${CANVAS_W * scale}px`, height: `${CANVAS_H * scale}px` }"
            >
                <div
                    class="absolute top-0 left-0 origin-top-left"
                    :style="{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px`, transform: `scale(${scale})` }"
                >
                    <!-- 背景层 -->
                    <div class="pointer-events-none absolute inset-0">
                        <img v-if="stage.bg && urls[stage.bg]" :src="urls[stage.bg]" class="h-full w-full object-cover" alt="" />
                        <div
                            v-else-if="stage.bg"
                            class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-amber-glow/40 bg-amber-glow/5 text-amber-glow"
                        >
                            <ImageOff :size="30" />
                            <span class="font-mono text-sm">背景资源缺失：{{ stage.bg }}</span>
                        </div>
                    </div>

                    <!-- 立绘层 -->
                    <div class="absolute inset-0">
                        <div
                            v-for="plan in plans"
                            :key="`${plan.slot}-${plan.srcIndex}`"
                            class="absolute bottom-[60px] cursor-grab"
                            :class="dragging ? 'cursor-grabbing' : ''"
                            :style="{
                                left: `${CANVAS_W / 2 + plan.x}px`,
                                width: `${AVATAR_W}px`,
                                height: `${AVATAR_H}px`,
                                opacity: isDimmed(plan) ? DIM_ALPHA / 255 : 1,
                                transform: `translateX(-50%) scaleX(${plan.facing})`,
                            }"
                            :title="`P${plan.slot} · ${plan.key}${plan.name ? ' · ' + plan.name : ''}`"
                            @pointerdown="onAvatarDown($event, plan)"
                            @dblclick="toggleFacing(plan)"
                        >
                            <img
                                v-if="urls[plan.key]"
                                :src="urls[plan.key]"
                                class="h-full w-full object-contain object-bottom drop-shadow-2xl"
                                alt=""
                                draggable="false"
                            />
                            <div
                                v-else
                                class="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-phantom-300/40 bg-phantom-500/5 text-center text-phantom-200"
                            >
                                <ImageOff :size="26" />
                                <span class="font-mono text-sm">P{{ plan.slot }}</span>
                                <span class="font-mono text-xs opacity-80">{{ plan.key }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- CG 层（最上，不拦截指针，保证立绘可拖） -->
                    <div class="pointer-events-none absolute inset-0">
                        <img v-if="stage.cg && urls[stage.cg]" :src="urls[stage.cg]" class="h-full w-full object-contain" alt="" />
                        <div
                            v-else-if="stage.cg"
                            class="flex h-full w-full items-center justify-center border border-dashed border-spirit-400/40 bg-spirit-500/5"
                        >
                            <span class="font-mono text-sm text-spirit-300">CG 缺失：{{ stage.cg }}</span>
                        </div>
                    </div>

                    <!-- 选项层 -->
                    <div v-if="node.type === 'choice'" class="absolute inset-x-0 top-[180px] flex flex-col items-center gap-4 px-[200px]">
                        <button
                            v-for="(opt, i) in node.options"
                            :key="i"
                            type="button"
                            class="w-full cursor-pointer rounded-lg border border-phantom-300/50 bg-void-950/75 px-6 py-3 text-lg text-phantom-50 backdrop-blur transition-colors hover:border-phantom-300 hover:bg-phantom-700/70"
                            @click="store.playAdvance(i)"
                        >
                            {{ opt.text || '（未命名选项）' }}
                        </button>
                    </div>

                    <!-- 对话框层 -->
                    <div
                        v-if="node.type !== 'action'"
                        class="absolute inset-x-[80px] bottom-[44px] rounded-xl border border-void-400/40 bg-void-950/80 px-8 py-6 backdrop-blur-sm"
                    >
                        <p
                            v-if="node.type === 'dialogue' && node.speaker"
                            class="absolute -top-[17px] left-6 rounded-sm border border-phantom-400/60 bg-phantom-700 px-4 py-0.5 text-base font-medium text-white"
                        >
                            {{ node.speaker }}
                        </p>
                        <p class="text-xl leading-relaxed whitespace-pre-wrap text-void-50">{{ node.text || '（无文本）' }}</p>
                    </div>

                    <!-- 地址角标 -->
                    <p class="absolute bottom-2 left-3 font-mono text-xs text-void-300/70">{{ address }}</p>
                </div>
            </div>
        </div>

        <!-- 底部信息 -->
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted">
            <span>
                舞台： <span class="text-soft">bg</span>
                {{ stage.bg === null ? '（继承）' : stage.bg === '' ? '（隐藏）' : stage.bg }}
                <span class="mx-1.5 text-faint">·</span>
                <span class="text-soft">cg</span>
                {{ stage.cg === null ? '（继承）' : stage.cg === '' ? '（隐藏）' : stage.cg }}
            </span>
            <span>立绘 {{ plans.length }} 个（说话人高亮，其余压暗）</span>
            <span class="tabular text-faint">设计分辨率 {{ CANVAS_W }}×{{ CANVAS_H }} · 当前缩放 {{ (scale * 100).toFixed(0) }}%</span>
        </div>
    </div>
</template>
