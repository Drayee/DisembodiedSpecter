/**
 * types.ts — 与 Go 后端 DTO 一一对应的类型定义
 * 来源：internal/dto/request/*.go、internal/dto/response/*.go、internal/domain/*.go
 * 注意：后端 PUT 一律是「整体替换」，所以 Update 类型里的字段基本都可选但提交时必须带全。
 */

// ==================== 通用 ====================

export interface TokenPair {
    access_token: string
    refresh_token: string
    user_id: number
}

export interface PageQuery {
    page: number
    page_size: number
}

export interface Paginated<T> {
    total: number
    list: T[]
}

// ==================== 用户 / 玩家 ====================

export type UserRole = 'admin' | 'user'

/** 后端常量：1=正常，0=禁用 */
export const UserStatus = { Active: 1, Disabled: 0 } as const

export interface AdminUserItem {
    id: number
    name: string
    email: string
    role: UserRole
    status: number
    created_at: string
}

export interface AdminPlayerItem {
    id: number
    description: string
    level: number
    exp: number
    is_active: boolean
    least_active_type: string
    least_active_ip: string
    least_active_at: string
}

export interface PlayerLocation {
    x: number
    y: number
    map: string
}

export interface AdminPlayerDetail {
    id: number
    description: string
    level: number
    exp: number
    location: PlayerLocation
    story_progress: string
    is_active: boolean
    least_active_type: string
    least_active_ip: string
    least_active_at: string
}

// ==================== 统计 ====================

export interface StatsOverview {
    user_count: number
    player_count: number
    item_count: number
    email_count: number
}

export interface StatsOnline {
    online_count: number
    total_count: number
}

export interface ItemStat {
    id: number
    name: string
    description: string
    type: string
}

export interface StatsItems {
    items: ItemStat[]
}

// ==================== 系统配置 ====================

export interface EmailConfig {
    id: number
    host: string
    port: number
    user: string
    pass: string
    max_count: number
    status: number
    created_at: string
    updated_at: string
}

export interface EmailConfigUpdate {
    host: string
    port: number
    user: string
    pass: string
    max_count: number
    status: number
}

/** 邮箱配置状态：后端未定义常量，按 1=启用 0=停用 约定展示 */
export const EmailStatus = { Enabled: 1, Disabled: 0 } as const

// ==================== 游戏内容 ====================

export interface Character {
    id: number
    name: string
    health: number
    type: string
    description: string
    created_at: string
    updated_at: string
}

export interface CharacterCreate {
    name: string
    health: number
    type: string
    description: string
    owner_number: number
}

export type CharacterUpdate = Partial<Omit<CharacterCreate, 'owner_number'>> & { owner_number?: number }

export interface Enemy {
    id: number
    name: string
    health: number
    type: string
    description: string
    created_at: string
    updated_at: string
}

export interface EnemyCreate {
    name: string
    health: number
    type: string
    description: string
}

export type EnemyUpdate = Partial<EnemyCreate>

export interface Tool {
    id: number
    name: string
    description: string
    created_at: string
    updated_at: string
}

export interface ToolCreate {
    name: string
    description: string
}

export type ToolUpdate = Partial<ToolCreate>

export interface Skill {
    id: number
    character_id: number
    name: string
    type: string
    description: string
    created_at: string
    updated_at: string
}

export interface SkillCreate {
    character_id: number
    name: string
    type: string
    description: string
}

export type SkillUpdate = Partial<SkillCreate>

// Buff：type / loss_way 是 oneof 枚举，PUT 整体替换时必须带全，否则会把枚举清空
export const BuffTypeOptions = [
    { value: 'value_change', label: '数值变化' },
    { value: 'percent_change', label: '百分比变化' },
    { value: 'listener', label: '监听事件' },
    { value: 'tag', label: '标签（无效果）' },
] as const

export const BuffLossWayOptions = [
    { value: 'time', label: '按回合减少' },
    { value: 'action', label: '按行动减少' },
    { value: 'none', label: '无损耗（永久）' },
    { value: 'listener', label: '监听事件损耗' },
] as const

export const BuffStatOptions = [
    { value: 'attack', label: '攻击' },
    { value: 'defense', label: '防御' },
    { value: 'recover', label: '恢复' },
] as const

export type BuffType = (typeof BuffTypeOptions)[number]['value']
export type BuffLossWay = (typeof BuffLossWayOptions)[number]['value']
export type BuffStat = (typeof BuffStatOptions)[number]['value']

export interface BuffEffect {
    stat: BuffStat
    value: number
    percent: boolean
}

export interface Buff {
    id: number
    name: string
    type: BuffType
    loss_way: BuffLossWay
    default_duration: number
    effects: BuffEffect[] | null
    description: string
    created_at: string
    updated_at: string
}

export interface BuffCreate {
    name: string
    type: BuffType
    loss_way: BuffLossWay
    default_duration: number
    effects: BuffEffect[]
    description: string
}

export type BuffUpdate = BuffCreate
