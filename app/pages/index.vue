<script setup lang="ts">
// 首頁顯示本週場次（依台灣日期挑，見 useCurrentSession）。
// 網站是靜態輸出：預先產生的 HTML 用建置當天的日期，掛載後再用瀏覽器的今天重挑，挑到別場時才抓那一場的資料，
// 這樣不必每週重新建置。挑到別場、正在抓那一場的資料時放場次頁的骨架（不顯示舊的那一場），抓到後淡入。
import { SESSION_TABS } from '~/components/SessionView.vue'

const { data: index } = await useSessionIndex()
const { data: session, status } = await useCurrentSession(index)
if (!session.value) throw createError({ statusCode: 404, statusMessage: '還沒有任何場次', fatal: true })

useSeoMeta({
  title: () => `悅讀聊天室・${session.value?.chip ?? ''}`,
  ogTitle: '悅讀聊天室',
  ogDescription: () => `這週：${session.value?.title ?? ''}`,
})
</script>

<template>
  <div>
    <!--
      不用 <Transition mode="out-in">：hydration 時「建置那一場 → 骨架 → 新的那一場」切得很快，out-in 會卡在中間、兩邊都不顯示。
      只讓新內容出現時淡入（animate-reveal），舊的直接換掉。
    -->
      <!-- 骨架：頂部列（含分頁列）照常顯示，下面是「看之前」的場次標頭和導讀的形狀 -->
      <div v-if="status === 'pending'" key="loading" class="min-h-dvh" aria-busy="true">
        <SalonHeader :tabs="SESSION_TABS" />
        <div class="mx-auto flex max-w-[760px] flex-col gap-10 px-4 pt-7 pb-20">
          <span class="sr-only">載入中…</span>
          <div class="flex flex-col gap-3" aria-hidden="true">
            <USkeleton class="h-4 w-40" />
            <USkeleton class="h-10 w-4/5" />
            <USkeleton class="h-5 w-72 max-w-full" />
            <div class="flex gap-1.5">
              <USkeleton v-for="i in 3" :key="i" class="h-5 w-14 rounded-tag" />
            </div>
          </div>
          <div class="flex flex-col gap-4" aria-hidden="true">
            <USkeleton class="h-5 w-full" />
            <USkeleton class="h-5 w-11/12" />
            <USkeleton class="h-7 w-48" />
            <USkeleton v-for="i in 4" :key="i" class="h-4" :class="i % 2 ? 'w-full' : 'w-5/6'" />
          </div>
        </div>
      </div>
      <div v-else-if="session" :key="session.slug" class="animate-reveal">
        <SessionView :session="session" />
      </div>
  </div>
</template>
