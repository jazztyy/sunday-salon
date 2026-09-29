<script setup lang="ts">
// 「看完回想」分頁：複習節奏、白紙回想、自我測驗、名詞卡。規格見 SPEC.md 4.3。
// 每個區塊（含 h2 與學習法註記）都在各自的元件裡。
import type { Session } from '~/types/session'

defineProps<{ session: Session }>()
</script>

<template>
  <RecallTimeline />
  <RecallQuestions :videos="session.videos" />
  <RecallQuiz :key="`quiz-${session.id}`" :session="session" />
  <RecallTerms :key="`terms-${session.id}`" :session="session" />
</template>
