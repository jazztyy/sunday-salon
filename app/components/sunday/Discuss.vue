<script setup lang="ts">
// 討論題：serif 金色編號。超出影片內容的題目加「延伸」標籤。
import type { DiscussItem } from '~/types/session'

defineProps<{ items: DiscussItem[] }>()
</script>

<template>
  <ol class="flex flex-col gap-4.5">
    <li v-for="([question, context, extended], i) in items" :key="i" class="grid grid-cols-[2em_1fr] gap-2.5">
      <span class="font-serif text-h2 font-black leading-snug text-primary">{{ i + 1 }}</span>
      <div class="flex flex-col gap-1">
        <p>
          {{ question }}
          <UBadge
            v-if="extended"
            label="延伸"
            color="secondary"
            variant="soft"
            class="ms-1.5 rounded-tag bg-secondary-soft px-1.5 py-0 align-middle font-medium text-label"
          />
        </p>
        <p class="text-small text-muted">{{ context }}</p>
      </div>
    </li>
  </ol>
</template>
