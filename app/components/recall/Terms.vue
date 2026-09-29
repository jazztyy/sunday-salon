<script setup lang="ts">
// 「名詞卡」：點卡片翻面，自評「還不熟／記得」，可以只看還不熟的（SPEC.md 4.3）。
// 自評存在 salon-cards-{id}：{卡片索引: 'shaky' | 'known'}。翻開與否只在這次瀏覽有效，不儲存。
import type { Session } from '~/types/session'

type Rate = 'shaky' | 'known'

const props = defineProps<{ session: Session }>()

const stored = useSalonStorage<Record<string, Rate>>(`salon-cards-${props.session.id}`, {})
const rates = computed<Record<string, Rate>>(() =>
  stored.value && typeof stored.value === 'object' ? stored.value : {},
)

const onlyShaky = ref(false)
const opened = ref<Record<number, boolean>>({})

const countOf = (r: Rate) => Object.values(rates.value).filter(v => v === r).length

const items = computed(() =>
  props.session.terms
    .map((term, i) => ({ term, i }))
    .filter(({ i }) => !onlyShaky.value || rates.value[i] === 'shaky'),
)

const toggle = (i: number) => {
  opened.value = { ...opened.value, [i]: !opened.value[i] }
}

const rate = (i: number, r: Rate) => {
  stored.value = { ...rates.value, [i]: r }
}

const RATES: [Rate, string][] = [['shaky', '還不熟'], ['known', '記得']]

const cardClass = (i: number) => {
  if (opened.value[i]) return 'border-primary bg-primary-soft'
  if (rates.value[i] === 'shaky') return 'border-error bg-muted'
  return 'border-default bg-muted'
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">名詞卡</h2>

    <div class="flex flex-wrap items-center justify-between gap-3 text-small text-muted">
      <span>{{ session.terms.length }} 張・還不熟 {{ countOf('shaky') }} 張・記得 {{ countOf('known') }} 張</span>
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
        v-for="{ term: [t, en, d], i } in items"
        :key="i"
        class="flex flex-col rounded-card border"
        :class="cardClass(i)"
      >
        <button
          type="button"
          class="flex min-h-[110px] cursor-pointer flex-col gap-1.5 rounded-card p-3.5 text-left text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-expanded="!!opened[i]"
          @click="toggle(i)"
        >
          <span class="font-serif text-title font-black">{{ t }}</span>
          <span class="font-mono text-meta text-muted">{{ en }}</span>
          <span v-if="opened[i]" class="text-small leading-relaxed text-toned">{{ d }}</span>
          <span v-else class="mt-auto text-meta text-muted">先想想意思，再點開</span>
        </button>

        <div v-if="opened[i]" class="flex gap-1.5 px-3.5 pb-3">
          <button
            v-for="[r, label] in RATES"
            :key="r"
            type="button"
            class="flex-1 cursor-pointer rounded-control border bg-muted py-1 text-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="rates[i] === r ? 'border-inverted font-bold text-highlighted' : 'border-default font-medium text-toned'"
            :aria-pressed="rates[i] === r"
            @click="rate(i, r)"
          >
            {{ label }}
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-small text-muted">沒有標成「還不熟」的卡片。</p>
  </section>
</template>
