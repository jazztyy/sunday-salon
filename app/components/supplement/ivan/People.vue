<script setup lang="ts">
// 《伊凡．伊里奇之死》關係圖：第七、八章，誰在說謊、誰沒有（DESIGN.md 6.9）。
// 灰色虛線是「假裝他只是生病」，金色虛線（往伊凡流）是「懂他、可憐他」。連線停在圓圈邊緣，不壓到字。
const CENTER = { x: 280, y: 180, r: 42 }

const nodes = [
  { label: '妻子', x: 115, y: 75, warm: false },
  { label: '女兒', x: 75, y: 195, warm: false },
  { label: '未婚夫', x: 130, y: 312, warm: false },
  { label: '醫生們', x: 445, y: 75, warm: false },
  { label: '同事們', x: 485, y: 195, warm: false },
  { label: '格拉西姆', x: 430, y: 312, warm: true },
  { label: '兒子瓦夏', x: 280, y: 334, warm: true },
].map((n) => {
  const r = n.label.length > 3 ? 36 : 34
  // 連線從人物圓圈邊緣（再留 4）畫到伊凡的圓圈邊緣
  const dx = CENTER.x - n.x
  const dy = CENTER.y - n.y
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  return {
    ...n,
    r,
    from: { x: n.x + ux * (r + 4), y: n.y + uy * (r + 4) },
    to: { x: CENTER.x - ux * (CENTER.r + 4), y: CENTER.y - uy * (CENTER.r + 4) },
  }
})
</script>

<template>
  <figure class="flex flex-col gap-3.5">
    <p class="flex flex-col font-serif text-title font-bold text-highlighted">
      <span class="font-sans text-meta font-normal tracking-[.12em] text-muted">第七、八章 · 關係圖</span>
      誰在說謊，誰沒有
    </p>
    <div class="flex flex-wrap gap-x-7 gap-y-2 text-small text-muted" aria-hidden="true">
      <span class="inline-flex items-center gap-2">
        <svg width="28" height="8" viewBox="0 0 28 8"><line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 6" /></svg>
        假裝他只是生病
      </span>
      <span class="inline-flex items-center gap-2">
        <svg width="28" height="8" viewBox="0 0 28 8" class="text-primary"><line x1="2" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round" /></svg>
        懂他、可憐他
      </span>
    </div>
    <div class="border-y border-default py-3">
      <svg
        viewBox="0 0 560 380"
        class="mx-auto block h-auto w-full max-w-160"
        role="img"
        aria-label="關係圖：妻子、女兒、未婚夫、醫生、同事都假裝他只是生病；只有格拉西姆和兒子瓦夏懂他、可憐他。"
      >
        <template v-for="n in nodes" :key="`l${n.label}`">
          <line
            v-if="n.warm"
            class="sup-flow text-primary"
            :x1="n.from.x" :y1="n.from.y" :x2="n.to.x" :y2="n.to.y"
            stroke="currentColor" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"
          />
          <line
            v-else
            class="text-muted"
            :x1="n.to.x" :y1="n.to.y" :x2="n.from.x" :y2="n.from.y"
            stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 6" opacity=".75"
          />
        </template>
        <g v-for="n in nodes" :key="n.label" text-anchor="middle">
          <circle class="text-inverted" :cx="n.x" :cy="n.y" :r="n.r" fill="currentColor" />
          <circle v-if="n.warm" class="text-primary-soft" :cx="n.x" :cy="n.y" :r="n.r" fill="currentColor" />
          <circle
            :class="n.warm ? 'text-primary' : 'text-muted'"
            :cx="n.x" :cy="n.y" :r="n.r"
            fill="none" stroke="currentColor" :stroke-width="n.warm ? 2 : 1.5"
          />
          <text class="text-highlighted" :x="n.x" :y="n.y + 5" fill="currentColor" font-size="14" font-weight="600">{{ n.label }}</text>
        </g>
        <circle class="text-highlighted" :cx="CENTER.x" :cy="CENTER.y" :r="CENTER.r" fill="currentColor" />
        <text class="text-inverted" :x="CENTER.x" :y="CENTER.y + 6" text-anchor="middle" fill="currentColor" font-size="16" font-weight="900">伊凡</text>
      </svg>
    </div>
    <figcaption class="text-small leading-relaxed text-muted">
      妻子把生病當成他自己的錯，醫生每次來都在演「會好起來」，同事開他玩笑，私下看他的位子什麼時候空出來。第八章寫道，他覺得除了格拉西姆，只有兒子瓦夏懂他、可憐他。
    </figcaption>
  </figure>
</template>
