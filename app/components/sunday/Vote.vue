<script setup lang="ts">
// 立場題：一列 pill，選一個立場（只有一輪，3.5 起拿掉「討論後」）。
// 儲存格式：salon-vote-{slug} = {題目索引: 選項索引}，同一場次所有題目共用一個物件。
import type { Vote } from '~/types/session'

type VoteRecord = Record<string, number>

const props = defineProps<{ vote: Vote, index: number, sessionId: string }>()

const store = useSalonStorage<VoteRecord>(`salon-vote-${props.sessionId}`, {})
const uid = useId()

// 3.4 以前的格式是 {pre, post} 物件，不是數字就當作沒選
const picked = computed(() => {
  const v = store.value?.[String(props.index)]
  return typeof v === 'number' ? v : undefined
})

const choose = (option: number) => {
  store.value = { ...store.value, [String(props.index)]: option }
}
</script>

<template>
  <div class="flex flex-col gap-2.5 rounded-card border border-default bg-elevated p-3.5">
    <h3 :id="`${uid}-q`" class="text-lead font-bold leading-normal text-highlighted">{{ vote.q }}</h3>
    <div class="flex flex-wrap gap-1.5" role="group" :aria-labelledby="`${uid}-q`">
      <UButton
        v-for="(option, j) in vote.o"
        :key="j"
        :label="option"
        color="neutral"
        :variant="picked === j ? 'solid' : 'subtle'"
        :aria-pressed="picked === j"
        class="rounded-full px-3 py-0.5 font-normal text-small"
        :class="picked === j ? 'ring ring-inset ring-inverted' : 'bg-accented ring-default'"
        @click="choose(j)"
      />
    </div>
  </div>
</template>
