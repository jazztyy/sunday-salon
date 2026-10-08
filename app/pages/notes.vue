<script setup lang="ts">
// /notes 筆記：把各場討論題的「我的想法」（salon-notes-{slug}）、複習時寫的筆記（salon-review-notes）
// 和自己新增的筆記（salon-mynotes）集中在一起。
// 依場次分組，新的在前；不屬於任何場次的「我的筆記」放在最後。可以模糊搜尋（Fuse.js）、切換只看某一種。
// 版面和 /archive 一致：左邊固定的篩選欄（新增、搜尋、種類、場次），右邊依場次分組的 <NoteCard> 網格；點卡片打開編輯視窗。
// 全部存在這個瀏覽器（掛載後才讀），預先產生的 HTML 是空的。規格見 SPEC.md「筆記」。
import Fuse from 'fuse.js'
import type { DiscussItem, Session } from '~/types/session'
import type { MyNote } from '~/composables/useMyNotes'
import type { ReviewQuestion } from '~/utils/review'

useSeoMeta({ title: '筆記・悅讀聊天室' })

const { data: sessions } = await useAllSessions()
const { data: concepts } = await useAllConcepts()

const discussStores = sessions.value.map(s => ({ session: s, ...useDiscussNotes(s.slug) }))
const { notes: myNotes, add, update, remove } = useMyNotes()
const { notes: reviewNotes, setNote: setReviewNote } = useReviewNotes()

type Kind = 'all' | 'discuss' | 'review' | 'mine'
const KINDS: { key: Kind, label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'discuss', label: '討論筆記' },
  { key: 'review', label: '複習筆記' },
  { key: 'mine', label: '我的筆記' },
]
const kind = ref<Kind>('all')
/** 場次篩選：null = 全部，'none' = 不屬於任何場次，其他是 slug */
const place = ref<string | null>(null)
const query = ref('')

/** 編輯視窗打開的筆記 key（討論筆記 `d:{slug}:{題號}`、我的筆記 `m:{id}`）。編輯中就算清空也先留在畫面上 */
const editing = ref<string | null>(null)
const modalOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => { if (!v) editing.value = null },
})

type Entry =
  | { key: string, kind: 'discuss', slug: string, session: Session, item: DiscussItem, text: string }
  | { key: string, kind: 'mine', slug: string | null, note: MyNote }
  | { key: string, kind: 'review', slug: string, question: ReviewQuestion, text: string }

const discussEntries = computed<Entry[]>(() =>
  discussStores.flatMap(({ session, getNote }) =>
    session.discuss
      .map((item, i) => ({ key: `d:${session.slug}:${i}`, kind: 'discuss' as const, slug: session.slug, session, item, text: getNote(item) }))
      .filter(e => e.text.trim() || editing.value === e.key),
  ),
)

const mineEntries = computed<Entry[]>(() =>
  [...(myNotes.value ?? [])]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(note => ({ key: `m:${note.id}`, kind: 'mine' as const, slug: note.slug, note })),
)

/** 複習筆記：key 對回題目（測驗題算在它的場次，概念卡題算在第一次用到這張卡的場次）；題目改掉或刪掉的筆記不顯示 */
const reviewQuestions = computed(() => new Map(buildReviewQuestions(sessions.value, concepts.value).map(q => [q.key, q])))

const reviewEntries = computed<Entry[]>(() =>
  [...reviewQuestions.value.values()]
    .map(q => ({ key: `r:${q.key}`, kind: 'review' as const, slug: q.session.slug, question: q, text: reviewNotes.value?.[q.key] ?? '' }))
    .filter(e => e.text.trim() || editing.value === e.key),
)

const allEntries = computed(() => [...discussEntries.value, ...reviewEntries.value, ...mineEntries.value])

const active = computed(() => allEntries.value.find(e => e.key === editing.value) ?? null)

/** 搜尋索引：題目、筆記內容、標題。ignoreLocation：中文關鍵字常在句子中間 */
const fuse = computed(() => new Fuse(
  allEntries.value.map(e => e.kind === 'discuss'
    ? { key: e.key, title: '', question: e.item.q, text: e.text }
    : e.kind === 'review'
      ? { key: e.key, title: '', question: e.question.item.q, text: e.text }
      : { key: e.key, title: e.note.title, question: '', text: e.note.body }),
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
const placeOf = (e: Entry) => e.slug && knownSlugs.value.has(e.slug) ? e.slug : 'none'

const visible = computed(() =>
  allEntries.value.filter(e =>
    (kind.value === 'all' || e.kind === kind.value)
    && (!place.value || placeOf(e) === place.value || editing.value === e.key)
    && (!matched.value || matched.value.has(e.key) || editing.value === e.key),
  ),
)

/** 場次篩選的選項：有筆記的場次（新的在前），有不屬於任何場次的筆記時加上「其他」 */
const placeOptions = computed(() => {
  const used = new Set(allEntries.value.map(placeOf))
  const out = sessions.value.filter(s => used.has(s.slug)).map(s => ({ value: s.slug, label: s.chip }))
  if (used.has('none')) out.push({ value: 'none', label: '其他' })
  return out
})

// 選的場次已經沒有筆記時，回到全部
watch(placeOptions, (list) => {
  if (place.value && !list.some(o => o.value === place.value)) place.value = null
})

const hasFilter = computed(() => !!(query.value.trim() || kind.value !== 'all' || place.value))
const clearFilters = () => {
  query.value = ''
  kind.value = 'all'
  place.value = null
}

/** 依場次分組（新的在前），不屬於任何場次的放最後 */
const groups = computed(() => {
  const out: { key: string, session: Session | null, entries: Entry[] }[] = []
  for (const s of sessions.value) {
    const entries = visible.value.filter(e => e.slug === s.slug)
    if (entries.length) out.push({ key: s.slug, session: s, entries })
  }
  const known = new Set(sessions.value.map(s => s.slug))
  const loose = visible.value.filter(e => !e.slug || !known.has(e.slug))
  if (loose.length) out.push({ key: 'none', session: null, entries: loose })
  return out
})

const counts = computed(() => ({
  all: allEntries.value.length,
  discuss: discussEntries.value.length,
  review: reviewEntries.value.length,
  mine: mineEntries.value.length,
}))

// 新增筆記預設屬於本週那一場（和首頁同一套判斷）
const today = useState('home:today', () => taipeiToday())
onMounted(() => { today.value = taipeiToday() })

const newNote = () => {
  const note = add(pickCurrentSession(sessions.value, today.value)?.slug ?? null)
  clearFilters()
  editing.value = `m:${note.id}`
}

const removeNote = (note: MyNote) => {
  if (window.confirm(`刪除「${note.title || '未命名筆記'}」？刪除後無法復原。`)) {
    if (editing.value === `m:${note.id}`) editing.value = null
    remove(note.id)
  }
}

const sessionOptions = computed(() => [
  { label: '不屬於任何場次', value: 'none' },
  ...sessions.value.map(s => ({ label: `${s.chip}・${s.title}`, value: s.slug })),
])

const discussLabel = (e: Extract<Entry, { kind: 'discuss' }>) =>
  e.item.scope === 'all' ? '整合回顧' : lecOf(e.session, e.item.scope)

const setDiscussNote = (e: Extract<Entry, { kind: 'discuss' }>, text: string) =>
  discussStores.find(d => d.session.slug === e.slug)?.setNote(e.item, text)

const reviewLabel = (q: ReviewQuestion) =>
  q.kind === 'concept' ? '概念卡' : q.item.scope === 'all' ? '整合回顧' : lecOf(q.session, q.item.scope)

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto max-w-[1240px] px-4 pt-7 pb-16">
      <header class="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">筆記</h1>
        <p class="text-body text-muted">
          各場討論題的「我的想法」和複習時寫的筆記會自動收在這裡，也可以自己新增筆記。筆記只存在這個瀏覽器。
        </p>
      </header>

      <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <!-- 篩選欄：桌機固定在左邊，往下捲也看得到（同 /archive） -->
        <aside
          aria-label="篩選"
          class="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--tb,64px)+1.5rem)] lg:max-h-[calc(100vh-var(--tb,64px)-3rem)] lg:overflow-y-auto lg:pr-1"
        >
          <UButton
            icon="i-lucide-plus"
            label="新增筆記"
            color="primary"
            variant="outline"
            class="justify-center rounded-control px-3 text-ui font-medium"
            @click="newNote"
          />

          <UInput
            v-model="query"
            type="text"
            enterkeyhint="search"
            icon="i-lucide-search"
            placeholder="搜尋筆記、題目或標題…"
            aria-label="搜尋筆記"
            class="w-full"
            :ui="{ base: 'text-ui', trailing: 'pe-1' }"
          >
            <template v-if="query" #trailing>
              <UButton icon="i-lucide-x" aria-label="清除搜尋" color="neutral" variant="link" size="xs" @click="query = ''" />
            </template>
          </UInput>

          <div class="flex flex-col gap-1.5">
            <span id="facet-kind" class="text-ui text-muted">種類</span>
            <div role="group" aria-labelledby="facet-kind" class="flex flex-wrap gap-1.5">
              <UButton
                v-for="k in KINDS"
                :key="k.key"
                :label="`${k.label} ${counts[k.key]}`"
                color="neutral"
                :variant="kind === k.key ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="kind === k.key"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="kind = k.key"
              />
            </div>
          </div>

          <div v-if="placeOptions.length" class="flex flex-col gap-1.5">
            <span id="facet-place" class="text-ui text-muted">場次</span>
            <div role="group" aria-labelledby="facet-place" class="flex flex-wrap gap-1.5">
              <UButton
                label="全部"
                color="neutral"
                :variant="place === null ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="place === null"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="place = null"
              />
              <UButton
                v-for="o in placeOptions"
                :key="o.value"
                :label="o.label"
                color="neutral"
                :variant="place === o.value ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="place === o.value"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="place = o.value"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 border-t border-default pt-3 text-ui text-muted" aria-live="polite">
            <span>共 {{ visible.length }} 則</span>
            <UButton
              v-if="hasFilter"
              label="清除篩選"
              color="secondary"
              variant="link"
              size="xs"
              class="p-0"
              :ui="{ label: 'text-ui' }"
              @click="clearFilters"
            />
          </div>
        </aside>

        <div class="flex min-w-0 flex-col gap-8">
          <p v-if="!counts.all" class="rounded-card border border-dashed border-default p-6 text-center text-small leading-relaxed text-muted">
            還沒有筆記。在場次的「邊看邊想」或「週日討論」寫下的想法會出現在這裡，也可以按「新增筆記」。
          </p>
          <p v-else-if="!groups.length" class="text-small text-muted">沒有符合的筆記。</p>

          <section v-for="group in groups" :key="group.key" class="flex flex-col gap-3">
            <h2 class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <NuxtLink
                v-if="group.session"
                :to="`/s/${group.session.slug}`"
                class="font-serif text-h2 leading-snug font-semibold text-highlighted hover:text-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                {{ group.session.chip }}
              </NuxtLink>
              <span v-else class="font-serif text-h2 leading-snug font-semibold text-highlighted">其他筆記</span>
              <span class="font-sans text-ui font-normal text-muted">{{ group.entries.length }} 則</span>
              <span v-if="group.session" class="basis-full text-small text-muted">{{ group.session.title }}</span>
            </h2>

            <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <li v-for="e in group.entries" :key="e.key">
                <NoteCard
                  v-if="e.kind === 'discuss'"
                  kind="discuss"
                  :title="e.item.q"
                  :meta="discussLabel(e)"
                  :body="e.text"
                  @open="editing = e.key"
                />
                <NoteCard
                  v-else-if="e.kind === 'review'"
                  kind="review"
                  :title="e.question.item.q"
                  :meta="reviewLabel(e.question)"
                  :body="e.text"
                  @open="editing = e.key"
                />
                <NoteCard
                  v-else
                  kind="mine"
                  :title="e.note.title"
                  :meta="dateText(e.note.updatedAt)"
                  :body="e.note.body"
                  @open="editing = e.key"
                />
              </li>
            </ul>
          </section>
        </div>
      </div>

      <!-- 編輯視窗：內容一改就存（和討論卡片一樣），按「完成」或點外面關閉 -->
      <UModal
        v-model:open="modalOpen"
        :title="{ discuss: '討論筆記', review: '複習筆記', mine: '我的筆記' }[active?.kind ?? 'mine']"
        :description="active?.kind === 'discuss'
          ? `${active.session.chip}・${discussLabel(active)}`
          : active?.kind === 'review' ? `${active.question.session.chip}・${reviewLabel(active.question)}` : '只存在這個瀏覽器'"
        :ui="{ content: 'sm:max-w-2xl', title: 'font-serif text-title font-black', description: 'font-mono text-meta' }"
      >
        <template #body>
          <div v-if="active?.kind === 'discuss'" class="flex flex-col gap-3">
            <p class="text-body font-medium text-highlighted">{{ active.item.q }}</p>
            <UTextarea
              :model-value="active.text"
              autoresize
              autofocus
              :rows="5"
              :maxrows="18"
              placeholder="寫下你的想法；清空就是刪除這則筆記"
              aria-label="我的想法"
              :ui="{ base: 'text-body-sm leading-relaxed' }"
              @update:model-value="(v: string) => setDiscussNote(active as Extract<Entry, { kind: 'discuss' }>, v)"
            />
            <NuxtLink
              :to="`/s/${active.slug}#sunday`"
              class="self-start text-ui text-secondary hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
              @click="editing = null"
            >
              回到題目，看 Kagan 怎麼說 ›
            </NuxtLink>
          </div>

          <div v-else-if="active?.kind === 'review'" class="flex flex-col gap-3">
            <p class="text-body font-medium text-highlighted">{{ active.question.item.q }}</p>
            <UTextarea
              :model-value="active.text"
              autoresize
              autofocus
              :rows="5"
              :maxrows="18"
              placeholder="寫下你的筆記；清空就是刪除這則筆記"
              aria-label="複習筆記"
              :ui="{ base: 'text-body-sm leading-relaxed' }"
              @update:model-value="(v: string) => setReviewNote((active as Extract<Entry, { kind: 'review' }>).question.key, v)"
            />
            <NuxtLink
              :to="active.question.kind === 'concept' ? `/c/${active.question.conceptId}` : `/s/${active.slug}#recall`"
              class="self-start text-ui text-secondary hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
              @click="editing = null"
            >
              {{ active.question.kind === 'concept' ? '看概念卡 ›' : '回到這一場的「看完回想」 ›' }}
            </NuxtLink>
          </div>

          <div v-else-if="active?.kind === 'mine'" class="flex flex-col gap-3">
            <UInput
              :model-value="active.note.title"
              placeholder="標題"
              aria-label="筆記標題"
              autofocus
              :ui="{ base: 'font-serif text-body font-semibold' }"
              @update:model-value="(v: string) => update((active as Extract<Entry, { kind: 'mine' }>).note.id, { title: v })"
            />
            <UTextarea
              :model-value="active.note.body"
              autoresize
              :rows="6"
              :maxrows="20"
              placeholder="寫下你的筆記"
              aria-label="筆記內容"
              :ui="{ base: 'text-body-sm leading-relaxed' }"
              @update:model-value="(v: string) => update((active as Extract<Entry, { kind: 'mine' }>).note.id, { body: v })"
            />
            <USelect
              :model-value="active.note.slug ?? 'none'"
              :items="sessionOptions"
              aria-label="屬於哪一場"
              class="w-full"
              :ui="{ base: 'text-ui' }"
              @update:model-value="(v: string) => update((active as Extract<Entry, { kind: 'mine' }>).note.id, { slug: v === 'none' ? null : v })"
            />
          </div>
        </template>

        <template #footer>
          <div class="flex w-full items-center gap-2">
            <UButton
              v-if="active?.kind === 'mine'"
              label="刪除"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="sm"
              class="text-ui text-muted hover:text-highlighted"
              @click="removeNote((active as Extract<Entry, { kind: 'mine' }>).note)"
            />
            <UButton
              label="完成"
              color="primary"
              variant="outline"
              size="sm"
              class="ml-auto rounded-control px-4 text-ui font-medium"
              @click="editing = null"
            />
          </div>
        </template>
      </UModal>
    </main>
  </div>
</template>
