<script setup lang="ts">
// 概念卡（卡片牆用）：整張卡片連到 /c/{id}（站內點擊會開彈窗，見 app.vue）。
// 出現過幾場不放在卡片上，只在詳情（<ConceptDetail>）列出。
// 規格見 DESIGN.md「元件目錄」。
import type { Concept } from '~/types/session'

const props = defineProps<{ concept: Concept }>()
</script>

<template>
  <NuxtLink
    :to="`/c/${props.concept.id}`"
    class="flex h-full flex-col gap-3 rounded-card border border-default bg-elevated p-4 transition-colors hover:border-secondary/70 hover:bg-accented focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  >
    <div class="flex flex-col gap-0.5">
      <h3 class="font-serif text-title font-black leading-snug text-highlighted">{{ props.concept.title }}</h3>
      <p class="font-mono text-meta text-muted">{{ props.concept.en }}</p>
    </div>

    <p class="line-clamp-3 text-small leading-relaxed text-toned">{{ props.concept.summary }}</p>

    <ul v-if="props.concept.tags.length" class="mt-auto flex flex-wrap gap-1" aria-label="標籤">
      <li v-for="tag in props.concept.tags" :key="tag">
        <UBadge :label="tag" color="neutral" variant="subtle" class="rounded-tag text-label" />
      </li>
    </ul>
  </NuxtLink>
</template>
