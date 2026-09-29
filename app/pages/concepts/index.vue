<script setup lang="ts">
// /concepts 概念卡牆：依詞彙表「領域」面向分組，一張卡片有多個領域時每組都會出現，沒有領域的放在「其他」。
// 每張卡片的場次數 = 有多少場次的 concepts 含這張卡片的 id。
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

      <section v-for="group in groups" :key="group.label" class="flex flex-col gap-4" :aria-label="group.label">
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
