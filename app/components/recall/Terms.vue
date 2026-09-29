<script setup lang="ts">
// 「名詞卡」：點卡片翻面，自評「還不熟／記得」，可以只看還不熟的（SPEC.md 4.3）。
// 卡片內容來自這場的概念卡（session.concepts，依場次檔裡的順序）。
// 自評存在 salon-cards-{slug}：{概念卡 id: 'shaky' | 'known'}。翻開與否只在這次瀏覽有效，不儲存。
import type { Session } from '~/types/session'

type Rate = 'shaky' | 'known'

const props = defineProps<{ session: Session }>()

const { data: concepts } = useAllConcepts()

/** 這場的概念卡，依 session.concepts 的順序；找不到的 id 略過 */
const cards = computed(() => {
  const byId = new Map(concepts.value.map(c => [c.id, c]))
  return props.session.concepts.flatMap((id) => {
    const c = byId.get(id)
    return c ? [c] : []
  })
})

const stored = useSalonStorage<Record<string, Rate>>(`salon-cards-${props.session.slug}`, {})
const rates = computed<Record<string, Rate>>(() =>
  stored.value && typeof stored.value === 'object' ? stored.value : {},
)

const onlyShaky = ref(false)
const opened = ref<Record<string, boolean>>({})

/** 只算這場現有的卡片，舊格式（以索引為 key）的值自然被忽略 */
const countOf = (r: Rate) => cards.value.filter(c => rates.value[c.id] === r).length

const items = computed(() =>
  cards.value.filter(c => !onlyShaky.value || rates.value[c.id] === 'shaky'),
)

const toggle = (id: string) => {
  opened.value = { ...opened.value, [id]: !opened.value[id] }
}

const rate = (id: string, r: Rate) => {
  stored.value = { ...rates.value, [id]: r }
}

const RATES: [Rate, string][] = [['shaky', '還不熟'], ['known', '記得']]

const cardClass = (id: string) => {
  if (opened.value[id]) return 'border-primary bg-primary-soft'
  if (rates.value[id] === 'shaky') return 'border-error bg-muted'
  return 'border-default bg-muted'
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">名詞卡</h2>

    <div class="flex flex-wrap items-center justify-between gap-3 text-small text-muted">
      <span>{{ cards.length }} 張・還不熟 {{ countOf('shaky') }} 張・記得 {{ countOf('known') }} 張</span>
      <UButton
        color="neutral"
        variant="outline"
        class="rounded-control px-3 text-small"
        :aria-pressed="onlyShaky"
        :label="onlyShaky ? '顯示全部' : '只看還不熟的'"
        @click="onlyShaky = !onlyShaky"
      />
    </div>

    <div v-if="items.length" class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5">
      <div
        v-for="c in items"
        :key="c.id"
        class="flex flex-col rounded-card border"
        :class="cardClass(c.id)"
      >
        <button
          type="button"
          class="flex min-h-[110px] cursor-pointer flex-col gap-1.5 rounded-card p-3.5 text-left text-default transition-colors hover:bg-accented focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-expanded="!!opened[c.id]"
          @click="toggle(c.id)"
        >
          <span class="font-serif text-title font-black">{{ c.title }}</span>
          <span class="font-mono text-meta text-muted">{{ c.en }}</span>
          <span v-if="opened[c.id]" class="text-small leading-relaxed text-toned">{{ c.summary }}</span>
          <span v-else class="mt-auto text-meta text-muted">先想想意思，再點開</span>
        </button>

        <NuxtLink
          v-if="opened[c.id]"
          :to="`/c/${c.id}`"
          class="self-start px-3.5 pb-2 text-ui font-medium text-secondary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          看完整卡片 →
        </NuxtLink>

        <div v-if="opened[c.id]" class="flex gap-1.5 px-3.5 pb-3">
          <button
            v-for="[r, label] in RATES"
            :key="r"
            type="button"
            class="flex-1 cursor-pointer rounded-control border bg-muted py-1 text-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="rates[c.id] === r ? 'border-inverted font-bold text-highlighted' : 'border-default font-medium text-toned transition-colors hover:border-secondary/70 hover:text-highlighted'"
            :aria-pressed="rates[c.id] === r"
            @click="rate(c.id, r)"
          >
            {{ label }}
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-small text-muted">沒有標成「還不熟」的卡片。</p>
  </section>
</template>
