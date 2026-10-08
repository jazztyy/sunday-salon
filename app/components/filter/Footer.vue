<script setup lang="ts">
// 篩選欄最下面：「共 N 場」，有篩選條件時旁邊有「清除篩選」。數字變動時螢幕閱讀器會念出來。
defineProps<{
  count: number
  /** 單位：場、張、則… */
  unit: string
  hasFilter: boolean
}>()

const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <div class="flex items-center gap-3 border-t border-default pt-3 text-ui text-muted" aria-live="polite">
    <span>共 {{ count }} {{ unit }}</span>
    <UButton
      v-if="hasFilter"
      label="清除篩選"
      color="secondary"
      variant="link"
      size="xs"
      class="p-0"
      :ui="{ label: 'text-ui' }"
      @click="emit('clear')"
    />
  </div>
</template>
