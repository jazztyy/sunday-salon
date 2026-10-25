<script setup lang="ts">
// 「補充資料」分頁：和本場相關、但不是影片內容的延伸閱讀（SPEC.md 5.6、DESIGN.md 6.9）。
// 只有場次有 supplement 時才會出現（SessionView 決定）。第一份是 10/25 的《伊凡．伊里奇之死》。
import type { Session, Supplement } from '~/types/session'

const props = defineProps<{ session: Session }>()

const sup = computed(() => props.session.supplement as Supplement)
const titleChars = computed(() => Array.from(sup.value.title))

const label = 'font-mono text-meta font-medium tracking-[.12em] text-primary'
const h2 = 'font-serif text-h2 font-black leading-snug text-highlighted'
const h3 = 'font-serif text-title font-bold text-highlighted'

/** 開頭的段落捷徑：捲到該段，不改網址（網址的 hash 是分頁） */
const sections = computed(() => [
  { id: 'sup-plot', label: '劇情' },
  sup.value.themes && { id: 'sup-themes', label: '想說什麼' },
  sup.value.pairs && { id: 'sup-pairs', label: '和這週的關係' },
  sup.value.questions && { id: 'sup-questions', label: '帶去聊的問題' },
].filter(Boolean) as { id: string, label: string }[])
const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// ── 捲到才播放：主旨的說明往上浮、對照的兩欄從左右滑進來、問題依序出現 ──
const { reveal } = useScrollReveal()
const themeTexts = useTemplateRef<HTMLElement[]>('themeText')
const pairEls = useTemplateRef<HTMLElement[]>('pair')
const questionList = useTemplateRef<HTMLElement>('questionList')

onMounted(() => {
  for (const el of themeTexts.value ?? []) {
    reveal(el, e => setFrame(e, { opacity: '0.12', transform: 'translateY(18px)' }), e =>
      playFrom(e, { opacity: '0.12', transform: 'translateY(18px)' }, { duration: 700, easing: EASE_OUT }))
  }
  for (const el of pairEls.value ?? []) {
    const cols = () => Array.from(el.querySelectorAll<HTMLElement>('[data-col]'))
    const extra = () => el.querySelector<HTMLElement>('[data-think]')
    const from = (i: number) => ({ opacity: '0.12', transform: `translateX(${i ? 28 : -28}px)` })
    reveal(el, () => {
      cols().forEach((c, i) => setFrame(c, from(i)))
      const t = extra()
      if (t) setFrame(t, { opacity: '0.12', transform: 'translateY(12px)' })
    }, () => {
      cols().forEach((c, i) => playFrom(c, from(i), { duration: 700, delay: i * 140, easing: EASE_OUT }))
      const t = extra()
      if (t) playFrom(t, { opacity: '0.12', transform: 'translateY(12px)' }, { duration: 600, delay: 350, easing: EASE_OUT })
    })
  }
  reveal(questionList.value, (el) => {
    el.querySelectorAll<HTMLElement>('li').forEach(li => setFrame(li, { opacity: '0.12', transform: 'translateY(16px)' }))
  }, (el) => {
    el.querySelectorAll<HTMLElement>('li').forEach((li, i) =>
      playFrom(li, { opacity: '0.12', transform: 'translateY(16px)' }, { duration: 700, delay: i * 140, easing: EASE_OUT }))
  })
})

// ── 閱讀進度：頂部列下方一條金色細線 ──
const { y } = useWindowScroll()
const progress = computed(() => {
  if (!import.meta.client) return 0
  const max = document.documentElement.scrollHeight - window.innerHeight
  return max > 0 ? Math.min(1, Math.max(0, y.value / max)) : 0
})
</script>

<template>
  <!-- 進度條的長度由捲動位置決定，只能用 :style（DESIGN.md 7） -->
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-x-0 top-[var(--tb,116px)] z-10 h-0.5 origin-left bg-primary"
    :style="{ transform: `scaleX(${progress})` }"
  />

  <header class="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:gap-10">
    <div class="flex min-w-0 flex-col gap-4">
      <p :class="label">{{ sup.eyebrow }}</p>
      <h2 class="sup-chars font-serif text-h1 font-black leading-tight tracking-[.02em] text-highlighted" :aria-label="sup.title">
        <span v-for="(c, i) in titleChars" :key="i" aria-hidden="true">{{ c }}</span>
      </h2>
      <p v-if="sup.original" class="text-small italic text-muted" lang="ru">{{ sup.original }}</p>
      <SupplementQuote v-if="sup.epigraph" :quote="sup.epigraph" size="lead" immediate />
      <p class="text-lead text-toned">{{ sup.lede }}</p>
      <nav aria-label="本頁段落" class="flex flex-wrap gap-x-5 gap-y-1 border-t border-default pt-3">
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          class="rounded-control py-1 text-small text-secondary transition-colors hover:text-highlighted"
          @click="jump(s.id)"
        >
          {{ s.label }}
        </button>
      </nav>
    </div>
    <SupplementNotice v-if="sup.notice" :notice="sup.notice" />
  </header>

  <dl v-if="sup.facts?.length" class="grid grid-cols-1 gap-x-6 sm:grid-cols-2 md:grid-cols-3">
    <div v-for="[k, v] in sup.facts" :key="k" class="flex flex-col gap-0.5 border-t border-default pt-3 pb-4">
      <dt class="text-meta tracking-[.12em] text-muted">{{ k }}</dt>
      <dd class="font-bold leading-relaxed text-highlighted">{{ v }}</dd>
    </div>
  </dl>

  <section id="sup-plot" class="flex scroll-mt-[calc(var(--tb,116px)+16px)] flex-col gap-6">
    <div class="flex flex-col gap-2">
      <p :class="label">劇情</p>
      <h2 :class="h2">{{ sup.plot.title }}</h2>
      <p class="text-toned">{{ sup.plot.intro }}</p>
    </div>
    <SupplementBook :supplement="sup" />
    <SupplementSpans v-if="sup.plot.spans" :spans="sup.plot.spans" :chapters="sup.plot.chapters" />
  </section>

  <section v-if="sup.themes" id="sup-themes" class="flex scroll-mt-[calc(var(--tb,116px)+16px)] flex-col gap-8">
    <div class="flex flex-col gap-2">
      <p :class="label">托爾斯泰想說什麼</p>
      <h2 :class="h2">{{ sup.themes.title }}</h2>
      <p class="text-toned">{{ sup.themes.intro }}</p>
    </div>
    <SupplementFigure v-for="fig in sup.themes.figures ?? []" :key="fig" :figure="fig" />
    <article
      v-for="item in sup.themes.items"
      :key="item.title"
      class="grid gap-5 border-t border-default pt-6 md:grid-cols-2 md:gap-8"
    >
      <div ref="themeText" class="flex min-w-0 flex-col gap-2.5">
        <h3 :class="h3">{{ item.title }}</h3>
        <p>{{ item.body }}</p>
      </div>
      <div class="flex min-w-0 flex-col gap-5">
        <SupplementQuote v-for="q in item.quotes ?? []" :key="q.text" :quote="q" />
      </div>
      <div v-if="item.figure" class="min-w-0 md:col-span-2">
        <SupplementFigure :figure="item.figure" />
      </div>
    </article>
  </section>

  <section v-if="sup.pairs" id="sup-pairs" class="flex scroll-mt-[calc(var(--tb,116px)+16px)] flex-col gap-8">
    <div class="flex flex-col gap-2">
      <p :class="label">和這週的關係</p>
      <h2 :class="h2">{{ sup.pairs.title }}</h2>
      <p class="text-toned">{{ sup.pairs.intro }}</p>
    </div>
    <article v-for="p in sup.pairs.items" :key="p.title" ref="pair" class="flex flex-col gap-4 border-t border-default pt-6">
      <div class="flex flex-col gap-0.5">
        <p class="font-mono text-meta font-medium text-primary">{{ p.lec }}</p>
        <h3 :class="h3">{{ p.title }}</h3>
      </div>
      <div class="grid gap-5 md:grid-cols-2 md:gap-8">
        <div data-col class="flex min-w-0 flex-col gap-1.5">
          <p class="text-meta tracking-[.12em] text-muted">Kagan 說</p>
          <p>{{ p.kagan }}</p>
        </div>
        <div data-col class="flex min-w-0 flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <p class="text-meta tracking-[.12em] text-muted">小說裡</p>
            <p>{{ p.novel }}</p>
          </div>
          <SupplementQuote v-if="p.quote" :quote="p.quote" />
        </div>
      </div>
      <p v-if="p.think" data-think class="rounded-card bg-secondary-soft px-4.5 py-3.5 text-body-sm">
        <strong class="text-secondary">{{ p.think.label }}：</strong>{{ p.think.text }}
      </p>
    </article>
  </section>

  <section v-if="sup.questions" id="sup-questions" class="flex scroll-mt-[calc(var(--tb,116px)+16px)] flex-col gap-4">
    <div class="flex flex-col gap-2">
      <p :class="label">帶去聊的問題</p>
      <h2 :class="h2">{{ sup.questions.title }}</h2>
    </div>
    <ul ref="questionList" class="flex flex-col">
      <li
        v-for="q in sup.questions.items"
        :key="q.q"
        class="flex flex-col gap-1 border-t border-default py-4 last:border-b"
      >
        <span class="font-serif text-lead font-bold leading-relaxed text-highlighted">{{ q.q }}</span>
        <span v-if="q.sub" class="text-small text-muted">{{ q.sub }}</span>
      </li>
    </ul>
  </section>

  <section v-if="sup.sources?.length" class="flex flex-col gap-1.5 border-t border-default pt-5 text-ui leading-relaxed text-muted">
    <p v-for="s in sup.sources" :key="s">{{ s }}</p>
  </section>
</template>
