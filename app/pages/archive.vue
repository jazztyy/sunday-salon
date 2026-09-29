<script setup lang="ts">
// /archive「全部場次」：依月份列出所有場次，可以用詞彙表的 tag 篩選（多選、全部符合）。
// 篩選條件同步到網址 ?tag=A&tag=B，方便分享。
import type { Session } from '~/types/session'

useSeoMeta({ title: '全部場次・悅讀聊天室' })

const { data: sessions } = await useAllSessions()
const { data: facets } = await useTaxonomy()

const route = useRoute()
const router = useRouter()

const selected = ref<string[]>([])

/** 至少一場用到的 tag；沒用到的詞彙不顯示 */
const usedTags = computed(() => new Set(sessions.value.flatMap(s => s.tags)))

const visibleFacets = computed(() =>
  facets.value
    .map(f => ({ ...f, tags: f.tags.filter(t => usedTags.value.has(t)) }))
    .filter(f => f.tags.length > 0),
)

const filtered = computed(() =>
  sessions.value.filter(s => selected.value.every(t => s.tags.includes(t))),
)

/** 依月份分組（sessions 已是新到舊，分組後維持順序） */
const groups = computed(() => {
  const out: { key: string, label: string, items: Session[] }[] = []
  for (const s of filtered.value) {
    const [y, m] = s.date.split('-')
    const key = `${y}-${m}`
    const last = out.at(-1)
    if (last?.key === key) last.items.push(s)
    else out.push({ key, label: `${y} 年 ${Number(m)} 月`, items: [s] })
  }
  return out
})

const isSelected = (tag: string) => selected.value.includes(tag)

const toggle = (tag: string) => {
  selected.value = isSelected(tag)
    ? selected.value.filter(t => t !== tag)
    : [...selected.value, tag]
}

const clear = () => {
  selected.value = []
}

const tagsFromQuery = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((t): t is string => typeof t === 'string' && t.length > 0)

// 預先產生的頁面初次載入時，Nuxt 會把網址修正回產生時的路徑（query 會被清掉），
// 而且這一步發生在元件掛載之後。所以改讀 head 腳本存下來的原始 search，並等 Nuxt 完全就緒才寫回網址。
const urlReady = ref(false)

const syncUrl = (tags: string[]) =>
  router.replace({ query: { ...route.query, tag: tags.length ? tags : undefined }, hash: route.hash })

// 監聽器建在元件範圍內（離開頁面會自動清除），就緒前不寫網址
watch(selected, (tags) => {
  if (urlReady.value) syncUrl(tags)
})

onNuxtReady(() => {
  const initial = takeInitialLocation().search
  const fromRoute = tagsFromQuery(route.query.tag)
  const tags = fromRoute.length ? fromRoute : new URLSearchParams(initial).getAll('tag')
  selected.value = [...new Set(tags)].filter(t => usedTags.value.has(t))
  urlReady.value = true
  syncUrl(selected.value)
})
</script>

<template>
  <div>
    <SalonHeader />

    <main class="mx-auto flex max-w-[760px] flex-col gap-10 px-4 pt-7 pb-16">
      <header class="flex flex-col gap-2">
        <h1 class="font-serif text-h1 leading-tight font-black text-highlighted">全部場次</h1>
        <p class="text-body text-muted">依月份瀏覽過去的討論，也可以用主題篩選。</p>
      </header>

      <section v-if="visibleFacets.length" aria-label="主題篩選" class="flex flex-col gap-3">
        <div v-for="facet in visibleFacets" :key="facet.key" class="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-3">
          <span :id="`facet-${facet.key}`" class="shrink-0 text-ui text-muted sm:w-14">{{ facet.label }}</span>
          <div role="group" :aria-labelledby="`facet-${facet.key}`" class="flex min-w-0 flex-wrap gap-1.5">
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

        <div class="flex items-center gap-3 text-ui text-muted" aria-live="polite">
          <span>共 {{ filtered.length }} 場</span>
          <UButton
            v-if="selected.length"
            label="清除篩選"
            color="secondary"
            variant="link"
            size="xs"
            class="p-0"
            :ui="{ label: 'text-ui' }"
            @click="clear"
          />
        </div>
      </section>

      <div class="flex flex-col gap-10">
        <p v-if="!groups.length" class="text-small text-muted">沒有符合的場次。</p>

        <section v-for="group in groups" :key="group.key" class="flex flex-col gap-4">
          <h2 class="font-serif text-h2 leading-snug font-semibold text-highlighted">{{ group.label }}</h2>

          <ul class="flex flex-col gap-3">
            <li
              v-for="s in group.items"
              :key="s.slug"
              class="flex flex-col gap-2 rounded-card border border-default bg-elevated p-4"
            >
              <span class="font-mono text-meta text-primary">{{ s.dateLabel }}</span>
              <NuxtLink
                :to="`/s/${s.slug}`"
                class="font-serif text-title leading-snug font-semibold text-highlighted hover:text-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                {{ s.title }}
              </NuxtLink>
              <p class="text-small text-muted">{{ s.eyebrow }}</p>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <div v-if="s.tags.length" class="flex flex-wrap gap-1.5">
                  <UBadge
                    v-for="tag in s.tags"
                    :key="tag"
                    :label="tag"
                    color="neutral"
                    variant="outline"
                    class="rounded-tag px-1.5 py-0 text-label font-medium"
                  />
                </div>
                <span class="text-ui text-muted">{{ s.concepts.length }} 張概念卡</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </main>
  </div>
</template>
