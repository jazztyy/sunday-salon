<script setup lang="ts">
// 全站共用的概念卡彈窗（掛在 app.vue）。內容是 <ConceptDetail>（左欄概念、右欄筆記）。
// 彈窗裡點別的概念卡會直接換內容並捲回頂端；點場次或 tag 會換頁，換頁時自動關閉。
// 底部固定一列「上一則／下一則」（<ConceptPager>），順序是從哪裡點進來就照那裡（useConceptModal 的 sequence）。
//
// 換卡不閃：id 是要看的卡，shown 是畫面上的卡。id 變了先等那張卡的資料到（多半已經預先抓好），再換 shown；
// 換的時候新卡進來、舊卡同時往旁邊淡出（舊卡疊在上面，彈窗高度直接變成新卡的，不會先縮再撐開）。
// 往後讀往左滑、往前讀往右滑，跳到別張是淡入。第一次打開還沒有資料時顯示骨架。
const { id, sequence, open: openCard, close } = useConceptModal()
const { data: concepts } = await useConceptIndex()
// 「出現在這些場次」要用，先開始抓（大部分頁面的 payload 已經有）
useSessionIndex()
const prefetch = useConceptPrefetch()

const concept = computed(() => concepts.value.find(c => c.id === id.value))

const open = computed({
  get: () => !!id.value && !!concept.value,
  set: (v: boolean) => { if (!v) close() },
})

const route = useRoute()
watch(() => route.fullPath, close)

/** 目前的閱讀順序（和 <ConceptPager> 一樣：有 sequence 用它，沒有用全部概念卡） */
const orderFor = (cid: string) => sequence.value?.includes(cid) ? sequence.value : concepts.value.map(c => c.id)

const shown = ref<string | null>(null)
const transition = ref<'slide-next' | 'slide-prev' | 'fade'>('fade')

watch(id, async (next, prev) => {
  if (!next) {
    shown.value = null
    return
  }
  const order = orderFor(next)
  const from = prev ? order.indexOf(prev) : -1
  const to = order.indexOf(next)
  transition.value = from >= 0 && to >= 0 ? (to > from ? 'slide-next' : 'slide-prev') : 'fade'
  await prefetch(next)
  if (id.value !== next) return // 等的時候又換了別張
  shown.value = next
  // 前後兩張先抓好，按上一則／下一則時直接換
  for (const near of [order[to - 1], order[to + 1]]) if (near) prefetch(near)
}, { immediate: true })

const body = useTemplateRef<HTMLElement>('body')
watch(shown, () => nextTick(() => body.value?.closest('[data-slot="body"]')?.scrollTo({ top: 0 })))
</script>

<template>
  <UModal
    v-model:open="open"
    :title="concept?.title ?? '概念卡'"
    :close="false"
    :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
    :ui="{ content: 'sm:max-w-5xl', header: 'sr-only', body: 'p-0 sm:p-0' }"
  >
    <template #body>
      <div ref="body" class="relative overflow-x-clip">
        <UButton
          icon="i-lucide-x"
          aria-label="關閉"
          color="neutral"
          variant="ghost"
          size="sm"
          class="absolute top-3 right-3 z-20"
          @click="close"
        />

        <!-- 第一次打開、資料還沒到：骨架（版面和 <ConceptDetail> 一樣，換成真的內容時不會跳） -->
        <div v-if="!shown" class="grid lg:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true">
          <span class="sr-only">載入中…</span>
          <div class="flex flex-col gap-3 p-6 sm:p-8">
            <USkeleton class="h-3 w-12" />
            <USkeleton class="h-10 w-48" />
            <USkeleton class="h-3 w-32" />
            <USkeleton class="mt-6 h-4 w-full" />
            <USkeleton class="h-4 w-11/12" />
            <USkeleton class="h-4 w-3/4" />
          </div>
          <div class="flex flex-col gap-3 border-t border-default bg-elevated p-6 sm:p-8 lg:border-t-0 lg:border-l lg:pt-14">
            <USkeleton class="h-5 w-24" />
            <USkeleton class="h-40 w-full" />
          </div>
        </div>

        <Transition
          :name="transition"
          :leave-active-class="`${transition}-leave-active pointer-events-none absolute inset-x-0 top-0`"
        >
          <ConceptDetail v-if="shown" :key="shown" :id="shown" />
        </Transition>

        <div v-if="id" class="sticky bottom-0 z-10 border-t border-default bg-default/95 px-3 py-1.5 backdrop-blur">
          <ConceptPager :current="id" :ids="sequence" mode="modal" @go="openCard" />
        </div>
      </div>
    </template>
  </UModal>
</template>
