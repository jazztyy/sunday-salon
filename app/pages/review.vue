<script setup lang="ts">
// /review 複習：從討論過的場次出選擇題（場次的測驗題＋概念卡題），一題一題做，每題可以寫筆記。
// 版面和 /archive 一致：左邊固定的設定欄（出題方式、範圍、題型、題數、先回想），右邊做題。
// 一輪的題目在瀏覽器按「開始複習」才抽（隨機、跨場次交錯），作答只留在這一輪；
// 每題的作答紀錄（間隔重複的熟練程度與到期日）和筆記存在瀏覽器（useReview）。
// 學習流程：先回想再看選項（提取練習）→ 作答後立刻看解析 → 答對時標記有沒有把握（猜對不拉長間隔）
// → 用最簡單的話寫筆記（費曼技巧）→ 一輪結束馬上重練答錯的（連續再學習），低於 80% 建議再練（精熟學習）。
// 方法依據：pdf-parser 專案的 study skill（整合 11 本學習科學書籍），間隔照它的 1/2/4/7/15/30 天。
// 規格見 SPEC.md「複習」。
import type { ReviewQuestion } from '~/utils/review'
import type { ScopeMode, ScopeSession } from '~/components/filter/ScopePicker.vue'

useSeoMeta({ title: '複習・悅讀聊天室' })

const { data: sessions } = await useStudySessions()
const { data: concepts } = await useConceptIndex()

const { getNote, setNote } = useReviewNotes()
const { log, isDue, record } = useReviewLog()

// 「討論過」= 活動日期在今天（台灣時間）或之前
const today = useToday()
const discussed = computed(() => sessions.value.filter(s => s.date <= today.value))
const discussedSlugs = computed(() => new Set(discussed.value.map(s => s.slug)))

/** 「全部討論過的」：討論過的場次（還沒有就是本週那一場） */
const discussedBase = computed(() => discussed.value.length
  ? discussed.value
  : [pickCurrentSession(sessions.value, today.value)].filter(s => !!s))

/** 「最近 4 場」：討論過的場次裡最新的 4 場（sessions 是新到舊） */
const RECENT_COUNT = 4

const presetSlugs = computed(() => ({
  discussed: discussedBase.value.map(s => s.slug),
  recent: discussedBase.value.slice(0, RECENT_COUNT).map(s => s.slug),
}))

/** 範圍設定存在瀏覽器：預設範圍，或「自己選」的場次 slug */
const scopeState = useSalonStorage<{ mode: ScopeMode, slugs: string[] }>(STORAGE_KEYS.reviewScope, { mode: 'discussed', slugs: [] })

const scopeMode = computed({
  get: () => scopeState.value.mode,
  set: (mode: ScopeMode) => {
    // 第一次切到「自己選」時，從目前的範圍開始勾
    const slugs = mode === 'custom' && !scopeState.value.slugs.length && scopeState.value.mode !== 'custom'
      ? presetSlugs.value[scopeState.value.mode]
      : scopeState.value.slugs
    scopeState.value = { mode, slugs }
  },
})
const customSlugs = computed({
  get: () => scopeState.value.slugs,
  set: (slugs: string[]) => { scopeState.value = { ...scopeState.value, slugs } },
})

// 掛載後讀回存的範圍（useSalonStorage 在這之前已經讀好）：丟掉已經不存在的場次；
// 自己選的剛好等於某個預設範圍時改回那個預設，之後有新場次會跟著更新。只在讀回時整理，勾選途中不動
onMounted(() => {
  const { mode, slugs } = scopeState.value
  const known = new Set(sessions.value.map(s => s.slug))
  const kept = (Array.isArray(slugs) ? slugs : []).filter(v => known.has(v))
  const same = (list: string[]) => list.length === kept.length && list.every(v => kept.includes(v))
  const normalized: ScopeMode = !['discussed', 'recent', 'custom'].includes(mode) ? 'discussed'
    : mode !== 'custom' ? mode
      : !kept.length || same(presetSlugs.value.discussed) ? 'discussed'
          : same(presetSlugs.value.recent) ? 'recent'
            : 'custom'
  if (normalized !== mode || kept.length !== slugs?.length) scopeState.value = { mode: normalized, slugs: kept }
})

/** 範圍：實際選取的場次 slug */
const scope = computed(() => scopeMode.value === 'custom' ? customSlugs.value : presetSlugs.value[scopeMode.value])

const scopeSet = computed(() => new Set(scope.value))

/** 「自己選」清單：全部場次，還沒討論的淡一點 */
const scopeSessions = computed<ScopeSession[]>(() => sessions.value.map(s => ({
  slug: s.slug,
  date: s.date,
  chip: s.chip,
  upcoming: !discussedSlugs.value.has(s.slug),
})))

type Kind = 'quiz' | 'concept'
const kinds = ref<Kind[]>(['quiz', 'concept'])
const KIND_OPTIONS: { value: Kind, label: string }[] = [
  { value: 'quiz', label: '測驗題' },
  { value: 'concept', label: '概念卡' },
]

const size = ref<number>(10)
/** 0 = 全部 */
const SIZE_OPTIONS = [10, 20, 0].map(n => ({ value: n, label: n ? `${n} 題` : '全部' }))

/** 出題方式：今天到期（含沒做過的，預設）、上次答錯的、全部 */
type Mode = 'due' | 'wrong' | 'all'
const MODES: { key: Mode, label: string }[] = [
  { key: 'due', label: '今天該複習的' },
  { key: 'wrong', label: '上次答錯的' },
  { key: 'all', label: '全部' },
]
const mode = ref<Mode>('due')

/** 先回想再看選項（預設開） */
const recallFirst = ref(true)

/** 這些場次、篩完題型的題目（還沒套出題方式） */
const questionsOf = (slugs: Set<string>) => {
  const kindSet = new Set(kinds.value)
  return buildReviewQuestions(sessions.value.filter(s => slugs.has(s.slug)), concepts.value).filter(q => kindSet.has(q.kind))
}

/** 套用出題方式 */
const byMode = (list: ReviewQuestion[], m: Mode) => list.filter(q =>
  m === 'all'
  || (m === 'due' && isDue(q.key, today.value))
  || (m === 'wrong' && log.value?.[q.key]?.lastCorrect === false),
)

/** 範圍和題型篩完、還沒套出題方式的題目 */
const base = computed(() => questionsOf(scopeSet.value))

const modeCounts = computed(() => ({
  due: byMode(base.value, 'due').length,
  wrong: byMode(base.value, 'wrong').length,
  all: base.value.length,
}))

const modeOptions = computed(() => MODES.map(m => ({ value: m.key, label: m.label, count: modeCounts.value[m.key] })))

/** 依目前設定可以出的題目 */
const pool = computed(() => byMode(base.value, mode.value))

/** 範圍 chip 上的題數：換成那個範圍、其他設定不變時可以出幾題 */
const scopeCounts = computed(() => {
  const count = (slugs: string[]) => byMode(questionsOf(new Set(slugs)), mode.value).length
  return {
    discussed: count(presetSlugs.value.discussed),
    recent: count(presetSlugs.value.recent),
    custom: count(customSlugs.value),
  }
})

// ---- 一輪複習 ----
const deck = ref<ReviewQuestion[]>([])
/** 第幾輪：重新抽題時第 1 題也要換一張卡（過場用的 key） */
const round = ref(0)
const index = ref(0)
const picks = ref<Record<number, number>>({})
const running = computed(() => deck.value.length > 0)
const finished = computed(() => running.value && index.value >= deck.value.length)
const current = computed(() => deck.value[index.value])
const score = computed(() => deck.value.filter((q, i) => picks.value[i] === q.item.a).length)
const answeredCount = computed(() => Object.keys(picks.value).length)

const start = (list = pool.value) => {
  commit()
  const drawn = shuffled(list)
  deck.value = (size.value ? drawn.slice(0, size.value) : drawn)
    .map(q => q.kind === 'concept' ? withConceptOptions(q, concepts.value) : q)
  round.value++
  index.value = 0
  picks.value = {}
  revealed.value = {}
  committed.value = new Set()
  sure.value = true
  noteOpen.value = false
}

const retryWrong = () => start(deck.value.filter((q, i) => picks.value[i] !== q.item.a).map(q => ({ ...q })))

const quit = () => {
  commit()
  deck.value = []
}

/** 先回想模式下，這一題的選項打開了沒 */
const revealed = ref<Record<number, boolean>>({})
const optionsShown = computed(() => !recallFirst.value || !!revealed.value[index.value] || picks.value[index.value] !== undefined)

/** 答對時的信心：有把握（預設）或猜的。離開這一題時才寫進作答紀錄 */
const sure = ref(true)
const committed = ref(new Set<number>())

/** 把目前這一題的結果寫進作答紀錄（間隔重複）；沒作答或已寫過就略過 */
const commit = () => {
  const q = current.value
  const p = picks.value[index.value]
  if (!q || p === undefined || committed.value.has(index.value)) return
  record(q.key, p === q.item.a, sure.value)
  committed.value = new Set(committed.value).add(index.value)
}

const pick = (option: number) => {
  if (!current.value || picks.value[index.value] !== undefined) return
  picks.value = { ...picks.value, [index.value]: option }
  sure.value = true
}

const next = () => {
  commit()
  index.value++
  sure.value = true
  noteOpen.value = false
}

/** 精熟門檻：一輪答對率低於 80% 時建議再練（精熟學習） */
const mastered = computed(() => deck.value.length > 0 && score.value / deck.value.length >= 0.8)

/** 做過、明天到期的題數（不含沒做過的），結果頁用來提醒明天回來 */
const dueTomorrow = computed(() => {
  const tomorrow = addDays(today.value, 1)
  return base.value.filter(q => (log.value?.[q.key]?.due ?? '9999') <= tomorrow).length
})

/**
 * 換題時題目卡整張換掉（slide-next），按的「下一題」也跟著消失、焦點會掉到 <body>。
 * 新題目出現後把焦點放在題目卡上（tabindex="-1"），鍵盤和螢幕閱讀器從新題目開始
 */
const card = useTemplateRef<HTMLElement>('card')
const onCardEntered = () => focusIfLost(card.value)

/** 開始、結果這種整塊換掉的畫面：焦點掉了就交給新畫面裡標了 tabindex="-1" 的地方 */
const onStageEntered = (el: Element) => focusIfLost(el.querySelector<HTMLElement>('[tabindex="-1"]'))

/** 先回想模式按了「看選項」：按鈕消失，焦點交給第一個選項 */
const onOptionsEntered = (el: Element) => focusIfLost(el.querySelector<HTMLElement>('button:not(:disabled)'))

// 掛載前 localStorage 還沒讀（useSalonStorage 的 initOnMounted）：出題方式、範圍的題數都還不對，設定欄先放骨架
const storageReady = useStorageReady()

const isCorrect = computed(() => current.value !== undefined && picks.value[index.value] === current.value.item.a)

/** 下一次到期日的文字，例如「明天」「4 天後」 */
const nextDueLabel = computed(() => {
  if (!current.value || picks.value[index.value] === undefined) return ''
  const box = nextBox(log.value?.[current.value.key]?.box ?? 0, isCorrect.value, sure.value)
  const days = REVIEW_INTERVALS[box]!
  return days === 1 ? '明天' : `${days} 天後`
})

// ---- 筆記 ----
const noteOpen = ref(false)
const note = computed({
  get: () => current.value ? getNote(current.value.key) : '',
  set: (text: string) => { if (current.value) setNote(current.value.key, text, reviewNoteQuestion(current.value, concepts.value)) },
})
const showNote = computed(() => noteOpen.value || !!note.value)

/** 題目上方的出處：「10/4 靈魂・講座 5」或「概念卡」 */
const sourceOf = (q: ReviewQuestion) =>
  q.kind === 'concept'
    ? '概念卡'
    : `${q.session.chip}・${q.item.scope === 'all' ? '整合回顧' : lecOf(q.session, q.item.scope)}`
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto max-w-[1240px] px-4 pt-7 pb-16">
      <header class="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">複習</h1>
        <p class="text-body text-muted">
          從討論過的場次出選擇題：場次的測驗題，和概念卡的定義題。每題都可以寫筆記，筆記會收進「筆記」頁。
        </p>
      </header>

      <FilterLayout aside-label="複習設定" main-class="gap-4">
        <template #aside>
          <!-- 掛載前：題數還沒套上作答紀錄和存的範圍，先放骨架（同樣的組數和 chip 數），不顯示錯的數字 -->
          <div v-if="!storageReady" class="flex flex-col gap-5" aria-busy="true">
            <span class="sr-only">載入中…</span>
            <div v-for="(n, g) in [3, 3, 2, 3]" :key="g" class="flex flex-col gap-1.5" aria-hidden="true">
              <USkeleton class="my-1 h-3.5 w-16" />
              <div class="flex flex-wrap gap-1.5">
                <USkeleton v-for="i in n" :key="i" class="h-6 w-20 rounded-full" />
              </div>
            </div>
            <USkeleton class="h-5 w-36" aria-hidden="true" />
            <div class="flex flex-col gap-2 border-t border-default pt-3" aria-hidden="true">
              <USkeleton class="my-1 h-3.5 w-20" />
              <USkeleton class="h-8 w-full rounded-control" />
            </div>
          </div>
          <Transition name="fade">
            <div v-if="storageReady" class="flex flex-col gap-5">
              <FilterChips v-model="mode" label="出題方式" :options="modeOptions" />
              <FilterScopePicker v-model:mode="scopeMode" v-model:slugs="customSlugs" :sessions="scopeSessions" :counts="scopeCounts" />
              <FilterChips v-model="kinds" label="題型" :options="KIND_OPTIONS" multiple />
              <FilterChips v-model="size" label="題數" :options="SIZE_OPTIONS" />

              <USwitch v-model="recallFirst" label="先回想再看選項" :ui="{ label: 'text-ui text-muted' }" />

              <div class="flex flex-col gap-2 border-t border-default pt-3">
                <span class="text-ui text-muted" aria-live="polite">可以出 {{ pool.length }} 題</span>
                <UButton
                  :label="running && !finished ? '重新抽題' : '開始複習'"
                  icon="i-lucide-play"
                  color="primary"
                  variant="outline"
                  class="justify-center rounded-control px-3 text-ui font-medium"
                  :disabled="!pool.length"
                  @click="start()"
                />
              </div>
            </div>
          </Transition>
        </template>

        <!-- 三個畫面（還沒開始／做題／結果）整塊換：淡出後淡入上浮（rise）；做題時換題是 slide-next -->
        <Transition name="rise" mode="out-in" @after-enter="onStageEntered">
          <!-- 還沒開始 -->
          <div v-if="!running" key="intro" class="flex flex-col gap-3 rounded-card border border-dashed border-default p-6 text-small leading-relaxed text-muted">
            <p>按左邊的「開始複習」。預設只出今天該複習的題目：沒做過的，和到了複習日期的。題目跨場次、跨題型混在一起隨機抽。</p>
            <p>每題答完會依你的表現排下次複習的日期：有把握答對，間隔拉長（1、2、4、7、15、30 天）；猜對的間隔不變；答錯就明天再來。作答紀錄和筆記只存在這個瀏覽器。</p>
            <WhyNote>間隔重複：快要忘記時再提取一次，記得最牢；已經熟的題目就不必每次都做。</WhyNote>
          </div>

          <!-- 做題 -->
          <div v-else-if="!finished && current" key="round" class="flex flex-col gap-4">
            <div class="flex items-center gap-3 font-mono text-meta text-muted">
              <span class="text-primary">第 {{ index + 1 }} / {{ deck.length }} 題</span>
              <span>答對 {{ score }} / {{ answeredCount }}</span>
              <UButton label="結束這一輪" color="neutral" variant="link" size="xs" class="ml-auto p-0 font-sans text-ui text-muted" @click="quit" />
            </div>
            <UProgress :model-value="index" :max="deck.length" size="xs" aria-label="複習進度" />

            <!-- 換題：整張題目卡往左滑出、新的從右邊進來。tabindex="-1"：換題後焦點放在新題目上 -->
            <Transition name="slide-next" mode="out-in" @after-enter="onCardEntered">
              <article
                :key="`${round}-${index}`"
                ref="card"
                tabindex="-1"
                :aria-label="`第 ${index + 1} 題`"
                class="flex flex-col gap-4 rounded-card border border-default bg-elevated p-4 focus-visible:outline-none sm:p-5"
              >
                <span class="font-mono text-meta text-muted">{{ sourceOf(current) }}</span>
                <!-- 先回想 → 看選項：提示區淡出、選項淡入上浮 -->
                <Transition name="rise" mode="out-in" @after-enter="onOptionsEntered">
                  <div v-if="!optionsShown" key="recall" class="flex flex-col gap-4">
                    <h3 class="text-body font-bold">{{ index + 1 }}. {{ current.item.q }}</h3>
                    <div class="flex flex-col items-start gap-3 rounded-control border border-dashed border-default p-4">
                      <p class="text-small text-muted">先不看選項，在心裡想好答案（可以寫在下面的筆記），再打開選項。</p>
                      <UButton
                        label="我想好了，看選項"
                        trailing-icon="i-lucide-chevron-down"
                        color="secondary"
                        variant="subtle"
                        class="rounded-control px-3 py-1.5 text-ui font-medium"
                        @click="revealed = { ...revealed, [index]: true }"
                      />
                    </div>
                    <WhyNote>提取練習：先從記憶裡把答案拉出來，比看著選項認答案記得更牢。</WhyNote>
                  </div>
                  <StudyQuizItem
                    v-else
                    key="options"
                    :session="current.session"
                    :item="current.item"
                    :number="index + 1"
                    :pick="picks[index]"
                    hide-source
                    @pick="pick"
                  />
                </Transition>

                <!-- 作答後才出現的：概念卡連結、把握程度、下一題，和解析一起淡入 -->
                <Transition name="rise">
                  <NuxtLink
                    v-if="current.kind === 'concept' && picks[index] !== undefined"
                    :to="`/c/${current.conceptId}`"
                    class="-mt-2 self-start font-mono text-meta text-secondary hover:text-highlighted"
                  >
                    ▸ 看概念卡
                  </NuxtLink>
                </Transition>

                <Transition name="rise">
                  <div v-if="picks[index] !== undefined" class="flex flex-wrap items-center gap-2 text-ui text-muted">
                    <template v-if="isCorrect">
                      <span>這題是：</span>
                      <UButton
                        label="有把握"
                        color="neutral"
                        :variant="sure ? 'solid' : 'outline'"
                        size="xs"
                        :aria-pressed="sure"
                        class="rounded-full px-3"
                        :ui="{ label: 'text-ui font-medium' }"
                        @click="sure = true"
                      />
                      <UButton
                        label="猜的"
                        color="neutral"
                        :variant="!sure ? 'solid' : 'outline'"
                        size="xs"
                        :aria-pressed="!sure"
                        class="rounded-full px-3"
                        :ui="{ label: 'text-ui font-medium' }"
                        @click="sure = false"
                      />
                    </template>
                    <span class="font-mono text-meta" :class="{ 'ml-auto': isCorrect }">下次複習：{{ nextDueLabel }}</span>
                  </div>
                </Transition>

                <div class="flex flex-col gap-2 border-t border-default pt-3">
                  <Transition name="fade" mode="out-in">
                    <UButton
                      v-if="!showNote"
                      key="write"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-pencil-line"
                      label="寫筆記"
                      class="self-start rounded-control px-2.5 py-1.5 text-ui text-muted hover:bg-accented hover:text-highlighted"
                      @click="noteOpen = true"
                    />
                    <div v-else key="note" class="flex flex-col gap-2">
                      <label :for="`review-note-${index}`" class="text-meta font-medium text-muted">我的筆記<span class="font-normal text-dimmed">・會收進「筆記」頁</span></label>
                      <!-- 編輯器的程式第一次下載時先放骨架 -->
                      <Suspense>
                        <LazyMarkdownEditor
                          :id="`review-note-${index}`"
                          :key="`review-note-${index}`"
                          v-model="note"
                          :autofocus="noteOpen && !note"
                          min-height="min-h-24"
                          placeholder="用最簡單的話，向沒看過影片的朋友解釋為什麼是這個答案；卡住的地方就是還不懂的地方"
                        />
                        <template #fallback>
                          <MarkdownEditorSkeleton min-height="min-h-24" />
                        </template>
                      </Suspense>
                    </div>
                  </Transition>
                </div>

                <Transition name="rise">
                  <UButton
                    v-if="picks[index] !== undefined"
                    :label="index + 1 < deck.length ? '下一題' : '看結果'"
                    trailing-icon="i-lucide-arrow-right"
                    color="primary"
                    variant="outline"
                    class="self-end rounded-control px-4 text-ui font-medium"
                    @click="next"
                  />
                </Transition>
              </article>
            </Transition>
          </div>

          <!-- 結果 -->
          <div v-else key="results" class="flex flex-col gap-4">
            <section
              tabindex="-1"
              aria-labelledby="review-result"
              class="flex flex-col gap-3 rounded-card border border-default bg-elevated p-5 focus-visible:outline-none"
            >
              <h2 id="review-result" class="font-serif text-h2 leading-snug font-semibold text-highlighted">
                答對 {{ score }} / {{ deck.length }} 題
              </h2>
              <p class="text-small text-muted">
                <template v-if="score === deck.length">全部答對。</template>
                <template v-else-if="mastered">答對率超過 8 成。下面是答錯的題目，可以點「只練答錯的」補起來。</template>
                <template v-else>答對率還不到 8 成，建議先「只練答錯的」，練到都答對再結束。</template>
                每題下次複習的日期已經排好了，明天到期 {{ dueTomorrow }} 題。
              </p>
              <WhyNote v-if="score < deck.length">連續再學習：答錯的題目在同一次練到答對，之後再隔幾天複習，忘得最慢。</WhyNote>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-if="score < deck.length"
                  label="只練答錯的"
                  icon="i-lucide-rotate-ccw"
                  color="primary"
                  variant="outline"
                  class="rounded-control px-3 text-ui font-medium"
                  @click="retryWrong"
                />
                <UButton
                  label="再抽一輪"
                  icon="i-lucide-play"
                  color="neutral"
                  variant="outline"
                  class="rounded-control px-3 text-ui font-medium"
                  :disabled="!pool.length"
                  @click="start()"
                />
              </div>
            </section>

            <ul v-if="score < deck.length" class="grid gap-3 sm:grid-cols-2">
              <template v-for="(q, i) in deck" :key="q.key">
                <li v-if="picks[i] !== q.item.a" class="flex flex-col gap-2 rounded-card border border-default bg-elevated p-4">
                  <span class="font-mono text-meta text-muted">{{ sourceOf(q) }}</span>
                  <p class="text-body-sm font-medium text-highlighted">{{ q.item.q }}</p>
                  <p class="text-small text-toned">正解：{{ q.item.o[q.item.a] }}</p>
                </li>
              </template>
            </ul>
          </div>
        </Transition>
      </FilterLayout>
    </main>
  </div>
</template>
