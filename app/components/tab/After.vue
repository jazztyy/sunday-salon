<script setup lang="ts">
// 「活動後」分頁：目前是待補狀態（SPEC.md 4.5）。
import type { Session } from '~/types/session'

defineProps<{ session: Session }>()
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">活動後</h2>
    <div class="flex flex-col gap-2 rounded-card border border-dashed border-default p-5 text-toned">
      <b>尚未舉行</b>
      <p>{{ session.after }}</p>
    </div>
  </section>
</template>
