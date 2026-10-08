<script lang="ts">
// 篩選欄的一組 pill（DESIGN.md 6.8「tag 篩選 pill」）：上面是組名，下面是一排可以按的 chip。
// multiple：v-model 是陣列，可以多選；否則 v-model 是單一值，allLabel 的「全部」chip 對應 null。
// 只負責畫面，選了什麼怎麼篩由各頁決定。組名後面的 slot 放說明文字。

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
}>()

const model = defineModel<M>({ required: true })

const id = useId()

/** 多選時選取的值，查詢用 Set（chip 多時不必每個都掃一次陣列） */
const picked = computed(() => new Set(Array.isArray(model.value) ? model.value : []))

const isOn = (value: T) => props.multiple ? picked.value.has(value) : model.value === value

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
        v-for="o in options"
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
    </div>
    <slot />
  </div>
</template>
