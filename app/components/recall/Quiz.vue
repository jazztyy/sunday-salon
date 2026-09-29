<script setup lang="ts">
// 「自我測驗」：單選題，作答後鎖定並顯示解析與原片段連結（SPEC.md 4.3）。
// 儲存格式 { order: 題目順序, ans: {題目索引: 選項索引} }；舊格式（沒有 order 陣列）一律重設。
import type { Session } from '~/types/session'

interface QuizState {
  order: number[]
  ans: Record<string, number>
}

const props = defineProps<{ session: Session }>()

const defaultOrder = () => props.session.quiz.map((_, i) => i)

const stored = useSalonStorage<QuizState>(`salon-quiz-${props.session.slug}`, { order: defaultOrder(), ans: {} })

/** 相容舊資料：order 不是陣列、或題數對不上時，退回預設順序 */
const state = computed<QuizState>(() => {
  const v = stored.value
  const valid = v && Array.isArray(v.order) && v.order.length === props.session.quiz.length
  return valid ? { order: v.order, ans: v.ans ?? {} } : { order: defaultOrder(), ans: {} }
})

const shuffle = <T,>(arr: T[]): T[] =>
  arr.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v)

const score = computed(() =>
  Object.entries(state.value.ans).filter(([i, a]) => props.session.quiz[Number(i)]?.a === a).length,
)

/** videoId → '講座 N' */
const lecName = (vid: string) => props.session.videos.find(v => v.id === vid)?.lec.split(' · ')[0] ?? ''

const answer = (i: number, pick: number) => {
  if (state.value.ans[i] !== undefined) return
  stored.value = { order: state.value.order, ans: { ...state.value.ans, [i]: pick } }
}

const reset = () => {
  stored.value = { order: shuffle(defaultOrder()), ans: {} }
}

const optionClass = (i: number, j: number) => {
  const pick = state.value.ans[i]
  if (pick === undefined) return 'border-default bg-muted hover:border-accented'
  if (j === props.session.quiz[i]!.a) return 'border-success bg-success-soft'
  if (j === pick) return 'border-error bg-error-soft'
  return 'border-default bg-muted'
}
</script>

<template>
  <section id="quiz" class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">自我測驗</h2>

    <div class="flex flex-wrap items-center justify-between gap-3 text-small text-muted">
      <span>答對 <b class="font-mono text-body-sm font-medium text-highlighted">{{ score }} / {{ session.quiz.length }}</b></span>
      <UButton color="neutral" variant="outline" class="rounded-control px-3 text-small" label="打亂順序，重新作答" @click="reset" />
    </div>

    <div class="flex flex-col gap-7">
      <div v-for="(i, n) in state.order" :key="i" class="flex flex-col gap-2.5">
        <h3 class="text-body font-bold">
          <span class="block font-mono text-label font-medium text-muted">{{ lecName(session.quiz[i]!.t[0]) }}</span>
          {{ n + 1 }}. {{ session.quiz[i]!.q }}
        </h3>

        <div class="flex flex-col gap-1.5">
          <button
            v-for="(o, j) in session.quiz[i]!.o"
            :key="j"
            type="button"
            class="w-full rounded-control border px-3 py-2 text-left text-body-sm leading-relaxed text-default enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="optionClass(i, j)"
            :disabled="state.ans[i] !== undefined"
            @click="answer(i, j)"
          >
            {{ o }}
          </button>
        </div>

        <p v-if="state.ans[i] !== undefined" class="text-small leading-relaxed text-toned">
          <b v-if="state.ans[i] === session.quiz[i]!.a" class="text-success">答對了。</b><b v-else class="text-error">再想想。</b>{{ session.quiz[i]!.e }}
          <VideoLink :vid="session.quiz[i]!.t[0]" :t="session.quiz[i]!.t[1]">看原片段 ▸</VideoLink>
        </p>
      </div>
    </div>

    <WhyNote>題目打亂、三支影片混在一起考（交錯練習），比照順序作答更能分辨概念。</WhyNote>
  </section>
</template>
