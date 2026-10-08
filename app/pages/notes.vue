<script setup lang="ts">
// /notes 筆記：把各場討論題的「我的想法」（salon-notes-{slug}）、複習時寫的筆記（salon-review-notes）
// 和自己新增的筆記（salon-mynotes）集中在一起。
// 依場次分組，新的在前；不屬於任何場次的「我的筆記」放在最後。可以模糊搜尋（Fuse.js）、切換只看某一種。
// 版面和 /archive 一致：左邊固定的篩選欄（新增、搜尋、種類、場次），右邊依場次分組的 <NoteCard> 網格；點卡片打開編輯視窗。
// 題目文字改掉後對不到新題目的筆記，另外列成「題目已修改」，不會默默消失。
// 各種筆記的資料整理在 useNoteEntries，種類的名稱和顏色在 utils/noteKinds.ts；這裡只管篩選、版面和視窗。
// 上方切換「筆記」和「作答紀錄」（<NoteAnswers>：每一場測驗題的作答，複習用）。
// 全部存在這個瀏覽器（掛載後才讀）：預先產生的 HTML 和掛載前放骨架（useStorageReady），不先閃「還沒有筆記」。規格見 SPEC.md「筆記」。
import Fuse from 'fuse.js'
import type { StudySession as Session } from '~/types/content'
import type { NoteEntry } from '~/composables/useNoteEntries'
import { NOTE_KINDS, type NoteKind } from '~/utils/noteKinds'
import type { FilterSummaryItem } from '~/components/filter/Summary.vue'
import type { NoteExportFormat } from '~/utils/noteExport'

useSeoMeta({ title: '筆記・悅讀聊天室' })

const { data: sessions } = await useStudySessions()
const { data: concepts } = await useConceptIndex()

/** 上方的檢視切換。不寫進網址（同篩選，筆記是私人的） */
const view = ref<'notes' | 'answers'>('notes')
const VIEWS = [
  { label: '筆記', value: 'notes', icon: 'i-lucide-notebook-pen' },
  { label: '作答紀錄', value: 'answers', icon: 'i-lucide-list-checks' },
]

type Kind = 'all' | NoteKind
const kind = ref<Kind>('all')
/** 場次篩選：null = 全部，'none' = 不屬於任何場次，其他是 slug */
const place = ref<string | null>(null)
const query = ref('')

/** 編輯視窗打開的筆記 key（見 NoteEntry.key）。編輯中就算清空也先留在畫面上 */
const editing = ref<string | null>(null)
const modalOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => { if (!v) editing.value = null },
})

const { entries, filled, addMine, updateMine } = useNoteEntries(sessions, concepts, editing)

/** localStorage 讀好了沒；還沒讀好時放骨架 */
const storageReady = useStorageReady()

const active = computed(() => entries.value.find(e => e.key === editing.value) ?? null)

/** 搜尋索引：題目、筆記內容、標題。只收有內容的筆記，打開、關閉視窗不用重建。ignoreLocation：中文關鍵字常在句子中間 */
const fuse = computed(() => new Fuse(
  filled.value.map(e => ({ key: e.key, title: e.search.title, question: e.search.question, text: e.body })),
  {
    keys: [{ name: 'title', weight: 2 }, { name: 'text', weight: 2 }, { name: 'question', weight: 1 }],
    threshold: 0.35,
    ignoreLocation: true,
  },
))

const matched = computed(() => {
  const q = query.value.trim()
  return q ? new Set(fuse.value.search(q).map(r => r.item.key)) : null
})

const knownSlugs = computed(() => new Set(sessions.value.map(s => s.slug)))
const placeOf = (e: NoteEntry) => e.slug && knownSlugs.value.has(e.slug) ? e.slug : 'none'

const visible = computed(() =>
  entries.value.filter(e =>
    (kind.value === 'all' || e.kind === kind.value)
    && (!place.value || placeOf(e) === place.value || editing.value === e.key)
    && (!matched.value || matched.value.has(e.key) || editing.value === e.key),
  ),
)

/** 每種、每場各有幾則（不受篩選影響） */
const tally = computed(() => {
  const byKind = new Map<NoteKind, number>()
  const byPlace = new Set<string>()
  for (const e of entries.value) {
    byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1)
    byPlace.add(placeOf(e))
  }
  return { byKind, byPlace }
})

/** 種類篩選：附數量；平常沒有的種類（題目已修改）有的時候才出現，排在最後 */
const kindOptions = computed(() => {
  const all = Object.entries(NOTE_KINDS) as [NoteKind, typeof NOTE_KINDS[NoteKind]][]
  const shown = all.filter(([k, info]) => !info.hiddenWhenEmpty || tally.value.byKind.get(k) || kind.value === k)
  return [
    { value: 'all' as Kind, label: '全部', count: entries.value.length },
    ...[...shown.filter(([, i]) => !i.hiddenWhenEmpty), ...shown.filter(([, i]) => i.hiddenWhenEmpty)]
      .map(([k, info]) => ({ value: k as Kind, label: info.label, count: tally.value.byKind.get(k) ?? 0 })),
  ]
})

/** 場次篩選的選項：有筆記的場次（新的在前），有不屬於任何場次的筆記時加上「其他」 */
const placeOptions = computed(() => {
  const used = tally.value.byPlace
  const out = sessions.value.filter(s => used.has(s.slug)).map(s => ({ value: s.slug, label: s.chip }))
  if (used.has('none')) out.push({ value: 'none', label: '其他' })
  return out
})

// 選的場次已經沒有筆記時，回到全部
watch(placeOptions, (list) => {
  if (place.value && !list.some(o => o.value === place.value)) place.value = null
})

const hasFilter = computed(() => !!(query.value.trim() || kind.value !== 'all' || place.value))
/** 篩選欄最上面的「已選」 */
const summary = computed<FilterSummaryItem[]>(() => [
  ...(kind.value !== 'all' ? [{ key: 'kind', label: kindOptions.value.find(o => o.value === kind.value)?.label ?? '', remove: () => { kind.value = 'all' } }] : []),
  ...(place.value ? [{ key: 'place', label: placeOptions.value.find(o => o.value === place.value)?.label ?? '', remove: () => { place.value = null } }] : []),
])

const clearFilters = () => {
  query.value = ''
  kind.value = 'all'
  place.value = null
}

/** 依場次分組（新的在前），不屬於任何場次的放最後 */
const groups = computed(() => {
  const bySlug = new Map<string, NoteEntry[]>()
  for (const e of visible.value) {
    const k = placeOf(e)
    const list = bySlug.get(k)
    if (list) list.push(e)
    else bySlug.set(k, [e])
  }
  const out: { key: string, session: Session | null, entries: NoteEntry[] }[] = []
  for (const s of sessions.value) {
    const list = bySlug.get(s.slug)
    if (list) out.push({ key: s.slug, session: s, entries: list })
  }
  const loose = bySlug.get('none')
  if (loose) out.push({ key: 'none', session: null, entries: loose })
  return out
})

// 新增筆記預設屬於本週那一場（和首頁同一套判斷）
const today = useToday()

const newNote = () => {
  const note = addMine(pickCurrentSession(sessions.value, today.value)?.slug ?? null)
  clearFilters()
  editing.value = `m:${note.id}`
}

const { confirm } = useConfirm()

/** 刪除前確認。我的筆記整則刪除；討論、複習、概念筆記清空內容（題目和概念卡本身不受影響，之後還可以在原處重寫） */
const removeEntry = async (e: NoteEntry) => {
  const ok = await confirm({ ...e.confirmRemove, confirmLabel: '刪除' })
  if (!ok) return
  if (editing.value === e.key) editing.value = null
  e.remove()
}

const sessionOptions = computed(() => [
  { label: '不屬於任何場次', value: 'none' },
  ...sessions.value.map(s => ({ label: `${s.chip}・${s.title}`, value: s.slug })),
])

// ---- 匯出：目前篩選出來的筆記（沒篩選就是全部），依場次分組，下載成 .md 或 .txt ----
const download = (format: NoteExportFormat) => {
  const text = buildNoteExport(format, groups.value.map(g => ({
    title: g.session ? `${g.session.chip}・${g.session.title}` : '其他筆記',
    items: g.entries.map(e => ({ label: e.exportLabel, head: e.title || '未命名筆記', quote: e.quote, body: e.body })),
  })), taipeiToday())
  downloadText(`悅讀聊天室筆記-${taipeiToday()}.${format}`, text, format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8')
}
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto max-w-[1240px] px-4 pt-7 pb-16">
      <header class="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">筆記</h1>
        <p class="text-body text-muted">
          各場討論題的「我的想法」、複習和概念卡上寫的筆記會自動收在這裡，也可以自己新增筆記；「作答紀錄」收著每一場測驗題你答過的結果。全部只存在這個瀏覽器。
        </p>
      </header>

      <UTabs
        v-model="view"
        :items="VIEWS"
        :content="false"
        variant="pill"
        color="neutral"
        size="sm"
        class="mb-6 w-fit"
        :ui="{ label: 'text-ui' }"
      />

      <!--
        掛載前（localStorage 還沒讀）：同樣版面的骨架，不顯示「還沒有筆記」。
        骨架直接拿掉（不淡出），真的內容淡入；站內換頁時已經讀好，不會出現骨架
      -->
      <FilterLayout v-if="!storageReady" aria-busy="true">
        <template #top>
          <span class="sr-only">載入中…</span>
          <USkeleton class="h-8 w-full rounded-control" aria-hidden="true" />
          <USkeleton class="h-8 w-full rounded-control" aria-hidden="true" />
        </template>

        <template #aside>
          <div class="flex flex-col gap-1.5" aria-hidden="true">
            <USkeleton class="my-1 h-3.5 w-10" />
            <div class="flex flex-wrap gap-1.5">
              <USkeleton v-for="i in 5" :key="i" class="h-6 w-16 rounded-full" />
            </div>
          </div>
        </template>

        <div class="flex flex-col gap-3" aria-hidden="true">
          <div class="flex flex-col gap-2 py-1">
            <USkeleton class="h-7 w-28" />
            <USkeleton class="h-4 w-56" />
          </div>
          <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <li v-for="i in 3" :key="i" class="flex h-36 flex-col gap-3 rounded-card border border-default bg-elevated p-4">
              <div class="flex items-center justify-between">
                <USkeleton class="h-3 w-20 bg-accented" />
                <USkeleton class="h-4 w-14 bg-accented" />
              </div>
              <USkeleton class="h-5 w-4/5 bg-accented" />
              <USkeleton class="h-3.5 w-full bg-accented" />
              <USkeleton class="h-3.5 w-3/5 bg-accented" />
            </li>
          </ul>
        </div>
      </FilterLayout>

      <Transition name="rise" mode="out-in">
        <!-- 切換檢視：淡出後淡入上浮（rise）。<NoteAnswers> 有兩個根節點（版面＋視窗），包一層 div 才能套過場 -->
        <div v-if="storageReady && view === 'answers'" key="answers">
          <NoteAnswers :sessions="sessions" />
        </div>

        <!--
          篩選欄：桌機固定在左邊，往下捲也看得到（同 /archive）。
          手機：新增筆記、搜尋、「已選」一直在上面，種類、場次和匯出收在「篩選（N）」裡
        -->
        <FilterLayout v-else-if="storageReady" key="notes" :active-count="summary.length">
          <template #top>
            <UButton
              icon="i-lucide-plus"
              label="新增筆記"
              color="primary"
              variant="outline"
              class="justify-center rounded-control px-3 text-ui font-medium"
              @click="newNote"
            />

            <FilterSearch v-model="query" placeholder="搜尋筆記、題目或標題…" label="搜尋筆記" />
            <FilterSummary :items="summary" :has-filter="hasFilter" @clear="clearFilters" />
          </template>

          <template #aside>
            <FilterChips v-model="kind" label="種類" :options="kindOptions" />
            <FilterSelect v-if="placeOptions.length" v-model="place" label="場次" placeholder="全部場次" search-placeholder="搜尋場次…" :options="placeOptions" />
            <FilterStatus :count="visible.length" unit="則" />

            <div v-if="visible.length" class="flex flex-col gap-1.5">
              <span id="facet-export" class="text-ui text-muted">匯出{{ hasFilter ? '目前篩選的' : '全部' }} {{ visible.length }} 則</span>
              <div role="group" aria-labelledby="facet-export" class="flex flex-wrap gap-1.5">
                <UButton
                  label="Markdown"
                  icon="i-lucide-download"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-full px-3"
                  :ui="{ label: 'text-ui font-medium' }"
                  @click="download('md')"
                />
                <UButton
                  label="純文字"
                  icon="i-lucide-download"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-full px-3"
                  :ui="{ label: 'text-ui font-medium' }"
                  @click="download('txt')"
                />
              </div>
            </div>
          </template>

          <p v-if="!entries.length" class="rounded-card border border-dashed border-default p-6 text-center text-small leading-relaxed text-muted">
            還沒有筆記。在場次的「邊看邊想」或「週日討論」寫下的想法會出現在這裡，也可以按「新增筆記」。
          </p>
          <p v-else-if="!groups.length" class="text-small text-muted">沒有符合的筆記。</p>

          <section v-for="group in groups" :key="group.key" class="flex flex-col gap-3">
            <SessionGroupHeading :session="group.session" :count="group.entries.length" unit="則" />

            <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <li v-for="e in group.entries" :key="e.key">
                <NoteCard
                  :kind="e.kind"
                  :title="e.title"
                  :meta="e.meta"
                  :body="e.body"
                  deletable
                  @delete="removeEntry(e)"
                  @open="editing = e.key"
                />
              </li>
            </ul>
          </section>
        </FilterLayout>
      </Transition>

      <!--
        編輯視窗（<NoteSheet>）：上方是種類標籤和關閉圖示（刪除在外層的卡片上），大字標題、一排屬性（場次、修改時間、連結），
        下面一大塊無框的書寫區。內容一改就自動儲存，沒有「完成」按鈕。
      -->
      <NoteSheet
        v-model:open="modalOpen"
        :title="active ? NOTE_KINDS[active.kind].label : '筆記'"
        :badge="active ? NOTE_KINDS[active.kind] : null"
        hint="自動儲存・只存在這個瀏覽器"
      >
        <template v-if="active" #title>
          <!-- 標題：我的筆記可以改；其他種類是題目或詞條 -->
          <UInput
            v-if="active.mine"
            :model-value="active.mine.title"
            variant="none"
            placeholder="未命名筆記"
            aria-label="筆記標題"
            autofocus
            :ui="{ root: 'w-full', base: 'p-0 font-serif text-h2! leading-snug font-black text-highlighted placeholder:text-dimmed' }"
            @update:model-value="(v: string) => updateMine(active!.mine!.id, { title: v })"
          />
          <h2 v-else class="font-serif leading-snug font-black text-highlighted" :class="NOTE_KINDS[active.kind].headClass">
            {{ active.title }}
          </h2>

          <p v-if="NOTE_KINDS[active.kind].notice" class="text-small leading-relaxed text-muted">
            {{ NOTE_KINDS[active.kind].notice }}
          </p>
        </template>

        <template v-if="active" #props>
          <NoteSheetProp icon="i-lucide-calendar-days" label="場次" class="min-w-0">
            <USelect
              v-if="active.mine"
              :model-value="active.mine.slug ?? 'none'"
              :items="sessionOptions"
              variant="ghost"
              size="sm"
              aria-label="屬於哪一場"
              class="-ms-2.5 w-full max-w-full"
              :ui="{ base: 'text-ui text-default', value: 'truncate' }"
              @update:model-value="(v: string) => updateMine(active!.mine!.id, { slug: v === 'none' ? null : v })"
            />
            <span v-else class="truncate text-default">{{ active.where }}</span>
          </NoteSheetProp>

          <NoteSheetProp v-if="active.mine" icon="i-lucide-clock" label="修改" class="font-mono text-meta text-default">
            {{ active.meta }}
          </NoteSheetProp>

          <NoteSheetProp v-if="active.link" icon="i-lucide-link" label="連結">
            <NuxtLink
              :to="active.link.to"
              class="text-secondary hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
              @click="active.link.leaves && (editing = null)"
            >
              {{ active.link.label }} ›
            </NuxtLink>
          </NoteSheetProp>
        </template>

        <!-- 書寫區：沒有外框，像在紙上寫；Markdown 編輯器（有工具列，也可以直接打 ## 、**、- ） -->
        <LazyMarkdownEditor
          v-if="active"
          :key="active.key"
          :model-value="active.body"
          :autofocus="!active.mine"
          min-height="min-h-48"
          :placeholder="active.mine ? '開始寫…（支援 Markdown）' : '寫下你的想法…（清空就是刪除這則筆記）'"
          @update:model-value="(v: string) => active!.setBody(v)"
        />
      </NoteSheet>
    </main>
  </div>
</template>
