<script setup lang="ts">
// 側欄：內嵌播放器＋目前章節＋章節清單。規格見 SPEC.md「播放器規格」。
// 播放器只在 YouTube API 載入成功（embed）時顯示，但掛載點一定要存在。
import type { Session } from '~/types/session'

const props = defineProps<{ session: Session }>()

const { embed, vid, seconds, floating, mount, unmount, hide } = usePlayer()

// 放大：同一個元素改成 fixed 置中，不搬動 DOM（iframe 一搬就會重新載入）。
// 只在桌機提供；視窗縮到 1024px 以下時自動回到側欄。
const isDesktop = useMediaQuery('(min-width: 1024px)')
watch(isDesktop, (desktop) => {
  if (!desktop) floating.value = false
})
onKeyStroke('Escape', () => {
  floating.value = false
})

// 拖曳：懸浮時按住把手移動。offset 是相對「置中」位置的位移，每次放大都從中間開始。
// 拖曳中讓 iframe 不接收滑鼠事件，否則滑鼠一經過影片，pointermove 就被 iframe 吃掉。
const card = useTemplateRef<HTMLElement>('card')
const handle = useTemplateRef<HTMLElement>('handle')
const offset = ref({ x: 0, y: 0 })
const dragging = ref(false)
let drag = { x: 0, y: 0, dx: 0, dy: 0, rect: null as DOMRect | null, handleWidth: 0 }

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

// 把手永遠朝向畫面中間：視窗在右半邊（含置中）時在左側，拖到左半邊時換到右側，
// 視窗才能貼齊任一側的邊緣。視窗一開始水平置中，所以中心在哪一半只看 offset.x 的正負。
const sideOf = (dx: number) => (dx < 0 ? 'right' : 'left')
const handleSide = computed(() => sideOf(offset.value.x))

const onDragStart = (e: PointerEvent) => {
  if (!card.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  const rect = card.value.getBoundingClientRect()
  drag = { x: e.clientX, y: e.clientY, dx: offset.value.x, dy: offset.value.y, rect, handleWidth: handle.value?.offsetWidth ?? 0 }
  dragging.value = true
}

/**
 * 位移限制在畫面內：用開始拖曳時的位置換算。
 * 把手在哪一側，那一側要多留把手的寬度，另一側可以貼齊邊緣。
 */
const onDragMove = (e: PointerEvent) => {
  const { rect, handleWidth } = drag
  if (!dragging.value || !rect) return
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const rawDx = drag.dx + e.clientX - drag.x
  const side = sideOf(rawDx)
  const left = clamp(
    rect.left + rawDx - drag.dx,
    side === 'left' ? handleWidth : 0,
    vw - rect.width - (side === 'right' ? handleWidth : 0),
  )
  const my = clamp(e.clientY - drag.y, -rect.top, vh - rect.bottom)
  offset.value = { x: drag.dx + left - rect.left, y: drag.dy + my }
}

const onDragEnd = () => {
  dragging.value = false
}

const resetOffset = () => {
  offset.value = { x: 0, y: 0 }
}
watch(floating, resetOffset)
useEventListener('resize', resetOffset)

// 跟著滑鼠即時計算的位置只能用 inline style（DESIGN.md「實作規則」的例外）
const cardStyle = computed(() => (floating.value ? { transform: `translate(${offset.value.x}px, ${offset.value.y}px)` } : undefined))

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
onBeforeUnmount(() => {
  floating.value = false
  unmount()
})

watch(() => props.session.slug, () => {
  unmount()
  mountPlayer()
})

/** 「講座 N・目前章節名稱」 */
const nowLabel = computed(() => {
  const v = props.session.videos.find(x => x.id === vid.value)
  if (!v || !v.chapters.length) return ''
  const chapter = v.chapters.reduce((hit, c) => (seconds.value >= c[0] ? c : hit), v.chapters[0]!)
  return `${v.lec}・${chapter[1]}`
})
</script>

<template>
  <div class="flex flex-col">
    <!-- 放大時留在側欄原位的占位，章節清單才不會往上跳 -->
    <div
      v-if="embed && floating"
      class="flex aspect-video flex-col items-center justify-center gap-2 rounded-card border border-dashed border-default text-small text-muted"
    >
      <span>影片在懸浮視窗播放</span>
      <UButton label="縮回側欄" icon="i-lucide-minimize-2" color="neutral" variant="outline" size="xs" @click="floating = false" />
    </div>

    <!-- 放大時：鋪滿畫面的外層只負責置中，pointer-events-none 讓滾輪和點擊穿過去，頁面照樣可以捲動 -->
    <div
      v-show="embed"
      :class="floating
        ? 'pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6'
        : 'sticky top-0 z-10 bg-default pb-3'"
    >
      <div
        ref="card"
        class="flex w-full flex-col gap-2"
        :class="floating && 'group pointer-events-auto relative max-w-3xl rounded-card border border-default bg-default p-3 shadow-2xl'"
        :style="cardStyle"
      >
        <!-- 把手：側邊凸出的小分頁（朝向畫面中間的那一側），滑鼠碰到把手或視窗邊框、狀態列時才淡入。
             滑鼠在影片畫面上時偵測不到（YouTube iframe 跨網域，外層頁面收不到事件），
             所以放在視窗外側：從那一側靠近時一定先經過把手 -->
        <div
          v-if="floating"
          ref="handle"
          role="button"
          aria-label="拖曳移動"
          class="absolute top-1/2 flex -translate-y-1/2 touch-none select-none items-center border border-default bg-default px-0.5 py-3 text-muted transition-[color,opacity] hover:text-highlighted hover:opacity-100 group-hover:opacity-100"
          :class="[
            handleSide === 'left' ? 'right-full rounded-l-card border-r-0' : 'left-full rounded-r-card border-l-0',
            dragging ? 'cursor-grabbing opacity-100' : 'cursor-grab opacity-0',
          ]"
          @pointerdown="onDragStart"
          @pointermove="onDragMove"
          @pointerup="onDragEnd"
          @pointercancel="onDragEnd"
        >
          <UIcon name="i-lucide-grip-vertical" class="size-4" aria-hidden="true" />
        </div>
        <div
          ref="host"
          :class="dragging && 'pointer-events-none'"
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
          <UButton
            :label="floating ? '縮回側欄' : '放大影片'"
            :icon="floating ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
            color="neutral"
            variant="outline"
            size="xs"
            class="hidden flex-none lg:inline-flex"
            @click="floating = !floating"
          />
        </div>
        <!-- 字幕說明放在播放器正下方：語言是看影片的第一個門檻 -->
        <p v-if="session.captionTip" class="flex gap-1.5 text-meta leading-relaxed text-muted">
          <UIcon name="i-lucide-captions" class="mt-0.5 size-4 flex-none" aria-hidden="true" />
          <span>{{ session.captionTip }}</span>
        </p>
      </div>
    </div>

    <div class="hidden lg:block">
      <VideoChapterList :session="session" />
    </div>
  </div>
</template>
