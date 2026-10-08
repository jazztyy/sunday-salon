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

useSeoMeta({ title: '複習・悅讀聊天室' })

const { data: sessions } = await useAllSessions()
const { data: concepts } = await useAllConcepts()

const { getNote, setNote } = useReviewNotes()
const { log, isDue, record } = useReviewLog()

// 「討論過」= 活動日期在今天（台灣時間）或之前
const today = useState('home:today', () => taipeiToday())
const discussed = computed(() => sessions.value.filter(s => s.date <= today.value))

/** 範圍：選取的場次 slug；掛載後預設是討論過的場次（還沒有就選本週那一場） */
const scope = ref<string[]>([])
onMounted(() => {
  today.value = taipeiToday()
  const base = discussed.value.length ? discussed.value : [pickCurrentSession(sessions.value, today.value)].filter(s => !!s)
  scope.value = base.map(s => s.slug)
})

const toggleScope = (slug: string) => {
  scope.value = scope.value.includes(slug) ? scope.value.filter(x => x !== slug) : [...scope.value, slug]
}

type Kind = 'quiz' | 'concept'
const kinds = ref<Kind[]>(['quiz', 'concept'])
const toggleKind = (k: Kind) => {
  kinds.value = kinds.value.includes(k) ? kinds.value.filter(x => x !== k) : [...kinds.value, k]
}

const SIZES = [10, 20, 0] as const // 0 = 全部
const size = ref<number>(10)

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

/** 範圍和題型篩完、還沒套出題方式的題目 */
const base = computed(() => {
  const picked = sessions.value.filter(s => scope.value.includes(s.slug))
  return buildReviewQuestions(picked, concepts.value).filter(q => kinds.value.includes(q.kind))
})

const modeCounts = computed(() => ({
  due: base.value.filter(q => isDue(q.key, today.value)).length,
  wrong: base.value.filter(q => log.value?.[q.key]?.lastCorrect === false).length,
  all: base.value.length,
}))

/** 依目前設定可以出的題目 */
const pool = computed(() => base.value.filter(q =>
  mode.value === 'all'
  || (mode.value === 'due' && isDue(q.key, today.value))
  || (mode.value === 'wrong' && log.value?.[q.key]?.lastCorrect === false),
))

// ---- 一輪複習 ----
const deck = ref<ReviewQuestion[]>([])
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

const isCorrect = computed(() => current.value !== undefined && picks.value[index.value] === current.value.item.a)

/** 下一次到期日的文字，例如「明天」「4 天後」 */
const nextDueLabel = computed(() => {
  if (!current.value || picks.value[index.value] === undefined) return ''
  const prevBox = log.value?.[current.value.key]?.box ?? 0
  const box = !isCorrect.value ? 0 : sure.value ? Math.min(prevBox + 1, REVIEW_INTERVALS.length - 1) : prevBox
  const days = REVIEW_INTERVALS[box]!
  return days === 1 ? '明天' : `${days} 天後`
})

// ---- 筆記 ----
const noteOpen = ref(false)
const note = computed({
  get: () => current.value ? getNote(current.value.key) : '',
  set: (text: string) => { if (current.value) setNote(current.value.key, text) },
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

      <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <!-- 設定欄：桌機固定在左邊（同 /archive） -->
        <aside
          aria-label="複習設定"
          class="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--tb,64px)+1.5rem)] lg:max-h-[calc(100vh-var(--tb,64px)-3rem)] lg:overflow-y-auto lg:pr-1"
        >
          <div class="flex flex-col gap-1.5">
            <span id="facet-mode" class="text-ui text-muted">出題方式</span>
            <div role="group" aria-labelledby="facet-mode" class="flex flex-wrap gap-1.5">
              <UButton
                v-for="m in MODES"
                :key="m.key"
                :label="`${m.label} ${modeCounts[m.key]}`"
                color="neutral"
                :variant="mode === m.key ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="mode === m.key"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="mode = m.key"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <span id="facet-scope" class="text-ui text-muted">範圍</span>
            <div role="group" aria-labelledby="facet-scope" class="flex flex-wrap gap-1.5">
              <UButton
                v-for="s in sessions"
                :key="s.slug"
                :label="s.chip"
                color="neutral"
                :variant="scope.includes(s.slug) ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="scope.includes(s.slug)"
                class="rounded-full px-3"
                :class="{ 'opacity-70': !discussed.includes(s) && !scope.includes(s.slug) }"
                :ui="{ label: 'text-ui font-medium' }"
                @click="toggleScope(s.slug)"
              />
            </div>
            <p class="text-meta text-dimmed">預設是已經討論過的場次</p>
          </div>

          <div class="flex flex-col gap-1.5">
            <span id="facet-kind" class="text-ui text-muted">題型</span>
            <div role="group" aria-labelledby="facet-kind" class="flex flex-wrap gap-1.5">
              <UButton
                v-for="k in ([['quiz', '測驗題'], ['concept', '概念卡']] as const)"
                :key="k[0]"
                :label="k[1]"
                color="neutral"
                :variant="kinds.includes(k[0]) ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="kinds.includes(k[0])"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="toggleKind(k[0])"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <span id="facet-size" class="text-ui text-muted">題數</span>
            <div role="group" aria-labelledby="facet-size" class="flex flex-wrap gap-1.5">
              <UButton
                v-for="n in SIZES"
                :key="n"
                :label="n ? `${n} 題` : '全部'"
                color="neutral"
                :variant="size === n ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="size === n"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="size = n"
              />
            </div>
          </div>

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
        </aside>

        <div class="flex min-w-0 flex-col gap-4">
          <!-- 還沒開始 -->
          <div v-if="!running" class="flex flex-col gap-3 rounded-card border border-dashed border-default p-6 text-small leading-relaxed text-muted">
            <p>按左邊的「開始複習」。預設只出今天該複習的題目：沒做過的，和到了複習日期的。題目跨場次、跨題型混在一起隨機抽。</p>
            <p>每題答完會依你的表現排下次複習的日期：有把握答對，間隔拉長（1、2、4、7、15、30 天）；猜對的間隔不變；答錯就明天再來。作答紀錄和筆記只存在這個瀏覽器。</p>
            <WhyNote>間隔重複：快要忘記時再提取一次，記得最牢；已經熟的題目就不必每次都做。</WhyNote>
          </div>

          <!-- 做題 -->
          <template v-else-if="!finished && current">
            <div class="flex items-center gap-3 font-mono text-meta text-muted">
              <span class="text-primary">第 {{ index + 1 }} / {{ deck.length }} 題</span>
              <span>答對 {{ score }} / {{ answeredCount }}</span>
              <UButton label="結束這一輪" color="neutral" variant="link" size="xs" class="ml-auto p-0 font-sans text-ui text-muted" @click="quit" />
            </div>
            <UProgress :model-value="index" :max="deck.length" size="xs" aria-label="複習進度" />

            <article :key="index" class="flex flex-col gap-4 rounded-card border border-default bg-elevated p-4 sm:p-5">
              <span class="font-mono text-meta text-muted">{{ sourceOf(current) }}</span>
              <template v-if="!optionsShown">
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
              </template>
              <StudyQuizItem
                v-else
                :session="current.session"
                :item="current.item"
                :number="index + 1"
                :pick="picks[index]"
                hide-source
                @pick="pick"
              />
              <NuxtLink
                v-if="current.kind === 'concept' && picks[index] !== undefined"
                :to="`/c/${current.conceptId}`"
                class="-mt-2 self-start font-mono text-meta text-secondary hover:text-highlighted"
              >
                ▸ 看概念卡
              </NuxtLink>

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

              <div class="flex flex-col gap-2 border-t border-default pt-3">
                <UButton
                  v-if="!showNote"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil-line"
                  label="寫筆記"
                  class="self-start rounded-control px-2.5 py-1.5 text-ui text-muted hover:bg-accented hover:text-highlighted"
                  @click="noteOpen = true"
                />
                <template v-else>
                  <label :for="`review-note-${index}`" class="text-meta font-medium text-muted">我的筆記<span class="font-normal text-dimmed">・會收進「筆記」頁</span></label>
                  <MarkdownEditor
                    :id="`review-note-${index}`"
                    :key="`review-note-${index}`"
                    v-model="note"
                    :autofocus="noteOpen && !note"
                    min-height="min-h-24"
                    placeholder="用最簡單的話，向沒看過影片的朋友解釋為什麼是這個答案；卡住的地方就是還不懂的地方"
                  />
                </template>
              </div>

              <UButton
                v-if="picks[index] !== undefined"
                :label="index + 1 < deck.length ? '下一題' : '看結果'"
                trailing-icon="i-lucide-arrow-right"
                color="primary"
                variant="outline"
                class="self-end rounded-control px-4 text-ui font-medium"
                @click="next"
              />
            </article>
          </template>

          <!-- 結果 -->
          <template v-else>
            <section class="flex flex-col gap-3 rounded-card border border-default bg-elevated p-5">
              <h2 class="font-serif text-h2 leading-snug font-semibold text-highlighted">
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
          </template>
        </div>
      </div>
    </main>
  </div>
</template>
