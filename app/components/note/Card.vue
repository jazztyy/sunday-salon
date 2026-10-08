<script setup lang="ts">
// 筆記卡（/notes 用）：外觀和 /archive 的場次卡一致。整張卡片是按鈕，點了由頁面打開編輯視窗。
// 規格見 SPEC.md「筆記」。
const props = defineProps<{
  /** 'discuss' 討論筆記、'review' 複習筆記、'mine' 我的筆記 */
  kind: 'discuss' | 'review' | 'mine'
  title: string
  /** 第一行的小字：講座標籤或修改日期 */
  meta: string
  body: string
}>()

defineEmits<{ open: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex h-full w-full flex-col gap-2 rounded-card border border-default bg-elevated p-4 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    @click="$emit('open')"
  >
    <div class="flex items-center gap-2 font-mono text-meta">
      <span class="text-primary">{{ props.meta }}</span>
      <UBadge
        :label="{ discuss: '討論筆記', review: '複習筆記', mine: '我的筆記' }[props.kind]"
        :color="{ discuss: 'neutral', review: 'secondary', mine: 'primary' }[props.kind] as 'neutral' | 'secondary' | 'primary'"
        variant="outline"
        class="ml-auto rounded-tag px-1.5 py-0 font-sans text-label font-medium"
      />
    </div>
    <span class="line-clamp-2 font-serif text-title leading-snug font-semibold text-pretty" :class="props.title ? 'text-highlighted' : 'text-muted'">
      {{ props.title || '未命名筆記' }}
    </span>
    <p v-if="props.body" class="line-clamp-3 text-small leading-relaxed whitespace-pre-line text-toned">{{ props.body }}</p>
  </button>
</template>
