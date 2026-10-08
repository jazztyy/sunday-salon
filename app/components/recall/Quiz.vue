<script setup lang="ts">
// 「自我測驗」：全部題目（各影片 + 整合回顧）打亂混考，單題顯示交給 StudyQuizItem（SPEC.md 4.3）。
// 第一次打開就是打亂的順序；出處（講座幾）作答後才顯示，免得題目還沒答就先透露答案在哪一講。
// 儲存在 salon-quiz-{slug}（useQuizAnswers，依題目 key 記答案和順序）。改過的題目要重答，其他題不受影響；新題目接在最後。
import type { Session } from '~/types/session'

const props = defineProps<{ session: Session }>()

const defaultOrder = () => props.session.quiz.map((_, i) => i)

const { picks, order, answer, reset: resetAnswers } = useQuizAnswers(props.session.slug, () => props.session.quiz, 'recall')

const state = computed(() => ({ order: order.value ?? defaultOrder(), ans: picks.value }))

const score = computed(() =>
  Object.entries(state.value.ans).filter(([i, a]) => props.session.quiz[Number(i)]?.a === a).length,
)

const reset = () => resetAnswers(shuffled(defaultOrder()))

// 沒有紀錄（第一次來）時直接給一個打亂的順序。
// 放在掛載後：預先產生的 HTML 用固定順序，避免 hydration 不一致；useSalonStorage 的讀取先於這裡執行。
onMounted(() => {
  if (!order.value) reset()
})
</script>

<template>
  <section id="quiz" class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">自我測驗</h2>

    <div class="flex flex-wrap items-center justify-between gap-3 text-small text-muted">
      <span>答對 <b class="font-mono text-body-sm font-medium text-highlighted">{{ score }} / {{ session.quiz.length }}</b></span>
      <UButton color="neutral" variant="outline" class="rounded-control px-3 text-small" label="打亂順序，重新作答" @click="reset" />
    </div>

    <div class="flex flex-col gap-7">
      <StudyQuizItem
        v-for="(i, n) in state.order"
        :key="i"
        :session="session"
        :item="session.quiz[i]!"
        :number="n + 1"
        :pick="state.ans[i]"
        source-after-answer
        @pick="answer(i, $event)"
      />
    </div>

    <WhyNote>題目打亂、三支影片混在一起考（交錯練習），比照順序作答更能分辨概念。</WhyNote>
  </section>
</template>
