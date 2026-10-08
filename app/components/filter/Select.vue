<script setup lang="ts">
// 篩選欄的單選下拉選單（場次用）：一年會多 52 場，攤開成 chip 太長；下拉選單不管幾場都只佔一行，
// 可以打字搜尋（「靈魂」「10/4」都找得到）。v-model 是選的值，null 是全部；右邊的 ✕ 清掉。
// 選了什麼由篩選欄上面的 <FilterSummary> 顯示。
const props = defineProps<{
  label: string
  options: { value: string, label: string }[]
  /** 沒選時顯示的文字 */
  placeholder: string
  /** 搜尋框的提示文字 */
  searchPlaceholder?: string
}>()

const model = defineModel<string | null>({ required: true })

/** USelectMenu 清除時給 undefined，這裡一律換成 null */
const value = computed({
  get: () => model.value ?? undefined,
  set: (v: string | null | undefined) => { model.value = v ?? null },
})

const id = useId()

/** 「10/4 靈魂與永生」→ ['10/4', '靈魂與永生']；開頭不是日期就整個當主題 */
const splitDate = (text: string): [string, string] => {
  const m = text.match(/^(\d{1,2}\/\d{1,2})\s+(.+)$/)
  return m ? [m[1]!, m[2]!] : ['', text]
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-ui text-muted">{{ props.label }}</label>
    <USelectMenu
      :id="id"
      v-model="value"
      :items="props.options"
      value-key="value"
      label-key="label"
      :placeholder="props.placeholder"
      :search-input="{ placeholder: props.searchPlaceholder ?? '搜尋…' }"
      :clear="model !== null"
      size="sm"
      class="w-full"
      :ui="{ base: 'text-ui', placeholder: 'text-muted', itemLabel: 'text-ui' }"
    >
      <template #item-label="{ item }">
        <span class="flex items-baseline gap-2.5">
          <span v-if="splitDate(item.label)[0]" class="w-11 shrink-0 font-mono text-meta text-muted">{{ splitDate(item.label)[0] }}</span>
          <span>{{ splitDate(item.label)[1] }}</span>
        </span>
      </template>
    </USelectMenu>
  </div>
</template>
