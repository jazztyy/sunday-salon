<script setup lang="ts">
// 《伊凡．伊里奇之死》動畫：第九、十二章的黑色麻袋（DESIGN.md 6.9）。
// 平常停在「卡在窄口」；按播放（或第一次捲到時）分四步：被塞進去 → 卡住 → 掉下去 → 洞底有光。
// 人形的位置是相對「卡住」的位移（SVG 的 transform 屬性是卡住的位置，動畫只動 CSS transform），
// 沒有 JavaScript 時也停在卡住的樣子。
type Pose = 'top' | 'push' | 'stuck' | 'fall' | 'light'

const OFFSET: Record<Pose, number> = { top: -205, push: -55, stuck: 0, fall: 113, light: 113 }
const STEPS: { pose: Pose, at: number, n: string, text: string }[] = [
  { pose: 'push', at: 60, n: '一', text: '一股看不見、抗拒不了的力量把他往麻袋裡塞。他像死刑犯在劊子手手裡掙扎，知道自己逃不掉。' },
  { pose: 'stuck', at: 2700, n: '二', text: '他卡在窄口，進不去也出不來。卡住他的，是他認定自己這一生過得很好。' },
  { pose: 'fall', at: 5600, n: '三', text: '忽然有股力量撞上他的胸口和側腹，他掉了進去。「對，那樣不對，」他對自己說，「不過沒關係。」' },
  { pose: 'light', at: 7000, n: '四', text: '洞底有光。他找不到原本對死亡的恐懼：取代死亡的，是光。' },
]

const gradient = useId()
const step = ref('第十二章 · 最後三天')
const caption = ref('第九章他第一次覺得自己被塞進這個黑色麻袋；第十二章他在裡面掙扎了三天，卡在窄口過不去。按播放，看他怎麼掉到洞底。')
const pose = ref<Pose>('stuck')
const playing = ref(false)
const played = ref(false)

const wrap = useTemplateRef<HTMLElement>('wrap')
const ivan = useTemplateRef<SVGGElement>('ivan')
const wig = useTemplateRef<SVGGElement>('wig')
const bar = useTemplateRef<SVGGElement>('bar')
const glow = useTemplateRef<SVGCircleElement>('glow')
const captionEl = useTemplateRef<HTMLElement>('captionEl')
const { reveal, motionOk } = useScrollReveal()

let cur = { y: 0, op: 1, bar: 1, glow: 1 }
let wiggle: Animation | undefined
const timers: ReturnType<typeof setTimeout>[] = []

/** 換掉元素上原本的動畫，從目前的樣子播到新的樣子，停在新的樣子 */
const run = (el: Element | null, frames: Keyframe[], options: KeyframeAnimationOptions) => {
  if (!el) return
  el.getAnimations().forEach(a => a.cancel())
  el.animate(frames, { fill: 'forwards', ...options })
}

const go = (next: Pose, animate: boolean) => {
  const gone = next === 'fall' || next === 'light'
  const target = { y: OFFSET[next], op: gone ? 0 : 1, bar: gone ? 0 : 1, glow: next === 'light' ? 5.5 : 1 }
  const falling = next === 'fall'
  run(ivan.value, [
    { transform: `translateY(${cur.y}px)`, opacity: cur.op, offset: 0 },
    { opacity: cur.op, offset: falling ? 0.72 : 0.99 },
    { transform: `translateY(${target.y}px)`, opacity: target.op, offset: 1 },
  ], { duration: animate ? (falling ? 1100 : 2300) : 0, easing: falling ? 'cubic-bezier(.55,0,1,.45)' : 'cubic-bezier(.4,0,.6,1)' })
  run(bar.value, [{ opacity: cur.bar }, { opacity: target.bar }], { duration: animate ? 500 : 0 })
  run(glow.value, [{ transform: `scale(${cur.glow})` }, { transform: `scale(${target.glow})` }], { duration: animate ? 1900 : 0, easing: 'ease-out' })
  wiggle?.cancel()
  wiggle = undefined
  if (animate && (next === 'push' || next === 'stuck') && wig.value) {
    wiggle = wig.value.animate(
      [{ transform: 'translateX(-3px) rotate(-5deg)' }, { transform: 'translateX(3px) rotate(5deg)' }, { transform: 'translateX(-3px) rotate(-5deg)' }],
      { duration: 500, iterations: Infinity, easing: 'ease-in-out' },
    )
  }
  cur = target
  pose.value = next
}

const start = () => {
  played.value = true
  playing.value = true
  timers.splice(0).forEach(clearTimeout)
  const animate = motionOk()
  go('top', false)
  for (const s of STEPS) {
    timers.push(setTimeout(() => {
      step.value = `第十二章 · ${s.n} / 四`
      caption.value = s.text
      go(s.pose, animate)
      if (animate && captionEl.value) playFrom(captionEl.value, { opacity: '0.15', transform: 'translateY(8px)' }, { duration: 500, easing: EASE_OUT })
    }, animate ? s.at : 0))
  }
  timers.push(setTimeout(() => { playing.value = false }, animate ? 9200 : 0))
}

onMounted(() => {
  // 平常停在卡住的樣子，掙扎一直在動
  if (motionOk()) go('stuck', true)
  reveal(wrap.value, () => {}, () => { if (!played.value) start() })
})
onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  wiggle?.cancel()
})
</script>

<template>
  <figure class="flex flex-col gap-3.5">
    <p class="flex flex-col font-serif text-title font-bold text-highlighted">
      <span class="font-sans text-meta font-normal tracking-[.12em] text-muted">第九、十二章 · 動畫</span>
      黑色麻袋
    </p>
    <div ref="wrap" class="grid items-center gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-10">
      <svg
        viewBox="0 0 360 470"
        class="mx-auto block h-auto w-full max-w-75 md:max-w-80"
        role="img"
        aria-label="動畫：伊凡被塞進一個黑色麻袋，卡在窄口，那裡寫著「我這一生過得很好」。袋底有光。"
      >
        <defs>
          <radialGradient :id="gradient">
            <stop class="text-primary" offset="0" stop-color="currentColor" stop-opacity="1" />
            <stop class="text-primary" offset="0.35" stop-color="currentColor" stop-opacity="0.55" />
            <stop class="text-primary" offset="1" stop-color="currentColor" stop-opacity="0" />
          </radialGradient>
        </defs>
        <path class="text-void" d="M100,34 C96,164 140,284 160,344 L163,388 L197,388 L200,344 C220,284 264,164 260,34 Z" fill="currentColor" />
        <path class="text-muted" d="M100,34 C96,164 140,284 160,344 L163,388 L197,388 L200,344 C220,284 264,164 260,34 Z" fill="none" stroke="currentColor" stroke-width="1" opacity=".5" />
        <ellipse class="text-muted" cx="180" cy="34" rx="80" ry="8" fill="none" stroke="currentColor" stroke-width="1.5" />
        <circle ref="glow" class="transform-fill origin-center" cx="180" cy="420" r="36" :fill="`url(#${gradient})`" />
        <circle class="text-primary" cx="180" cy="420" r="7" fill="currentColor" />
        <g ref="bar">
          <line class="text-void-ink" x1="158" y1="340" x2="202" y2="340" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
          <line class="text-muted" x1="206" y1="340" x2="236" y2="352" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3" />
          <g class="text-muted" fill="currentColor" font-size="12.5">
            <text x="240" y="356">「我這一生</text>
            <text x="240" y="374">過得很好」</text>
          </g>
        </g>
        <g transform="translate(0 205)">
          <g ref="ivan">
            <g ref="wig" class="transform-fill origin-center text-void-ink" fill="currentColor">
              <circle cx="180" cy="76" r="9" />
              <ellipse cx="180" cy="102" rx="12" ry="16" />
            </g>
          </g>
        </g>
        <text class="text-muted" x="268" y="64" fill="currentColor" font-size="12.5">黑色麻袋</text>
      </svg>
      <div class="flex min-w-0 flex-col gap-4">
        <p class="text-ui tracking-[.14em] text-muted">{{ step }}</p>
        <p ref="captionEl" class="font-serif text-lead leading-relaxed md:min-h-28" :class="pose === 'light' ? 'text-primary' : 'text-highlighted'" aria-live="polite">
          {{ caption }}
        </p>
        <UButton class="self-start" color="neutral" variant="outline" icon="i-lucide-play" :label="played ? '再看一次' : '播放'" :disabled="playing" @click="start" />
      </div>
    </div>
  </figure>
</template>
