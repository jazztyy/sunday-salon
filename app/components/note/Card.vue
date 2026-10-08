<script setup lang="ts">
// 筆記卡（/notes 用）：外觀和 /archive 的場次卡一致。內容區是按鈕，點了由頁面打開編輯視窗。
// deletable 時底部多一個刪除圖示（四種筆記都有）；按鈕不能包按鈕，所以外框放在外層 div。
// 種類的名稱和徽章顏色在 utils/noteKinds.ts。規格見 SPEC.md「筆記」。
import { NOTE_KINDS, type NoteKind } from '~/utils/noteKinds'

const props = withDefaults(defineProps<{
  kind: NoteKind
  title: string
  /** 第一行的小字：講座標籤或修改日期 */
  meta: string
  body: string
  deletable?: boolean
}>(), { deletable: false })

defineEmits<{ open: [], delete: [] }>()

/** 卡片預覽用：去掉 Markdown 符號（標題、粗斜體、程式碼、引用、清單記號、連結網址），只留文字 */
const preview = computed(() => props.body
  .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
  .replace(/(\*\*|__|~~|`)(.+?)\1/g, '$2')
  .replace(/(\*|_)(.+?)\1/g, '$2')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\n{2,}/g, '\n')
  .trim())
</script>

<template>
  <div class="flex h-full flex-col rounded-card border border-default bg-elevated transition-colors has-[>button:hover]:border-primary">
    <button
      type="button"
      class="flex w-full flex-1 flex-col gap-2 rounded-card p-4 text-left focus-visible:outline-2 focus-visible:outline-primary"
      :class="{ 'pb-2': props.deletable }"
      @click="$emit('open')"
    >
      <div class="flex w-full items-center gap-2 font-mono text-meta">
        <span class="text-primary">{{ props.meta }}</span>
        <UBadge
          :label="NOTE_KINDS[props.kind].label"
          :color="NOTE_KINDS[props.kind].color"
          variant="outline"
          class="ml-auto rounded-tag px-1.5 py-0 font-sans text-label font-medium"
        />
      </div>
      <span class="line-clamp-2 font-serif text-title leading-snug font-semibold text-pretty" :class="props.title ? 'text-highlighted' : 'text-muted'">
        {{ props.title || '未命名筆記' }}
      </span>
      <p v-if="preview" class="line-clamp-3 text-small leading-relaxed whitespace-pre-line text-toned">{{ preview }}</p>
    </button>

    <div v-if="props.deletable" class="flex justify-end px-2 pb-2">
      <UButton
        icon="i-lucide-trash-2"
        :aria-label="`刪除「${props.title || '未命名筆記'}」`"
        color="neutral"
        variant="ghost"
        size="xs"
        class="text-dimmed hover:text-highlighted"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>
