// ui-basic.js — 顶部工具栏 / 文件与节点列表 / 属性面板 / 表格 / 资源库 / 词典与物品 / 校验
import { computed, ref, watch } from '../vendor/vue.esm-browser.prod.js';
import {
    state, currentFile, currentNode, usedKeys,
    addFile, removeFile, selectFile, addNode, removeNode, moveNode, duplicateNode, changeNodeId,
    addAvatar, addOption, runLint, selectIssue, newProject, saveLocal, notify,
} from './store.js';
import {
    NODE_TYPES, TYPE_LABEL, SLOT_MAX, emptyAvatar, emptyOption, isLegalFile, nodeRows,
} from './model.js';
import {
    addAssetFromFile, exportProjectZip, importProjectZip, getAssetUrl, idbGetAsset, idbPutAsset,
    idbDeleteKey, dropAssetUrl, downloadText, projectToJsonFiles, downloadBlob, csvOf, parseCsv,
} from './io.js';

// ==================== 顶部工具栏 ====================

export const TopBar = {
    setup() {
        const fileList = computed(() => Object.keys(state.project.files));
        const newFileName = ref('');
        const zipInput = ref(null);
        const busy = computed(() => state.busy);

        function doAddFile() {
            if (!newFileName.value) return notify('请输入段文件名，如 1.0.0.2');
            if (!isLegalFile(newFileName.value)) notify('建议使用「篇.章.片.段」格式，如 1.0.0.1');
            addFile(newFileName.value);
            newFileName.value = '';
        }

        async function onZipPicked(ev) {
            const f = ev.target.files && ev.target.files[0];
            if (!f) return;
            state.busy = '正在导入…';
            try {
                const r = await importProjectZip(f, state.project);
                notify(`导入完成：${r.files} 个段、${r.assets} 个资源`);
                if (!fileList.value.length) addFile('1.0.0.1');
                if (!state.project.files[state.currentFile]) state.currentFile = Object.keys(state.project.files)[0] || '';
                saveLocal();
            } catch (e) {
                console.error(e);
                notify('导入失败：' + e.message);
            } finally {
                state.busy = '';
                ev.target.value = '';
            }
        }

        async function doExport() {
            state.busy = '正在打包…';
            try {
                const n = await exportProjectZip(state.project, { projectName: 'story' });
                notify(`已导出 zip（${n} 个文件），解压覆盖 assets/resources/story/`);
            } catch (e) {
                console.error(e);
                notify('导出失败：' + e.message);
            } finally {
                state.busy = '';
            }
        }

        function exportCurrentJson() {
            const data = projectToJsonFiles(state.project)[state.currentFile];
            if (!data) return notify('当前段为空');
            downloadText(JSON.stringify(data, null, 2), `${state.currentFile}.json`);
        }

        return {
            state, fileList, newFileName, busy, zipInput,
            doAddFile, onZipPicked, doExport, exportCurrentJson, removeFile, selectFile, runLint, newProject,
        };
    },
    template: `
    <header class="topbar">
      <strong class="brand">剧情编排</strong>
      <span class="grow"></span>
      <select :value="state.currentFile" @change="selectFile($event.target.value)" title="当前段">
        <option v-for="f in fileList" :key="f" :value="f">{{ f }}</option>
      </select>
      <input class="w120" v-model="newFileName" placeholder="新建段 1.0.0.2" @keyup.enter="doAddFile" />
      <button @click="doAddFile">新建段</button>
      <button @click="removeFile(state.currentFile)" :disabled="!state.currentFile">删除段</button>
      <span class="sep"></span>
      <label class="btn-like">导入 zip<input ref="zipInput" type="file" accept=".zip" hidden @change="onZipPicked" /></label>
      <button @click="doExport" :disabled="busy">导出 zip</button>
      <button @click="exportCurrentJson">导出本段 JSON</button>
      <span class="sep"></span>
      <button @click="runLint">校验</button>
      <button class="danger" @click="newProject">新建项目</button>
      <span class="status">{{ busy || state.message || (state.dirty ? '未保存…' : ('已保存 ' + state.lastSavedAt)) }}</span>
    </header>`,
};

// ==================== 节点列表 ====================

export const NodeList = {
    setup() {
        const addType = ref('dialogue');
        const nodes = computed(() => (currentFile.value && currentFile.value.nodes) || []);
        return { state, nodes, addType, NODE_TYPES, TYPE_LABEL, addNode, removeNode, moveNode, duplicateNode, changeNodeId };
    },
    template: `
    <aside class="sidebar">
      <div class="panel-title">节点（{{ state.currentFile || '—' }}）</div>
      <div class="row">
        <select v-model="addType"><option v-for="t in NODE_TYPES" :key="t" :value="t">{{ TYPE_LABEL[t] }}</option></select>
        <button @click="addNode(addType)">新增节点</button>
      </div>
      <ol class="node-list">
        <li v-for="(n, i) in nodes" :key="n.id" :class="{ active: n.id === state.selectedId }" @click="state.selectedId = n.id">
          <div class="nl-head">
            <input class="id-input" :value="n.id" @click.stop @change="changeNodeId(n.id, $event.target.value)" />
            <span class="tag">{{ TYPE_LABEL[n.type] || n.type }}</span>
          </div>
          <div class="nl-text">{{ n.speaker ? n.speaker + '：' : '' }}{{ (n.text || '').slice(0, 26) || '（无文本）' }}</div>
          <div class="nl-ops" @click.stop>
            <button title="上移" @click="moveNode(n.id, -1)" :disabled="i === 0">↑</button>
            <button title="下移" @click="moveNode(n.id, 1)" :disabled="i === nodes.length - 1">↓</button>
            <button title="复制" @click="duplicateNode(n.id)">⧉</button>
            <button title="删除" class="danger" @click="removeNode(n.id)">✕</button>
          </div>
        </li>
      </ol>
      <div v-if="!nodes.length" class="hint">还没有节点，点「新增节点」开始。</div>
    </aside>`,
};

// ==================== 属性面板 ====================

export const Inspector = {
    setup() {
        const node = currentNode;
        const addrList = computed(() => {
            const out = [];
            for (const [file, seg] of Object.entries(state.project.files)) {
                (seg.nodes || []).forEach((n) => out.push(`${file}.${n.id}`));
                out.push(`${file}.end`);
            }
            return out;
        });
        const assetKeys = computed(() => Object.keys(state.project.assets || {}));
        const speakers = computed(() => {
            const s = new Set();
            for (const seg of Object.values(state.project.files)) (seg.nodes || []).forEach((n) => { if (n.speaker) s.add(n.speaker); });
            return Array.from(s);
        });
        const glossaryTerms = computed(() => Object.keys(state.project.glossary || {}));

        function changeType(t) {
            if (!node.value) return;
            const keep = { id: node.value.id, next: node.value.next, text: node.value.text, speaker: node.value.speaker };
            Object.keys(node.value).forEach((k) => delete node.value[k]);
            Object.assign(node.value, { id: keep.id, type: t });
            if (t === 'dialogue') { node.value.speaker = keep.speaker || ''; node.value.text = keep.text || ''; node.value.avatars = []; }
            if (t === 'narration') node.value.text = keep.text || '';
            if (t === 'choice') { node.value.text = keep.text || ''; node.value.options = [emptyOption()]; }
            if (t === 'stage') { node.value.text = keep.text || ''; node.value.stage = { avatars: [] }; }
            if (t === 'action') node.value.action = 'end';
            if (keep.next) node.value.next = keep.next;
        }

        function insertGlossary(term) {
            if (!node.value) return;
            const mark = `⟦${term}⟧`;
            node.value.text = (node.value.text || '') + mark;
        }

        const avatarTarget = computed(() => {
            if (!node.value) return null;
            if (node.value.type === 'stage') {
                if (!node.value.stage) node.value.stage = { avatars: [] };
                if (!node.value.stage.avatars) node.value.stage.avatars = [];
                return node.value.stage.avatars;
            }
            if (!node.value.avatars) node.value.avatars = [];
            return node.value.avatars;
        });

        function pushAvatar() { if (avatarTarget.value) avatarTarget.value.push(emptyAvatar()); }
        function dropAvatar(i) { if (avatarTarget.value) avatarTarget.value.splice(i, 1); }
        function clearStage(field) {
            if (node.value && node.value.stage) delete node.value.stage[field];
        }
        function pushOption() { if (node.value) { if (!node.value.options) node.value.options = []; node.value.options.push(emptyOption()); } }
        function dropOption(i) { if (node.value && node.value.options) node.value.options.splice(i, 1); }

        return {
            state, node, addrList, assetKeys, speakers, glossaryTerms, avatarTarget,
            NODE_TYPES, TYPE_LABEL, SLOT_MAX,
            changeType, insertGlossary, pushAvatar, dropAvatar, pushOption, dropOption, clearStage,
        };
    },
    template: `
    <section class="inspector">
      <div class="panel-title">属性</div>
      <div v-if="!node" class="hint">选中一个节点后可编辑。</div>
      <div v-else class="form">
        <label>节点 id<input :value="node.id" disabled /></label>
        <label>类型
          <select :value="node.type" @change="changeType($event.target.value)">
            <option v-for="t in NODE_TYPES" :key="t" :value="t">{{ TYPE_LABEL[t] }}</option>
          </select>
        </label>
        <label v-if="node.type === 'dialogue'">说话人
          <input v-model="node.speaker" list="speaker-list" placeholder="角色名（用于立绘高亮）" />
          <datalist id="speaker-list"><option v-for="s in speakers" :key="s" :value="s" /></datalist>
        </label>
        <label v-if="node.type !== 'action'">文本
          <textarea v-model="node.text" rows="4" placeholder="台词 / 旁白 / 演出说明"></textarea>
        </label>
        <div v-if="glossaryTerms.length" class="tags">
          <span class="hint">插入术语标记：</span>
          <button v-for="t in glossaryTerms" :key="t" class="mini" @click="insertGlossary(t)">{{ t }}</button>
        </div>
        <label v-if="node.type !== 'action'">next（缺省=段内顺序，末尾=本段完结）
          <input v-model="node.next" list="addr-list" placeholder="1.0.0.2.1 或留空" />
          <datalist id="addr-list"><option v-for="a in addrList" :key="a" :value="a" /></datalist>
        </label>
        <label v-if="node.type === 'action'">动作
          <select v-model="node.action"><option value="end">end（结束/续播）</option></select>
        </label>

        <!-- 立绘 -->
        <fieldset v-if="node.type === 'dialogue' || node.type === 'stage'">
          <legend>立绘（P1~P8 同时显示）</legend>
          <div class="avatar-row" v-for="(a, i) in avatarTarget" :key="i">
            <select v-model.number="a.slot"><option :value="null">自动槽位</option><option v-for="s in SLOT_MAX" :key="s" :value="s">P{{ s }}</option></select>
            <input v-model="a.key" :list="'asset-list'" placeholder="立绘 key" />
            <input class="w90" v-model="a.x" placeholder="x（空=自动）" />
            <select v-model.number="a.facing"><option :value="1">正向</option><option :value="-1">镜像</option></select>
            <input class="w90" v-model="a.name" placeholder="角色名(高亮)" />
            <button class="mini danger" @click="dropAvatar(i)">✕</button>
          </div>
          <button class="mini" @click="pushAvatar">+ 添加立绘</button>
          <div class="hint">不填 x：1 个居中；多个按“左、右、左、右…”自动排开。name 与说话人相同者会高亮。</div>
        </fieldset>

        <!-- 选项 -->
        <fieldset v-if="node.type === 'choice'">
          <legend>选项</legend>
          <div class="opt-row" v-for="(o, i) in node.options" :key="i">
            <span class="idx">{{ i + 1 }}</span>
            <input v-model="o.text" placeholder="选项文本" />
            <input v-model="o.next" list="addr-list" placeholder="next（空=顺序）" />
            <button class="mini danger" @click="dropOption(i)">✕</button>
          </div>
          <button class="mini" @click="pushOption">+ 添加选项</button>
        </fieldset>

        <!-- 演出 -->
        <fieldset v-if="node.type === 'stage' && node.stage">
          <legend>舞台（bg=底部背景，cg=顶部 CG）</legend>
          <label>bg
            <input v-model="node.stage.bg" list="asset-list" placeholder="背景 key（清空字段=保持上一幕）" />
          </label>
          <div class="row">
            <button class="mini" @click="node.stage.bg = ''">隐藏背景（''）</button>
            <button class="mini" @click="clearStage('bg')">保持上一幕（删除字段）</button>
          </div>
          <label>cg
            <input v-model="node.stage.cg" list="asset-list" placeholder="CG key（清空字段=保持上一幕）" />
          </label>
          <div class="row">
            <button class="mini" @click="node.stage.cg = ''">隐藏 CG（''）</button>
            <button class="mini" @click="clearStage('cg')">保持上一幕（删除字段）</button>
          </div>
          <label>video（预留）
            <input v-model="node.stage.video" placeholder="暂未实现" />
          </label>
        </fieldset>
        <datalist id="asset-list"><option v-for="k in assetKeys" :key="k" :value="k" /></datalist>
      </div>
    </section>`,
};

// ==================== 表格视图 ====================

export const TablePanel = {
    setup() {
        const rows = computed(() => nodeRows(state.project, state.currentFile));
        const csvInput = ref(null);

        function exportCsv() {
            downloadText(csvOf(rows.value), `${state.currentFile}-nodes.csv`, 'text/csv;charset=utf-8');
        }
        function importCsv(ev) {
            const f = ev.target.files && ev.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
                const list = parseCsv(String(reader.result || ''));
                const seg = state.project.files[state.currentFile];
                if (!seg) return;
                const byId = new Map((seg.nodes || []).map((n) => [n.id, n]));
                let updated = 0;
                let created = 0;
                for (const r of list) {
                    const id = String(r.id || '').trim();
                    if (!id) continue;
                    let n = byId.get(id);
                    if (!n) {
                        n = { id, type: r.type || 'dialogue', text: '' };
                        seg.nodes.push(n);
                        byId.set(id, n);
                        created++;
                    } else updated++;
                    if (r.type) n.type = r.type;
                    n.speaker = r.speaker || '';
                    n.text = r.text || '';
                    n.next = r.next || '';
                    if (r.bg || r.cg) {
                        n.stage = n.stage || {};
                        if (r.bg !== undefined && r.bg !== '') n.stage.bg = r.bg;
                        if (r.cg !== undefined && r.cg !== '') n.stage.cg = r.cg;
                    }
                }
                notify(`CSV 导入完成：更新 ${updated} 条、新建 ${created} 条`);
            };
            reader.readAsText(f, 'utf-8');
            ev.target.value = '';
        }

        return { state, rows, csvInput, exportCsv, importCsv, selectIssue };
    },
    template: `
    <section class="panel">
      <div class="panel-title">表格（{{ state.currentFile }}）</div>
      <div class="row">
        <button @click="exportCsv">导出 CSV</button>
        <label class="btn-like">导入 CSV<input ref="csvInput" type="file" accept=".csv" hidden @change="importCsv" /></label>
        <span class="hint">表格适合批量改台词；流程图/属性面板适合改结构。</span>
      </div>
      <table class="grid">
        <thead><tr><th>#</th><th>id</th><th>类型</th><th>说话人</th><th>文本</th><th>next</th><th>bg</th><th>cg</th><th>立绘</th><th>选项</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" @click="state.selectedId = r.id" :class="{ active: r.id === state.selectedId }">
            <td>{{ r.index }}</td><td>{{ r.id }}</td><td>{{ r.type }}</td><td>{{ r.speaker }}</td>
            <td class="text-cell">{{ r.text }}</td><td>{{ r.next }}</td><td>{{ r.bg }}</td><td>{{ r.cg }}</td>
            <td class="text-cell">{{ r.avatars }}</td><td class="text-cell">{{ r.options }}</td>
          </tr>
        </tbody>
      </table>
    </section>`,
};

// ==================== 资源库 ====================

export const AssetsPanel = {
    setup() {
        const urls = ref({});
        const fileInput = ref(null);
        const newKey = ref('');

        async function refresh() {
            const map = {};
            for (const key of Object.keys(state.project.assets || {})) {
                map[key] = await getAssetUrl(key);
            }
            urls.value = map;
        }
        watch(() => Object.keys(state.project.assets || {}).join(','), refresh, { immediate: true });

        async function onPicked(ev) {
            const files = Array.from(ev.target.files || []);
            for (const f of files) {
                const key = files.length === 1 && newKey.value ? newKey.value.trim() : undefined;
                const k = await addAssetFromFile(f, state.project, key);
                await refresh();
                notify(`已加入资源：${k}`);
            }
            newKey.value = '';
            ev.target.value = '';
        }

        async function renameKey(oldKey) {
            const nk = prompt(`把资源 key 重命名（原：${oldKey}）`, oldKey);
            if (!nk || nk === oldKey) return;
            const rec = await idbGetAsset(oldKey);
            if (!rec) return;
            await idbPutAsset(nk, rec.filename, rec.blob, rec.mime);
            await idbDeleteKey(oldKey);
            dropAssetUrl(oldKey);
            state.project.assets[nk] = state.project.assets[oldKey];
            delete state.project.assets[oldKey];
            await refresh();
        }

        async function del(key) {
            if (!confirm(`删除资源 ${key}？（导出包里将不再包含）`)) return;
            await idbDeleteKey(key);
            dropAssetUrl(key);
            delete state.project.assets[key];
            await refresh();
        }

        const usage = computed(() => {
            const map = {};
            for (const [key, from] of usedKeys.value.entries()) map[key] = from.size;
            return map;
        });

        return { state, urls, fileInput, newKey, onPicked, renameKey, del, usage, refresh };
    },
    template: `
    <section class="panel">
      <div class="panel-title">资源库（导出为 story/image/{key}/文件名）</div>
      <div class="row">
        <input class="w160" v-model="newKey" placeholder="key（可留空=用文件名）" />
        <label class="btn-like">上传图片<input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onPicked" /></label>
        <span class="hint">key = 目录名；引擎按 story/image/{key}/spriteFrame 加载。一个 key 建议只放一张图。</span>
      </div>
      <table class="grid">
        <thead><tr><th>预览</th><th>key</th><th>文件</th><th>引用</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="(meta, key) in state.project.assets" :key="key">
            <td><img v-if="urls[key]" :src="urls[key]" class="thumb" /></td>
            <td>{{ key }}</td>
            <td>{{ meta.filename }}</td>
            <td>{{ usage[key] || 0 }} 处</td>
            <td><button class="mini" @click="renameKey(key)">重命名</button><button class="mini danger" @click="del(key)">删除</button></td>
          </tr>
        </tbody>
      </table>
      <div v-if="!Object.keys(state.project.assets).length" class="hint">还没有资源。上传背景/立绘/CG 图片后即可在属性面板里选择 key。</div>
    </section>`,
};

// ==================== 词典 / 物品 ====================

export const ExtraPanel = {
    setup() {
        const sub = ref('glossary');
        const term = ref('');
        const expl = ref('');

        function addTerm() {
            if (!term.value.trim()) return;
            state.project.glossary[term.value.trim()] = expl.value;
            term.value = '';
            expl.value = '';
        }
        function delTerm(k) { delete state.project.glossary[k]; }

        function addItem() {
            const id = `item_${Object.keys(state.project.items).length + 1}`;
            state.project.items[id] = { name: '新物品', type: 'item', desc: '', iconKey: '' };
        }
        function delItem(id) { delete state.project.items[id]; }

        const assetKeys = computed(() => Object.keys(state.project.assets || {}));
        return { state, sub, term, expl, addTerm, delTerm, addItem, delItem, assetKeys };
    },
    template: `
    <section class="panel">
      <div class="panel-title">词典 / 物品</div>
      <div class="row tabs">
        <button :class="{ active: sub === 'glossary' }" @click="sub = 'glossary'">术语词典</button>
        <button :class="{ active: sub === 'items' }" @click="sub = 'items'">物品 / 信件</button>
      </div>

      <div v-if="sub === 'glossary'">
        <div class="row">
          <input v-model="term" placeholder="术语（如 古木）" />
          <input v-model="expl" placeholder="解释（tooltip 内容）" />
          <button @click="addTerm">添加</button>
        </div>
        <table class="grid"><thead><tr><th>术语</th><th>解释</th><th></th></tr></thead>
          <tbody><tr v-for="(v, k) in state.project.glossary" :key="k">
            <td>{{ k }}</td><td><input v-model="state.project.glossary[k]" /></td>
            <td><button class="mini danger" @click="delTerm(k)">✕</button></td>
          </tr></tbody>
        </table>
        <div class="hint">在属性面板「插入术语标记」会把 ⟦术语⟧ 追加到文本中，作为后续 tooltip/注音功能的标记约定。</div>
      </div>

      <div v-else>
        <div class="row"><button @click="addItem">+ 新增物品</button></div>
        <table class="grid"><thead><tr><th>id</th><th>名称</th><th>类型</th><th>描述</th><th>图标 key</th><th></th></tr></thead>
          <tbody><tr v-for="(it, id) in state.project.items" :key="id">
            <td>{{ id }}</td>
            <td><input v-model="it.name" /></td>
            <td><select v-model="it.type"><option value="item">物品</option><option value="letter">信件（阅读模式）</option></select></td>
            <td><input v-model="it.desc" /></td>
            <td><input v-model="it.iconKey" :list="'item-assets'" /></td>
            <td><button class="mini danger" @click="delItem(id)">✕</button></td>
          </tr></tbody>
        </table>
        <datalist id="item-assets"><option v-for="k in assetKeys" :key="k" :value="k" /></datalist>
        <div class="hint">物品库先作为数据登记（获得物品 / 阅读模式的引擎指令尚未实现，字段已按未来扩展预留）。</div>
      </div>
    </section>`,
};

// ==================== 校验结果 ====================

export const LintPanel = {
    setup() {
        const errors = computed(() => state.issues.filter((i) => i.level === 'error'));
        const warns = computed(() => state.issues.filter((i) => i.level === 'warn'));
        return { state, errors, warns, selectIssue };
    },
    template: `
    <section class="panel">
      <div class="panel-title">校验结果</div>
      <div class="row"><span class="err">{{ errors.length }} 个错误</span><span class="warn">{{ warns.length }} 个警告</span>
        <span class="hint">点击条目可跳转到对应节点。</span></div>
      <ul class="lint-list">
        <li v-for="(it, i) in state.issues" :key="i" :class="it.level" @click="selectIssue(it)">
          <span class="tag">{{ it.level === 'error' ? '错误' : '警告' }}</span>
          <span class="addr">{{ it.file }}{{ it.nodeId ? '.' + it.nodeId : '' }}</span>
          <span>{{ it.msg }}</span>
        </li>
      </ul>
      <div v-if="!state.issues.length" class="hint">还没有校验结果，点顶部「校验」。</div>
    </section>`,
};
