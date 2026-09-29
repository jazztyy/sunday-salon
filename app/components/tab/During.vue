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

// 子分頁：一次只看一支影片（或整合回顧）。切到某支影片時，右側播放器與章節也跟著換（不自動播放）。
// 選擇記在 salon-during-part-{slug}。
const { cue, select, selected } = usePlayer()
const parts = computed(() => [
  ...props.session.videos.map(v => ({ key: v.id, label: lecOf(props.session, v.id) })),
  ...(allQuiz.value.length || allDiscuss.value.length ? [{ key: 'all', label: '整合回顧' }] : []),
])
const storedPart = useSalonStorage(`salon-during-part-${props.session.slug}`, '')
const part = ref(props.session.videos[0]?.id ?? 'all')
const currentVideo = computed(() => props.session.videos.find(v => v.id === part.value))
const nextPart = computed(() => parts.value[parts.value.findIndex(p => p.key === part.value) + 1])

const partsBar = useTemplateRef<HTMLElement>('partsBar')

const selectPart = (key: string, scroll = true) => {
  if (!parts.value.some(p => p.key === key)) return
  part.value = key
  storedPart.value = key
  if (key !== 'all') select(key)
  // 換段後回到子分頁列的位置，不必自己往上捲
  if (scroll && partsBar.value) {
    const tb = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tb')) || 0
    const top = partsBar.value.getBoundingClientRect().top + window.scrollY - tb
    if (window.scrollY > top) window.scrollTo({ top })
  }
}

// 右側章節清單選了別的講座 → 左側子分頁跟著換
watch(selected, (id) => {
  if (id && id !== part.value) selectPart(id)
})

// 初始段落：剛才在右側選過的講座優先，其次是上次停留的位置，都沒有就是第一支影片
onMounted(() => {
  const initial = selected.value ?? storedPart.value
  if (initial) selectPart(initial, false)
  else select(part.value)
})
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">邊看邊想</h2>
    <p class="text-small text-muted">一次看一支影片：切換下面的分頁，播放器和影片章節也會跟著換。看完一支，先猜論證哪裡有問題、做幾題小測驗，再想想討論題；三支都看完，最後做整合回顧。</p>
    <WhyNote>先猜再看答案（預測試）：就算猜錯，也比直接讀答案記得更牢。</WhyNote>
    <p v-if="session.argsNote" class="text-small text-muted">{{ session.argsNote }}</p>
  </section>

  <!-- 子分頁列：固定在頂部列下方，捲動時也能切換 -->
  <div ref="partsBar" class="sticky top-[var(--tb,116px)] z-10 -mx-4 bg-default px-4 py-2 lg:mx-0 lg:px-0">
    <UTabs
      :model-value="part"
      :items="parts"
      value-key="key"
      variant="pill"
      color="neutral"
      size="sm"
      :content="false"
      aria-label="影片"
      :ui="{ list: 'w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', trigger: 'flex-1 min-w-fit', label: 'text-ui font-medium' }"
      @update:model-value="selectPart(String($event))"
    />
  </div>

  <StudyVideoSection
    v-if="currentVideo"
    :key="`${session.slug}-${currentVideo.id}`"
    :session="session"
    :video="currentVideo"
    :quiz-picks="picks ?? {}"
    @pick="answer"
  />

  <section v-else-if="part === 'all'" class="flex flex-col gap-6">
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

  <div v-if="nextPart" class="flex justify-end">
    <UButton color="neutral" variant="outline" :label="`下一段：${nextPart.label} →`" @click="selectPart(nextPart.key)" />
  </div>
</template>
