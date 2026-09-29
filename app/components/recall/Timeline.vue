<script setup lang="ts">
// 「複習節奏」：四個複習時間點（DESIGN.md「容器」→ 複習節奏）。
const STEPS: [when: string, what: string][] = [
  ['看完當天', '白紙回想＋做一次測驗'],
  ['隔天', '只翻標成「還不熟」的名詞卡'],
  ['週日活動前', '再做一次測驗（題目會打亂）'],
  ['活動後一週', '回來看回顧，再回想一次'],
]
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">複習節奏</h2>
    <ol class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
      <li
        v-for="[when, what] in STEPS"
        :key="when"
        class="flex flex-col gap-0.5 rounded-card border border-default bg-muted px-3 py-2.5 text-small"
      >
        <span class="font-mono text-meta font-medium text-primary">{{ when }}</span>
        {{ what }}
      </li>
    </ol>
    <WhyNote>間隔複習：同樣的時間分散在幾天，比一次看完記得久得多。</WhyNote>
  </section>
</template>
