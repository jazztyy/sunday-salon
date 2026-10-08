<script setup lang="ts">
// <NoteSheet> 屬性列的一列：左邊是圖示＋名稱，右邊是內容（預設 slot）。class 等屬性加在內容（dd）上。
defineOptions({ inheritAttrs: false })

defineProps<{
  icon: string
  label: string
}>()
</script>

<template>
  <dt class="flex items-center gap-1.5 text-muted"><UIcon :name="icon" class="size-3.5" />{{ label }}</dt>
  <dd v-bind="$attrs"><slot /></dd>
</template>
