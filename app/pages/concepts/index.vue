<script setup lang="ts">
// /concepts 概念卡牆：依詞彙表「領域」面向分組，一張卡片有多個領域時每組都會出現，沒有領域的放在「其他」。
// 每張卡片的場次數 = 有多少場次的 concepts 含這張卡片的 id。
// 上方的搜尋框是模糊比對（Fuse.js）：有輸入時不分組，改成依相關程度排列的單一列表。搜尋字同步到網址 ?q=。
import Fuse from 'fuse.js'

const { data: concepts } = await useAllConcepts()
const { data: sessions } = await useAllSessions()
const { data: facets } = await useTaxonomy()

useSeoMeta({ title: '概念卡・悅讀聊天室' })

const counts = computed(() => {
  const map = new Map<string, number>()
  for (const s of sessions.value) for (const id of s.concepts) map.set(id, (map.get(id) ?? 0) + 1)
  return map
})

const groups = computed(() => {
  const domains = facets.value.find(f => f.key === 'domain')?.tags ?? []
  const list = domains
    .map(tag => ({ label: tag, cards: concepts.value.filter(c => c.tags.includes(tag)) }))
    .filter(g => g.cards.length)
  const others = concepts.value.filter(c => !c.tags.some(t => domains.includes(t)))
  return others.length ? [...list, { label: '其他', cards: others }] : list
})

const query = ref('')

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

/** 有輸入時的搜尋結果（依相關程度）；沒有輸入時是 null，顯示原本的分組 */
const results = computed(() => {
  const q = query.value.trim()
  return q ? fuse.value.search(q).map(r => r.item) : null
})

// 預先產生的頁面初次載入時網址的 query 會被清掉，所以讀 head 腳本存下的原始 search（同 /archive）
const route = useRoute()
const router = useRouter()
const urlReady = ref(false)

watch(query, (q) => {
  if (urlReady.value) router.replace({ query: { ...route.query, q: q.trim() || undefined }, hash: route.hash })
})

onNuxtReady(() => {
  const fromRoute = route.query.q
  query.value = (typeof fromRoute === 'string' ? fromRoute : new URLSearchParams(takeInitialLocation().search).get('q')) ?? ''
  urlReady.value = true
})
</script>

<template>
  <div>
    <SalonHeader />
    <main class="mx-auto flex max-w-[1080px] flex-col gap-10 px-4 pt-7 pb-16">
      <header class="flex flex-col gap-2">
        <h1 class="font-serif text-h1 font-black leading-tight text-highlighted">概念卡</h1>
        <p class="text-small leading-relaxed text-muted">
          每張卡片是一個概念。同一張卡片會在不同場次出現，點進去可以看到它出現在哪幾場、和哪些概念有關。
        </p>
      </header>

      <UInput
        v-model="query"
        type="text"
        enterkeyhint="search"
        icon="i-lucide-search"
        placeholder="搜尋詞條、英文、別名或定義…"
        aria-label="搜尋概念卡"
        class="-mt-4 w-full sm:max-w-[360px]"
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

      <section v-if="results" class="flex flex-col gap-4" aria-label="搜尋結果" aria-live="polite">
        <h2 class="flex items-baseline gap-2 font-serif text-h2 font-black leading-snug text-highlighted">
          搜尋結果
          <span class="font-mono text-meta font-normal text-muted">{{ results.length }}</span>
        </h2>
        <p v-if="!results.length" class="text-small text-muted">沒有符合的概念卡。</p>
        <ul v-else class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          <li v-for="c in results" :key="c.id">
            <ConceptCard :concept="c" :count="counts.get(c.id) ?? 0" />
          </li>
        </ul>
      </section>

      <section v-for="group in (results ? [] : groups)" :key="group.label" class="flex flex-col gap-4" :aria-label="group.label">
        <h2 class="flex items-baseline gap-2 font-serif text-h2 font-black leading-snug text-highlighted">
          {{ group.label }}
          <span class="font-mono text-meta font-normal text-muted">{{ group.cards.length }}</span>
        </h2>
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          <li v-for="c in group.cards" :key="c.id">
            <ConceptCard :concept="c" :count="counts.get(c.id) ?? 0" />
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
