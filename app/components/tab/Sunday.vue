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
    ...props.session.videos.map(v => ({ key: v.id, lec: v.lec, title: v.short, items: byScope(v.id) })),
    { key: 'all', title: '整合回顧', items: byScope('all') },
  ].filter(g => g.items.length)
})

// 「我的想法」匯出：只列有寫筆記的題目，依分組排成 Markdown，可以貼進 Heptabase 或任何筆記軟體
const { getNote } = useDiscussNotes(props.session.slug)
const notesMarkdown = computed(() => {
  const sections = groups.value
    .map((g) => {
      const written = g.items.filter(({ item }) => getNote(item))
      if (!written.length) return ''
      const heading = g.lec ? `## ${g.lec}：${g.title}` : `## ${g.title}`
      return [heading, ...written.map(({ item }) => `### ${item.q}\n\n${getNote(item).trim()}`)].join('\n\n')
    })
    .filter(Boolean)
  if (!sections.length) return ''
  return [`# ${props.session.chip}：我的討論筆記`, props.session.title, ...sections].join('\n\n') + '\n'
})

// 立場題（salon-vote-{slug}，依題目 key 記選項）
const { pickOf: votePick, choose: chooseVote } = useVotes(props.session.slug, () => props.session.votes)

const { copy, isSupported } = useClipboard({ legacy: true })
const toast = useToast()
const copyNotes = async () => {
  try {
    await copy(notesMarkdown.value)
    toast.add({ title: '已複製我的筆記', description: 'Markdown 格式，可以直接貼進筆記軟體', icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: '複製失敗', description: '瀏覽器不允許存取剪貼簿', color: 'error' })
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">立場題</h2>
    <p class="text-small text-muted">活動前選好你的立場，討論時可以拿來對照。你的選擇只存在自己的瀏覽器，別人看不到。</p>
    <div class="flex flex-col gap-3.5">
      <SundayVote
        v-for="v in session.votes"
        :key="questionKey(v, v.q)"
        :vote="v"
        :picked="votePick(v)"
        @choose="chooseVote(v, $event)"
      />
    </div>
  </section>

  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">討論議題</h2>
      <UButton
        v-if="notesMarkdown && isSupported"
        color="neutral"
        variant="outline"
        icon="i-lucide-copy"
        label="複製我的筆記"
        class="rounded-control px-3 text-small"
        @click="copyNotes"
      />
    </div>
    <p class="text-small text-muted">影片裡的討論題都整理在這裡，挑有感覺的帶來聊。每題都可以寫下自己的想法、打開 Kagan 的觀點和影片段落；寫過的想法可以複製成 Markdown 帶走。</p>
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
