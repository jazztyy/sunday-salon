<script setup lang="ts">
// 篩選結果的數量，只給螢幕閱讀器：條件一變就念出「共 N 場」。畫面上不顯示（Kai 決定：側欄不需要計數文字）。
defineProps<{
  count: number
  /** 單位：場、張、則… */
  unit: string
}>()
</script>

<template>
  <p class="sr-only" aria-live="polite">共 {{ count }} {{ unit }}</p>
</template>
