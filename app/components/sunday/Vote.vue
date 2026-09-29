<script setup lang="ts">
// 立場題：「討論前」「討論後」兩列 pill。前後選擇不同時顯示改變提示。
// 儲存格式與舊版相同：salon-vote-{id} = {題目索引: {pre: 選項, post: 選項}}，同一場次所有題目共用一個物件。
import type { Vote } from '~/types/session'

type Phase = 'pre' | 'post'
type VoteRecord = Record<string, { pre?: number, post?: number }>

const props = defineProps<{ vote: Vote, index: number, sessionId: string }>()

const PHASES: { key: Phase, label: string }[] = [
  { key: 'pre', label: '討論前' },
  { key: 'post', label: '討論後' },
]

const store = useSalonStorage<VoteRecord>(`salon-vote-${props.sessionId}`, {})
const uid = useId()

const record = computed(() => store.value?.[String(props.index)] ?? {})

const choose = (phase: Phase, option: number) => {
  const key = String(props.index)
  const all = store.value ?? {}
  store.value = { ...all, [key]: { ...all[key], [phase]: option } }
}

const shift = computed(() => {
  const { pre, post } = record.value
  if (pre === undefined || post === undefined || pre === post) return null
  return { from: props.vote.o[pre], to: props.vote.o[post] }
})
</script>

<template>
  <div class="flex flex-col gap-2.5 rounded-card border border-default bg-elevated p-3.5">
    <h3 class="text-lead font-bold leading-normal text-highlighted">{{ vote.q }}</h3>
    <div
      v-for="phase in PHASES"
      :key="phase.key"
      class="grid grid-cols-[4.5em_1fr] items-center gap-2 text-ui text-muted"
    >
      <span :id="`${uid}-${phase.key}`">{{ phase.label }}</span>
      <div class="flex flex-wrap gap-1.5" role="group" :aria-labelledby="`${uid}-${phase.key}`">
        <UButton
          v-for="(option, j) in vote.o"
          :key="j"
          :label="option"
          color="neutral"
          :variant="record[phase.key] === j ? 'solid' : 'subtle'"
          :aria-pressed="record[phase.key] === j"
          class="rounded-full px-3 py-0.5 font-normal text-small"
          :class="record[phase.key] === j ? 'ring ring-inset ring-inverted' : 'bg-accented ring-default'"
          @click="choose(phase.key, j)"
        />
      </div>
    </div>
    <p v-if="shift" class="text-ui text-primary">你從「{{ shift.from }}」改成了「{{ shift.to }}」。是哪個理由說動你的？</p>
  </div>
</template>
