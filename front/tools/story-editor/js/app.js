// app.js — 应用入口：组合各面板
import { createApp } from '../vendor/vue.esm-browser.prod.js';
import { state } from './store.js';
import { TopBar, NodeList, Inspector, TablePanel, AssetsPanel, ExtraPanel, LintPanel } from './ui-basic.js';
import { PreviewPanel, FlowPanel } from './ui-views.js';

const TABS = [
    { key: 'preview', label: '预览' },
    { key: 'flow', label: '流程图' },
    { key: 'table', label: '表格' },
    { key: 'assets', label: '资源库' },
    { key: 'extra', label: '词典/物品' },
    { key: 'lint', label: '校验' },
];

const App = {
    components: { TopBar, NodeList, Inspector, TablePanel, AssetsPanel, ExtraPanel, LintPanel, PreviewPanel, FlowPanel },
    setup() {
        return { state, TABS };
    },
    template: `
    <div class="app">
      <TopBar />
      <div class="body">
        <NodeList />
        <main class="main">
          <nav class="tabs">
            <button v-for="t in TABS" :key="t.key" :class="{ active: state.tab === t.key }" @click="state.tab = t.key">{{ t.label }}</button>
            <span class="grow"></span>
            <span class="hint" v-if="state.issues.length">校验：{{ state.issues.filter(i => i.level === 'error').length }} 错误 / {{ state.issues.filter(i => i.level === 'warn').length }} 警告</span>
          </nav>
          <PreviewPanel v-if="state.tab === 'preview'" />
          <FlowPanel v-else-if="state.tab === 'flow'" />
          <TablePanel v-else-if="state.tab === 'table'" />
          <AssetsPanel v-else-if="state.tab === 'assets'" />
          <ExtraPanel v-else-if="state.tab === 'extra'" />
          <LintPanel v-else />
        </main>
        <Inspector />
      </div>
    </div>`,
};

createApp(App).mount('#app');
