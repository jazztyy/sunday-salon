<script setup lang="ts">
// 「活動後」分頁：活動結束後填了 recap 才顯示回顧（錄音、大家的立場、現場問題、新增概念卡），
// 還沒填時顯示預告文字。規格見 SPEC.md 5.5。
import type { Session } from '~/types/session'

const props = defineProps<{ session: Session }>()

// Nuxt Content 不會替巢狀物件補 schema 的預設值：recap 只填了一部分時，其他欄位是 undefined，這裡統一補成空的
const recap = computed(() => {
  const r = props.session.recap
  if (!r) return null
  return { audio: r.audio, chapters: r.chapters ?? [], votes: r.votes ?? [], questions: r.questions ?? [], concepts: r.concepts ?? [] }
})

const { data: allConcepts } = await useConceptIndex()
const newConcepts = computed(() =>
  (recap.value?.concepts ?? []).map(id => allConcepts.value?.find(c => c.id === id)).filter(c => !!c),
)

/** 人數 → 百分比（整數），總人數 0 時回傳 0 */
const percent = (list: number[], i: number) => {
  const total = list.reduce((a, b) => a + b, 0)
  return total ? Math.round(((list[i] ?? 0) / total) * 100) : 0
}

const voteRows = computed(() =>
  (recap.value?.votes ?? []).map((counts, i) => ({
    q: props.session.votes[i]?.q ?? '',
    options: (props.session.votes[i]?.o ?? []).map((label, j) => ({ label, percent: percent(counts, j) })),
    count: counts.reduce((a, b) => a + b, 0),
  })),
)

const h3Class = 'font-serif text-title font-bold text-highlighted'
</script>

<template>
  <section class="flex flex-col gap-6">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">活動後</h2>

    <div v-if="!recap" class="flex flex-col gap-2 rounded-card border border-dashed border-default p-5 text-toned">
      <b>尚未舉行</b>
      <p>{{ session.after }}</p>
    </div>

    <template v-else>
      <div v-if="recap.audio || recap.chapters.length" class="flex flex-col gap-3">
        <h3 :class="h3Class">討論錄音</h3>
        <UButton
          v-if="recap.audio"
          :to="recap.audio.url"
          target="_blank"
          icon="i-lucide-headphones"
          :label="recap.audio.label"
          class="self-start rounded-control px-3.5"
        />
        <ol v-if="recap.chapters.length" class="flex flex-col">
          <li v-for="[t, label] in recap.chapters" :key="t" class="grid grid-cols-[3.4em_1fr] gap-2 py-0.5 text-ui text-toned">
            <span class="pt-px font-mono text-meta font-medium tabular-nums text-muted">{{ mmss(t) }}</span>
            <span>{{ label }}</span>
          </li>
        </ol>
      </div>

      <div v-if="voteRows.length" class="flex flex-col gap-3">
        <h3 :class="h3Class">大家的立場</h3>
        <p class="text-small text-muted">立場題的投票結果，數字是各選項的比例。</p>
        <div v-for="(v, i) in voteRows" :key="i" class="flex flex-col gap-2 rounded-card border border-default bg-elevated p-3.5">
          <p class="font-medium text-highlighted">{{ v.q }}<span class="ms-2 text-meta font-normal text-muted">{{ v.count }} 人</span></p>
          <ul class="flex flex-col gap-1">
            <li v-for="o in v.options" :key="o.label" class="flex items-baseline justify-between gap-3 text-small">
              <span class="text-toned">{{ o.label }}</span>
              <b class="flex-none font-mono text-meta font-medium tabular-nums text-highlighted">{{ o.percent }}%</b>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="recap.questions.length" class="flex flex-col gap-3">
        <h3 :class="h3Class">現場冒出的問題</h3>
        <ul class="flex flex-col gap-2">
          <li v-for="(q, i) in recap.questions" :key="i" class="rounded-card border border-default bg-elevated px-3.5 py-3 text-body-sm">{{ q }}</li>
        </ul>
      </div>

      <div v-if="newConcepts.length" class="flex flex-col gap-3">
        <h3 :class="h3Class">這場新增的概念卡</h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <ConceptCard v-for="c in newConcepts" :key="c.id" :concept="c" />
        </div>
      </div>
    </template>
  </section>

  <RelatedSessions :session="session" />
</template>
