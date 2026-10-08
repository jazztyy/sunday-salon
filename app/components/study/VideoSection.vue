<script setup lang="ts">
// 「邊看邊想」的一支影片：帶著問題看 → 論證卡 → 小測驗 → 討論題，全部只列這支影片的內容。
// 論證卡與測驗都傳 session 裡的「原始索引」，儲存 key 才會和其他地方一致。
import type { Session, Video } from '~/types/session'

const props = defineProps<{
  session: Session
  video: Video
  /** {題目在 session.quiz 的索引: 選項索引} */
  quizPicks: Record<number, number>
}>()

const emit = defineEmits<{ pick: [quizIndex: number, option: number] }>()

/** 保留原始索引再篩選 */
const withIndex = <T,>(list: T[]) => list.map((item, index) => ({ item, index }))

const args = computed(() => withIndex(props.session.args).filter(({ item }) => item.vid === props.video.id))
const quiz = computed(() => withIndex(props.session.quiz).filter(({ item }) => item.scope === props.video.id))
const discuss = computed(() => withIndex(props.session.discuss).filter(({ item }) => item.scope === props.video.id))

const h3Class = 'font-serif text-title font-bold text-highlighted'

// 手機版的播放器平常收起來，這顆按鈕是看影片的主要入口（桌機右側已經有播放器，用文字連結即可）。
// 沒有內嵌播放器時照常開新分頁到 YouTube，行為同 <VideoLink>。
const { embed, play } = usePlayer()
const youtubeUrl = computed(() => `https://www.youtube.com/watch?v=${props.video.id}`)
const playFromStart = (e: MouseEvent) => {
  if (!embed.value) return
  e.preventDefault()
  play(props.video.id, 0)
}
</script>

<template>
  <section class="flex flex-col gap-6 border-t-2 border-accented pt-6">
    <header class="flex flex-col gap-1">
      <span class="font-mono text-meta font-medium tracking-[.06em] text-primary">{{ video.lec }}・{{ minutesLabel(video.duration) }}</span>
      <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">{{ video.short }}</h2>
      <p class="text-small text-muted">{{ video.title }}</p>
      <VideoLink :vid="video.id" :t="0" class="hidden self-start text-ui lg:inline">▸ 從頭播放</VideoLink>
      <UButton
        :to="youtubeUrl"
        target="_blank"
        icon="i-lucide-play"
        label="播放這一講"
        class="mt-2 self-start rounded-control px-3.5 lg:hidden"
        @click="playFromStart"
      />
    </header>

    <div class="flex flex-col gap-1.5 rounded-card border border-default bg-elevated p-3.5">
      <span class="text-meta font-medium text-muted">帶著這個問題看</span>
      <p class="font-serif text-body text-highlighted">{{ video.guide }}</p>
    </div>

    <div v-if="args.length" class="flex flex-col gap-3">
      <h3 :class="h3Class">論證</h3>
      <ArgumentCard
        v-for="{ item, index } in args"
        :key="`${session.slug}-arg-${index}`"
        :arg="item"
        :session="session"
      />
    </div>

    <div v-if="quiz.length" class="flex flex-col gap-4">
      <h3 :class="h3Class">看完這段，測一下</h3>
      <div class="flex flex-col gap-7">
        <StudyQuizItem
          v-for="({ item, index }, n) in quiz"
          :key="`${session.slug}-quiz-${index}`"
          as="h4"
          hide-source
          :session="session"
          :item="item"
          :number="n + 1"
          :pick="quizPicks[index]"
          @pick="emit('pick', index, $event)"
        />
      </div>
    </div>

    <div v-if="discuss.length" class="flex flex-col gap-3">
      <h3 :class="h3Class">想一想</h3>
      <StudyDiscussCard
        v-for="{ item, index } in discuss"
        :key="`${session.slug}-discuss-${index}`"
        :session="session"
        :item="item"
      />
    </div>
  </section>
</template>
