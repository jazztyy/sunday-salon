<script setup lang="ts">
// 首頁直接顯示最新一場
const { data: session } = await useSession()
if (!session.value) throw createError({ statusCode: 404, statusMessage: '還沒有任何場次', fatal: true })

useSeoMeta({
  title: () => `悅讀聊天室・${session.value?.chip ?? ''}`,
  ogTitle: '悅讀聊天室',
  ogDescription: () => `這週：${session.value?.title ?? ''}`,
})
</script>

<template>
  <SessionView v-if="session" :session="session" />
</template>
