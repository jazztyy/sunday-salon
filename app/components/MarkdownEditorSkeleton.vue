<script setup lang="ts">
// 文字編輯器還沒出來時的骨架：一排工具列按鈕＋幾行字，高度和 <MarkdownEditor> 一樣，載入完不會跳。
// 用在 <MarkdownEditor> 的 ClientOnly fallback，和 <LazyMarkdownEditor> 外面的 <Suspense>（編輯器的程式還在下載時）。
// 骨架用 bg-accented：編輯器常放在卡片（bg-elevated）或視窗上，預設的 bg-elevated 會看不見。
withDefaults(defineProps<{
  /** 編輯區最小高度（Tailwind class），和 <MarkdownEditor> 的 minHeight 相同 */
  minHeight?: string
}>(), { minHeight: 'min-h-40' })

/** 工具列四組按鈕的個數（標題／文字樣式／清單與引用／復原），和 MarkdownEditor 的 items 對應 */
const GROUPS = [2, 4, 3, 2]
</script>

<template>
  <div class="flex w-full flex-col gap-2" aria-busy="true">
    <span class="sr-only">載入中…</span>
    <div class="-mx-1 flex flex-wrap items-center gap-1.5 border-b border-default pb-1.5" aria-hidden="true">
      <template v-for="(n, g) in GROUPS" :key="g">
        <span v-if="g" class="h-4 w-px bg-accented" />
        <div class="flex items-center gap-0.5 px-1">
          <USkeleton v-for="i in n" :key="i" class="size-6 rounded-control bg-accented" />
        </div>
      </template>
    </div>
    <div class="mb-2 flex flex-col gap-2.5 py-2.5" :class="minHeight" aria-hidden="true">
      <USkeleton class="h-3.5 w-11/12 bg-accented" />
      <USkeleton class="h-3.5 w-4/5 bg-accented" />
      <USkeleton class="h-3.5 w-3/5 bg-accented" />
    </div>
  </div>
</template>
