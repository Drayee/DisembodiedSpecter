import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { session } from '@/api/session'

/**
 * 路由表
 *  - /login          公开
 *  - /story/*        剧情编辑器（纯前端，本地存储 + zip 导入导出，不需要登录）
 *  - /admin/*        后台管理（需要 admin 令牌）
 * 使用 hash 模式：构建产物可以直接丢到任意静态目录（甚至 Cocos 扩展里）打开。
 */
const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: '登录', public: true },
    },
    {
        path: '/',
        component: () => import('@/layouts/AppShell.vue'),
        children: [
            { path: '', redirect: { name: 'story' } },
            {
                path: 'story',
                name: 'story',
                component: () => import('@/views/story/StoryEditorView.vue'),
                meta: { title: '剧情编排' },
            },
            {
                path: 'admin/overview',
                name: 'admin-overview',
                component: () => import('@/views/admin/OverviewView.vue'),
                meta: { title: '数据概览', requiresAdmin: true },
            },
            {
                path: 'admin/users',
                name: 'admin-users',
                component: () => import('@/views/admin/UsersView.vue'),
                meta: { title: '用户管理', requiresAdmin: true },
            },
            {
                path: 'admin/players',
                name: 'admin-players',
                component: () => import('@/views/admin/PlayersView.vue'),
                meta: { title: '玩家管理', requiresAdmin: true },
            },
            {
                path: 'admin/content/characters',
                name: 'admin-characters',
                component: () => import('@/views/admin/CharactersView.vue'),
                meta: { title: '角色管理', requiresAdmin: true },
            },
            {
                path: 'admin/content/enemies',
                name: 'admin-enemies',
                component: () => import('@/views/admin/EnemiesView.vue'),
                meta: { title: '敌人管理', requiresAdmin: true },
            },
            {
                path: 'admin/content/tools',
                name: 'admin-tools',
                component: () => import('@/views/admin/ToolsView.vue'),
                meta: { title: '道具管理', requiresAdmin: true },
            },
            {
                path: 'admin/content/skills',
                name: 'admin-skills',
                component: () => import('@/views/admin/SkillsView.vue'),
                meta: { title: '技能管理', requiresAdmin: true },
            },
            {
                path: 'admin/content/buffs',
                name: 'admin-buffs',
                component: () => import('@/views/admin/BuffsView.vue'),
                meta: { title: 'Buff 管理', requiresAdmin: true },
            },
            {
                path: 'admin/config/emails',
                name: 'admin-emails',
                component: () => import('@/views/admin/EmailsView.vue'),
                meta: { title: '邮箱配置', requiresAdmin: true },
            },
        ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'story' } },
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
    const needsAdmin = to.matched.some((r) => r.meta.requiresAdmin)
    if (needsAdmin && !session.isLogged) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (to.name === 'login' && session.isLogged) {
        const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
        return redirect ? { path: redirect } : { name: 'admin-overview' }
    }
    return true
})

router.afterEach((to) => {
    const title = (to.meta.title as string) || ''
    document.title = title ? `${title} · 幽影工坊` : '幽影工坊 · DisembodiedSpecter Studio'
})
