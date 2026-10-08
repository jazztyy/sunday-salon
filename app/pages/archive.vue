<script setup lang="ts">
// /archive「全部場次」：左邊篩選欄（搜尋、年份、月份、詞彙表的 tag），右邊依月份分組的場次卡片網格。
// 搜尋是模糊比對（Fuse.js），打錯字或只記得片段也找得到；年份、月份各選一個（或全部）；tag 可以多選，結果要全部符合。
// 篩選條件同步到網址 ?q=靈魂&year=2026&month=10&tag=A&tag=B，方便分享。
import Fuse from 'fuse.js'
import type { FilterSummaryItem } from '~/components/filter/Summary.vue'
import type { SessionSummary as Session } from '~/types/content'

useSeoMeta({ title: '全部場次・悅讀聊天室' })

const { data: sessions } = await useSessionIndex()
const { data: searchText } = await useSessionSearch()
const { data: facets } = await useTaxonomy()

const selected = ref<string[]>([])
const year = ref<string | null>(null)
const month = ref<string | null>(null)
const query = ref('')

/**
 * 搜尋索引：每場攤平成幾個文字欄位。權重越高，命中時排越前面也越容易過門檻。
 * ignoreLocation：中文標題的關鍵字常在句子中間，不限制命中位置。
 */
const searchBySlug = computed(() => new Map(searchText.value.map(t => [t.slug, t])))
const fuse = computed(() => new Fuse(
  sessions.value.map(s => ({
    slug: s.slug,
    title: s.title,
    chip: s.chip,
    tags: s.tags,
    lede: s.lede,
    ...searchBySlug.value.get(s.slug),
  })),
  {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'chip', weight: 2 },
      { name: 'tags', weight: 2 },
      { name: 'videos', weight: 2 },
      { name: 'args', weight: 1.5 },
      { name: 'chapters', weight: 1 },
      { name: 'lede', weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
  },
))

/** 符合搜尋的場次 slug；沒有輸入時是 null（不篩） */
const matched = computed(() => {
  const q = query.value.trim()
  if (!q) return null
  // 講座編號要精準比對：模糊比對會把「講座 12」當成和「講座 11」「講座 10」很接近
  const lec = q.match(/^(?:講座\s*)?(\d+)$/)?.[1]
  if (lec) return new Set(sessions.value.filter(s => s.videos.some(v => v.lec === `講座 ${Number(lec)}`)).map(s => s.slug))
  return new Set(fuse.value.search(q).map(r => r.item.slug))
})

/** 「本週」標記：和首頁同一套判斷，today 共用首頁的 useState（掛載後換成瀏覽器的今天） */
const today = useToday()
const currentSlug = computed(() => pickCurrentSession(sessions.value, today.value)?.slug)

const yearOf = (s: Session) => s.date.slice(0, 4)
const monthOf = (s: Session) => String(Number(s.date.slice(5, 7)))

/** 有場次的年份，新的在前 */
const years = computed(() => [...new Set(sessions.value.map(yearOf))])

/** 選定年份裡有場次的月份（沒選年份就是全部年份），由小到大 */
const months = computed(() => [
  ...new Set(sessions.value.filter(s => !year.value || yearOf(s) === year.value).map(monthOf)),
].sort((a, b) => Number(a) - Number(b)))

// 換年份後，原本選的月份如果在那一年沒有場次，就取消
watch(months, (list) => {
  if (month.value && !list.includes(month.value)) month.value = null
})

/** 至少一場用到的 tag；沒用到的詞彙不顯示 */
const usedTags = computed(() => new Set(sessions.value.flatMap(s => s.tags)))

const visibleFacets = computed(() =>
  facets.value
    .map(f => ({ ...f, tags: f.tags.filter(t => usedTags.value.has(t)) }))
    .filter(f => f.tags.length > 0),
)

const filtered = computed(() =>
  sessions.value.filter(s =>
    (!matched.value || matched.value.has(s.slug))
    && (!year.value || yearOf(s) === year.value)
    && (!month.value || monthOf(s) === month.value)
    && selected.value.every(t => s.tags.includes(t)),
  ),
)

/** 依月份分組（sessions 已是新到舊，分組後維持順序） */
const groups = computed(() => {
  const out: { key: string, label: string, items: Session[] }[] = []
  for (const s of filtered.value) {
    const key = s.date.slice(0, 7)
    const last = out.at(-1)
    if (last?.key === key) last.items.push(s)
    else out.push({ key, label: `${yearOf(s)} 年 ${monthOf(s)} 月`, items: [s] })
  }
  return out
})

/** 卡片上的講座範圍：「講座 8–10」 */
const lecRange = (s: Session) => {
  const nums = s.videos.map(v => v.lec.replace(/\D/g, '')).filter(Boolean)
  if (!nums.length) return ''
  return nums.length === 1 ? `講座 ${nums[0]}` : `講座 ${nums[0]}–${nums.at(-1)}`
}

/** 卡片上的短日期：「10/11」 */
const shortDate = (s: Session) => `${monthOf(s)}/${Number(s.date.slice(8, 10))}`

const MAX_TAGS = 3

const hasFilter = computed(() => !!(query.value.trim() || year.value || month.value || selected.value.length))

const clear = () => {
  selected.value = []
  query.value = ''
  year.value = null
  month.value = null
}

/** 篩選欄的 chip 選項 */
const yearOptions = computed(() => years.value.map(y => ({ value: y, label: y, class: 'font-mono' })))
const monthOptions = computed(() => months.value.map(m => ({ value: m, label: `${m} 月` })))
/** 每個 tag 有幾場（顯示在 chip 上，也決定收起時留哪些） */
const tagCount = computed(() => {
  const out = new Map<string, number>()
  for (const s of sessions.value) for (const t of s.tags) out.set(t, (out.get(t) ?? 0) + 1)
  return out
})
const tagOptions = (tags: string[]) => tags.map(t => ({ value: t, label: t, count: tagCount.value.get(t) ?? 0 }))

/** 篩選欄最上面的「已選」 */
const summary = computed<FilterSummaryItem[]>(() => [
  ...(year.value ? [{ key: 'year', label: `${year.value} 年`, remove: () => { year.value = null } }] : []),
  ...(month.value ? [{ key: 'month', label: `${month.value} 月`, remove: () => { month.value = null } }] : []),
  ...selected.value.map(t => ({ key: `tag:${t}`, label: t, remove: () => { selected.value = selected.value.filter(x => x !== t) } })),
])

// 篩選條件同步到網址（初次載入讀原始 search、等 Nuxt 就緒才寫回，見 useUrlFilters）。
// 月份要在年份之後套用：只接受選定年份裡有場次的月份
useUrlFilters([
  { key: 'q', read: () => query.value.trim() || undefined, apply: (v) => { query.value = v[0] ?? '' } },
  { key: 'year', read: () => year.value ?? undefined, apply: ([y]) => { year.value = y && years.value.includes(y) ? y : null } },
  { key: 'month', read: () => month.value ?? undefined, apply: ([m]) => { month.value = m && months.value.includes(m) ? m : null } },
  {
    key: 'tag',
    read: () => selected.value.length ? selected.value : undefined,
    apply: (v) => { selected.value = [...new Set(v)].filter(t => usedTags.value.has(t)) },
  },
])
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto max-w-[1240px] px-4 pt-7 pb-16">
      <header class="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">全部場次</h1>
        <p class="text-body text-muted">搜尋或依年份、月份、主題篩選過去的討論。</p>
      </header>

      <!-- 手機：搜尋和「已選」一直在上面，年份、月份、tag 收在「篩選（N）」裡 -->
      <FilterLayout :active-count="summary.length">
        <template #top>
          <FilterSearch v-model="query" placeholder="搜尋標題、講座、章節…" label="搜尋場次" />
          <FilterSummary :items="summary" :has-filter="hasFilter" @clear="clear" />
        </template>

        <template #aside>
          <FilterChips v-model="year" label="年份" all-label="全部" :options="yearOptions" />
          <FilterChips v-model="month" label="月份" all-label="全部" :options="monthOptions" />
          <FilterChips
            v-for="facet in visibleFacets"
            :key="facet.key"
            v-model="selected"
            :label="facet.label"
            :options="tagOptions(facet.tags)"
            multiple
            :limit="8"
            rank="count"
          />
          <FilterStatus :count="filtered.length" unit="場" />
        </template>

        <p v-if="!groups.length" class="text-small text-muted">沒有符合的場次。</p>

        <section v-for="group in groups" :key="group.key" class="flex flex-col gap-3">
          <h2 class="flex items-baseline gap-2 font-serif text-h2 leading-snug font-semibold text-highlighted">
            {{ group.label }}
            <span class="font-sans text-ui font-normal text-muted">{{ group.items.length }} 場</span>
          </h2>

          <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <li v-for="s in group.items" :key="s.slug" class="relative">
              <NuxtLink
                :to="`/s/${s.slug}`"
                class="flex h-full flex-col gap-2 rounded-card border bg-elevated p-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                :class="s.slug === currentSlug ? 'border-primary' : 'border-default'"
              >
                <div class="flex items-center gap-2 font-mono text-meta">
                  <span class="text-primary">{{ shortDate(s) }}</span>
                  <span class="text-muted">{{ lecRange(s) }}</span>
                  <UBadge
                    v-if="s.slug === currentSlug"
                    label="本週"
                    color="primary"
                    variant="outline"
                    class="ml-auto rounded-tag px-1.5 py-0 font-sans text-label font-medium"
                  />
                </div>
                <span class="font-serif text-title leading-snug font-semibold text-pretty text-highlighted">
                  {{ s.title }}
                </span>
                <div v-if="s.tags.length" class="mt-auto flex flex-wrap gap-1.5 pt-1">
                  <UBadge
                    v-for="tag in s.tags.slice(0, MAX_TAGS)"
                    :key="tag"
                    :label="tag"
                    color="neutral"
                    variant="outline"
                    class="rounded-tag px-1.5 py-0 text-label font-medium"
                  />
                  <span v-if="s.tags.length > MAX_TAGS" class="text-label text-muted">+{{ s.tags.length - MAX_TAGS }}</span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </FilterLayout>
    </main>
  </div>
</template>
