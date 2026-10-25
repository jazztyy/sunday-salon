<script setup lang="ts">
// 《伊凡．伊里奇之死》示意圖：第十二章的火車錯覺（DESIGN.md 6.9）。
// 火車往右前進、窗外景物往左移，箭頭在「以為在往後退」和「其實在往前走」之間輪流亮。
const poles = [0, 80, 160, 240, 320, 400, 480, 560, 640]
const trees = [40, 120, 200, 280, 360, 440, 520, 600]
const ties = Array.from({ length: 16 }, (_, i) => i * 40)
const wheels = [195, 365]
</script>

<template>
  <figure class="flex flex-col gap-3.5">
    <p class="flex flex-col font-serif text-title font-bold text-highlighted">
      <span class="font-sans text-meta font-normal tracking-[.12em] text-muted">第十二章 · 動畫</span>
      以為在後退，其實在前進
    </p>
    <div class="overflow-x-auto border-y border-default py-3">
      <svg
        viewBox="0 0 560 196"
        class="block h-auto w-full min-w-130"
        role="img"
        aria-label="動畫：火車往右前進，窗外景物往左移。箭頭在「以為在往後退」和「其實在往前走」之間切換。"
      >
        <g class="sup-drift text-muted">
          <line v-for="x in poles" :key="`p${x}`" :x1="x" y1="70" :x2="x" y2="170" stroke="currentColor" stroke-width="2" />
          <template v-for="x in trees" :key="`t${x}`">
            <circle class="text-inverted" :cx="x" cy="104" r="16" fill="currentColor" />
            <circle :cx="x" cy="104" r="16" fill="none" stroke="currentColor" stroke-width="1.5" />
          </template>
        </g>
        <line class="text-muted" x1="0" y1="170" x2="560" y2="170" stroke="currentColor" stroke-width="2" />
        <g class="sup-drift-ties text-muted">
          <line v-for="x in ties" :key="x" :x1="x" y1="172" :x2="x" y2="180" stroke="currentColor" stroke-width="2" />
        </g>
        <g class="text-highlighted" fill="currentColor">
          <rect x="142" y="44" width="276" height="10" rx="3" />
          <path fill-rule="evenodd" d="M150,52 H410 V146 H150 Z M172,70 H232 V114 H172 Z M250,70 H310 V114 H250 Z M328,70 H388 V114 H328 Z" />
          <rect x="164" y="146" width="232" height="6" />
        </g>
        <g v-for="x in wheels" :key="x" class="sup-spin">
          <circle class="text-inverted" :cx="x" cy="158" r="12" fill="currentColor" />
          <g class="text-highlighted" stroke="currentColor">
            <circle :cx="x" cy="158" r="12" fill="none" stroke-width="3" />
            <line :x1="x - 12" y1="158" :x2="x + 12" y2="158" stroke-width="2" />
            <line :x1="x" y1="146" :x2="x" y2="170" stroke-width="2" />
          </g>
        </g>
        <g class="sup-alt-a text-muted">
          <line x1="262" y1="30" x2="174" y2="30" stroke="currentColor" stroke-width="2" stroke-dasharray="6 5" />
          <polygon points="162,30 175,23 175,37" fill="currentColor" />
          <text x="216" y="17" text-anchor="middle" font-size="13" fill="currentColor">以為在往後退</text>
        </g>
        <g class="sup-alt-b text-primary">
          <line x1="298" y1="30" x2="386" y2="30" stroke="currentColor" stroke-width="2.5" />
          <polygon points="398,30 385,23 385,37" fill="currentColor" />
          <text x="344" y="17" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">其實在往前走</text>
        </g>
      </svg>
    </div>
    <figcaption class="text-small leading-relaxed text-muted">
      伊凡掉到洞底那一刻的感覺：「就像有時坐在火車車廂裡，以為自己在往後退，其實是在往前走，然後忽然察覺真正的方向。」（由英譯本轉譯）第九章他以為往上、其實往下；最後一章方向反過來，這一次察覺之後是好事。
    </figcaption>
  </figure>
</template>
