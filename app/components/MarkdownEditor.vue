<script setup lang="ts">
// 筆記用的 Markdown 編輯器（Nuxt UI 的 UEditor，TipTap）。內容讀寫都是 Markdown 字串，和筆記匯出的格式一致。
// 工具列：標題、粗體、斜體、刪除線、行內程式碼、清單、引用、復原／重做。也可以直接打 Markdown 語法（## 、**、- ），會自動轉換。
// 只在瀏覽器渲染（筆記存在 localStorage，預先產生的 HTML 不需要編輯器）。
// 一律用 <LazyMarkdownEditor>：TipTap／ProseMirror 很大（約 190KB gzip），不要進到每一頁的首次載入。
import type { EditorToolbarItem } from '@nuxt/ui'

const props = withDefaults(defineProps<{
  placeholder?: string
  /** 編輯區最小高度（Tailwind class），例：'min-h-48' */
  minHeight?: string
  autofocus?: boolean
}>(), { placeholder: '開始寫…', minHeight: 'min-h-40', autofocus: false })

const model = defineModel<string>({ default: '' })

const items: EditorToolbarItem[][] = [
  [
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', 'aria-label': '標題' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', 'aria-label': '小標題' },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': '粗體' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': '斜體' },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', 'aria-label': '刪除線' },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', 'aria-label': '行內程式碼' },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': '項目清單' },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': '編號清單' },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', 'aria-label': '引用' },
  ],
  [
    { kind: 'undo', icon: 'i-lucide-undo-2', 'aria-label': '復原' },
    { kind: 'redo', icon: 'i-lucide-redo-2', 'aria-label': '重做' },
  ],
]
</script>

<template>
  <ClientOnly>
    <UEditor
      v-slot="{ editor }"
      v-model="model"
      content-type="markdown"
      :placeholder="{ placeholder: props.placeholder, mode: 'firstLine' }"
      :image="false"
      :mention="false"
      :autofocus="props.autofocus ? 'end' : false"
      class="flex w-full flex-col gap-2"
      :ui="{ base: ['px-0! sm:px-0! *:my-2! focus-visible:outline-none! text-body-sm leading-relaxed text-default', props.minHeight] }"
    >
      <UEditorToolbar
        :editor="editor"
        :items="items"
        size="xs"
        class="-mx-1 flex-wrap border-b border-default pb-1.5"
      />
    </UEditor>
    <!-- 掛載前：同高度的骨架（工具列＋幾行字），出來時版面不跳 -->
    <template #fallback>
      <MarkdownEditorSkeleton :min-height="props.minHeight" />
    </template>
  </ClientOnly>
</template>
