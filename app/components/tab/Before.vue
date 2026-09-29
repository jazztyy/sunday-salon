<script setup lang="ts">
// 「看之前」分頁：導言、五分鐘看懂全貌、引導問題、精選片段、講者立場。規格見 SPEC.md 4.1。
import type { Session } from '~/types/session'

defineProps<{ session: Session }>()

const stanceOpen = ref(false)
</script>

<template>
  <section class="flex flex-col gap-4">
    <p class="text-lead text-toned">{{ session.lede }}</p>
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">五分鐘看懂全貌</h2>
    <ul class="flex flex-col gap-3">
      <li v-for="(t, i) in session.tldr" :key="i" class="relative pl-4.5">
        <span aria-hidden="true" class="absolute top-[.72em] left-0.5 size-1.5 rounded-full bg-primary" />
        <!-- tldr 是站方撰寫的可信內容，只含 <b> 標記 -->
        <span v-html="t" />
      </li>
    </ul>
    <WhyNote>先看全貌再看細節：大腦有了框架，才接得住後面的內容。</WhyNote>
  </section>

  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">帶著這三個問題看</h2>
    <ol class="flex flex-col gap-2.5">
      <li
        v-for="v in session.videos"
        :key="v.id"
        class="flex flex-col gap-0.5 rounded-card border border-default bg-elevated px-3.5 py-3"
      >
        <span class="font-mono text-meta font-medium text-primary">{{ v.lec }}</span>
        <span class="font-serif text-lead font-semibold leading-relaxed">{{ v.guide }}</span>
      </li>
    </ol>
    <WhyNote>先有問題再找答案（SQ3R 的 Question 步驟），好奇心會讓記憶更牢。</WhyNote>
  </section>

  <div class="flex flex-col gap-2.5 rounded-card bg-secondary-soft px-4.5 py-4 text-body-sm">
    <p><strong class="text-secondary">時間不夠？先看這四段（約 55 分鐘）</strong></p>
    <ul class="flex flex-col gap-1.5">
      <li
        v-for="([lec, vid, t, range, label], i) in session.picks"
        :key="i"
        class="grid grid-cols-[auto_1fr] items-baseline gap-2.5"
      >
        <VideoLink :vid="vid" :t="t" class="font-mono text-ui font-medium">{{ lec }} {{ range }}</VideoLink>
        <span>{{ label }}</span>
      </li>
    </ul>
    <p class="text-small text-muted">{{ session.captionTip }}</p>
  </div>

  <UCollapsible
    v-model:open="stanceOpen"
    class="rounded-card border border-default bg-elevated"
  >
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-card px-3.5 py-3 text-left font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span>Kagan 自己站在哪一邊</span>
      <span aria-hidden="true" class="flex-none font-mono text-title font-medium text-muted">{{ stanceOpen ? '−' : '+' }}</span>
    </button>
    <template #content>
      <div class="px-3.5 pb-3.5">
        <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-body-sm">
          <template v-for="([k, v], i) in session.stance" :key="i">
            <dt class="text-muted">{{ k }}</dt>
            <dd>{{ v }}</dd>
          </template>
        </dl>
      </div>
    </template>
  </UCollapsible>
</template>
