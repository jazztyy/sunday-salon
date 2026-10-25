<script setup lang="ts">
// 原著裡的一份文件（DESIGN.md 6.9），例：第一章同事在報上讀到的黑框訃聞。上方一根燭火。
import type { Supplement } from '~/types/session'

defineProps<{ notice: NonNullable<Supplement['notice']> }>()
</script>

<template>
  <figure class="flex flex-col gap-3">
    <div class="border-8 border-inverted bg-elevated p-1.5">
      <div class="flex flex-col items-center gap-2 border border-inverted px-5 py-7 text-center text-highlighted">
        <svg class="mb-1 overflow-visible" width="30" height="50" viewBox="0 0 30 50" aria-hidden="true">
          <circle class="sup-halo text-primary" fill="currentColor" opacity=".22" cx="15" cy="12" r="11" />
          <path class="sup-flame text-primary" fill="currentColor" d="M15 2 C19.5 8 20.5 12.5 15 19 C9.5 12.5 10.5 8 15 2 Z" />
          <line x1="15" y1="19" x2="15" y2="23" stroke="currentColor" stroke-width="1.5" />
          <rect x="9.5" y="23" width="11" height="25" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <p class="text-small leading-relaxed">
          <template v-for="(line, i) in notice.lines" :key="i">{{ line }}<br v-if="i < notice.lines.length - 1"></template>
        </p>
        <p class="my-1 font-serif text-h2 font-black leading-snug tracking-[.06em]">{{ notice.name }}</p>
        <p class="text-small tracking-[.3em]">{{ notice.role }}</p>
        <p class="mt-2 font-bold">{{ notice.date }}</p>
        <p class="text-small">{{ notice.note }}</p>
      </div>
    </div>
    <figcaption class="text-ui leading-relaxed text-muted">{{ notice.caption }}</figcaption>
  </figure>
</template>
