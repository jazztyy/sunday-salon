<script setup lang="ts">
// 「白紙回想」：每支影片一個收合區塊，裡面 3 題，各自可以打開「對照重點」。
import type { Video } from '~/types/session'

defineProps<{ videos: Video[] }>()

/** '講座 5 · 48:02' → '講座 5' */
const lecName = (v: Video) => v.lec.split(' · ')[0]
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">白紙回想</h2>
    <p class="text-small text-muted">每支影片看完後，先關掉影片，自己在紙上或腦中回答這三題，寫完再打開對照。卡住的地方就是還沒真正理解的地方。</p>

    <UCollapsible
      v-for="v in videos"
      :key="v.id"
      class="rounded-card border border-default bg-muted"
    >
      <template #default="{ open }">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-card px-3.5 py-3 text-left font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span>{{ lecName(v) }}：{{ v.short }}</span>
          <span class="font-mono text-title font-medium text-muted" aria-hidden="true">{{ open ? '−' : '+' }}</span>
        </button>
      </template>

      <template #content>
        <ol class="flex flex-col gap-3.5 px-3.5 pb-3.5">
          <li v-for="([q, a], i) in v.recall" :key="i" class="flex flex-col gap-1.5">
            <span class="font-medium">{{ q }}</span>
            <UCollapsible class="flex flex-col gap-1.5">
              <UButton color="secondary" variant="link" class="self-start rounded-control p-0 text-ui font-normal underline" label="對照重點" />
              <template #content>
                <p class="rounded-control bg-accented px-3 py-2.5 text-small text-toned">{{ a }}</p>
              </template>
            </UCollapsible>
          </li>
        </ol>
      </template>
    </UCollapsible>

    <WhyNote>主動回想比重看一次有效：從記憶裡「拉出來」的動作本身就在加強記憶。</WhyNote>
  </section>
</template>
