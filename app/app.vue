<script setup lang="ts">
// Nuxt UI 內建元件的文字（深淺色切換、抽屜關閉等無障礙標籤）用繁體中文
import { zh_tw } from '@nuxt/ui/locale'
</script>

<template>
  <UApp :locale="zh_tw">
    <NuxtPage />
  </UApp>
</template>
