<script setup lang="ts">
// 依場次分組的標題（/notes 的筆記和作答紀錄）：場次 chip（連到場次頁）和數量，下一行是那場的題目。
// session 是 null 時是不屬於任何場次的那一組，顯示 otherLabel，不是連結。
withDefaults(defineProps<{
  session: { slug: string, chip: string, title: string } | null
  count: number
  /** 數量的單位：則、題 */
  unit: string
  otherLabel?: string
}>(), { otherLabel: '其他筆記' })
</script>

<template>
  <h2 class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
    <NuxtLink
      v-if="session"
      :to="`/s/${session.slug}`"
      class="font-serif text-h2 leading-snug font-semibold text-highlighted hover:text-secondary focus-visible:outline-2 focus-visible:outline-primary"
    >
      {{ session.chip }}
    </NuxtLink>
    <span v-else class="font-serif text-h2 leading-snug font-semibold text-highlighted">{{ otherLabel }}</span>
    <span class="font-sans text-ui font-normal text-muted">{{ count }} {{ unit }}</span>
    <span v-if="session" class="basis-full text-small text-muted">{{ session.title }}</span>
  </h2>
</template>
