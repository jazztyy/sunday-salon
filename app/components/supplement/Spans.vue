<script setup lang="ts">
// 每章涵蓋多長的時間（DESIGN.md 6.9）：橫向長條、對數刻度。捲到時長條依序長出來。
import type { Supplement, SupplementChapter } from '~/types/session'

const props = defineProps<{
  spans: NonNullable<Supplement['plot']['spans']>
  chapters: SupplementChapter[]
}>()

const ticks = SPAN_TICKS

const lightNums = computed(() => new Set(props.chapters.filter(c => c.light).map(c => c.num)))

const rows = computed(() => props.spans.rows.map(r => ({
  ...r,
  width: `${spanPercent(r.hours)}%`,
  light: lightNums.value.has(r.num),
})))

const chart = useTemplateRef<HTMLElement>('chart')
const { reveal } = useScrollReveal()

onMounted(() => {
  reveal(chart.value, (el) => {
    el.querySelectorAll<HTMLElement>('[data-bar]').forEach(b => setFrame(b, { transform: 'scaleX(0)' }))
  }, (el) => {
    el.querySelectorAll<HTMLElement>('[data-bar]').forEach((b, i) =>
      playFrom(b, { transform: 'scaleX(0)' }, { duration: 800, delay: i * 60, easing: EASE_OUT }))
  })
})
</script>

<template>
  <figure class="flex flex-col gap-3.5">
    <p class="flex flex-col font-serif text-title font-bold text-highlighted">
      <span class="font-sans text-meta font-normal tracking-[.12em] text-muted">示意圖</span>
      {{ spans.title }}
    </p>
    <div
      ref="chart"
      role="img"
      :aria-label="`${spans.title}：${spans.rows.map(r => `第 ${r.num} 章${r.label}`).join('、')}`"
      class="flex flex-col gap-2 border-y border-default py-3.5"
    >
      <div
        v-for="r in rows"
        :key="r.num"
        aria-hidden="true"
        class="grid grid-cols-[2rem_minmax(0,1fr)_4.75rem] items-center gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_6rem] sm:gap-3"
      >
        <span class="text-right font-serif text-small" :class="r.light ? 'font-bold text-primary' : 'text-muted'">{{ r.num }}</span>
        <span class="relative h-3">
          <span
            v-for="tick in ticks.slice(1)"
            :key="tick.label"
            class="absolute inset-y-0 border-l border-default"
            :style="{ left: `${tick.at}%` }"
          />
          <!-- 長條寬度由資料決定，只能用 :style（DESIGN.md 7） -->
          <span
            data-bar
            class="absolute inset-y-0 left-0 origin-left rounded-r-tag"
            :class="r.prologue ? 'bg-accented' : r.light ? 'bg-primary' : 'bg-inverted'"
            :style="{ width: r.width }"
          />
        </span>
        <span class="whitespace-nowrap text-ui" :class="r.light ? 'font-bold text-primary' : 'text-muted'">{{ r.label }}</span>
      </div>
      <div aria-hidden="true" class="grid grid-cols-[2rem_minmax(0,1fr)_4.75rem] gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_6rem] sm:gap-3">
        <span />
        <span class="relative h-5 text-label text-muted">
          <span
            v-for="(tick, i) in ticks"
            :key="tick.label"
            class="absolute top-0 whitespace-nowrap"
            :class="i ? '-translate-x-1/2' : ''"
            :style="{ left: `${tick.at}%` }"
          >{{ tick.label }}</span>
        </span>
        <span />
      </div>
    </div>
    <figcaption class="text-small leading-relaxed text-muted">{{ spans.caption }}</figcaption>
  </figure>
</template>
