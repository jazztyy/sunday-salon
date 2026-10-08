<script setup lang="ts">
// 概念卡牆的一列：標題＋橫向滑動的卡片（UCarousel），不會無限往下長。
// 箭頭放在標題右側（內建箭頭會擺在卡片外側，和左邊的篩選欄重疊）。手機可以直接左右滑。
import type { Concept } from '~/types/session'

const props = defineProps<{
  label: string
  cards: Concept[]
}>()

const carousel = useTemplateRef<{ emblaApi?: { scrollPrev: () => void, scrollNext: () => void, canScrollPrev: () => boolean, canScrollNext: () => boolean, on: (e: string, cb: () => void) => void } }>('carousel')

const canPrev = ref(false)
const canNext = ref(false)
const sync = () => {
  const api = carousel.value?.emblaApi
  canPrev.value = !!api?.canScrollPrev()
  canNext.value = !!api?.canScrollNext()
}

onMounted(() => {
  // emblaApi 在下一個 tick 才建立
  nextTick(() => {
    const api = carousel.value?.emblaApi
    if (!api) return
    sync()
    api.on('select', sync)
    api.on('reInit', sync)
  })
})
watch(() => props.cards.length, () => nextTick(sync))
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3" :aria-label="label">
    <div class="flex items-center gap-2">
      <h2 class="flex items-baseline gap-2 font-serif text-h2 leading-snug font-semibold text-highlighted">
        {{ label }}
        <span class="font-sans text-ui font-normal text-muted">{{ cards.length }} 張</span>
      </h2>
      <div v-if="canPrev || canNext" class="ml-auto flex gap-1">
        <UButton
          icon="i-lucide-chevron-left"
          aria-label="上一組"
          color="neutral"
          variant="outline"
          size="sm"
          class="rounded-full"
          :disabled="!canPrev"
          @click="carousel?.emblaApi?.scrollPrev()"
        />
        <UButton
          icon="i-lucide-chevron-right"
          aria-label="下一組"
          color="neutral"
          variant="outline"
          size="sm"
          class="rounded-full"
          :disabled="!canNext"
          @click="carousel?.emblaApi?.scrollNext()"
        />
      </div>
    </div>

    <UCarousel
      ref="carousel"
      v-slot="{ item }"
      :items="cards"
      align="start"
      slides-to-scroll="auto"
      :ui="{ container: '-ms-3', item: 'ps-3 flex *:w-full basis-[85%] sm:basis-1/2 xl:basis-1/3' }"
    >
      <ConceptCard :concept="item" />
    </UCarousel>
  </section>
</template>
