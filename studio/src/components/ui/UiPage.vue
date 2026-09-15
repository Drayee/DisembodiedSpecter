<script setup lang="ts">
/** UiPage — 后台页面的统一容器：整页滚动 + 最大宽度 + 一致内边距 */
</script>

<template>
    <div class="h-full min-h-0 overflow-y-auto">
        <div class="mx-auto flex w-full max-w-[1480px] flex-col gap-5 p-5 lg:p-6">
            <slot />
        </div>
    </div>
</template>
