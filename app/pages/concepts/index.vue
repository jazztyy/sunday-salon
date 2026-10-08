<script setup lang="ts">
// /concepts 概念卡牆。版面和 /archive 一致：左邊固定的篩選欄（搜尋、詞彙表各面向的 tag、場次），
// 右邊依「領域」分組，每組是一列橫向滑動的卡片（<ConceptRow>），不會無限往下長。
// 一張卡片有多個領域時每組都會出現，沒有領域的放在「其他」。有搜尋字時不分組，改成依相關程度排列的「搜尋結果」一列。
// 點卡片開概念卡彈窗（app.vue 攔截 /c/{id} 連結），不換頁。
// 篩選條件同步到網址 ?q=…&tag=…&s=…（場次 slug），方便分享。
import Fuse from 'fuse.js'
import type { Concept } from '~/types/session'

const { data: concepts } = await useConceptIndex()
const { data: sessions } = await useSessionIndex()
const { data: facets } = await useTaxonomy()

useSeoMeta({ title: '概念卡・悅讀聊天室' })

const query = ref('')
const selected = ref<string[]>([])
/** 場次篩選：null = 全部，其他是 slug */
const session = ref<string | null>(null)

/** 至少一張卡用到的 tag；沒用到的詞彙不顯示 */
const usedTags = computed(() => new Set(concepts.value.flatMap(c => c.tags)))
const visibleFacets = computed(() =>
  facets.value
    .map(f => ({ ...f, tags: f.tags.filter(t => usedTags.value.has(t)) }))
    .filter(f => f.tags.length > 0),
)

/** 有用到概念卡的場次（新的在前） */
const sessionOptions = computed(() => sessions.value.filter(s => s.concepts.length))

/** 搜尋索引：詞條、英文、別名權重最高，其次是定義和 tag。ignoreLocation：中文關鍵字常在句子中間 */
const fuse = computed(() => new Fuse(concepts.value, {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'en', weight: 2 },
    { name: 'aliases', weight: 2 },
    { name: 'summary', weight: 1 },
    { name: 'tags', weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
}))

/** 選定場次用到的概念卡 id；沒選場次是 null（不篩）。先算好，不必每張卡都找一次場次 */
const sessionConceptIds = computed(() => {
  if (!session.value) return null
  return new Set(sessions.value.find(s => s.slug === session.value)?.concepts ?? [])
})

const passesFilters = (c: Concept) =>
  selected.value.every(t => c.tags.includes(t))
  && (!sessionConceptIds.value || sessionConceptIds.value.has(c.id))

/** 有搜尋字時：依相關程度排列；沒有時是 null */
const results = computed(() => {
  const q = query.value.trim()
  return q ? fuse.value.search(q).map(r => r.item).filter(passesFilters) : null
})

const filtered = computed(() => concepts.value.filter(passesFilters))

const groups = computed(() => {
  if (results.value) return results.value.length ? [{ label: '搜尋結果', cards: results.value }] : []
  const domains = facets.value.find(f => f.key === 'domain')?.tags ?? []
  const domainSet = new Set(domains)
  const list = domains
    .map(tag => ({ label: tag, cards: filtered.value.filter(c => c.tags.includes(tag)) }))
    .filter(g => g.cards.length)
  const others = filtered.value.filter(c => !c.tags.some(t => domainSet.has(t)))
  return others.length ? [...list, { label: '其他', cards: others }] : list
})

const total = computed(() => results.value ? results.value.length : filtered.value.length)

const hasFilter = computed(() => !!(query.value.trim() || selected.value.length || session.value))
const clear = () => {
  query.value = ''
  selected.value = []
  session.value = null
}

/** 篩選欄的 chip 選項 */
const tagOptions = (tags: string[]) => tags.map(t => ({ value: t, label: t }))
const sessionChips = computed(() => sessionOptions.value.map(s => ({ value: s.slug, label: s.chip })))

// 篩選條件同步到網址（初次載入讀原始 search、等 Nuxt 就緒才寫回，同 /archive，見 useUrlFilters）
const { urlReady } = useUrlFilters([
  { key: 'q', read: () => query.value.trim() || undefined, apply: (v) => { query.value = v[0] ?? '' } },
  {
    key: 'tag',
    read: () => selected.value.length ? selected.value : undefined,
    apply: (v) => { selected.value = [...new Set(v)].filter(t => usedTags.value.has(t)) },
  },
  {
    key: 's',
    read: () => session.value ?? undefined,
    apply: ([s]) => { session.value = s && sessionOptions.value.some(o => o.slug === s) ? s : null },
  },
])

// 在本頁點概念卡上的 tag（/concepts?tag=…）時，Nuxt 只換 query 不重建頁面，所以跟著網址更新篩選
const route = useRoute()
watch(() => route.query.tag, (v) => {
  if (!urlReady.value) return
  const tags = queryValues(v).filter(t => usedTags.value.has(t))
  if (tags.join('|') !== selected.value.join('|')) selected.value = tags
})
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto max-w-[1240px] px-4 pt-7 pb-16">
      <header class="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">概念卡</h1>
        <p class="text-body text-muted">
          每張卡片是一個概念。點開可以看到它出現在哪幾場、和哪些概念有關。
        </p>
      </header>

      <FilterLayout>
        <template #aside>
          <FilterSearch v-model="query" placeholder="搜尋詞條、英文、別名或定義…" label="搜尋概念卡" />
          <FilterChips
            v-for="facet in visibleFacets"
            :key="facet.key"
            v-model="selected"
            :label="facet.label"
            :options="tagOptions(facet.tags)"
            multiple
          />
          <FilterChips v-model="session" label="場次" all-label="全部" :options="sessionChips" />
          <FilterFooter :count="total" unit="張" :has-filter="hasFilter" @clear="clear" />
        </template>

        <p v-if="!groups.length" class="text-small text-muted">沒有符合的概念卡。</p>
        <ConceptRow v-for="g in groups" :key="g.label" :label="g.label" :cards="g.cards" />
      </FilterLayout>
    </main>
  </div>
</template>
