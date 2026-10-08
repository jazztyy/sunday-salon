<script setup lang="ts">
// /archive「全部場次」：左邊篩選欄（搜尋、年份、月份、詞彙表的 tag），右邊依月份分組的場次卡片網格。
// 搜尋是模糊比對（Fuse.js），打錯字或只記得片段也找得到；年份、月份各選一個（或全部）；tag 可以多選，結果要全部符合。
// 篩選條件同步到網址 ?q=靈魂&year=2026&month=10&tag=A&tag=B，方便分享。
import Fuse from 'fuse.js'
import type { Session } from '~/types/session'

useSeoMeta({ title: '全部場次・悅讀聊天室' })

const { data: sessions } = await useAllSessions()
const { data: facets } = await useTaxonomy()

const route = useRoute()
const router = useRouter()

const selected = ref<string[]>([])
const year = ref<string | null>(null)
const month = ref<string | null>(null)
const query = ref('')

/**
 * 搜尋索引：每場攤平成幾個文字欄位。權重越高，命中時排越前面也越容易過門檻。
 * ignoreLocation：中文標題的關鍵字常在句子中間，不限制命中位置。
 */
const fuse = computed(() => new Fuse(
  sessions.value.map(s => ({
    slug: s.slug,
    title: s.title,
    chip: s.chip,
    tags: s.tags,
    lede: s.lede,
    videos: s.videos.flatMap(v => [v.lec, v.title, v.short, v.guide]),
    chapters: s.videos.flatMap(v => v.chapters.map(c => c[1])),
    args: s.args.map(a => a.name),
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
const today = useState('home:today', () => taipeiToday())
onMounted(() => { today.value = taipeiToday() })
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

const isSelected = (tag: string) => selected.value.includes(tag)

const toggle = (tag: string) => {
  selected.value = isSelected(tag)
    ? selected.value.filter(t => t !== tag)
    : [...selected.value, tag]
}

const clear = () => {
  selected.value = []
  query.value = ''
  year.value = null
  month.value = null
}

const tagsFromQuery = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((t): t is string => typeof t === 'string' && t.length > 0)

const firstOf = (value: unknown): string | null => tagsFromQuery(value)[0] ?? null

// 預先產生的頁面初次載入時，Nuxt 會把網址修正回產生時的路徑（query 會被清掉），
// 而且這一步發生在元件掛載之後。所以改讀 head 腳本存下來的原始 search，並等 Nuxt 完全就緒才寫回網址。
const urlReady = ref(false)

const syncUrl = () =>
  router.replace({
    query: {
      ...route.query,
      q: query.value.trim() || undefined,
      year: year.value ?? undefined,
      month: month.value ?? undefined,
      tag: selected.value.length ? selected.value : undefined,
    },
    hash: route.hash,
  })

// 監聽器建在元件範圍內（離開頁面會自動清除），就緒前不寫網址
watch([selected, year, month, query], () => {
  if (urlReady.value) syncUrl()
})

onNuxtReady(() => {
  const initial = new URLSearchParams(takeInitialLocation().search)
  const hasRouteQuery = Object.keys(route.query).length > 0
  const tags = hasRouteQuery ? tagsFromQuery(route.query.tag) : initial.getAll('tag')
  const y = hasRouteQuery ? firstOf(route.query.year) : initial.get('year')
  const m = hasRouteQuery ? firstOf(route.query.month) : initial.get('month')
  query.value = (hasRouteQuery ? firstOf(route.query.q) : initial.get('q')) ?? ''
  selected.value = [...new Set(tags)].filter(t => usedTags.value.has(t))
  year.value = y && years.value.includes(y) ? y : null
  month.value = m && months.value.includes(m) ? m : null
  urlReady.value = true
  syncUrl()
})
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto max-w-[1240px] px-4 pt-7 pb-16">
      <header class="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">全部場次</h1>
        <p class="text-body text-muted">搜尋或依年份、月份、主題篩選過去的討論。</p>
      </header>

      <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <!-- 篩選欄：桌機固定在左邊，往下捲也看得到 -->
        <aside
          aria-label="篩選"
          class="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--tb,64px)+1.5rem)] lg:max-h-[calc(100vh-var(--tb,64px)-3rem)] lg:overflow-y-auto lg:pr-1"
        >
          <UInput
            v-model="query"
            type="text"
            enterkeyhint="search"
            icon="i-lucide-search"
            placeholder="搜尋標題、講座、章節…"
            aria-label="搜尋場次"
            class="w-full"
            :ui="{ base: 'text-ui', trailing: 'pe-1' }"
          >
            <template v-if="query" #trailing>
              <UButton
                icon="i-lucide-x"
                aria-label="清除搜尋"
                color="neutral"
                variant="link"
                size="xs"
                @click="query = ''"
              />
            </template>
          </UInput>

          <div class="flex flex-col gap-1.5">
            <span id="facet-year" class="text-ui text-muted">年份</span>
            <div role="group" aria-labelledby="facet-year" class="flex flex-wrap gap-1.5">
              <UButton
                label="全部"
                color="neutral"
                :variant="year === null ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="year === null"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="year = null"
              />
              <UButton
                v-for="y in years"
                :key="y"
                :label="y"
                color="neutral"
                :variant="year === y ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="year === y"
                class="rounded-full px-3 font-mono"
                :ui="{ label: 'text-ui font-medium' }"
                @click="year = y"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <span id="facet-month" class="text-ui text-muted">月份</span>
            <div role="group" aria-labelledby="facet-month" class="flex flex-wrap gap-1.5">
              <UButton
                label="全部"
                color="neutral"
                :variant="month === null ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="month === null"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="month = null"
              />
              <UButton
                v-for="m in months"
                :key="m"
                :label="`${m} 月`"
                color="neutral"
                :variant="month === m ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="month === m"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="month = m"
              />
            </div>
          </div>

          <div v-for="facet in visibleFacets" :key="facet.key" class="flex flex-col gap-1.5">
            <span :id="`facet-${facet.key}`" class="text-ui text-muted">{{ facet.label }}</span>
            <div role="group" :aria-labelledby="`facet-${facet.key}`" class="flex flex-wrap gap-1.5">
              <UButton
                v-for="tag in facet.tags"
                :key="tag"
                :label="tag"
                color="neutral"
                :variant="isSelected(tag) ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="isSelected(tag)"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="toggle(tag)"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 border-t border-default pt-3 text-ui text-muted" aria-live="polite">
            <span>共 {{ filtered.length }} 場</span>
            <UButton
              v-if="hasFilter"
              label="清除篩選"
              color="secondary"
              variant="link"
              size="xs"
              class="p-0"
              :ui="{ label: 'text-ui' }"
              @click="clear"
            />
          </div>
        </aside>

        <div class="flex min-w-0 flex-col gap-8">
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
        </div>
      </div>
    </main>
  </div>
</template>
