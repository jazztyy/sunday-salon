<script setup lang="ts">
// 概念卡的「上一則／下一則」：讀完一張直接往下讀，不用回到列表。
// 順序：ids（從哪裡點進來就照那裡的順序，見 useConceptModal 的 sequence）；沒給或不含目前這張時用全部概念卡的順序。
// 彈窗（mode 'modal'）：按鈕換卡，也可以用鍵盤 ← →（正在打字時不算）。
// /c/{id} 頁面（mode 'page'）：一般連結換頁，加 data-no-modal 讓 app.vue 不攔成彈窗。
const props = defineProps<{
  current: string
  ids?: string[] | null
  mode: 'modal' | 'page'
}>()
const emit = defineEmits<{ go: [id: string] }>()

const { data: concepts } = useConceptIndex()
const titleOf = computed(() => new Map(concepts.value.map(c => [c.id, c.title])))

const order = computed(() =>
  props.ids?.includes(props.current) ? props.ids : concepts.value.map(c => c.id),
)
const index = computed(() => order.value.indexOf(props.current))
const prev = computed(() => index.value > 0 ? order.value[index.value - 1] : undefined)
const next = computed(() => index.value >= 0 && index.value < order.value.length - 1 ? order.value[index.value + 1] : undefined)

const go = (id?: string) => { if (id) emit('go', id) }

/** 彈窗裡用 ← → 換卡；焦點在輸入框或筆記編輯器時不攔 */
if (props.mode === 'modal') {
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    const el = document.activeElement as HTMLElement | null
    if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
    if (e.key === 'ArrowLeft' && prev.value) { e.preventDefault(); go(prev.value) }
    if (e.key === 'ArrowRight' && next.value) { e.preventDefault(); go(next.value) }
  })
}

const linkClass = 'group flex min-w-0 max-w-[46%] items-center gap-1.5 rounded-control px-2 py-1.5 text-ui text-muted transition-colors hover:bg-accented hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary'
</script>

<template>
  <nav v-if="order.length > 1 && index >= 0" aria-label="上一則、下一則概念卡" class="flex items-center gap-2">
    <template v-if="prev">
      <NuxtLink v-if="mode === 'page'" :to="`/c/${prev}`" data-no-modal :class="linkClass">
        <UIcon name="i-lucide-chevron-left" class="size-4 shrink-0" />
        <span class="truncate"><span class="text-dimmed">上一則・</span>{{ titleOf.get(prev) }}</span>
      </NuxtLink>
      <button v-else type="button" :class="linkClass" @click="go(prev)">
        <UIcon name="i-lucide-chevron-left" class="size-4 shrink-0" />
        <span class="truncate"><span class="text-dimmed">上一則・</span>{{ titleOf.get(prev) }}</span>
      </button>
    </template>

    <span class="mx-auto shrink-0 font-mono text-meta text-dimmed">{{ index + 1 }} / {{ order.length }}</span>

    <template v-if="next">
      <NuxtLink v-if="mode === 'page'" :to="`/c/${next}`" data-no-modal :class="[linkClass, 'justify-end']">
        <span class="truncate"><span class="text-dimmed">下一則・</span>{{ titleOf.get(next) }}</span>
        <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0" />
      </NuxtLink>
      <button v-else type="button" :class="[linkClass, 'justify-end']" @click="go(next)">
        <span class="truncate"><span class="text-dimmed">下一則・</span>{{ titleOf.get(next) }}</span>
        <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0" />
      </button>
    </template>
  </nav>
</template>
