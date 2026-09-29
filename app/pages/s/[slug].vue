<script setup lang="ts">
// 各場次的固定網址：/s/w1
const route = useRoute()
const { data: session } = await useSession(String(route.params.slug))
if (!session.value) throw createError({ statusCode: 404, statusMessage: '找不到這一場', fatal: true })

useSeoMeta({
  title: () => `悅讀聊天室・${session.value?.chip ?? ''}`,
  ogTitle: '悅讀聊天室',
  ogDescription: () => session.value?.title ?? '',
})
</script>

<template>
  <SessionView v-if="session" :session="session" />
</template>
