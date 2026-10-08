<script setup lang="ts">
// /concepts 概念卡牆。版面和 /archive 一致：左邊固定的篩選欄（搜尋、詞彙表各面向的 tag、場次），
// 右邊依「領域」分組，每組是一列橫向滑動的卡片（<ConceptRow>），不會無限往下長。
// 一張卡片有多個領域時每組都會出現，沒有領域的放在「其他」。有搜尋字時不分組，改成依相關程度排列的「搜尋結果」一列。
// 點卡片開概念卡彈窗（app.vue 攔截 /c/{id} 連結），不換頁。
// 篩選條件同步到網址 ?q=…&tag=…&s=…（場次 slug），方便分享。
import Fuse from 'fuse.js'
import type { Concept } from '~/types/session'

const { data: concepts } = await useAllConcepts()
const { data: sessions } = await useAllSessions()
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

const passesFilters = (c: Concept) =>
  selected.value.every(t => c.tags.includes(t))
  && (!session.value || !!sessions.value.find(s => s.slug === session.value)?.concepts.includes(c.id))

/** 有搜尋字時：依相關程度排列；沒有時是 null */
const results = computed(() => {
  const q = query.value.trim()
  return q ? fuse.value.search(q).map(r => r.item).filter(passesFilters) : null
})

const filtered = computed(() => concepts.value.filter(passesFilters))

const groups = computed(() => {
  if (results.value) return results.value.length ? [{ label: '搜尋結果', cards: results.value }] : []
  const domains = facets.value.find(f => f.key === 'domain')?.tags ?? []
  const list = domains
    .map(tag => ({ label: tag, cards: filtered.value.filter(c => c.tags.includes(tag)) }))
    .filter(g => g.cards.length)
  const others = filtered.value.filter(c => !c.tags.some(t => domains.includes(t)))
  return others.length ? [...list, { label: '其他', cards: others }] : list
})

const total = computed(() => results.value ? results.value.length : filtered.value.length)

const isSelected = (tag: string) => selected.value.includes(tag)
const toggle = (tag: string) => {
  selected.value = isSelected(tag) ? selected.value.filter(t => t !== tag) : [...selected.value, tag]
}

const hasFilter = computed(() => !!(query.value.trim() || selected.value.length || session.value))
const clear = () => {
  query.value = ''
  selected.value = []
  session.value = null
}

// 預先產生的頁面初次載入時網址的 query 會被清掉，所以讀 head 腳本存下的原始 search（同 /archive），
// 並等 Nuxt 完全就緒才寫回網址
const route = useRoute()
const router = useRouter()
const urlReady = ref(false)

const syncUrl = () => router.replace({
  query: {
    ...route.query,
    q: query.value.trim() || undefined,
    tag: selected.value.length ? selected.value : undefined,
    s: session.value ?? undefined,
  },
  hash: route.hash,
})

watch([query, selected, session], () => {
  if (urlReady.value) syncUrl()
})

const listOf = (v: unknown): string[] => (Array.isArray(v) ? v : [v]).filter((t): t is string => typeof t === 'string' && t.length > 0)

onNuxtReady(() => {
  const initial = new URLSearchParams(takeInitialLocation().search)
  const fromRoute = Object.keys(route.query).length > 0
  query.value = (fromRoute ? listOf(route.query.q)[0] : initial.get('q')) ?? ''
  selected.value = [...new Set(fromRoute ? listOf(route.query.tag) : initial.getAll('tag'))].filter(t => usedTags.value.has(t))
  const s = fromRoute ? listOf(route.query.s)[0] : initial.get('s')
  session.value = s && sessionOptions.value.some(o => o.slug === s) ? s : null
  urlReady.value = true
  syncUrl()
})

// 在本頁點概念卡上的 tag（/concepts?tag=…）時，Nuxt 只換 query 不重建頁面，所以跟著網址更新篩選
watch(() => route.query.tag, (v) => {
  if (!urlReady.value) return
  const tags = listOf(v).filter(t => usedTags.value.has(t))
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

      <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <!-- 篩選欄：桌機固定在左邊（同 /archive） -->
        <aside
          aria-label="篩選"
          class="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--tb,64px)+1.5rem)] lg:max-h-[calc(100vh-var(--tb,64px)-3rem)] lg:overflow-y-auto lg:pr-1"
        >
          <UInput
            v-model="query"
            type="text"
            enterkeyhint="search"
            icon="i-lucide-search"
            placeholder="搜尋詞條、英文、別名或定義…"
            aria-label="搜尋概念卡"
            class="w-full"
            :ui="{ base: 'text-ui', trailing: 'pe-1' }"
          >
            <template v-if="query" #trailing>
              <UButton icon="i-lucide-x" aria-label="清除搜尋" color="neutral" variant="link" size="xs" @click="query = ''" />
            </template>
          </UInput>

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

          <div class="flex flex-col gap-1.5">
            <span id="facet-session" class="text-ui text-muted">場次</span>
            <div role="group" aria-labelledby="facet-session" class="flex flex-wrap gap-1.5">
              <UButton
                label="全部"
                color="neutral"
                :variant="session === null ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="session === null"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="session = null"
              />
              <UButton
                v-for="s in sessionOptions"
                :key="s.slug"
                :label="s.chip"
                color="neutral"
                :variant="session === s.slug ? 'solid' : 'outline'"
                size="xs"
                :aria-pressed="session === s.slug"
                class="rounded-full px-3"
                :ui="{ label: 'text-ui font-medium' }"
                @click="session = s.slug"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 border-t border-default pt-3 text-ui text-muted" aria-live="polite">
            <span>共 {{ total }} 張</span>
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
          <p v-if="!groups.length" class="text-small text-muted">沒有符合的概念卡。</p>
          <ConceptRow v-for="g in groups" :key="g.label" :label="g.label" :cards="g.cards" />
        </div>
      </div>
    </main>
  </div>
</template>
