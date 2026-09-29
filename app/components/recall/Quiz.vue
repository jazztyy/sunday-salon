<script setup lang="ts">
// 「自我測驗」：全部題目（各影片 + 整合回顧）打亂混考，單題顯示交給 StudyQuizItem（SPEC.md 4.3）。
// 第一次打開就是打亂的順序；出處（講座幾）作答後才顯示，免得題目還沒答就先透露答案在哪一講。
// 儲存格式 { sig: 題目簽章, order: 題目順序, ans: {題目索引: 選項索引} }；簽章不同（題目改過）或舊格式一律重設。
import type { Session } from '~/types/session'

interface QuizState {
  sig: string
  order: number[]
  ans: Record<string, number>
}

const props = defineProps<{ session: Session }>()

const defaultOrder = () => props.session.quiz.map((_, i) => i)

const sig = computed(() => quizSignature(props.session.quiz))

const stored = useSalonStorage<QuizState>(`salon-quiz-${props.session.slug}`, { sig: '', order: defaultOrder(), ans: {} })

/** 題目改過（簽章不同）、舊格式或題數對不上時，退回預設順序、清空作答 */
const state = computed<QuizState>(() => {
  const v = stored.value
  const valid = v && v.sig === sig.value && Array.isArray(v.order) && v.order.length === props.session.quiz.length
  return valid ? { sig: sig.value, order: v.order, ans: v.ans ?? {} } : { sig: sig.value, order: defaultOrder(), ans: {} }
})

const shuffle = <T,>(arr: T[]): T[] =>
  arr.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v)

const score = computed(() =>
  Object.entries(state.value.ans).filter(([i, a]) => props.session.quiz[Number(i)]?.a === a).length,
)

const answer = (i: number, pick: number) => {
  if (state.value.ans[i] !== undefined) return
  stored.value = { sig: sig.value, order: state.value.order, ans: { ...state.value.ans, [i]: pick } }
}

const reset = () => {
  stored.value = { sig: sig.value, order: shuffle(defaultOrder()), ans: {} }
}

// 沒有紀錄（第一次來）或題目改過時，直接給一個打亂的順序。
// 放在掛載後：預先產生的 HTML 用固定順序，避免 hydration 不一致；useSalonStorage 的讀取先於這裡執行。
onMounted(() => {
  if (stored.value?.sig !== sig.value) reset()
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
