<script setup lang="ts">
// 翻頁書（DESIGN.md 6.9）：封面 → 目錄 → 每章一頁 → 結尾。容器寬 640px 以上兩頁攤開，以下一次一頁。
// 書頁是 CSS 3D：每張書頁（leaf）的正面是右頁、背面是下一頁（左頁），繞著書脊從 0 轉到 −180 度。
// 角度由彈簧逐格計算（utils/spring.ts，不回彈），而且鎖在 0 到 −180 度：轉過頭的話，書頁在 3D 裡會跑到
// 別疊書頁後面，下面的舊頁就會露出來。每張書頁另外有一點 translateZ 高度差，讓 3D 排序和疊放順序一致。
// 書頁角度、陰影、疊放順序都由程式寫進元素（DESIGN.md 7 的例外），不經過 Vue 的資料。
import type { ComponentPublicInstance } from 'vue'
import type { Supplement } from '~/types/session'

const props = defineProps<{ supplement: Supplement }>()

const pages = computed(() => bookPages(props.supplement.plot))
const chapterIndex = computed(() => pages.value.flatMap((p, i) => (p.kind === 'chapter' ? [{ i, ...p.chapter }] : [])))

const book = useTemplateRef<HTMLElement>('book')
const width = ref(0)
useResizeObserver(book, ([entry]) => {
  if (entry) width.value = entry.contentRect.width
})
const spread = computed(() => width.value >= 640)

/** 每張書頁的正面、背面各是第幾頁；一次一頁時背面是空白（-1） */
const leaves = computed(() => {
  const per = spread.value ? 2 : 1
  return Array.from({ length: Math.ceil(pages.value.length / per) }, (_, k) => ({
    front: k * per,
    back: per === 2 && k * 2 + 1 < pages.value.length ? k * 2 + 1 : -1,
  }))
})

/** 翻過幾張書頁 */
const f = ref(0)
/** 正在讀的那一頁：換成一次一頁或兩頁攤開時，用它找回位置。一開始停在第一章 */
let pos = 2
const visible = computed(() => visiblePages(f.value, spread.value, pages.value.length))
const closed = computed(() => spread.value && f.value === 0)

const faceVisible = (k: number, side: 'front' | 'back') => {
  const leaf = leaves.value[k]
  if (!leaf) return false
  return side === 'front' ? k >= f.value && visible.value.includes(leaf.front) : k < f.value && visible.value.includes(leaf.back)
}

const { motionOk } = useScrollReveal()

// ── 書頁的角度與疊放 ──
interface LeafState { angle: number, z: number, stop?: () => void }
let states: LeafState[] = []
const leafEls: HTMLElement[] = []
const setLeaf = (el: Element | ComponentPublicInstance | null, k: number) => {
  if (el) leafEls[k] = el as HTMLElement
}

/** 疊放順序：右邊那疊前面的在上面，左邊那疊後翻的在上面 */
const zFor = (k: number) => (k < f.value ? k + 1 : leaves.value.length - k)

const apply = (k: number) => {
  const el = leafEls[k]
  const s = states[k]
  if (!el || !s) return
  const a = Math.max(-180, Math.min(0, s.angle))
  el.style.transform = `translateZ(${s.z}px) rotateY(${a}deg)`
  // 翻到一半（−90 度）時陰影最深
  const shade = String(Math.abs(Math.sin((a * Math.PI) / 180)) * 0.5)
  el.querySelectorAll<HTMLElement>('[data-shade]').forEach((sh) => { sh.style.opacity = shade })
}

const init = () => {
  states.forEach(s => s.stop?.())
  f.value = Math.min(leavesBefore(pos, spread.value), leaves.value.length - 1)
  states = leaves.value.map((_, k) => ({ angle: k < f.value ? -180 : 0, z: zFor(k) * 0.05 }))
  leaves.value.forEach((_, k) => {
    const el = leafEls[k]
    if (el) el.style.zIndex = String(zFor(k))
    apply(k)
  })
}

// 量到寬度之後才排書頁；換成另一種版面時重排，停在同一頁
watch(spread, () => {
  leafEls.length = 0
  nextTick(init)
})
const measured = computed(() => width.value > 0)
watch(measured, (m) => { if (m) nextTick(init) })

let zTop = 100
let lift = 0
let settle: ReturnType<typeof setTimeout> | undefined

/** 翻到第幾頁的時候，那頁上的字再浮現一次（只有最後一章和結尾頁） */
const greet = (i: number) => {
  if (!motionOk()) return
  const page = pages.value[i]
  const leaf = leafEls[spread.value ? Math.floor(i / 2) : i]
  const face = leaf?.querySelector<HTMLElement>(`[data-face="${spread.value && i % 2 ? 'back' : 'front'}"]`)
  if (!page || !face) return
  if (page.kind === 'end') {
    face.querySelectorAll<HTMLElement>('[data-char]').forEach((c, j) =>
      playFrom(c, { opacity: '0.08', transform: 'translateY(10px)' }, { duration: 700, delay: 500 + j * 80, easing: EASE_OUT }))
    const dot = face.querySelector<HTMLElement>('[data-light]')
    if (dot) {
      const a = dot.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.9)' }, { transform: 'scale(1)' }], { duration: 1800, easing: 'ease-out', fill: 'both' })
      a.onfinish = () => a.cancel()
    }
  }
  else if (page.kind === 'chapter' && page.chapter.light) {
    const t = face.querySelector<HTMLElement>('[data-title]')
    if (t) playFrom(t, { opacity: '0.15', filter: 'blur(5px)' }, { duration: 1200, delay: 450 })
  }
}

const goTo = (target: number) => {
  const n = leaves.value.length
  const nf = Math.max(0, Math.min(n - 1, target))
  if (nf === f.value) return
  const before = visible.value
  const forward = nf > f.value
  const order: number[] = []
  if (forward) for (let k = f.value; k < nf; k++) order.push(k)
  else for (let k = f.value - 1; k >= nf; k--) order.push(k)
  const animate = motionOk()
  // 一次翻很多頁時一張接一張翻過去
  const step = animate ? Math.min(110, 520 / order.length) : 0
  order.forEach((k, j) => {
    const s = states[k]
    const el = leafEls[k]
    if (!s || !el) return
    // 越晚開始翻的越上層，連續快速翻頁時才不會露出下面的頁
    zTop += 1
    lift += 1
    el.style.zIndex = String(zTop)
    s.z = (n + lift) * 0.05
    s.stop?.()
    const to = forward ? -180 : 0
    if (animate) {
      s.stop = animateSpring(s.angle, to, (v) => {
        s.angle = v
        apply(k)
      }, { delay: j * step })
    }
    else {
      s.angle = to
      apply(k)
    }
  })
  f.value = nf
  pos = spread.value ? Math.max(0, 2 * nf - 1) : nf
  clearTimeout(settle)
  settle = setTimeout(() => {
    zTop = 100
    lift = 0
    leaves.value.forEach((_, k) => {
      const s = states[k]
      const el = leafEls[k]
      if (!s || !el) return
      s.z = zFor(k) * 0.05
      el.style.zIndex = String(zFor(k))
      apply(k)
    })
  }, animate ? 1300 + order.length * step : 0)
  visible.value.forEach((i) => { if (!before.includes(i)) greet(i) })
}

const goToPage = (i: number) => {
  goTo(leavesBefore(i, spread.value))
  pos = i
}

onBeforeUnmount(() => {
  states.forEach(s => s.stop?.())
  clearTimeout(settle)
})

// ── 操作：點頁面左右、滑動、方向鍵 ──
let downX: number | null = null
let swiped = false
const onPointerDown = (e: PointerEvent) => {
  downX = e.clientX
  swiped = false
}
const onPointerUp = (e: PointerEvent) => {
  if (downX === null) return
  const dx = e.clientX - downX
  downX = null
  if (Math.abs(dx) > 40) {
    swiped = true
    goTo(dx < 0 ? f.value + 1 : f.value - 1)
  }
}
const onClick = (e: MouseEvent) => {
  if (swiped) {
    swiped = false
    return
  }
  if ((e.target as HTMLElement).closest('button, a')) return
  if (f.value === 0) return goTo(1)
  const r = book.value!.getBoundingClientRect()
  goTo(e.clientX - r.left > r.width / 2 ? f.value + 1 : f.value - 1)
}
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    goTo(f.value + 1)
  }
  else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goTo(f.value - 1)
  }
}

const positionLabel = computed(() => visible.value.map(i => bookPageLabel(pages.value[i]!)).join(' · '))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      ref="book"
      tabindex="0"
      role="region"
      aria-roledescription="翻頁書"
      :aria-label="`${supplement.title}：劇情`"
      class="relative w-full cursor-pointer touch-pan-y select-none perspective-distant focus-visible:outline-offset-8"
      :class="!spread && 'overflow-hidden'"
      @click="onClick"
      @keydown="onKeydown"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
    >
      <div
        v-if="measured"
        class="grid transform-3d transition-transform duration-700 ease-out"
        :class="[spread ? 'grid-cols-2' : 'grid-cols-1', closed && '-translate-x-1/4']"
      >
        <div
          v-for="(leaf, k) in leaves"
          :key="`${spread ? 's' : 'o'}-${k}`"
          :ref="el => setLeaf(el, k)"
          class="relative row-start-1 grid origin-left transform-3d"
          :class="spread ? 'col-start-2' : 'col-start-1'"
        >
          <div
            data-face="front"
            class="book-spine-front relative col-start-1 row-start-1 overflow-hidden border border-default bg-elevated backface-hidden"
            :inert="!faceVisible(k, 'front')"
            :aria-hidden="!faceVisible(k, 'front')"
          >
            <SupplementBookPage
              :page="pages[leaf.front]!"
              :index="leaf.front"
              :pages="pages"
              :title="supplement.title"
              :original="supplement.original"
              @jump="goToPage"
            />
            <div data-shade class="book-shade-front pointer-events-none absolute inset-0 opacity-0" />
          </div>
          <div
            data-face="back"
            class="relative col-start-1 row-start-1 overflow-hidden border border-default rotate-y-180 backface-hidden"
            :class="leaf.back >= 0 ? 'book-spine-back bg-elevated' : 'bg-accented'"
            :inert="!faceVisible(k, 'back')"
            :aria-hidden="!faceVisible(k, 'back')"
          >
            <SupplementBookPage
              v-if="leaf.back >= 0"
              :page="pages[leaf.back]!"
              :index="leaf.back"
              :pages="pages"
              :title="supplement.title"
              :original="supplement.original"
              @jump="goToPage"
            />
            <div data-shade class="book-shade-back pointer-events-none absolute inset-0 opacity-0" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3">
      <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" label="上一頁" :disabled="f === 0" @click="goTo(f - 1)" />
      <p class="min-w-0 flex-1 text-center text-small text-muted" aria-live="polite">{{ positionLabel }}</p>
      <UButton
        color="neutral"
        variant="outline"
        trailing-icon="i-lucide-arrow-right"
        label="下一頁"
        :disabled="f === leaves.length - 1"
        @click="goTo(f + 1)"
      />
    </div>

    <div class="flex flex-wrap justify-center gap-1.5" role="group" aria-label="跳到章節">
      <UButton
        v-for="c in chapterIndex"
        :key="c.i"
        size="xs"
        color="neutral"
        :variant="visible.includes(c.i) ? 'solid' : 'outline'"
        class="min-w-10 justify-center font-serif"
        :class="c.light && !visible.includes(c.i) && 'text-primary'"
        :aria-label="`跳到第 ${c.num} 章：${c.title}`"
        :aria-current="visible.includes(c.i) ? 'true' : undefined"
        @click="goToPage(c.i)"
      >
        {{ c.num }}
      </UButton>
    </div>
  </div>
</template>
