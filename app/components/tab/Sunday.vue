<script setup lang="ts">
// 「週日討論」分頁：立場題、討論議題（依影片分組，最後是整合回顧）。規格見 SPEC.md 4.4。
import type { DiscussItem, Session } from '~/types/session'

const props = defineProps<{ session: Session }>()

interface DiscussGroup {
  key: string
  /** 講座標籤，整合回顧沒有 */
  lec?: string
  title: string
  items: { item: DiscussItem, index: number }[]
}

/** 每支影片一組，最後是整合回顧；沒有題目的組別不顯示 */
const groups = computed<DiscussGroup[]>(() => {
  const all = props.session.discuss.map((item, index) => ({ item, index }))
  const byScope = (scope: string) => all.filter(({ item }) => item.scope === scope)
  return [
    ...props.session.videos.map(v => ({ key: v.id, lec: v.lec.split(' · ')[0], title: v.short, items: byScope(v.id) })),
    { key: 'all', title: '整合回顧', items: byScope('all') },
  ].filter(g => g.items.length)
})
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">立場題</h2>
    <p class="text-small text-muted">你的選擇只存在自己的瀏覽器，別人看不到。活動前選「討論前」，活動後再選「討論後」。</p>
    <div class="flex flex-col gap-3.5">
      <SundayVote v-for="(v, i) in session.votes" :key="`${session.slug}-${i}`" :vote="v" :index="i" :session-id="session.slug" />
    </div>
  </section>

  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">討論議題</h2>
    <p class="text-small text-muted">影片裡的討論題都整理在這裡，挑有感覺的帶來聊。每題都可以打開 Kagan 的觀點和影片段落。</p>
    <div class="flex flex-col gap-6">
      <div v-for="g in groups" :key="`${session.slug}-${g.key}`" class="flex flex-col gap-3">
        <h3 class="flex flex-col font-serif text-title font-bold text-highlighted">
          <span v-if="g.lec" class="font-mono text-meta font-medium tracking-[.06em] text-primary">{{ g.lec }}</span>
          {{ g.title }}
        </h3>
        <StudyDiscussCard
          v-for="{ item, index } in g.items"
          :key="`${session.slug}-discuss-${index}`"
          :session="session"
          :item="item"
        />
      </div>
    </div>
  </section>
</template>
