<script setup lang="ts">
// 概念卡牆的一組：標題（領域＋張數）＋卡片 grid（手機一欄、sm 兩欄、xl 三欄）。
// 預設只顯示兩列，下面的「顯示全部（N 張）」展開。欄數跟著斷點變，所以「兩列」用 CSS 在各斷點藏掉多的卡
// （手機留 2 張、sm 留 4 張、xl 留 6 張），切換按鈕也只在該斷點真的有藏卡時出現。
// 藏起來的卡仍在 DOM 裡：彈窗的上一張／下一張會照 [data-concept-seq] 裡的 /c/{id} 連結順序走，要拿到整組。
// 頁面有篩選或搜尋時（collapsible = false）整組直接展開，不顯示按鈕。
import type { Concept } from '~/types/session'

const props = withDefaults(defineProps<{
  label: string
  cards: Concept[]
  /** false：一律全部顯示（有篩選時） */
  collapsible?: boolean
}>(), {
  collapsible: true,
})

const expanded = ref(false)
const collapsed = computed(() => props.collapsible && !expanded.value)
const gridId = useId()

/**
 * 收起時，第 i 張卡在哪些斷點要藏起來；按「顯示全部」後，同一批卡（只在原本藏起來的斷點）淡入（animate-reveal）。
 * 有篩選時（collapsible = false）整組直接顯示，不播。
 */
const hideClass = (i: number) => {
  if (collapsed.value) {
    return [
      i >= 2 && 'max-sm:hidden',
      i >= 4 && 'sm:max-xl:hidden',
      i >= 6 && 'xl:hidden',
    ]
  }
  if (!props.collapsible) return undefined
  return [
    i >= 2 && 'max-sm:animate-reveal',
    i >= 4 && 'sm:max-xl:animate-reveal',
    i >= 6 && 'xl:animate-reveal',
  ]
}

/** 切換按鈕只在「這個斷點的兩列放不下」時出現 */
const n = computed(() => props.cards.length)
const toggleClass = computed(() => [
  'hidden',
  n.value > 2 && 'max-sm:flex',
  n.value > 4 && 'sm:max-xl:flex',
  n.value > 6 && 'xl:flex',
])
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3" :aria-label="label">
    <h2 class="flex items-baseline gap-2 font-serif text-h2 leading-snug font-semibold text-highlighted">
      {{ label }}
      <span class="font-sans text-ui font-normal text-muted">{{ cards.length }} 張</span>
    </h2>

    <div :id="gridId" data-concept-seq class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <ConceptCard v-for="(c, i) in cards" :key="c.id" :concept="c" :class="hideClass(i)" />
    </div>

    <div v-if="collapsible && n > 2" :class="toggleClass">
      <UButton
        :label="expanded ? '收起' : `顯示全部（${n} 張）`"
        :trailing-icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        color="neutral"
        variant="link"
        class="px-0"
        :aria-expanded="expanded"
        :aria-controls="gridId"
        @click="expanded = !expanded"
      />
    </div>
  </section>
</template>
