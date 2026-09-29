<script setup lang="ts">
// 影片章節清單：側欄（桌機）與手機抽屜共用。每支影片一個收合群組，點時間跳到該段。
// 依播放器目前的影片與秒數標出目前章節（SPEC.md「播放器規格」）。
import type { Session } from '~/types/session'

// hideTitle：放在已有標題的容器裡（手機抽屜）時隱藏「影片章節」字樣
const props = defineProps<{ session: Session, hideTitle?: boolean }>()
const emit = defineEmits<{ played: [] }>()

const { vid, seconds } = usePlayer()

/** 秒數 → mm:ss */
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const initialOpen = () => Object.fromEntries(props.session.videos.map((v, i) => [v.id, i === 0]))
const open = ref<Record<string, boolean>>(initialOpen())

watch(() => props.session.slug, () => { open.value = initialOpen() })

watch(vid, (id) => {
  if (id && id in open.value) open.value[id] = true
})

/** 目前章節的秒數（最後一個 <= 目前秒數的章節），不是目前影片時為 null */
const nowT = computed(() => {
  const v = props.session.videos.find(x => x.id === vid.value)
  if (!v) return null
  return v.chapters.reduce((hit, [t]) => (seconds.value >= t ? t : hit), v.chapters[0]?.[0] ?? 0)
})

const isNow = (id: string, t: number) => vid.value === id && nowT.value === t
</script>

<template>
  <div class="flex flex-col">
    <div class="mb-1 flex items-baseline justify-between gap-3 border-b border-default pb-2">
      <b v-if="!hideTitle" class="font-serif text-body text-highlighted">影片章節</b>
      <span class="text-ui text-muted">點時間直接跳到該段</span>
    </div>

    <UCollapsible
      v-for="v in session.videos"
      :key="v.id"
      v-model:open="open[v.id]"
      class="border-b border-default"
    >
      <button
        type="button"
        class="flex w-full flex-col items-start py-2.5 text-left focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span class="font-mono text-meta font-medium tracking-[.06em] text-primary">{{ v.lec }}</span>
        <span class="text-small font-bold text-highlighted">{{ v.short }}</span>
      </button>

      <template #content>
        <div class="flex flex-col gap-2.5 pb-2.5">
          <VideoLink :vid="v.id" :t="0" class="self-start text-meta" @played="emit('played')">從頭播放</VideoLink>
          <ol class="flex flex-col">
            <li
              v-for="[t, label] in v.chapters"
              :key="t"
              class="grid grid-cols-[3.4em_1fr] gap-2 py-0.5 text-ui"
              :class="isNow(v.id, t) ? 'font-bold text-highlighted' : 'text-toned'"
              :aria-current="isNow(v.id, t) ? 'true' : undefined"
            >
              <VideoLink
                :vid="v.id"
                :t="t"
                class="pt-px font-mono text-meta font-medium tabular-nums no-underline hover:underline"
                @played="emit('played')"
              >
                <span :class="{ 'text-primary': isNow(v.id, t) }">{{ mmss(t) }}</span>
              </VideoLink>
              <span>{{ label }}</span>
            </li>
          </ol>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
