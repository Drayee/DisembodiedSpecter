// ui-views.js — 预览画布（可拖拽立绘）+ 分支流程图（点击连线）
import { computed, ref, watch, onMounted } from '../vendor/vue.esm-browser.prod.js';
import { state, previewNode, previewStageState, avatarPlans, avatarListOf, playFromSelection, playAdvance, stopPlay, notify } from './store.js';
import { getAssetUrl } from './io.js';
import { resolveAvatarLayout, nodeAddr, nextKeyInFile, parseAddr, CANVAS_W, CANVAS_H, TYPE_LABEL } from './model.js';

// ==================== 预览画布 ====================

export const PreviewPanel = {
    setup() {
        const host = ref(null);
        const scale = ref(1);
        const urls = ref({});
        const drag = ref(null); // {index, startClientX, startX}

        const pv = previewNode;
        const node = computed(() => (pv.value ? pv.value.node : null));
        const stage = computed(() => previewStageState());
        const plans = computed(() => (node.value ? avatarPlans(node.value) : []));

        function neededKeys() {
            const keys = new Set();
            if (stage.value.bg) keys.add(stage.value.bg);
            if (stage.value.cg) keys.add(stage.value.cg);
            plans.value.forEach((p) => keys.add(p.key));
            return Array.from(keys);
        }

        async function refreshUrls() {
            const map = {};
            for (const k of neededKeys()) map[k] = await getAssetUrl(k);
            urls.value = map;
        }
        watch([() => JSON.stringify(neededKeys()), () => state.project.assets], refreshUrls, { immediate: true, deep: true });

        function fit() {
            if (!host.value) return;
            const w = host.value.clientWidth || 800;
            scale.value = Math.max(0.35, Math.min(1, w / CANVAS_W));
        }
        onMounted(() => {
            fit();
            window.addEventListener('resize', fit);
        });

        /** 与 model.resolveAvatarLayout 的过滤规则保持一致，用于把拖拽结果写回原条目 */
        function filteredEntries() {
            const list = avatarListOf(node.value);
            const used = new Set();
            const out = [];
            for (const e of list) {
                if (!e || !e.key) continue;
                let slot = e.slot === null || e.slot === undefined || e.slot === '' ? null : Number(e.slot);
                if (slot === null) {
                    for (let s = 1; s <= 8; s++) if (!used.has(s)) { slot = s; break; }
                }
                if (slot === null || slot > 8 || used.has(slot)) continue;
                used.add(slot);
                out.push(e);
            }
            return out;
        }

        function onDown(ev, i) {
            const p = plans.value[i];
            if (!p) return;
            drag.value = { index: i, startClientX: ev.clientX, startX: p.x || 0 };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        }
        function onMove(ev) {
            if (!drag.value) return;
            const dx = (ev.clientX - drag.value.startClientX) / scale.value;
            const p = plans.value[drag.value.index];
            if (p) p.x = Math.round(drag.value.startX + dx);
        }
        function onUp() {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            if (!drag.value) return;
            const p = plans.value[drag.value.index];
            const entries = filteredEntries();
            const entry = entries[drag.value.index];
            if (p && entry) {
                entry.x = p.x;
                notify(`已写回立绘位置：P${p.slot} x=${p.x}`);
            }
            drag.value = null;
        }

        function toggleFacing(i) {
            const p = plans.value[i];
            const entry = filteredEntries()[i];
            if (!p || !entry) return;
            entry.facing = Number(entry.facing) === -1 ? 1 : -1;
            notify(`已写回朝向：P${p.slot} facing=${entry.facing}`);
        }

        function pickOption(i) { playAdvance(i); }

        const dimmed = (p) => !!(p.name && node.value && node.value.speaker && p.name !== node.value.speaker);

        return {
            state, host, scale, urls, pv, node, stage, plans,
            playFromSelection, playAdvance, stopPlay, onDown, toggleFacing, pickOption, dimmed, CANVAS_W, CANVAS_H,
        };
    },
    template: `
    <section class="panel preview-panel">
      <div class="panel-title">预览（{{ state.playing ? '播放中：' + state.playAddr : '编辑中：' + (pv ? pv.file + '.' + pv.key : '—') }}）</div>
      <div class="row">
        <button @click="playFromSelection">从选中节点播放</button>
        <button @click="playAdvance()" :disabled="!state.playing">下一步 ▶</button>
        <button @click="stopPlay" :disabled="!state.playing">停止</button>
        <span class="hint">拖拽立绘改位置（写回 JSON 的 x），双击立绘切换镜像。</span>
      </div>
      <div class="stage-host" ref="host">
        <div class="stage" :style="{ transform: 'scale(' + scale + ')', width: CANVAS_W + 'px', height: CANVAS_H + 'px' }">
          <!-- 底部背景 -->
          <div class="layer bg">
            <img v-if="stage.bg && urls[stage.bg]" :src="urls[stage.bg]" alt="" />
            <div v-else-if="stage.bg" class="missing">背景缺失：{{ stage.bg }}</div>
          </div>
          <!-- 立绘 -->
          <div class="layer avatars">
            <div v-for="(p, i) in plans" :key="i" class="avatar"
                 :style="{ left: 'calc(50% + ' + p.x + 'px)', opacity: dimmed(p) ? 0.47 : 1, transform: 'translateX(-50%) scaleX(' + p.facing + ')' }"
                 @pointerdown="onDown($event, i)" @dblclick="toggleFacing(i)">
              <img v-if="urls[p.key]" :src="urls[p.key]" alt="" />
              <div v-else class="missing small">P{{ p.slot }}<br />{{ p.key }}</div>
            </div>
          </div>
          <!-- 对话层 -->
          <div class="layer dialog">
            <div class="name" v-if="node && node.speaker">{{ node.speaker }}</div>
            <div class="text">{{ node ? (node.text || '（无文本）') : '（未选中节点）' }}</div>
            <div class="hint-line">{{ state.playing ? '点击「下一步」推进' : '点击左侧节点查看' }}</div>
          </div>
          <!-- 选项 -->
          <div class="layer options" v-if="state.playing && node && node.type === 'choice'">
            <button v-for="(o, i) in node.options" :key="i" @click="pickOption(i)">{{ o.text || '（未命名选项）' }}</button>
          </div>
          <!-- 顶部 CG -->
          <div class="layer cg">
            <img v-if="stage.cg && urls[stage.cg]" :src="urls[stage.cg]" alt="" />
            <div v-else-if="stage.cg" class="missing">CG 缺失：{{ stage.cg }}</div>
          </div>
        </div>
      </div>
    </section>`,
};

// ==================== 流程图 ====================

export const FlowPanel = {
    setup() {
        const linkMode = ref(null); // {kind:'next'} | {kind:'option', index}

        const nodes = computed(() => {
            const seg = state.project.files[state.currentFile];
            return seg ? seg.nodes || [] : [];
        });

        /** 当前选中节点的选项（用于“选项连线”按钮） */
        const selectedOptions = computed(() => {
            const n = nodes.value.find((x) => x.id === state.selectedId);
            return (n && n.options) || [];
        });

        const layout = computed(() => {
            const list = nodes.value;
            const depth = new Map();
            const order = new Map();
            list.forEach((n, i) => order.set(n.id, i));
            // 简化分层：按段内顺序递增，跳转目标至少在其来源之后 +1 列
            list.forEach((n, i) => depth.set(n.id, i));
            let changed = true;
            let guard = 0;
            while (changed && guard++ < 50) {
                changed = false;
                for (const n of list) {
                    const targets = [];
                    if (n.next) targets.push(n.next);
                    (n.options || []).forEach((o) => { if (o.next) targets.push(o.next); });
                    for (const t of targets) {
                        const p = parseAddr(t);
                        if (!p || p.terminal || p.file !== state.currentFile) continue;
                        if (!depth.has(p.key)) continue;
                        const want = depth.get(n.id) + 1;
                        if (depth.get(p.key) < want) { depth.set(p.key, want); changed = true; }
                    }
                }
            }
            const cols = new Map();
            const pos = new Map();
            for (const n of list) {
                const d = depth.get(n.id) || 0;
                const r = cols.get(d) || 0;
                cols.set(d, r + 1);
                pos.set(n.id, { x: 40 + d * 230, y: 40 + r * 110 });
            }
            const width = 120 + (Math.max(0, ...Array.from(cols.keys())) + 1) * 230;
            const height = 120 + Math.max(1, ...Array.from(cols.values())) * 110;
            return { pos, width, height };
        });

        function issueLevel(id) {
            const hit = state.issues.find((i) => i.file === state.currentFile && i.nodeId === id);
            return hit ? hit.level : '';
        }

        function edges() {
            const out = [];
            for (const n of nodes.value) {
                const from = layout.value.pos.get(n.id);
                if (!from) continue;
                const push = (target, label, option) => {
                    if (!target) return;
                    const p = parseAddr(target);
                    const to = p && !p.terminal && p.file === state.currentFile ? layout.value.pos.get(p.key) : null;
                    out.push({
                        key: `${n.id}-${label}-${target}`,
                        x1: from.x + 190, y1: from.y + 27,
                        x2: to ? to.x : from.x + 210, y2: to ? to.y + 27 : from.y + 70,
                        label,
                        external: !to,
                        target,
                        option,
                    });
                };
                if (n.next) push(n.next, 'next', false);
                else {
                    const nx = nextKeyInFile(state.project.files[state.currentFile], n.id);
                    if (nx) push(nodeAddr(state.currentFile, nx), '顺序', false);
                }
                (n.options || []).forEach((o, i) => push(o.next, `选项${i + 1}`, true));
            }
            return out;
        }

        function clickNode(id) {
            const n = nodes.value.find((x) => x.id === id);
            if (!n) return;
            if (!linkMode.value) { state.selectedId = id; return; }
            const addr = nodeAddr(state.currentFile, id);
            if (linkMode.value.kind === 'next') {
                n.next = addr;
                notify(`已设置 ${n.id}.next = ${addr}`);
            } else {
                if (!n.options) return;
                const o = n.options[linkMode.value.index];
                if (o) {
                    o.next = addr;
                    notify(`已设置选项${linkMode.value.index + 1}.next = ${addr}`);
                }
            }
            linkMode.value = null;
        }

        function jumpExternal(target) {
            const p = parseAddr(target);
            if (p && state.project.files[p.file]) {
                state.currentFile = p.file;
                state.selectedId = p.key || '';
            }
        }

        return { state, nodes, layout, edges, linkMode, clickNode, issueLevel, jumpExternal, TYPE_LABEL, parseAddr, selectedOptions };
    },
    template: `
    <section class="panel">
      <div class="panel-title">流程图（{{ state.currentFile }}）</div>
      <div class="row">
        <button :class="{ active: linkMode && linkMode.kind === 'next' }" @click="linkMode = { kind: 'next' }">设置 next：点我，再点目标节点</button>
        <span class="hint">选择节点的选项连线请在下方「选项连线」里选具体选项。</span>
      </div>
      <div class="row" v-if="state.selectedId">
        <span class="hint">为 {{ state.selectedId }} 的选项连线：</span>
        <button v-for="(o, i) in selectedOptions" :key="i" @click="linkMode = { kind: 'option', index: i }">选项{{ i + 1 }}</button>
      </div>
      <div class="flow-host">
        <svg :width="layout.width" :height="layout.height">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7aa2f7" />
            </marker>
          </defs>
          <g v-for="e in edges()" :key="e.key">
            <line :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
                  :stroke="e.option ? '#bb9af7' : (e.external ? '#e0af68' : '#7aa2f7')"
                  :stroke-dasharray="e.option ? '5,4' : ''" marker-end="url(#arrow)" />
            <text :x="(e.x1 + e.x2) / 2" :y="(e.y1 + e.y2) / 2 - 4" class="edge-label" @click="e.external && jumpExternal(e.target)">{{ e.label }}{{ e.external ? ' ↗' + e.target : '' }}</text>
          </g>
          <g v-for="n in nodes" :key="n.id" @click="clickNode(n.id)" class="flow-node">
            <rect :x="layout.pos.get(n.id).x" :y="layout.pos.get(n.id).y" width="190" height="54" rx="8"
                  :class="['node-rect', issueLevel(n.id), { selected: n.id === state.selectedId }]" />
            <text :x="layout.pos.get(n.id).x + 10" :y="layout.pos.get(n.id).y + 22" class="node-id">{{ n.id }} · {{ TYPE_LABEL[n.type] || n.type }}</text>
            <text :x="layout.pos.get(n.id).x + 10" :y="layout.pos.get(n.id).y + 42" class="node-text">{{ (n.text || '').slice(0, 14) }}</text>
          </g>
        </svg>
      </div>
    </section>`,
};
