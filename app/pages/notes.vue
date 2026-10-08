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

type Kind = 'all' | 'discuss' | 'review' | 'concept' | 'mine'
const KINDS: { key: Kind, label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'discuss', label: '討論筆記' },
  { key: 'review', label: '複習筆記' },
  { key: 'concept', label: '概念筆記' },
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
  | { key: string, kind: 'concept', slug: string, question: ReviewQuestion, title: string, text: string }

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

// 概念卡題的筆記（key `c:{id}`）就是概念卡彈窗裡寫的筆記，所以另外歸成「概念筆記」
const reviewEntries = computed<Entry[]>(() =>
  [...reviewQuestions.value.values()]
    .filter(q => q.kind === 'quiz')
    .map(q => ({ key: `r:${q.key}`, kind: 'review' as const, slug: q.session.slug, question: q, text: reviewNotes.value?.[q.key] ?? '' }))
    .filter(e => e.text.trim() || editing.value === e.key),
)

const conceptEntries = computed<Entry[]>(() =>
  [...reviewQuestions.value.values()]
    .filter(q => q.kind === 'concept')
    .map(q => ({
      key: `r:${q.key}`,
      kind: 'concept' as const,
      slug: q.session.slug,
      question: q,
      title: concepts.value.find(c => c.id === q.conceptId)?.title ?? '',
      text: reviewNotes.value?.[q.key] ?? '',
    }))
    .filter(e => e.text.trim() || editing.value === e.key),
)

const allEntries = computed(() => [...discussEntries.value, ...reviewEntries.value, ...conceptEntries.value, ...mineEntries.value])

const active = computed(() => allEntries.value.find(e => e.key === editing.value) ?? null)

/** 搜尋索引：題目、筆記內容、標題。ignoreLocation：中文關鍵字常在句子中間 */
const fuse = computed(() => new Fuse(
  allEntries.value.map(e => e.kind === 'discuss'
    ? { key: e.key, title: '', question: e.item.q, text: e.text }
    : e.kind === 'review'
      ? { key: e.key, title: '', question: e.question.item.q, text: e.text }
      : e.kind === 'concept'
        ? { key: e.key, title: e.title, question: e.question.item.q, text: e.text }
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
  concept: conceptEntries.value.length,
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

const { confirm } = useConfirm()

const shorten = (text: string) => text.length > 24 ? `${text.slice(0, 24)}…` : text

const removeNote = async (note: MyNote) => {
  const ok = await confirm({
    title: `刪除「${shorten(note.title || '未命名筆記')}」？`,
    description: '這則筆記會從這個瀏覽器刪除，無法復原。',
    confirmLabel: '刪除',
  })
  if (!ok) return
  if (editing.value === `m:${note.id}`) editing.value = null
  remove(note.id)
}

/**
 * 刪除討論、複習、概念筆記：清空筆記內容（題目和概念卡本身不受影響，之後還可以在原處重寫）。
 * 我的筆記走 removeNote，整則刪除。
 */
const removeEntry = async (e: Entry) => {
  if (e.kind === 'mine') return removeNote(e.note)
  const name = e.kind === 'concept' ? e.title : headOf(e)
  const ok = await confirm({
    title: `刪除這則${kindLabel(e)}？`,
    description: `「${shorten(name)}」的筆記內容會被清空，無法復原；${e.kind === 'concept' ? '概念卡' : '題目'}本身不受影響，之後還可以重寫。`,
    confirmLabel: '刪除',
  })
  if (!ok) return
  if (editing.value === e.key) editing.value = null
  setBody(e, '')
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

const kindLabel = (e: Entry) => ({ discuss: '討論筆記', review: '複習筆記', concept: '概念筆記', mine: '我的筆記' })[e.kind]

/** 彈窗的大標題：題目或詞條（我的筆記的標題可以直接改，不走這裡） */
const headOf = (e: Entry) =>
  e.kind === 'discuss' ? e.item.q : e.kind === 'review' ? e.question.item.q : e.kind === 'concept' ? e.title : e.note.title

/** 屬性列的「場次」 */
const whereOf = (e: Entry) =>
  e.kind === 'discuss'
    ? `${e.session.chip}・${discussLabel(e)}`
    : e.kind === 'review' || e.kind === 'concept'
      ? `${e.question.session.chip}・${reviewLabel(e.question)}`
      : ''

/** 屬性列的「連結」。leaves：會換頁的連結點了要先關掉彈窗；概念卡連結只是開另一個彈窗 */
const linkOf = (e: Entry): { to: string, label: string, leaves: boolean } | null =>
  e.kind === 'discuss'
    ? { to: `/s/${e.slug}#sunday`, label: '回到題目，看 Kagan 怎麼說', leaves: true }
    : e.kind === 'review'
      ? { to: `/s/${e.slug}#recall`, label: '回到這一場的「看完回想」', leaves: true }
      : e.kind === 'concept'
        ? { to: `/c/${e.question.conceptId}`, label: '看概念卡', leaves: false }
        : null

const bodyOf = (e: Entry) => e.kind === 'mine' ? e.note.body : e.text

const setBody = (e: Entry, v: string) => {
  if (e.kind === 'discuss') setDiscussNote(e, v)
  else if (e.kind === 'mine') update(e.note.id, { body: v })
  else setReviewNote(e.question.key, v)
}

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })

// ---- 匯出：目前篩選出來的筆記（沒篩選就是全部），依場次分組，下載成 .md 或 .txt ----
type Format = 'md' | 'txt'

/** 一則筆記的標籤、題目或標題、內容 */
const exportParts = (e: Entry) => {
  if (e.kind === 'discuss') return { label: `討論筆記・${discussLabel(e)}`, head: e.item.q, quote: true, body: e.text }
  if (e.kind === 'review') return { label: `複習筆記・${reviewLabel(e.question)}`, head: e.question.item.q, quote: true, body: e.text }
  if (e.kind === 'concept') return { label: '概念筆記', head: e.title, quote: false, body: e.text }
  return { label: `我的筆記・${dateText(e.note.updatedAt)}`, head: e.note.title || '未命名筆記', quote: false, body: e.note.body }
}

const buildExport = (format: Format) => {
  const md = format === 'md'
  const today = taipeiToday()
  const out: string[] = []
  out.push(md ? '# 悅讀聊天室筆記' : '悅讀聊天室筆記')
  out.push(`匯出日期：${today}　共 ${visible.value.length} 則`, '')
  for (const g of groups.value) {
    const title = g.session ? `${g.session.chip}・${g.session.title}` : '其他筆記'
    out.push(md ? `## ${title}` : `■ ${title}`, '')
    for (const e of g.entries) {
      const p = exportParts(e)
      if (md) {
        out.push(`### ${p.label}`, '')
        out.push(p.quote ? `> ${p.head}` : `**${p.head}**`, '')
      }
      else {
        out.push(`【${p.label}】`)
        out.push(p.quote ? `題目：${p.head}` : p.head)
      }
      const body = p.body.trim() || '（沒有內容）'
      // Markdown 的單一換行會被合併成同一行，行尾加兩個空白保留換行
      out.push(md ? body.replace(/\n/g, '  \n') : body, '')
      if (!md) out.push('―――', '')
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

const download = (format: Format) => {
  const text = buildExport(format)
  const blob = new Blob([text], { type: format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `悅讀聊天室筆記-${taipeiToday()}.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto max-w-[1240px] px-4 pt-7 pb-16">
      <header class="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">筆記</h1>
        <p class="text-body text-muted">
          各場討論題的「我的想法」、複習和概念卡上寫的筆記會自動收在這裡，也可以自己新增筆記。筆記只存在這個瀏覽器。
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
                  deletable
                  @delete="removeEntry(e)"
                  @open="editing = e.key"
                />
                <NoteCard
                  v-else-if="e.kind === 'review'"
                  kind="review"
                  :title="e.question.item.q"
                  :meta="reviewLabel(e.question)"
                  :body="e.text"
                  deletable
                  @delete="removeEntry(e)"
                  @open="editing = e.key"
                />
                <NoteCard
                  v-else-if="e.kind === 'concept'"
                  kind="concept"
                  :title="e.title"
                  meta="概念卡"
                  :body="e.text"
                  deletable
                  @delete="removeEntry(e)"
                  @open="editing = e.key"
                />
                <NoteCard
                  v-else
                  kind="mine"
                  :title="e.note.title"
                  :meta="dateText(e.note.updatedAt)"
                  :body="e.note.body"
                  deletable
                  @open="editing = e.key"
                  @delete="removeEntry(e)"
                />
              </li>
            </ul>
          </section>
        </div>
      </div>

      <!--
        編輯視窗：仿 Heptabase 卡片，像一張文件而不是表單。
        上方是種類標籤和關閉圖示（刪除在外層的卡片上），大字標題、一排屬性（場次、修改時間、連結），下面一大塊無框的書寫區。
        內容一改就自動儲存，沒有「完成」按鈕；按右上角關閉、點外面或按 Esc 都會關閉。
      -->
      <UModal
        v-model:open="modalOpen"
        :title="active ? kindLabel(active) : '筆記'"
        :close="false"
        :ui="{ content: 'sm:max-w-2xl', header: 'sr-only', body: 'p-0 sm:p-0' }"
      >
        <template #body>
          <article v-if="active" class="flex flex-col">
            <div class="flex items-center gap-2 px-6 pt-4 sm:px-8">
              <UBadge
                :label="kindLabel(active)"
                :color="active.kind === 'mine' ? 'primary' : active.kind === 'discuss' ? 'neutral' : 'secondary'"
                variant="outline"
                class="rounded-tag px-1.5 py-0 text-label font-medium"
              />
              <span class="text-meta text-dimmed">自動儲存・只存在這個瀏覽器</span>
              <div class="ml-auto flex gap-0.5">
                <UButton
                  icon="i-lucide-x"
                  aria-label="關閉"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="text-muted hover:text-highlighted"
                  @click="editing = null"
                />
              </div>
            </div>

            <div class="flex flex-col gap-5 px-6 pt-3 pb-8 sm:px-8">
              <!-- 標題：我的筆記可以改；其他種類是題目或詞條 -->
              <UInput
                v-if="active.kind === 'mine'"
                :model-value="active.note.title"
                variant="none"
                placeholder="未命名筆記"
                aria-label="筆記標題"
                autofocus
                :ui="{ root: 'w-full', base: 'p-0 font-serif text-h2! leading-snug font-black text-highlighted placeholder:text-dimmed' }"
                @update:model-value="(v: string) => update((active as Extract<Entry, { kind: 'mine' }>).note.id, { title: v })"
              />
              <h2 v-else class="font-serif leading-snug font-black text-highlighted" :class="active.kind === 'concept' ? 'text-h2' : 'text-title'">
                {{ headOf(active) }}
              </h2>

              <!-- 屬性列 -->
              <dl class="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-ui">
                <dt class="flex items-center gap-1.5 text-muted"><UIcon name="i-lucide-calendar-days" class="size-3.5" />場次</dt>
                <dd class="min-w-0">
                  <USelect
                    v-if="active.kind === 'mine'"
                    :model-value="active.note.slug ?? 'none'"
                    :items="sessionOptions"
                    variant="ghost"
                    size="sm"
                    aria-label="屬於哪一場"
                    class="-ms-2.5 w-full max-w-full"
                    :ui="{ base: 'text-ui text-default', value: 'truncate' }"
                    @update:model-value="(v: string) => update((active as Extract<Entry, { kind: 'mine' }>).note.id, { slug: v === 'none' ? null : v })"
                  />
                  <span v-else class="truncate text-default">{{ whereOf(active) }}</span>
                </dd>

                <template v-if="active.kind === 'mine'">
                  <dt class="flex items-center gap-1.5 text-muted"><UIcon name="i-lucide-clock" class="size-3.5" />修改</dt>
                  <dd class="font-mono text-meta text-default">{{ dateText(active.note.updatedAt) }}</dd>
                </template>

                <template v-if="linkOf(active)">
                  <dt class="flex items-center gap-1.5 text-muted"><UIcon name="i-lucide-link" class="size-3.5" />連結</dt>
                  <dd>
                    <NuxtLink
                      :to="linkOf(active)!.to"
                      class="text-secondary hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
                      @click="linkOf(active)!.leaves && (editing = null)"
                    >
                      {{ linkOf(active)!.label }} ›
                    </NuxtLink>
                  </dd>
                </template>
              </dl>

              <div class="border-t border-default" />

              <!-- 書寫區：沒有外框，像在紙上寫；Markdown 編輯器（有工具列，也可以直接打 ## 、**、- ） -->
              <MarkdownEditor
                :key="active.key"
                :model-value="bodyOf(active)"
                :autofocus="active.kind !== 'mine'"
                min-height="min-h-48"
                :placeholder="active.kind === 'mine' ? '開始寫…（支援 Markdown）' : '寫下你的想法…（清空就是刪除這則筆記）'"
                @update:model-value="(v: string) => setBody(active!, v)"
              />
            </div>
          </article>
        </template>
      </UModal>
    </main>
  </div>
</template>
