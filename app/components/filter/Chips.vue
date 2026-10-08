<script lang="ts">
// 篩選欄的一組 pill（DESIGN.md 6.8「tag 篩選 pill」）：上面是組名，下面是一排可以按的 chip。
// multiple：v-model 是陣列，可以多選；否則 v-model 是單一值，allLabel 的「全部」chip 對應 null。
// 只負責畫面，選了什麼怎麼篩由各頁決定。組名後面的 slot 放說明文字。
// limit：選項多時先只顯示 limit 個，其他收在「顯示全部（N）」。rank='count' 時留用得最多的（依 count），
// 否則留前面幾個（例如場次是新的在前）。已選的不管排第幾都一定顯示；只多出一兩個時不收。
// list：改成一行一個的直排清單（場次用）。label 開頭是日期（「10/4 靈魂與永生」）時，日期放在固定寬度的左欄，主題對齊。

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
  /** 一行一個的直排清單，不用 pill */
  list?: boolean
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

/** 收起時留下的選項 */
const kept = computed(() => {
  const ranked = props.rank === 'count'
    ? [...props.options].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    : props.options
  return new Set(ranked.slice(0, props.limit).map(o => o.value))
})

/** 要顯示的選項（維持原本順序） */
const shown = computed(() => {
  if (!collapsible.value || expanded.value) return props.options
  return props.options.filter(o => kept.value.has(o.value) || isOn(o.value))
})

/** 按「顯示全部」才出現的選項淡入（animate-reveal，DESIGN.md「動態」） */
const revealClass = (value: T) => collapsible.value && expanded.value && !kept.value.has(value) && 'animate-reveal'

/** 「10/4 靈魂與永生」→ ['10/4', '靈魂與永生']；開頭不是日期就整個當主題 */
const splitDate = (text: string): [string, string] => {
  const m = text.match(/^(\d{1,2}\/\d{1,2})\s+(.+)$/)
  return m ? [m[1]!, m[2]!] : ['', text]
}

const rowClass = (on: boolean) => on
  ? 'bg-inverted font-medium text-inverted'
  : 'text-toned hover:bg-accented hover:text-highlighted'

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
    <!-- 直排清單（場次） -->
    <div v-if="list" role="group" :aria-labelledby="id" class="flex flex-col gap-0.5">
      <button
        v-if="allLabel !== undefined && !multiple"
        type="button"
        class="flex w-full items-baseline gap-2.5 rounded-control px-2 py-1 text-left text-ui transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        :class="rowClass(model === null)"
        :aria-pressed="model === null"
        @click="model = null as M"
      >
        {{ allLabel }}
      </button>
      <button
        v-for="o in shown"
        :key="o.value"
        type="button"
        class="flex w-full items-baseline gap-2.5 rounded-control px-2 py-1 text-left text-ui transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        :class="[rowClass(isOn(o.value)), o.class, revealClass(o.value)]"
        :aria-pressed="isOn(o.value)"
        @click="choose(o.value)"
      >
        <span class="w-11 shrink-0 font-mono text-meta" :class="isOn(o.value) ? '' : 'text-muted'">{{ splitDate(o.label)[0] }}</span>
        <span class="min-w-0 truncate">{{ splitDate(o.label)[1] }}</span>
        <span v-if="o.count !== undefined" class="ml-auto font-mono text-meta" :class="isOn(o.value) ? '' : 'text-dimmed'">{{ o.count }}</span>
      </button>
      <UButton
        v-if="collapsible"
        :label="expanded ? '收起' : `${moreLabel ?? '顯示全部'}（${hiddenCount}）`"
        :trailing-icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        color="neutral"
        variant="link"
        size="xs"
        :aria-expanded="expanded"
        class="self-start px-2 text-muted hover:text-highlighted"
        :ui="{ label: 'text-ui', trailingIcon: 'size-3.5' }"
        @click="expanded = !expanded"
      />
    </div>

    <div v-else role="group" :aria-labelledby="id" class="flex flex-wrap gap-1.5">
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
        :class="[o.class, revealClass(o.value)]"
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
