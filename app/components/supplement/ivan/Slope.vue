<script setup lang="ts">
// 《伊凡．伊里奇之死》示意圖：第九、十章「以為在上坡，其實在下坡」（DESIGN.md 6.9）。
// 社會眼光一路往上、生命一路往下，小球沿著生命線越墜越快（第十章：像落下的石頭），最低點有光。捲到時從左往右畫出來。
const lifePath = useId()
const xs = [40, 106, 172, 238, 304, 370, 436, 502, 568, 634]
const social = [250, 225, 200, 180, 150, 178, 112, 108, 108, 108]
const life = [60, 92, 118, 140, 160, 176, 192, 208, 240, 286]
const labels = ['童年', '法學院', '外省任職', '結婚', '檢察官', '落選', '年薪五千', '摔傷', '臥病', '過世']
const points = (ys: number[]) => xs.map((x, i) => `${x},${ys[i]}`).join(' ')
const lifeD = `M${xs.map((x, i) => `${x},${life[i]}`).join(' L')}`

const svg = useTemplateRef<SVGSVGElement>('svg')
const { reveal } = useScrollReveal()
onMounted(() => {
  reveal(svg.value, el => setFrame(el, { clipPath: 'inset(0% 100% 0% 0%)' }), el =>
    playFrom(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { duration: 2400, easing: 'cubic-bezier(.55,0,.8,.4)' }))
})
</script>

<template>
  <figure class="flex flex-col gap-3.5">
    <p class="flex flex-col font-serif text-title font-bold text-highlighted">
      <span class="font-sans text-meta font-normal tracking-[.12em] text-muted">第九、十章 · 示意圖</span>
      以為在上坡，其實在下坡
    </p>
    <div class="flex flex-wrap gap-x-7 gap-y-2 text-small text-muted" aria-hidden="true">
      <span class="inline-flex items-center gap-2">
        <svg width="28" height="8" viewBox="0 0 28 8"><line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="2" stroke-dasharray="7 6" /></svg>
        在社會眼光中
      </span>
      <span class="inline-flex items-center gap-2">
        <svg width="28" height="8" viewBox="0 0 28 8" class="text-highlighted"><line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="2.5" /></svg>
        生命
      </span>
      <span class="inline-flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" class="sup-glow-svg text-primary"><circle cx="7" cy="7" r="5" fill="currentColor" /></svg>
        光：童年的「一個亮點」，和最後的光
      </span>
    </div>
    <div class="overflow-x-auto border-y border-default py-3">
      <svg
        ref="svg"
        viewBox="0 0 680 345"
        class="block h-auto w-full min-w-150"
        role="img"
        aria-label="示意圖：伊凡的社會地位一路往上，生命一路往下，越接近死亡墜落越快，最低點有光。"
      >
        <g class="text-line" stroke="currentColor" stroke-width="1">
          <line v-for="x in xs" :key="x" :x1="x" y1="40" :x2="x" y2="302" />
        </g>
        <polyline class="text-muted" :points="points(social)" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="7 6" />
        <path :id="lifePath" class="text-highlighted" :d="lifeD" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" />
        <g class="text-muted">
          <template v-for="(x, i) in xs" :key="x">
            <circle class="text-inverted" :cx="x" :cy="social[i]" r="3.5" fill="currentColor" />
            <circle :cx="x" :cy="social[i]" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          </template>
        </g>
        <g class="text-highlighted">
          <circle v-for="(x, i) in xs.slice(1, -1)" :key="x" :cx="x" :cy="life[i + 1]" r="3.5" fill="currentColor" />
        </g>
        <g class="sup-glow-svg text-primary">
          <circle cx="40" cy="60" r="7" fill="currentColor" />
          <circle cx="634" cy="286" r="7" fill="currentColor" />
        </g>
        <!-- 小球照「越墜越快」的速度沿著生命線往下掉（SMIL）；減少動態效果時不顯示 -->
        <circle class="text-primary motion-reduce:hidden" r="5.5" fill="currentColor">
          <animateMotion dur="7s" repeatCount="indefinite" calcMode="spline" keyPoints="0;1;1" keyTimes="0;0.82;1" keySplines="0.62 0 1 0.55;0 0 1 1">
            <mpath :href="`#${lifePath}`" />
          </animateMotion>
        </circle>
        <g class="text-primary" fill="currentColor" font-size="12.5" font-weight="600">
          <text x="54" y="46">一個亮點</text>
          <text x="622" y="304" text-anchor="end">洞底有光</text>
          <text x="370" y="222" text-anchor="middle">1880 最難熬的一年</text>
        </g>
        <g class="text-muted" fill="currentColor" font-size="12.5" text-anchor="middle">
          <text v-for="(label, i) in labels" :key="label" :x="xs[i]" y="330">{{ label }}</text>
        </g>
      </svg>
    </div>
    <figcaption class="text-small leading-relaxed text-muted">
      伊凡對自己一生的比喻：<span class="hl-mark px-px text-toned">「從社會的眼光看來，我是走上坡，但與此同時，生命卻在我腳下一步步溜走」</span>。他說生命只在最開頭有一個亮點，之後越來越黑，像落下的石頭越墜越快，那顆小球就是照這個速度往下掉的。事件依先後排列，不按比例。
    </figcaption>
  </figure>
</template>
