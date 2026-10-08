<script setup lang="ts">
// 立場題：一列 pill，選一個立場（只有一輪，3.5 起拿掉「討論後」）。
// 不存狀態：選項由父元件（tab/Sunday.vue 的 useVotes）保管。
import type { Vote } from '~/types/session'

const props = defineProps<{ vote: Vote, picked?: number }>()
const emit = defineEmits<{ choose: [option: number] }>()

const uid = useId()
const choose = (option: number) => emit('choose', option)
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
