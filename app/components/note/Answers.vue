<script setup lang="ts">
// /notes 的「作答紀錄」：每一場測驗題在邊看邊想、看完回想、複習的作答收在一起（useQuizRecords），複習時不用回到場次頁。
// 版面和筆記一樣：左邊篩選欄（結果、場次），右邊依場次、再依講座分組的卡片；點卡片打開視窗。
// 為了記得住，視窗先只給題目和選項（提取練習），自己想過再按「看答案與解析」；下面可以直接寫筆記，
// 和 /review 同一則（salon-review-notes 的 q:{slug}:{雜湊}），會出現在「複習筆記」。規格見 SPEC.md「筆記」。
import type { FilterSummaryItem } from '~/components/filter/Summary.vue'
import type { StudySession as Session } from '~/types/content'
import type { QuizRecord } from '~/composables/useQuizRecords'

const props = defineProps<{ sessions: Session[] }>()

const { records } = useQuizRecords(toRef(props, 'sessions'))
const { getNote, setNote } = useReviewNotes()

type Result = 'all' | 'missed' | 'right'
const result = ref<Result>('all')
const place = ref<string | null>(null)

const resultOptions = computed(() => {
  const missed = records.value.filter(r => r.missed).length
  return [
    { value: 'all' as const, label: '全部', count: records.value.length },
    { value: 'missed' as const, label: '答錯過', count: missed },
    { value: 'right' as const, label: '都答對', count: records.value.length - missed },
  ]
})

const visible = computed(() => records.value.filter(r =>
  (result.value === 'all' || (result.value === 'missed') === r.missed)
  && (!place.value || r.session.slug === place.value),
))

const placeOptions = computed(() => {
  const used = new Set(records.value.map(r => r.session.slug))
  return props.sessions.filter(s => used.has(s.slug)).map(s => ({ value: s.slug, label: s.chip }))
})

const hasFilter = computed(() => result.value !== 'all' || !!place.value)

/** 篩選欄最上面的「已選」 */
const summary = computed<FilterSummaryItem[]>(() => [
  ...(result.value !== 'all' ? [{ key: 'result', label: resultOptions.value.find(o => o.value === result.value)?.label ?? '', remove: () => { result.value = 'all' } }] : []),
  ...(place.value ? [{ key: 'place', label: placeOptions.value.find(o => o.value === place.value)?.label ?? '', remove: () => { place.value = null } }] : []),
])
const clearFilters = () => {
  result.value = 'all'
  place.value = null
}

/** 依場次（新的在前）→ 講座（影片順序，整合回顧最後）分組，組內照題目順序 */
const groups = computed(() => props.sessions.flatMap((s) => {
  const mine = visible.value.filter(r => r.session.slug === s.slug)
  if (!mine.length) return []
  const scopes = [...s.videos.map(v => v.id), 'all']
  const parts = scopes
    .map(scope => ({ scope, items: mine.filter(r => r.item.scope === scope) }))
    .filter(p => p.items.length)
    .map(p => ({
      ...p,
      label: p.scope === 'all' ? '整合回顧' : lecOf(s, p.scope),
      title: p.scope === 'all' ? '' : s.videos.find(v => v.id === p.scope)?.short ?? '',
    }))
  return [{ session: s, count: mine.length, parts }]
}))

const letter = (j: number) => String.fromCharCode(65 + j)

/** 卡片和視窗裡的作答紀錄：每個地方一筆 */
const attempts = (r: QuizRecord) => {
  const out: { label: string, ok: boolean, text: string }[] = []
  if (r.inline !== undefined) out.push({ label: '邊看邊想', ok: r.inline === r.item.a, text: `選 ${letter(r.inline)}` })
  if (r.recall !== undefined) out.push({ label: '看完回想', ok: r.recall === r.item.a, text: `選 ${letter(r.recall)}` })
  if (r.review) out.push({ label: '複習', ok: r.review.lastCorrect, text: `對 ${r.review.right}・錯 ${r.review.wrong}` })
  return out
}

// ---- 視窗 ----
const openKey = ref<string | null>(null)
const modalOpen = computed({
  get: () => openKey.value !== null,
  set: (v: boolean) => { if (!v) openKey.value = null },
})
const active = computed(() => records.value.find(r => r.key === openKey.value) ?? null)

/** 看過答案沒：每次打開都從「先回想」開始 */
const revealed = ref(false)
watch(openKey, () => { revealed.value = false })
/** 按了「看答案與解析」：按鈕消失，焦點交給解析（tabindex="-1"），不讓它掉出視窗 */
const onRevealed = (el: Element) => {
  if (revealed.value) focusIfLost(el as HTMLElement)
}

const note = computed({
  get: () => active.value ? getNote(active.value.key) : '',
  set: (text: string) => { if (active.value) setNote(active.value.key, text, active.value.item.q) },
})

/** 這個選項是哪些地方選的（看答案後標在選項上） */
const pickedBy = (r: QuizRecord, j: number) => [
  r.inline === j ? '邊看邊想' : '',
  r.recall === j ? '看完回想' : '',
].filter(Boolean)

const optionClass = (r: QuizRecord, j: number) => {
  if (!revealed.value) return 'border-default bg-muted'
  if (j === r.item.a) return 'border-success bg-success-soft'
  if (pickedBy(r, j).length) return 'border-error bg-error-soft'
  return 'border-default bg-muted text-muted'
}
</script>

<template>
  <FilterLayout aside-label="篩選作答紀錄">
    <template #aside>
      <FilterSummary :items="summary" :has-filter="hasFilter" @clear="clearFilters" />
      <FilterChips v-model="result" label="結果" :options="resultOptions" />
      <FilterSelect v-if="placeOptions.length" v-model="place" label="場次" placeholder="全部場次" search-placeholder="搜尋場次…" :options="placeOptions" />
      <FilterStatus :count="visible.length" unit="題" />

      <NuxtLink
        v-if="records.length"
        to="/review"
        class="text-ui text-secondary hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
      >
        到「複習」用間隔重複練習 ›
      </NuxtLink>
    </template>

    <p v-if="!records.length" class="rounded-card border border-dashed border-default p-6 text-center text-small leading-relaxed text-muted">
      還沒有作答紀錄。在場次的「邊看邊想」「看完回想」或「複習」答過的測驗題會出現在這裡。
    </p>
    <p v-else-if="!groups.length" class="text-small text-muted">沒有符合的題目。</p>

    <section v-for="g in groups" :key="g.session.slug" class="flex flex-col gap-4">
      <SessionGroupHeading :session="g.session" :count="g.count" unit="題" />

      <div v-for="p in g.parts" :key="p.scope" class="flex flex-col gap-2.5">
        <h3 class="flex items-baseline gap-2">
          <span class="font-mono text-meta text-primary">{{ p.label }}</span>
          <span v-if="p.title" class="text-small text-muted">{{ p.title }}</span>
        </h3>
        <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <li v-for="r in p.items" :key="r.key">
            <button
              type="button"
              class="flex h-full w-full flex-col gap-2 rounded-card border border-default bg-elevated p-4 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              @click="openKey = r.key"
            >
              <!-- 講座已經是分組標題，卡片上不重複 -->
              <div class="flex w-full items-center gap-2 font-mono text-meta">
                <UBadge
                  :label="r.missed ? '答錯過' : '答對'"
                  :color="r.missed ? 'error' : 'success'"
                  variant="outline"
                  class="ml-auto rounded-tag px-1.5 py-0 font-sans text-label font-medium"
                />
              </div>
              <span class="line-clamp-3 font-serif text-title leading-snug font-semibold text-pretty text-highlighted">{{ r.item.q }}</span>
              <span class="mt-auto flex flex-wrap gap-x-3 gap-y-0.5 text-meta text-muted">
                <span v-for="a in attempts(r)" :key="a.label">
                  {{ a.label }}
                  <UIcon :name="a.ok ? 'i-lucide-check' : 'i-lucide-x'" class="size-3 align-[-1px]" :class="a.ok ? 'text-success' : 'text-error'" />
                </span>
                <span v-if="getNote(r.key)" class="inline-flex items-center gap-0.5"><UIcon name="i-lucide-notebook-pen" class="size-3" />有筆記</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </section>
  </FilterLayout>

  <!-- 視窗：先回想（只有題目和選項）→ 看答案與解析 → 寫筆記。外殼同筆記的編輯視窗（<NoteSheet>） -->
  <NoteSheet
    v-model:open="modalOpen"
    title="作答紀錄"
    :badge="active ? { label: active.missed ? '答錯過' : '答對', color: active.missed ? 'error' : 'success' } : null"
    :hint="revealed ? '對照一下哪裡想錯了' : '先自己想答案，再看解析'"
    props-align="start"
  >
    <template v-if="active" #title>
      <h2 class="font-serif text-title leading-snug font-black text-highlighted">{{ active.item.q }}</h2>
    </template>

    <template v-if="active" #props>
      <NoteSheetProp icon="i-lucide-calendar-days" label="場次" class="text-default">{{ active.session.chip }}・{{ active.lec }}</NoteSheetProp>
      <NoteSheetProp icon="i-lucide-history" label="紀錄" class="flex flex-wrap gap-x-3 gap-y-0.5 text-default">
        <span v-for="a in attempts(active)" :key="a.label">
          {{ a.label }}
          <UIcon :name="a.ok ? 'i-lucide-check' : 'i-lucide-x'" class="size-3.5 align-[-2px]" :class="a.ok ? 'text-success' : 'text-error'" />
          <span v-if="revealed || a.label === '複習'" class="text-muted">{{ a.text }}</span>
        </span>
      </NoteSheetProp>
      <NoteSheetProp icon="i-lucide-link" label="連結">
        <NuxtLink
          :to="`/s/${active.session.slug}#during`"
          class="text-secondary hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
          @click="openKey = null"
        >
          回到這一場的「邊看邊想」 ›
        </NuxtLink>
      </NoteSheetProp>
    </template>

    <template v-if="active">
      <ol class="flex flex-col gap-1.5">
        <li
          v-for="(o, j) in active.item.o"
          :key="j"
          class="flex gap-2 rounded-control border px-3 py-2 text-body-sm leading-relaxed text-default"
          :class="optionClass(active, j)"
        >
          <span class="font-mono text-meta leading-relaxed text-muted">{{ letter(j) }}</span>
          <span class="flex-1">
            {{ o }}
            <span v-if="revealed && pickedBy(active, j).length" class="ms-1 text-meta text-muted">← {{ pickedBy(active, j).join('、') }}選的</span>
          </span>
        </li>
      </ol>

      <!-- 揭曉：按鈕淡出、解析淡入上浮；按鈕消失後焦點交給解析 -->
      <Transition name="rise" mode="out-in" @after-enter="onRevealed">
        <UButton
          v-if="!revealed"
          color="secondary"
          variant="subtle"
          trailing-icon="i-lucide-chevron-down"
          label="我想好了，看答案與解析"
          class="self-start rounded-control px-3 py-1.5 text-ui font-medium hover:bg-secondary/25 hover:ring-secondary"
          @click="revealed = true"
        />
        <div v-else tabindex="-1" class="flex flex-col gap-1 text-small leading-relaxed text-toned focus-visible:outline-none" aria-live="polite">
          <p><b class="text-success">答案是 {{ letter(active.item.a) }}。</b>{{ active.item.e }}</p>
          <ul class="flex flex-wrap gap-x-4 gap-y-1">
            <li v-for="(ref, k) in active.item.refs" :key="k">
              <VideoLink :vid="ref[0]" :t="ref[1]" class="font-mono text-meta">▸ {{ refLabel(active.session, ref) }}</VideoLink>
            </li>
          </ul>
        </div>
      </Transition>

      <NoteField
        :key="active.key"
        v-model="note"
        label="我的筆記"
        hint="支援 Markdown，會收進「複習筆記」"
        placeholder="用自己的話寫下為什麼是這個答案；寫不出來的地方，就是還沒弄懂的地方"
      />
    </template>
  </NoteSheet>
</template>
