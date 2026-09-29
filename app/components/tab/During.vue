<script setup lang="ts">
// 「邊看邊想」分頁：照影片順序，每支影片一段（論證卡、小測驗、討論題），最後是整合回顧。規格見 SPEC.md 4.2。
// 這裡的測驗紀錄存在 salon-quiz-inline-{slug}：{ sig: 題目簽章, ans: {題目在 session.quiz 的索引: 選項索引} }，
// 和「看完回想」的 salon-quiz-{slug} 分開，之後重測才是從頭開始。題目改過（簽章不同）就重置。
import type { Session } from '~/types/session'

const props = defineProps<{ session: Session }>()

interface InlineState { sig: string, ans: Record<string, number> }

const sig = computed(() => quizSignature(props.session.quiz))
const stored = useSalonStorage<InlineState>(`salon-quiz-inline-${props.session.slug}`, { sig: '', ans: {} })
const picks = computed(() => (stored.value?.sig === sig.value ? stored.value.ans ?? {} : {}))

const answer = (quizIndex: number, option: number) => {
  const key = String(quizIndex)
  if (picks.value[key] !== undefined) return
  stored.value = { sig: sig.value, ans: { ...picks.value, [key]: option } }
}

const withIndex = <T,>(list: T[]) => list.map((item, index) => ({ item, index }))

const allQuiz = computed(() => withIndex(props.session.quiz).filter(({ item }) => item.scope === 'all'))
const allDiscuss = computed(() => withIndex(props.session.discuss).filter(({ item }) => item.scope === 'all'))

const h3Class = 'font-serif text-title font-bold text-highlighted'
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">邊看邊想</h2>
    <p class="text-small text-muted">照影片順序，一支一支來：看完一支，先猜論證哪裡有問題、做幾題小測驗，再想想討論題。三支都看完，最後做整合回顧。</p>
    <WhyNote>先猜再看答案（預測試）：就算猜錯，也比直接讀答案記得更牢。</WhyNote>
    <p v-if="session.argsNote" class="text-small text-muted">{{ session.argsNote }}</p>
  </section>

  <StudyVideoSection
    v-for="v in session.videos"
    :key="`${session.slug}-${v.id}`"
    :session="session"
    :video="v"
    :quiz-picks="picks ?? {}"
    @pick="answer"
  />

  <section v-if="allQuiz.length || allDiscuss.length" class="flex flex-col gap-6 border-t-2 border-accented pt-6">
    <header class="flex flex-col gap-1">
      <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">整合回顧</h2>
      <p class="text-small text-muted">三支影片都看完之後，把它們放在一起想。</p>
    </header>

    <div v-if="allQuiz.length" class="flex flex-col gap-7">
      <h3 v-if="allQuiz.length" :class="h3Class">測一下</h3>
      <StudyQuizItem
        v-for="({ item, index }, n) in allQuiz"
        :key="`${session.slug}-quiz-${index}`"
        as="h4"
        hide-source
        :session="session"
        :item="item"
        :number="n + 1"
        :pick="picks?.[String(index)]"
        @pick="answer(index, $event)"
      />
    </div>

    <div v-if="allDiscuss.length" class="flex flex-col gap-3">
      <h3 :class="h3Class">想一想</h3>
      <StudyDiscussCard
        v-for="{ item, index } in allDiscuss"
        :key="`${session.slug}-discuss-${index}`"
        :session="session"
        :item="item"
      />
    </div>
  </section>
</template>
