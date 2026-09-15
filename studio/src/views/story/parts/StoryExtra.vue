<script setup lang="ts">
/**
 * StoryExtra — 中栏「词典·物品」标签
 *  - 术语词典：术语 → 解释；属性面板里的「插入术语标记」会写入 ⟦术语⟧
 *  - 物品 / 信件：字段按未来引擎指令预留（获得物品 / 阅读模式尚未实现）
 */
import { computed, ref } from 'vue'
import { BookOpen, Package, Plus, Sparkles, Tags, Trash } from '@lucide/vue'
import { useStoryStore } from '@/story/store'
import { useFeedbackStore } from '@/stores/feedback'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'

const store = useStoryStore()
const feedback = useFeedbackStore()

const sub = ref<'glossary' | 'items'>('glossary')
const term = ref('')
const explanation = ref('')

const glossaryRows = computed(() => Object.entries(store.project.glossary || {}))
const itemRows = computed(() => Object.entries(store.project.items || {}))
const assetKeys = computed(() => Object.keys(store.project.assets || {}))

function addTerm() {
    const t = term.value.trim()
    if (!t) return
    store.project.glossary[t] = explanation.value
    term.value = ''
    explanation.value = ''
    feedback.toast.success('已添加术语', t)
}

function removeTerm(key: string) {
    delete store.project.glossary[key]
}

function addItem() {
    let i = 1
    while (store.project.items[`item_${i}`]) i++
    const id = `item_${i}`
    store.project.items[id] = { name: '新物品', type: 'item', desc: '', iconKey: '' }
    feedback.toast.info('已新增物品', id)
}

function removeItem(id: string) {
    delete store.project.items[id]
}
</script>

<template>
    <div class="flex h-full min-h-0 flex-col gap-3 p-3">
        <div class="flex flex-wrap items-center gap-2">
            <UiSegmented
                v-model="sub"
                :options="[
                    { value: 'glossary', label: '术语词典', count: glossaryRows.length },
                    { value: 'items', label: '物品 / 信件', count: itemRows.length },
                ]"
            />
            <span class="ml-auto text-[11px] text-faint">
                {{ sub === 'glossary' ? '供未来 tooltip / 注音使用' : '字段已按未来扩展预留' }}
            </span>
        </div>

        <!-- 术语词典 -->
        <template v-if="sub === 'glossary'">
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title"><Tags :size="15" class="text-phantom-200" />新增术语</h3>
                </div>
                <div class="flex flex-wrap items-end gap-3 p-4">
                    <label class="field w-48">
                        <span class="field-label">术语</span>
                        <input v-model="term" class="input" placeholder="如 古木" @keydown.enter="addTerm" />
                    </label>
                    <label class="field min-w-[240px] flex-1">
                        <span class="field-label">解释（tooltip 内容）</span>
                        <input v-model="explanation" class="input" placeholder="如 传说中承载丰饶之名的巨树" @keydown.enter="addTerm" />
                    </label>
                    <button class="btn btn-primary" type="button" :disabled="!term.trim()" @click="addTerm">
                        <Plus :size="14" />添加
                    </button>
                </div>
            </div>

            <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
                <UiEmpty v-if="!glossaryRows.length" title="还没有术语" hint="添加后可在属性面板一键把 ⟦术语⟧ 标记插进文本。" compact>
                    <template #icon><BookOpen :size="24" /></template>
                </UiEmpty>
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 180px">术语</th>
                            <th>解释</th>
                            <th style="width: 120px">标记</th>
                            <th style="width: 80px"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="[k] in glossaryRows" :key="k">
                            <td class="font-medium text-strong">{{ k }}</td>
                            <td>
                                <input v-model="store.project.glossary[k]" class="input py-1 text-xs" placeholder="解释" />
                            </td>
                            <td class="font-mono text-[11px] text-phantom-200">⟦{{ k }}⟧</td>
                            <td class="text-right">
                                <button class="btn btn-ghost btn-icon" type="button" title="删除" @click="removeTerm(k)">
                                    <Trash :size="13" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>

        <!-- 物品 / 信件 -->
        <template v-else>
            <div class="flex items-center gap-2">
                <button class="btn btn-sm" type="button" @click="addItem"><Plus :size="13" />新增物品</button>
                <span class="text-[11px] text-faint">
                    获得物品 / 阅读模式的引擎指令尚未实现；这里先做数据登记，导出时随工程保存。
                </span>
            </div>

            <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
                <UiEmpty v-if="!itemRows.length" title="还没有物品" hint="点「新增物品」开始登记，图标 key 可复用资源库里的图片。" compact>
                    <template #icon><Package :size="24" /></template>
                </UiEmpty>
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 120px">id</th>
                            <th style="width: 180px">名称</th>
                            <th style="width: 170px">类型</th>
                            <th>描述</th>
                            <th style="width: 170px">图标 key</th>
                            <th style="width: 60px"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="[id, it] in itemRows" :key="id">
                            <td class="font-mono text-xs text-muted">{{ id }}</td>
                            <td><input v-model="it.name" class="input py-1 text-xs" /></td>
                            <td>
                                <select v-model="it.type" class="select py-1 text-xs">
                                    <option value="item">物品</option>
                                    <option value="letter">信件（阅读模式）</option>
                                </select>
                            </td>
                            <td><input v-model="it.desc" class="input py-1 text-xs" placeholder="描述" /></td>
                            <td>
                                <input v-model="it.iconKey" class="input input-mono py-1 text-[11px]" list="story-item-assets" placeholder="资源 key" />
                            </td>
                            <td class="text-right">
                                <button class="btn btn-ghost btn-icon" type="button" title="删除" @click="removeItem(id)">
                                    <Trash :size="13" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>

        <p class="flex items-center gap-2 text-[11px] text-faint">
            <Sparkles :size="12" />
            词典与物品库都随工程保存（localStorage），导出 zip 时会写进 assets-manifest.csv 的引用统计里。
        </p>

        <datalist id="story-item-assets">
            <option v-for="k in assetKeys" :key="k" :value="k" />
        </datalist>
    </div>
</template>
