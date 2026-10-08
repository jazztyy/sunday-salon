<script setup lang="ts">
// 單張概念卡的內容。/c/{id} 頁面和全站的概念卡彈窗（<ConceptModal>）共用。
// 版面：左欄是概念本身（大標題、tag、內文），下面是精簡的「出現在這些場次」（一行一場）和「相關概念」（小標籤）；
// 右欄是筆記（Markdown 編輯器），寬螢幕時固定在側邊，手機排在下面。
// 相關概念 = 本卡 related ∪ 把本卡列在 related 的卡片 ∪ 內文連到 /c/{id} 的卡片（反向連結，建置時算好的 links），扣掉自己。
// 內文只抓這一張（useConcept）；換卡時彈窗會用 :key 重新建立這個元件。
// 這裡面的 /c/{id} 連結（內文、相關概念）會被 app.vue 攔下來改成開彈窗，所以在彈窗裡點也只是換一張卡。
const props = defineProps<{ id: string }>()

const { data: concepts } = await useConceptIndex()
const { data: sessions } = await useSessionIndex()
const { data: full } = await useConcept(props.id)

const concept = computed(() => concepts.value.find(c => c.id === props.id))

// 筆記：和複習頁這張卡的概念卡題共用同一則（salon-review-notes 的 `c:{id}`），也會出現在筆記頁的「概念筆記」
const { getNote, setNote } = useReviewNotes()
const note = computed({
  get: () => getNote(conceptKey(props.id)),
  set: (text: string) => setNote(conceptKey(props.id), text, concept.value?.title ?? ''),
})

/** 用到這張卡片的場次（useSessionIndex 已經是新的在前） */
const usedIn = computed(() => sessions.value.filter(s => s.concepts.includes(props.id)))

const related = computed(() => {
  const self = concept.value
  if (!self) return []
  return concepts.value.filter(c =>
    c.id !== props.id && (self.related.includes(c.id) || c.related.includes(props.id) || c.links.includes(props.id)),
  )
})
</script>

<template>
  <div v-if="concept" class="grid lg:grid-cols-[minmax(0,1fr)_340px]">
    <!-- 左欄：概念本身 -->
    <div class="flex min-w-0 flex-col gap-8 p-6 sm:p-8">
      <header class="flex flex-col gap-2">
        <p class="font-mono text-meta uppercase tracking-[.12em] text-primary">概念卡</p>
        <h2 class="font-serif text-h1 leading-tight font-black text-highlighted">{{ concept.title }}</h2>
        <p class="font-mono text-meta text-muted">{{ concept.en }}</p>
        <p v-if="concept.aliases.length" class="text-small text-muted">也稱：{{ concept.aliases.join('、') }}</p>
        <ul v-if="concept.tags.length" class="flex flex-wrap gap-1.5" aria-label="標籤">
          <li v-for="tag in concept.tags" :key="tag">
            <NuxtLink
              :to="`/concepts?tag=${encodeURIComponent(tag)}`"
              class="rounded-tag focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <UBadge :label="tag" color="neutral" variant="subtle" class="rounded-tag text-meta hover:bg-accented" />
            </NuxtLink>
          </li>
        </ul>
      </header>

      <!--
        內文用 Nuxt UI 的 Prose 元件渲染（ProseA 內部是 ULink → NuxtLink，/c/{id} 是站內連結）。
        Prose 預設連結是 text-primary、段落 my-5 leading-7；這裡用後代選擇器改成站內規範（連結用 secondary）。
      -->
      <ContentRenderer v-if="full?.raw" :value="full.raw" class="-my-3 text-body text-toned" />

      <div class="flex flex-col gap-5 border-t border-default pt-5">
        <section class="flex flex-col gap-2" :aria-labelledby="`used-in-${id}`">
          <h3 :id="`used-in-${id}`" class="text-ui font-medium text-muted">出現在這些場次</h3>
          <ul v-if="usedIn.length" class="flex flex-col gap-1">
            <li v-for="s in usedIn" :key="s.slug">
              <NuxtLink
                :to="`/s/${s.slug}`"
                class="flex items-baseline gap-2 rounded-control text-small hover:text-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span class="shrink-0 font-mono text-meta text-primary">{{ s.chip }}</span>
                <span class="truncate text-default">{{ s.title }}</span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="text-small text-muted">還沒有場次用到這張卡片。</p>
        </section>

        <section v-if="related.length" class="flex flex-col gap-2" :aria-labelledby="`related-${id}`">
          <h3 :id="`related-${id}`" class="text-ui font-medium text-muted">相關概念</h3>
          <ul class="flex flex-wrap gap-1.5">
            <li v-for="c in related" :key="c.id">
              <NuxtLink
                :to="`/c/${c.id}`"
                :title="c.summary"
                class="inline-flex rounded-full border border-default px-3 py-0.5 text-ui text-default transition-colors hover:border-secondary/70 hover:text-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                {{ c.title }}
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- 右欄：筆記 -->
    <aside
      class="flex flex-col gap-3 border-t border-default bg-elevated p-6 sm:p-8 lg:border-t-0 lg:border-l lg:pt-14"
      :aria-label="`${concept.title}的筆記`"
    >
      <div class="flex flex-col gap-0.5">
        <h3 class="font-serif text-title font-black text-highlighted">我的筆記</h3>
        <p class="text-meta text-dimmed">支援 Markdown・自動儲存・只存在這個瀏覽器，也會收進「筆記」頁</p>
      </div>
      <LazyMarkdownEditor
        :key="id"
        v-model="note"
        placeholder="用自己的話解釋這個概念，或記下它讓你想到什麼…"
        min-height="min-h-56"
      />
    </aside>
  </div>
</template>
