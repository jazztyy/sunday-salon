<script setup lang="ts">
// 內嵌在內容裡的筆記小卡（討論卡的「我的想法」、作答紀錄視窗的「我的筆記」）：
// 有框的卡片，上面一行是名稱和淡色提示，下面是 Markdown 編輯器；closable 時右上角有收起的 X（emit close）。
// 概念卡的筆記在側欄，樣式不同，不用這個。
const props = withDefaults(defineProps<{
  label: string
  /** 名稱後面的淡色提示，例：「支援 Markdown，會收進「筆記」頁」 */
  hint?: string
  placeholder?: string
  /** 編輯區最小高度（Tailwind class） */
  minHeight?: string
  autofocus?: boolean
  closable?: boolean
  /** 收起按鈕的無障礙名稱 */
  closeLabel?: string
}>(), { minHeight: 'min-h-24', autofocus: false, closable: false, closeLabel: '收起' })

defineEmits<{ close: [] }>()

const model = defineModel<string>({ default: '' })

const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1 rounded-control border border-default bg-default p-3">
    <div class="flex items-center gap-2">
      <label :for="id" class="text-meta font-medium text-muted">{{ props.label }}<span v-if="props.hint" class="font-normal text-dimmed">・{{ props.hint }}</span></label>
      <UButton
        v-if="props.closable"
        icon="i-lucide-x"
        :aria-label="props.closeLabel"
        color="neutral"
        variant="ghost"
        size="xs"
        class="-my-1 ml-auto text-dimmed hover:text-highlighted"
        @click="$emit('close')"
      />
    </div>
    <LazyMarkdownEditor
      :id="id"
      v-model="model"
      :autofocus="props.autofocus"
      :min-height="props.minHeight"
      :placeholder="props.placeholder"
    />
  </div>
</template>
