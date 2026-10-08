<script lang="ts">
// 篩選欄的一組 pill（DESIGN.md 6.8「tag 篩選 pill」）：上面是組名，下面是一排可以按的 chip。
// multiple：v-model 是陣列，可以多選；否則 v-model 是單一值，allLabel 的「全部」chip 對應 null。
// 只負責畫面，選了什麼怎麼篩由各頁決定。組名後面的 slot 放說明文字。
// limit：選項多時先只顯示 limit 個，其他收在「顯示全部（N）」。rank='count' 時留用得最多的（依 count），
// 否則留前面幾個（例如場次是新的在前）。已選的不管排第幾都一定顯示；只多出一兩個時不收。

export interface FilterChipOption<V> {
  value: V
  label: string
  /** 有數字時顯示成「{label} {count}」 */
  count?: number
  /** 個別 chip 額外的 class，例如年份用 font-mono */
  class?: string | Record<string, boolean>
}
</script>

<script setup lang="ts" generic="T extends string | number, M extends T | T[] | null">
const props = defineProps<{
  label: string
  options: FilterChipOption<T>[]
  /** 單選時第一個「全部」chip 的文字；不給就沒有這個 chip */
  allLabel?: string
  multiple?: boolean
  /** 收起時顯示幾個；不給就全部顯示 */
  limit?: number
  /** 收起時留哪些：'count' 留 count 最大的，'order'（預設）留前面的 */
  rank?: 'count' | 'order'
  /** 展開按鈕的文字，後面會接（隱藏的數量） */
  moreLabel?: string
}>()

const model = defineModel<M>({ required: true })

const id = useId()

/** 多選時選取的值，查詢用 Set（chip 多時不必每個都掃一次陣列） */
const picked = computed(() => new Set(Array.isArray(model.value) ? model.value : []))

const isOn = (value: T) => props.multiple ? picked.value.has(value) : model.value === value

/** 至少要多出這麼多個才收起，免得「顯示全部（1）」 */
const MIN_HIDDEN = 3

const expanded = ref(false)

const collapsible = computed(() => props.limit !== undefined && props.options.length - props.limit >= MIN_HIDDEN)

/** 收起時要顯示的選項（維持原本順序） */
const shown = computed(() => {
  if (!collapsible.value || expanded.value) return props.options
  const ranked = props.rank === 'count'
    ? [...props.options].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    : props.options
  const keep = new Set(ranked.slice(0, props.limit).map(o => o.value))
  return props.options.filter(o => keep.has(o.value) || isOn(o.value))
})

const hiddenCount = computed(() => props.options.length - shown.value.length)

const choose = (value: T) => {
  if (!props.multiple) {
    model.value = value as M
    return
  }
  const list = (model.value ?? []) as T[]
  model.value = (picked.value.has(value) ? list.filter(v => v !== value) : [...list, value]) as M
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span :id="id" class="text-ui text-muted">{{ label }}</span>
    <div role="group" :aria-labelledby="id" class="flex flex-wrap gap-1.5">
      <UButton
        v-if="allLabel !== undefined && !multiple"
        :label="allLabel"
        color="neutral"
        :variant="model === null ? 'solid' : 'outline'"
        size="xs"
        :aria-pressed="model === null"
        class="rounded-full px-3"
        :ui="{ label: 'text-ui font-medium' }"
        @click="model = null as M"
      />
      <UButton
        v-for="o in shown"
        :key="o.value"
        :label="o.count === undefined ? o.label : `${o.label} ${o.count}`"
        color="neutral"
        :variant="isOn(o.value) ? 'solid' : 'outline'"
        size="xs"
        :aria-pressed="isOn(o.value)"
        class="rounded-full px-3"
        :class="o.class"
        :ui="{ label: 'text-ui font-medium' }"
        @click="choose(o.value)"
      />
      <UButton
        v-if="collapsible"
        :label="expanded ? '收起' : `${moreLabel ?? '顯示全部'}（${hiddenCount}）`"
        :trailing-icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        color="neutral"
        variant="link"
        size="xs"
        :aria-expanded="expanded"
        class="px-1 text-muted hover:text-highlighted"
        :ui="{ label: 'text-ui', trailingIcon: 'size-3.5' }"
        @click="expanded = !expanded"
      />
    </div>
    <slot />
  </div>
</template>
