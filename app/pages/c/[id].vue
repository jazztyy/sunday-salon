<script setup lang="ts">
// /c/{id} 單張概念卡：內文、出現過的場次、相關概念。
// 相關概念 = 本卡 related ∪ 把本卡列在 related 的卡片 ∪ 內文連到 /c/{id} 的卡片（反向連結），扣掉自己。
const route = useRoute()
const id = String(route.params.id)

const { data: concepts } = await useAllConcepts()
const { data: sessions } = await useAllSessions()

const concept = computed(() => concepts.value.find(c => c.id === id))
if (!concept.value) throw createError({ statusCode: 404, statusMessage: '找不到這張概念卡', fatal: true })

useSeoMeta({
  title: () => `${concept.value?.title ?? ''}・概念卡・悅讀聊天室`,
  description: () => concept.value?.summary ?? '',
})

/** 各卡片出現的場次數 */
const counts = computed(() => {
  const map = new Map<string, number>()
  for (const s of sessions.value) for (const cid of s.concepts) map.set(cid, (map.get(cid) ?? 0) + 1)
  return map
})

/** 用到這張卡片的場次（useAllSessions 已經是新的在前） */
const usedIn = computed(() => sessions.value.filter(s => s.concepts.includes(id)))

/**
 * 內文是否連到本卡。內文是 minimark AST，連結節點為 ['a', { href: '/c/{id}' }, …]，
 * 序列化後會出現 "/c/{id}"（前後都有引號，避免 soul 誤中 soul-x）。
 */
const linksHere = (body: unknown): boolean => JSON.stringify(body ?? '').includes(`"/c/${id}"`)

const related = computed(() => {
  const self = concept.value
  if (!self) return []
  return concepts.value.filter(c =>
    c.id !== id && (self.related.includes(c.id) || c.related.includes(id) || linksHere(c.raw?.body)),
  )
})
</script>

<template>
  <div>
    <SalonHeader />
    <main v-if="concept" class="mx-auto flex max-w-[760px] flex-col gap-10 px-4 pt-7 pb-16">
      <header class="flex flex-col gap-2">
        <p class="font-mono text-meta uppercase tracking-[.12em] text-primary">概念卡</p>
        <h1 class="font-serif text-h1 font-black leading-tight text-highlighted">{{ concept.title }}</h1>
        <p class="font-mono text-meta text-muted">{{ concept.en }}</p>
        <p v-if="concept.aliases.length" class="text-small text-muted">也稱：{{ concept.aliases.join('、') }}</p>
        <ul v-if="concept.tags.length" class="flex flex-wrap gap-1.5" aria-label="標籤">
          <li v-for="tag in concept.tags" :key="tag">
            <NuxtLink
              :to="`/archive?tag=${encodeURIComponent(tag)}`"
              class="rounded-tag focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <UBadge :label="tag" color="neutral" variant="subtle" class="rounded-tag text-meta hover:bg-accented" />
            </NuxtLink>
          </li>
        </ul>
      </header>

      <!--
        內文用 Nuxt UI 的 Prose 元件渲染（ProseA 內部是 ULink → NuxtLink，/c/{id} 是站內導覽）。
        Prose 預設連結是 text-primary、段落 my-5 leading-7；這裡用後代選擇器改成站內規範（連結用 secondary）。
      -->
      <ContentRenderer
        v-if="concept.raw"
        :value="concept.raw"
        class="-my-3 text-body text-toned"
      />

      <section class="flex flex-col gap-4" aria-labelledby="used-in">
        <h2 id="used-in" class="font-serif text-h2 font-black leading-snug text-highlighted">出現在這些場次</h2>
        <ul v-if="usedIn.length" class="flex flex-col gap-3">
          <li v-for="s in usedIn" :key="s.slug" class="flex flex-col gap-0.5">
            <span class="font-mono text-meta text-muted">{{ s.dateLabel }}</span>
            <NuxtLink
              :to="`/s/${s.slug}`"
              class="w-fit rounded-control font-serif text-lead font-black leading-snug text-highlighted hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {{ s.title }}
            </NuxtLink>
            <span class="text-small text-muted">{{ s.eyebrow }}</span>
          </li>
        </ul>
        <p v-else class="text-small text-muted">還沒有場次用到這張卡片。</p>
      </section>

      <section v-if="related.length" class="flex flex-col gap-4" aria-labelledby="related">
        <h2 id="related" class="font-serif text-h2 font-black leading-snug text-highlighted">相關概念</h2>
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
          <li v-for="c in related" :key="c.id">
            <ConceptCard :concept="c" :count="counts.get(c.id) ?? 0" />
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
