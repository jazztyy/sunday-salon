<script setup lang="ts">
// 篩選欄最上面的「已選」摘要：目前選了哪些條件，點 ✕ 取消；右邊是「清除篩選」。
// 收起來的選項（<FilterChips limit>）被選了也看得到。搜尋字不列在這裡（搜尋框裡就看得到），但算在 hasFilter。
// 沒有任何條件時整個不顯示。
export interface FilterSummaryItem {
  key: string
  label: string
  remove: () => void
}

defineProps<{ items: FilterSummaryItem[], hasFilter: boolean }>()
const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <div v-if="hasFilter" class="flex flex-col gap-1.5">
    <div class="flex items-center gap-3">
      <span v-if="items.length" class="text-ui text-muted">已選</span>
      <UButton
        label="清除篩選"
        color="secondary"
        variant="link"
        size="xs"
        class="ml-auto p-0"
        :ui="{ label: 'text-ui' }"
        @click="emit('clear')"
      />
    </div>
    <ul v-if="items.length" class="flex flex-wrap gap-1.5">
      <li v-for="item in items" :key="item.key">
        <UButton
          :label="item.label"
          trailing-icon="i-lucide-x"
          color="primary"
          variant="subtle"
          size="xs"
          :aria-label="`取消「${item.label}」`"
          class="rounded-full px-3"
          :ui="{ label: 'text-ui font-medium', trailingIcon: 'size-3.5' }"
          @click="item.remove()"
        />
      </li>
    </ul>
  </div>
</template>
