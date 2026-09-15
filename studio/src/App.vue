<script setup lang="ts">
/** App — 只负责挂载路由出口与全局反馈宿主（Toast / 确认弹窗） */
import { RouterView } from 'vue-router'
import UiToastHost from '@/components/ui/UiToastHost.vue'
import UiConfirmHost from '@/components/ui/UiConfirmHost.vue'
</script>

<template>
    <RouterView />
    <UiToastHost />
    <UiConfirmHost />
</template>
