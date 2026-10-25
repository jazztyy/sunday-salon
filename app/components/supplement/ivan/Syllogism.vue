<script setup lang="ts">
// 《伊凡．伊里奇之死》互動：第六章，把三段論裡的「凱撒」換成伊凡自己（DESIGN.md 6.9）。
// 邏輯一樣，只換一個名字，對照凡尼亞（小時候的伊凡）的記憶。回憶清單照 Maude 英譯本第六章。
const MEMORIES = [
  '那顆他很喜歡的條紋皮球的味道',
  '親吻媽媽的手，她絲綢裙子的沙沙聲',
  '學校點心太難吃時跟著大家鬧事',
  '那樣地戀愛過',
  '像他那樣主持開庭',
]

const isMe = ref(false)
const who = computed(() => (isMe.value ? '伊凡' : '凱撒'))
const verdict = computed(() => (isMe.value
  ? '「對我，凡尼亞……就是另一回事了。我不可能是該死的。這實在太殘酷了。」'
  : '「對凱撒來說，完全正確。」'))

const whoEls = useTemplateRef<HTMLElement[]>('who')
const memEls = useTemplateRef<HTMLElement[]>('mem')
const verdictEl = useTemplateRef<HTMLElement>('verdict')
const { motionOk } = useScrollReveal()

const toggle = async () => {
  isMe.value = !isMe.value
  if (!motionOk()) return
  await nextTick()
  for (const el of whoEls.value ?? []) playFrom(el, { opacity: '0.2', transform: 'scale(1.45)' }, { duration: 450, easing: EASE_OUT })
  if (verdictEl.value) playFrom(verdictEl.value, { opacity: '0.2', transform: 'translateY(8px)' }, { duration: 500, easing: EASE_OUT })
  if (isMe.value) {
    ;(memEls.value ?? []).forEach((el, i) =>
      playFrom(el, { opacity: '0.3', transform: 'translateX(-14px)' }, { duration: 500, delay: i * 70, easing: EASE_OUT }))
  }
}
</script>

<template>
  <figure class="flex flex-col gap-3.5">
    <p class="flex flex-col font-serif text-title font-bold text-highlighted">
      <span class="font-sans text-meta font-normal tracking-[.12em] text-muted">第六章 · 互動</span>
      把凱撒換成自己
    </p>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="flex flex-col gap-2 rounded-card border border-default bg-elevated px-5 py-4.5">
        <p class="grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-2 text-lead">
          <span class="text-meta tracking-[.12em] text-muted">大前提</span><span>人都會死。</span>
        </p>
        <p class="grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-2 text-lead">
          <span class="text-meta tracking-[.12em] text-muted">小前提</span>
          <span><span ref="who" class="inline-block font-black" :class="isMe && 'text-primary'">{{ who }}</span>是人。</span>
        </p>
        <p class="mt-1 grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-2 border-t border-default pt-2 text-lead font-bold">
          <span class="text-meta font-normal tracking-[.12em] text-muted">結論</span>
          <span><span ref="who" class="inline-block font-black" :class="isMe && 'text-primary'">{{ who }}</span>會死。</span>
        </p>
        <p ref="verdict" class="mt-2 font-serif leading-relaxed" :class="isMe ? 'text-highlighted' : 'text-muted'" aria-live="polite">{{ verdict }}</p>
      </div>
      <div class="flex flex-col gap-2 rounded-card bg-accented px-5 py-4.5">
        <p class="font-serif text-lead font-bold text-highlighted">可是凡尼亞（小時候的伊凡）有</p>
        <ul class="flex flex-col gap-1.5">
          <li v-for="m in MEMORIES" :key="m" ref="mem" class="relative pl-4.5 leading-relaxed">
            <span
              aria-hidden="true"
              class="absolute top-[.72em] left-0.5 size-1.5 rounded-full"
              :class="isMe ? 'bg-primary' : 'border border-accented'"
            />
            {{ m }}
          </li>
        </ul>
        <p class="text-small text-muted">凱撒知道這些嗎？</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <UButton color="neutral" variant="outline" :label="isMe ? '換回凱撒' : '把凱撒換成伊凡'" :aria-pressed="isMe" @click="toggle" />
      <p class="text-small text-muted">邏輯完全一樣，只換了一個名字。這就是 Kagan 說的「嘴上承認」和「打從心底相信」之間的距離。</p>
    </div>
  </figure>
</template>
