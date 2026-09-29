<script setup lang="ts">
// 單選題（無狀態）：作答紀錄由父元件保管（邊看邊想用 salon-quiz-inline-*、看完回想用 salon-quiz-*）。
// 作答後鎖定，顯示對錯、解析與所有原片段連結。
import type { QuizItem, Session } from '~/types/session'

const props = withDefaults(
  defineProps<{
    session: Session
    item: QuizItem
    number: number
    /** 已選的選項索引，未作答為 undefined */
    pick?: number
    /** 題目標題層級：放在 h3 小節底下時用 h4 */
    as?: 'h3' | 'h4'
    /** 隱藏出處標籤：已經在某支影片或整合回顧的區塊裡時不需要重複顯示（只有混合測驗需要） */
    hideSource?: boolean
  }>(),
  { pick: undefined, as: 'h3', hideSource: false },
)

const emit = defineEmits<{ pick: [option: number] }>()

const answered = computed(() => props.pick !== undefined)
const correct = computed(() => props.pick === props.item.a)

/** 題目出處：某支影片的講座標籤，或「整合回顧」 */
const source = computed(() => (props.item.scope === 'all' ? '整合回顧' : lecOf(props.session, props.item.scope)))

const choose = (j: number) => {
  if (answered.value) return
  emit('pick', j)
}

const optionClass = (j: number) => {
  if (!answered.value) return 'border-default bg-muted transition-colors hover:border-secondary/70 hover:bg-accented'
  if (j === props.item.a) return 'border-success bg-success-soft'
  if (j === props.pick) return 'border-error bg-error-soft'
  return 'border-default bg-muted'
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <component :is="as" class="text-body font-bold">
      <span v-if="source && !hideSource" class="block font-mono text-label font-medium text-muted">{{ source }}</span>
      {{ number }}. {{ item.q }}
    </component>

    <div class="flex flex-col gap-1.5">
      <button
        v-for="(o, j) in item.o"
        :key="j"
        type="button"
        class="w-full rounded-control border px-3 py-2 text-left text-body-sm leading-relaxed text-default enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="optionClass(j)"
        :disabled="answered"
        @click="choose(j)"
      >
        {{ o }}
      </button>
    </div>

    <div v-if="answered" class="flex flex-col gap-1 text-small leading-relaxed text-toned" aria-live="polite">
      <p>
        <b v-if="correct" class="text-success">答對了。</b><b v-else class="text-error">再想想。</b>{{ item.e }}
      </p>
      <ul class="flex flex-wrap gap-x-4 gap-y-1">
        <li v-for="(r, k) in item.refs" :key="k">
          <VideoLink :vid="r[0]" :t="r[1]" class="font-mono text-meta">▸ {{ refLabel(session, r) }}</VideoLink>
        </li>
      </ul>
    </div>
  </div>
</template>
