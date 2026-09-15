<script setup lang="ts">
/**
 * StoryInspector — 右栏：选中节点的属性面板
 * 字段按节点类型动态显示；所有选择类字段都能从资源库 / 地址表自动补全，减少手写错误。
 */
import { computed } from 'vue'
import {
    ArrowRight,
    Image as ImageIcon,
    Info,
    Layers,
    Play,
    Plus,
    Tags,
    Trash,
    UserPlus,
    Wand,
} from '@lucide/vue'
import { NODE_TYPES, TYPE_LABEL, allAddresses, nodeAddr, nodeIndex, resolveNext, TEXT_WARN_LEN } from '@/story/model'
import { useStoryStore } from '@/story/store'
import type { StoryAvatarEntry, StoryNode, StoryNodeType } from '@/story/types'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiField from '@/components/ui/UiField.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'

const store = useStoryStore()

const node = computed(() => store.currentNode)

/** 全工程出现过的说话人，供 datalist 补全 */
const speakers = computed(() => {
    const set = new Set<string>()
    for (const seg of Object.values(store.project.files)) {
        for (const n of seg.nodes) if (n.type === 'dialogue' && n.speaker) set.add(n.speaker)
    }
    return [...set].sort()
})

const assetKeys = computed(() => Object.keys(store.project.assets || {}).sort())
const addresses = computed(() => allAddresses(store.project))
const glossaryTerms = computed(() => Object.keys(store.project.glossary || {}))
/** 段内下一节点（缺省去向），用于提示与快捷填充 */
const defaultNext = computed(() => {
    const n = node.value
    const seg = store.segment
    if (!n || !seg) return null
    const nx = resolveNext(store.currentFile, seg, n)
    const isImplicit = !n.next && !!nx
    return { addr: nx, implicit: isImplicit }
})

const charCount = computed(() => (node.value?.text ? String(node.value.text).length : 0))
const overflow = computed(() => charCount.value > TEXT_WARN_LEN)

function addrOf(n: StoryNode | null): string {
    return n ? nodeAddr(store.currentFile, n.id) : ''
}

function changeType(t: string) {
    if (!node.value) return
    store.changeNodeType(node.value.id, t as StoryNodeType)
}

function insertTerm(term: string) {
    if (!node.value) return
    node.value.text = `${node.value.text || ''}⟦${term}⟧`
}

/** 数字输入：空串 → null（表示自动/未设置） */
function setNum(target: StoryAvatarEntry, key: 'x' | 'slot', raw: string) {
    const s = String(raw).trim()
    ;(target as unknown as Record<string, unknown>)[key] = s === '' ? null : Number(s)
}

// ==================== 舞台字段三态：保持 / 隐藏 / 指定 ====================

type StageMode = 'keep' | 'hide' | 'set'
type StageField = 'bg' | 'cg'

function stageMode(field: StageField): StageMode {
    const st = node.value?.stage
    if (!st || st[field] === undefined || st[field] === null) return 'keep'
    return st[field] === '' ? 'hide' : 'set'
}

function setStageMode(field: StageField, mode: StageMode) {
    const n = node.value
    if (!n) return
    if (!n.stage) n.stage = {}
    if (mode === 'keep') delete n.stage[field]
    else if (mode === 'hide') n.stage[field] = ''
    else if (!n.stage[field]) n.stage[field] = assetKeys.value[0] || ''
}

function stageValue(field: StageField): string {
    return (node.value?.stage?.[field] as string) || ''
}

function setStageValue(field: StageField, value: string) {
    const n = node.value
    if (!n) return
    if (!n.stage) n.stage = {}
    n.stage[field] = value
}

function setVideo(value: string) {
    const n = node.value
    if (!n) return
    if (!n.stage) n.stage = {}
    if (value) n.stage.video = value
    else delete n.stage.video
}

/** 舞台两层：背景在下、CG 在上 */
const stageFields: StageField[] = ['bg', 'cg']

/** 立绘列表：优先 node.avatars，兼容旧字段 stage.avatars / avatar */
const avatarList = computed<StoryAvatarEntry[]>(() => store.avatarListOf(node.value))

function addAvatarFor(node: StoryNode) {
    if (!node.avatars) node.avatars = []
    store.addAvatar(node)
    // 默认带入当前说话人的名字，方便预览高亮
    const list = node.avatars
    const last = list[list.length - 1]
    if (last && node.speaker) last.name = node.speaker
}

function jumpTo(addr: string) {
    const found = store.findNode(addr)
    if (!found) return
    store.currentFile = found.file
    store.selectedId = found.key
}

const typeOptions = NODE_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))
</script>

<template>
    <div class="panel h-full rounded-none border-0 border-l border-line bg-transparent">
        <div class="panel-header">
            <h3 class="panel-title">
                <Wand :size="15" class="text-phantom-200" />
                属性
            </h3>
            <UiBadge v-if="node" tone="accent" class="ml-auto font-mono">{{ addrOf(node) }}</UiBadge>
        </div>

        <div class="panel-body flex flex-col gap-5">
            <UiEmpty
                v-if="!node"
                title="未选中节点"
                hint="在左侧节点列表里点一个节点，这里会显示它全部可编辑字段。"
                compact
            >
                <template #icon><Wand :size="22" /></template>
            </UiEmpty>

            <template v-else>
                <!-- 基础 -->
                <section class="flex flex-col gap-3">
                    <UiField label="节点类型">
                        <UiSegmented :model-value="node.type" :options="typeOptions" @update:model-value="changeType" />
                    </UiField>

                    <UiField label="节点 id" hint="段内唯一键；3.a 这种形式表示节点 3 的分支变体。改 id 会自动同步段内引用。">
                        <input
                            class="input input-mono"
                            :value="node.id"
                            @change="store.changeNodeId(node.id, ($event.target as HTMLInputElement).value)"
                        />
                    </UiField>

                    <div class="rounded-sm border border-line bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                        <Info :size="12" class="mr-1 inline" />
                        完整地址 <code class="font-mono text-phantom-200">{{ addrOf(node) }}</code>
                        <span class="mx-1 text-faint">·</span>
                        段内第 {{ nodeIndex(store.segment, node.id) + 1 }} / {{ store.nodes.length }} 个
                    </div>
                </section>

                <!-- 说话人 -->
                <UiField v-if="node.type === 'dialogue'" label="说话人" required hint="与立绘条目的 name 相同 → 该立绘高亮，其余压暗。">
                    <input v-model="node.speaker" class="input" list="story-speakers" placeholder="例：林" />
                </UiField>

                <!-- 文本 -->
                <UiField v-if="node.type !== 'action'" :label="node.type === 'choice' ? '提问文本' : '文本'">
                    <textarea
                        v-model="node.text"
                        class="textarea"
                        rows="4"
                        :placeholder="node.type === 'narration' ? '旁白内容…' : '台词内容…'"
                    />
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="tabular text-[11px]" :class="overflow ? 'text-amber-glow' : 'text-faint'">
                            {{ charCount }} 字{{ overflow ? `（超过 ${TEXT_WARN_LEN} 字，可能溢出对话框）` : '' }}
                        </span>
                        <template v-if="glossaryTerms.length">
                            <span class="text-[11px] text-faint">插入术语标记：</span>
                            <button v-for="t in glossaryTerms" :key="t" class="badge badge-accent cursor-pointer" type="button" @click="insertTerm(t)">
                                <Tags :size="10" />{{ t }}
                            </button>
                        </template>
                    </div>
                </UiField>

                <!-- 动作 -->
                <UiField v-if="node.type === 'action'" label="动作" hint="引擎当前只实现 end；填 next 可自动续播下一段，否则本次剧情完结。">
                    <select class="select" :value="node.action || 'end'" @change="node.action = ($event.target as HTMLSelectElement).value">
                        <option value="end">end（剧情结束）</option>
                    </select>
                </UiField>

                <!-- 选项 -->
                <section v-if="node.type === 'choice'" class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                        <h4 class="flex items-center gap-1.5 text-[12px] font-semibold text-soft">
                            <Layers :size="13" />
                            选项分支
                        </h4>
                        <button class="btn btn-sm ml-auto" type="button" @click="store.addOption(node)">
                            <Plus :size="12" />添加选项
                        </button>
                    </div>

                    <div v-for="(opt, i) in node.options" :key="i" class="card flex flex-col gap-2 p-3">
                        <div class="flex items-center gap-2">
                            <span class="badge badge-accent">选项 {{ i + 1 }}</span>
                            <button class="btn btn-ghost btn-icon ml-auto" type="button" title="删除选项" @click="store.removeOption(node, i)">
                                <Trash :size="13" />
                            </button>
                        </div>
                        <UiField label="文案">
                            <input v-model="opt.text" class="input" placeholder="选项文案" />
                        </UiField>
                        <UiField label="跳转地址" hint="留空 = 按段内顺序推进。">
                            <input v-model="opt.next" class="input input-mono" list="story-addresses" placeholder="如 1.0.0.1.3.a" />
                        </UiField>
                        <button
                            v-if="opt.next"
                            class="btn btn-sm self-start"
                            type="button"
                            @click="jumpTo(opt.next || '')"
                        >
                            <ArrowRight :size="12" />跳到该节点
                        </button>
                    </div>
                </section>

                <!-- 立绘 -->
                <section v-if="node.type === 'dialogue' || node.type === 'stage'" class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                        <h4 class="flex items-center gap-1.5 text-[12px] font-semibold text-soft">
                            <UserPlus :size="13" />
                            立绘（P1~P8）
                        </h4>
                        <button class="btn btn-sm ml-auto" type="button" @click="addAvatarFor(node)">
                            <Plus :size="12" />添加立绘
                        </button>
                    </div>

                    <p v-if="!avatarList.length" class="field-hint">
                        未设置立绘 → 保持上一幕的立绘。不填 x 时：1 个居中，多个按「左、右、左、右…」自动排开。
                    </p>

                    <div v-for="(a, i) in avatarList" :key="i" class="card flex flex-col gap-2.5 p-3">
                        <div class="flex items-center gap-2">
                            <span class="badge badge-accent">立绘 {{ i + 1 }}</span>
                            <button class="btn btn-ghost btn-icon ml-auto" type="button" title="移除" @click="store.removeAvatar(node, i)">
                                <Trash :size="13" />
                            </button>
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <UiField label="资源 key" required>
                                <input v-model="a.key" class="input input-mono" list="story-assets" placeholder="如 lin" />
                            </UiField>
                            <UiField label="槽位">
                                <select class="select" :value="a.slot ?? ''" @change="setNum(a, 'slot', ($event.target as HTMLSelectElement).value)">
                                    <option value="">自动</option>
                                    <option v-for="s in 8" :key="s" :value="s">P{{ s }}</option>
                                </select>
                            </UiField>
                            <UiField label="角色名" hint="与说话人相同 → 高亮">
                                <input v-model="a.name" class="input" list="story-speakers" placeholder="例：林" />
                            </UiField>
                            <UiField label="横向偏移 x" hint="留空 = 自动排布">
                                <input
                                    class="input tabular"
                                    type="number"
                                    :value="a.x ?? ''"
                                    placeholder="自动"
                                    @input="setNum(a, 'x', ($event.target as HTMLInputElement).value)"
                                />
                            </UiField>
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                class="btn btn-sm"
                                type="button"
                                :title="Number(a.facing) === -1 ? '当前水平镜像，点击恢复' : '点击水平镜像'"
                                @click="a.facing = Number(a.facing) === -1 ? 1 : -1"
                            >
                                {{ Number(a.facing) === -1 ? '已镜像 ⇄' : '正常 ⇄' }}
                            </button>
                            <span class="text-[11px] text-faint">facing = {{ Number(a.facing) === -1 ? -1 : 1 }}</span>
                        </div>
                    </div>
                </section>

                <!-- 舞台 -->
                <section class="flex flex-col gap-3">
                    <h4 class="flex items-center gap-1.5 text-[12px] font-semibold text-soft">
                        <ImageIcon :size="13" />
                        舞台（背景 / CG）
                    </h4>

                    <div v-for="field in stageFields" :key="field" class="card flex flex-col gap-2.5 p-3">
                        <div class="flex items-center gap-2">
                            <span class="badge">{{ field === 'bg' ? '背景层 bg' : 'CG 层 cg' }}</span>
                            <span class="ml-auto text-[11px] text-faint">
                                {{ stageMode(field) === 'keep' ? '保持上一幕' : stageMode(field) === 'hide' ? '本幕隐藏' : '显示指定资源' }}
                            </span>
                        </div>
                        <UiSegmented
                            :model-value="stageMode(field)"
                            :options="[
                                { value: 'keep', label: '保持' },
                                { value: 'hide', label: '隐藏' },
                                { value: 'set', label: '指定' },
                            ]"
                            @update:model-value="setStageMode(field, $event as StageMode)"
                        />
                        <UiField v-if="stageMode(field) === 'set'" label="资源 key" hint="对应 story/image/{key}/spriteFrame">
                            <input
                                class="input input-mono"
                                list="story-assets"
                                :value="stageValue(field)"
                                placeholder="如 forest"
                                @change="setStageValue(field, ($event.target as HTMLInputElement).value)"
                            />
                        </UiField>
                    </div>

                    <UiField label="过场视频 key" hint="引擎 v1 未实现视频播放，此处仅登记。">
                        <input
                            class="input input-mono"
                            placeholder="留空 = 不设置"
                            :value="node.stage?.video || ''"
                            @change="setVideo(($event.target as HTMLInputElement).value)"
                        />
                    </UiField>
                </section>

                <!-- 去向 -->
                <section class="flex flex-col gap-3">
                    <h4 class="flex items-center gap-1.5 text-[12px] font-semibold text-soft">
                        <ArrowRight :size="13" />
                        去向 next
                    </h4>
                    <UiField
                        label="跳转地址"
                        hint="可跨段；留空 = 段内顺序推进；已是本段最后一节且留空 → 完结为 {file}.end。"
                    >
                        <input v-model="node.next" class="input input-mono" list="story-addresses" placeholder="留空 = 顺序推进" />
                    </UiField>

                    <div class="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span>缺省去向：</span>
                        <code class="font-mono text-soft">{{ defaultNext?.addr || `${store.currentFile}.end（完结）` }}</code>
                        <button v-if="defaultNext?.implicit" class="btn btn-sm" type="button" @click="node.next = defaultNext?.addr || ''">
                            显式写入
                        </button>
                        <button v-if="node.next" class="btn btn-sm" type="button" @click="node.next = ''">
                            清空（回到顺序）
                        </button>
                    </div>
                </section>

                <div class="flex flex-wrap gap-2 border-t border-line pt-4">
                    <button class="btn btn-primary btn-sm" type="button" @click="store.playFromSelection()">
                        <Play :size="13" />从此节点试跑
                    </button>
                </div>
            </template>
        </div>

        <!-- 补全数据源 -->
        <datalist id="story-speakers">
            <option v-for="s in speakers" :key="s" :value="s" />
        </datalist>
        <datalist id="story-assets">
            <option v-for="k in assetKeys" :key="k" :value="k" />
        </datalist>
        <datalist id="story-addresses">
            <option v-for="a in addresses" :key="a" :value="a" />
        </datalist>
    </div>
</template>
