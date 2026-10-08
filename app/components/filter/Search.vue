<script setup lang="ts">
// 篩選欄最上面的搜尋框：放大鏡圖示，有字時右邊出現「清除搜尋」按鈕。
defineProps<{
  placeholder: string
  /** 無障礙名稱（aria-label），例如「搜尋場次」 */
  label: string
}>()

const query = defineModel<string>({ required: true })
</script>

<template>
  <UInput
    v-model="query"
    type="text"
    enterkeyhint="search"
    icon="i-lucide-search"
    :placeholder="placeholder"
    :aria-label="label"
    class="w-full"
    :ui="{ base: 'text-ui', trailing: 'pe-1' }"
  >
    <template v-if="query" #trailing>
      <UButton
        icon="i-lucide-x"
        aria-label="清除搜尋"
        color="neutral"
        variant="link"
        size="xs"
        @click="query = ''"
      />
    </template>
  </UInput>
</template>
