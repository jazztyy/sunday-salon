<script setup lang="ts">
// 影片章節清單：側欄（桌機）與手機抽屜共用。一次只列一支影片的章節，上方的按鈕選擇講座（播放器一起換）。
// 預設跟著播放器目前的影片（「邊看邊想」切子分頁、點到別支影片的段落時都會換過來）。
// 依播放器目前的影片與秒數標出目前章節（SPEC.md「播放器規格」）。
import type { Session } from '~/types/session'

// hideTitle：放在已有標題的容器裡（手機抽屜）時隱藏「影片章節」字樣
const props = defineProps<{ session: Session, hideTitle?: boolean }>()
const emit = defineEmits<{ played: [] }>()

const { vid, seconds, select } = usePlayer()

const shownId = ref(props.session.videos[0]?.id ?? '')
const shown = computed(() => props.session.videos.find(v => v.id === shownId.value) ?? props.session.videos[0])

// 播放器換影片時，清單跟著換
watch(vid, (id) => {
  if (id && props.session.videos.some(v => v.id === id)) shownId.value = id
}, { immediate: true })

watch(() => props.session.slug, () => { shownId.value = props.session.videos[0]?.id ?? '' })

/** 目前章節的秒數（最後一個 <= 目前秒數的章節），不是目前影片時為 null */
const nowT = computed(() => {
  const v = props.session.videos.find(x => x.id === vid.value)
  if (!v) return null
  return v.chapters.reduce((hit, [t]) => (seconds.value >= t ? t : hit), v.chapters[0]?.[0] ?? 0)
})

const isNow = (id: string, t: number) => vid.value === id && nowT.value === t
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex items-baseline justify-between gap-3 border-b border-default pb-2">
      <b v-if="!hideTitle" class="font-serif text-body text-highlighted">影片章節</b>
      <span class="text-ui text-muted">點時間直接跳到該段</span>
    </div>

    <!-- 選擇講座：播放器、章節清單、左側「邊看邊想」的子分頁一起換 -->
    <div class="flex flex-wrap gap-1.5" role="group" aria-label="選擇影片">
      <UButton
        v-for="v in session.videos"
        :key="v.id"
        :label="lecOf(session, v.id)"
        :aria-pressed="v.id === shownId"
        color="neutral"
        :variant="v.id === shownId ? 'solid' : 'outline'"
        size="xs"
        class="rounded-full px-3"
        :ui="{ label: 'text-ui font-medium' }"
        @click="select(v.id)"
      />
    </div>

    <div v-if="shown" class="flex flex-col gap-2">
      <div class="flex flex-col">
        <span class="font-mono text-meta font-medium tracking-[.06em] text-primary">{{ shown.lec }}・{{ minutesLabel(shown.duration) }}</span>
        <span class="text-small font-bold text-highlighted">{{ shown.short }}</span>
      </div>
      <VideoLink :vid="shown.id" :t="0" class="self-start text-meta" @played="emit('played')">從頭播放</VideoLink>
      <ol class="flex flex-col">
        <li
          v-for="[t, label] in shown.chapters"
          :key="t"
          class="grid grid-cols-[3.4em_1fr] gap-2 py-0.5 text-ui"
          :class="isNow(shown.id, t) ? 'font-bold text-highlighted' : 'text-toned'"
          :aria-current="isNow(shown.id, t) ? 'true' : undefined"
        >
          <VideoLink
            :vid="shown.id"
            :t="t"
            class="pt-px font-mono text-meta font-medium tabular-nums no-underline hover:underline"
            @played="emit('played')"
          >
            <span :class="{ 'text-primary': isNow(shown.id, t) }">{{ mmss(t) }}</span>
          </VideoLink>
          <span>{{ label }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>
