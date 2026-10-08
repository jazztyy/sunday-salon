<script setup lang="ts">
// 首頁顯示本週場次（依台灣日期挑，見 pickCurrentSession）。
// 網站是靜態輸出：預先產生的 HTML 用建置當天的日期，掛載後再用瀏覽器的今天重挑，
// 這樣不必每週重新建置。today 放在 useState 裡，hydration 時沿用建置日期，避免不一致。
const { data: sessions } = await useAllSessions()
const today = useState('home:today', () => taipeiToday())
onMounted(() => { today.value = taipeiToday() })

const session = computed(() => pickCurrentSession(sessions.value, today.value))
if (!session.value) throw createError({ statusCode: 404, statusMessage: '還沒有任何場次', fatal: true })

useSeoMeta({
  title: () => `悅讀聊天室・${session.value?.chip ?? ''}`,
  ogTitle: '悅讀聊天室',
  ogDescription: () => `這週：${session.value?.title ?? ''}`,
})
</script>

<template>
  <SessionView v-if="session" :key="session.slug" :session="session" />
</template>
