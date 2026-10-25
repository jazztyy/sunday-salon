<script setup lang="ts">
// 翻頁書的一頁（DESIGN.md 6.9）：封面、目錄、章節、結尾。翻到時要再浮現的元素標上 data-title、data-char、data-light。
import type { BookPage } from '~/utils/supplement'

const props = defineProps<{
  page: BookPage
  /** 頁碼（也是在 pages 裡的位置） */
  index: number
  pages: BookPage[]
  title: string
  original?: string
}>()

const emit = defineEmits<{ jump: [index: number] }>()

const toc = computed(() => props.pages.flatMap((p, i) => (p.kind === 'chapter' ? [{ i, chapter: p.chapter, first: p.first }] : [])))
const endChars = computed(() => (props.page.kind === 'end' ? Array.from(props.page.line) : []))

const pad = 'flex h-full flex-col gap-3 px-6 pt-6 pb-4 sm:px-9 sm:pt-8'
</script>

<template>
  <div v-if="page.kind === 'cover'" class="flex h-full flex-col bg-inverted p-4 text-inverted">
    <div class="flex flex-1 flex-col items-center justify-center gap-3 border border-default px-5 py-8 text-center">
      <p v-if="original" class="text-small italic opacity-75">{{ original }}</p>
      <p class="font-serif text-h1 font-black leading-tight tracking-[.06em]">{{ title }}</p>
      <span class="sup-glow-dot my-4 size-2.5 rounded-full bg-primary" />
      <p class="text-ui opacity-60">點頁面或按「下一頁」翻開</p>
    </div>
  </div>

  <div v-else-if="page.kind === 'toc'" :class="pad">
    <div class="flex justify-between gap-4 border-b border-default pb-2 text-label tracking-[.16em] text-muted">
      <span>{{ title }}</span>
    </div>
    <p class="font-serif text-title font-black text-highlighted">目錄</p>
    <ol class="flex flex-col">
      <li v-for="c in toc" :key="c.i">
        <button
          type="button"
          class="grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-2 border-b border-dotted border-default px-1 py-1 text-left text-small transition-colors hover:bg-accented"
          @click.stop="emit('jump', c.i)"
        >
          <span class="font-serif" :class="c.chapter.light ? 'font-bold text-primary' : 'text-muted'">{{ c.chapter.num }}</span>
          <span :class="c.chapter.light ? 'font-bold text-primary' : 'text-highlighted'">{{ c.chapter.title }}</span>
          <span class="whitespace-nowrap text-label tracking-[.08em] text-muted">{{ c.first ? c.chapter.arc : '' }}</span>
        </button>
      </li>
    </ol>
    <p class="mt-auto pt-3 text-center font-mono text-meta text-muted">{{ index }}</p>
  </div>

  <div v-else-if="page.kind === 'chapter'" :class="[pad, page.chapter.light && 'book-glow']">
    <div class="flex justify-between gap-4 border-b border-default pb-2 text-label tracking-[.16em] text-muted">
      <span>{{ title }}</span>
      <span>{{ page.chapter.arc }}</span>
    </div>
    <p class="mt-3 font-serif text-h1 leading-none" :class="page.chapter.light ? 'text-primary' : 'text-muted'">{{ page.chapter.num }}</p>
    <p data-title class="font-serif text-title font-black leading-snug" :class="page.chapter.light ? 'text-primary' : 'text-highlighted'">
      {{ page.chapter.title }}
    </p>
    <p class="text-body-sm leading-loose text-highlighted">{{ page.chapter.body }}</p>
    <p class="mt-auto pt-3 text-center font-mono text-meta text-muted">{{ index }}</p>
  </div>

  <div v-else class="book-glow-center flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
    <span data-light class="sup-glow-dot mb-5 size-3.5 rounded-full bg-primary" />
    <p class="font-serif text-h2 leading-snug text-highlighted">
      <span v-for="(c, i) in endChars" :key="i" data-char class="inline-block">{{ c }}</span>
    </p>
    <p class="max-w-xs text-small text-muted">{{ page.sub }}</p>
    <p class="mt-6 ps-2 font-serif font-black tracking-[.5em] text-muted">完</p>
  </div>
</template>
