<script setup lang="ts">
// 「延續討論」：和這場有關的其他場次（人工連結＋共同概念），規則見 composables/useRelatedSessions.ts。
// 沒有相關場次時整個區塊不顯示。
import type { Session } from '~/types/session'

const props = defineProps<{ session: Session }>()

const related = useRelatedSessions(() => props.session)
</script>

<template>
  <section v-if="related.length" class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">延續討論</h2>
    <p class="text-small text-muted">這週的主題和以前的場次有關，可以回頭看看。</p>
    <ul class="flex flex-col gap-2.5">
      <li
        v-for="item in related"
        :key="item.session.slug"
        class="flex flex-col gap-1 rounded-card border border-default bg-elevated px-3.5 py-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono text-meta text-muted">{{ item.session.dateLabel }}</span>
          <UBadge
            :label="item.kind === 'manual' ? '主辦人推薦' : '共同概念'"
            :color="item.kind === 'manual' ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            class="rounded-tag text-meta"
          />
        </div>
        <NuxtLink
          :to="`/s/${item.session.slug}`"
          class="self-start font-serif text-lead font-semibold leading-relaxed text-highlighted underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {{ item.session.title }}
        </NuxtLink>
        <p class="text-small text-toned">{{ item.reason }}</p>
      </li>
    </ul>
  </section>
</template>
