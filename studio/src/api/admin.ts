/**
 * admin.ts — 后台管理接口（/api/v3/admin/*，需 admin 角色）
 * 与 internal/handlers/router.go 中的路由逐条对应，共 40 个。
 */
import { api } from './client'
import type {
    AdminPlayerDetail,
    AdminPlayerItem,
    AdminUserItem,
    Buff,
    BuffCreate,
    BuffUpdate,
    Character,
    CharacterCreate,
    CharacterUpdate,
    EmailConfig,
    EmailConfigUpdate,
    Enemy,
    EnemyCreate,
    EnemyUpdate,
    PageQuery,
    Paginated,
    Skill,
    SkillCreate,
    SkillUpdate,
    StatsItems,
    StatsOnline,
    StatsOverview,
    Tool,
    ToolCreate,
    ToolUpdate,
    UserRole,
} from './types'

// ==================== 用户管理 ====================

export const usersApi = {
    list: (query: PageQuery) => api.get<Paginated<AdminUserItem>>('/api/v3/admin/users/list', { ...query }),
    setRole: (id: number, role: UserRole) => api.put<null>(`/api/v3/admin/users/${id}/role`, { role }),
    disable: (id: number) => api.put<null>(`/api/v3/admin/users/${id}/disable`),
    enable: (id: number) => api.put<null>(`/api/v3/admin/users/${id}/enable`),
}

// ==================== 玩家管理 ====================

export const playersApi = {
    list: (query: PageQuery) => api.get<Paginated<AdminPlayerItem>>('/api/v3/admin/players/list', { ...query }),
    detail: (id: number) => api.get<AdminPlayerDetail>(`/api/v3/admin/players/${id}`),
    ban: (id: number) => api.put<null>(`/api/v3/admin/players/${id}/ban`),
    unban: (id: number) => api.put<null>(`/api/v3/admin/players/${id}/unban`),
    setLevel: (id: number, level: number) => api.put<null>(`/api/v3/admin/players/${id}/level`, { level }),
    setExp: (id: number, exp: number) => api.put<null>(`/api/v3/admin/players/${id}/exp`, { exp }),
}

// ==================== 数据统计 ====================

export const statsApi = {
    overview: () => api.get<StatsOverview>('/api/v3/admin/stats/overview'),
    online: () => api.get<StatsOnline>('/api/v3/admin/stats/online'),
    items: () => api.get<StatsItems>('/api/v3/admin/stats/items'),
}

// ==================== 系统配置 ====================

export const configApi = {
    emails: () => api.get<{ list: EmailConfig[] }>('/api/v3/admin/config/emails'),
    updateEmail: (id: number, payload: EmailConfigUpdate) =>
        api.put<null>(`/api/v3/admin/config/emails/${id}`, payload),
}

// ==================== 游戏内容：角色 ====================

export const charactersApi = {
    list: (query: PageQuery) => api.get<Paginated<Character>>('/api/v3/admin/game/characters/list', { ...query }),
    detail: (id: number) => api.get<Character>(`/api/v3/admin/game/characters/${id}`),
    create: (payload: CharacterCreate) => api.post<null>('/api/v3/admin/game/characters', payload),
    update: (id: number, payload: CharacterUpdate) => api.put<null>(`/api/v3/admin/game/characters/${id}`, payload),
}

// ==================== 游戏内容：敌人 ====================

export const enemiesApi = {
    list: (query: PageQuery) => api.get<Paginated<Enemy>>('/api/v3/admin/game/enemies/list', { ...query }),
    detail: (id: number) => api.get<Enemy>(`/api/v3/admin/game/enemies/${id}`),
    create: (payload: EnemyCreate) => api.post<null>('/api/v3/admin/game/enemies', payload),
    update: (id: number, payload: EnemyUpdate) => api.put<null>(`/api/v3/admin/game/enemies/${id}`, payload),
}

// ==================== 游戏内容：道具 ====================

export const toolsApi = {
    list: (query: PageQuery) => api.get<Paginated<Tool>>('/api/v3/admin/game/tools/list', { ...query }),
    detail: (id: number) => api.get<Tool>(`/api/v3/admin/game/tools/${id}`),
    create: (payload: ToolCreate) => api.post<null>('/api/v3/admin/game/tools', payload),
    update: (id: number, payload: ToolUpdate) => api.put<null>(`/api/v3/admin/game/tools/${id}`, payload),
}

// ==================== 游戏内容：技能 ====================

export const skillsApi = {
    list: (query: PageQuery) => api.get<Paginated<Skill>>('/api/v3/admin/game/skills/list', { ...query }),
    detail: (id: number) => api.get<Skill>(`/api/v3/admin/game/skills/${id}`),
    create: (payload: SkillCreate) => api.post<null>('/api/v3/admin/game/skills', payload),
    update: (id: number, payload: SkillUpdate) => api.put<null>(`/api/v3/admin/game/skills/${id}`, payload),
}

// ==================== 游戏内容：Buff ====================

export const buffsApi = {
    list: (query: PageQuery) => api.get<Paginated<Buff>>('/api/v3/admin/game/buffs/list', { ...query }),
    detail: (id: number) => api.get<Buff>(`/api/v3/admin/game/buffs/${id}`),
    create: (payload: BuffCreate) => api.post<null>('/api/v3/admin/game/buffs', payload),
    update: (id: number, payload: BuffUpdate) => api.put<null>(`/api/v3/admin/game/buffs/${id}`, payload),
}
