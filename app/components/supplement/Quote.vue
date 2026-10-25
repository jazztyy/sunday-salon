<script setup lang="ts">
// 原文引文（DESIGN.md 6.9）：==…== 的段落是讀書會劃線的地方，套 hl-mark。
// 捲到時底線像螢光筆一樣刷過去；immediate 時掛載後直接刷（分頁開頭的題詞）。
import type { SupplementQuote } from '~/types/session'

const props = defineProps<{
  quote: SupplementQuote
  /** lead：分頁開頭的大字題詞 */
  size?: 'lead' | 'body'
  immediate?: boolean
}>()

const segments = computed(() => quoteSegments(props.quote.text))

const marks = useTemplateRef<HTMLElement[]>('marks')
const { reveal, motionOk } = useScrollReveal()

const sweep = (el: HTMLElement | SVGElement, delay: number) =>
  playFrom(el, { backgroundSize: '0% 100%' }, { duration: 1100, delay, easing: 'cubic-bezier(.45,0,.2,1)' })

onMounted(() => {
  for (const el of marks.value ?? []) {
    if (props.immediate) {
      if (motionOk()) sweep(el, 700)
    }
    else reveal(el, e => setFrame(e, { backgroundSize: '0% 100%' }), e => sweep(e, 250))
  }
})
</script>

<template>
  <blockquote class="flex flex-col gap-1.5">
    <p
      class="font-serif leading-relaxed text-highlighted"
      :class="size === 'lead' ? 'text-h2 leading-snug' : 'text-lead'"
    >
      <template v-for="(s, i) in segments" :key="i">
        <span v-if="s.hl" ref="marks" class="hl-mark px-px">{{ s.text }}</span>
        <template v-else>{{ s.text }}</template>
      </template>
    </p>
    <cite class="text-ui not-italic text-muted">{{ quote.cite }}</cite>
  </blockquote>
</template>
