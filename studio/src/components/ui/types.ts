/**
 * types.ts — UI 组件层的公共类型
 * 单独成文件：`<script setup>` 内导出的类型在跨文件导入时不可靠，统一放这里。
 */

/** 数据表格列定义 */
export interface TableColumn {
    key: string
    title: string
    width?: string
    align?: 'left' | 'center' | 'right'
    /** 等宽字体（ID / 时间 / 地址类） */
    mono?: boolean
    /** 数值列使用等宽数字，避免抖动 */
    numeric?: boolean
}

/** 分段控件选项 */
export interface SegmentOption {
    value: string
    label: string
    /** lucide 图标组件（可选） */
    icon?: unknown
    /** 尾部计数 */
    count?: number
}

/** 标签栏选项 */
export interface TabOption {
    key: string
    label: string
    icon?: unknown
    count?: number
    tone?: 'default' | 'warn' | 'danger'
}
