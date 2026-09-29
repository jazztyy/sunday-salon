<script setup lang="ts">
// 側欄：內嵌播放器＋目前章節＋章節清單。規格見 SPEC.md「播放器規格」。
// 播放器只在 YouTube API 載入成功（embed）時顯示，但掛載點一定要存在。
import type { Session } from '~/types/session'

const props = defineProps<{ session: Session }>()

const { embed, vid, seconds, mount, unmount, hide } = usePlayer()

const host = useTemplateRef<HTMLElement>('host')

/**
 * YouTube 會把掛載元素換成 iframe，所以每次都建立一個新的子元素交給播放器，
 * 換場次時整個重建，Vue 管理的節點不會被替換掉。
 */
const mountPlayer = () => {
  if (!host.value) return
  const el = document.createElement('div')
  host.value.replaceChildren(el)
  const first = props.session.videos[0]
  if (first) mount(el, first.id)
}

onMounted(mountPlayer)
onBeforeUnmount(unmount)

watch(() => props.session.slug, () => {
  unmount()
  mountPlayer()
})

/** 「講座 N・目前章節名稱」 */
const nowLabel = computed(() => {
  const v = props.session.videos.find(x => x.id === vid.value)
  if (!v || !v.chapters.length) return ''
  const chapter = v.chapters.reduce((hit, c) => (seconds.value >= c[0] ? c : hit), v.chapters[0]!)
  return `${v.lec.split(' · ')[0]}・${chapter[1]}`
})
</script>

<template>
  <div class="flex flex-col">
    <div v-show="embed" class="sticky top-0 z-10 flex flex-col gap-2 bg-default pb-3">
      <div
        ref="host"
        class="relative aspect-video overflow-hidden rounded-card bg-accented [&>*]:absolute [&>*]:inset-0 [&>*]:size-full [&>*]:border-0"
      />
      <div class="flex items-center justify-between gap-2 text-ui text-toned">
        <span class="min-w-0 truncate" aria-live="polite">{{ nowLabel }}</span>
        <UButton
          label="收起影片"
          color="neutral"
          variant="outline"
          size="xs"
          class="flex-none lg:hidden"
          @click="hide"
        />
      </div>
    </div>

    <div class="hidden lg:block">
      <VideoChapterList :session="session" />
    </div>
  </div>
</template>
