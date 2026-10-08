<script setup lang="ts">
// 筆記頁的視窗外殼（筆記的編輯視窗、作答紀錄的視窗共用）：仿 Heptabase 卡片，像一張文件而不是表單。
// 上方是徽章、一行提示和關閉圖示；下面依序是大標題（title slot）、一排屬性（props slot，放 <NoteSheetProp>）、
// 分隔線、內容（預設 slot）。按右上角關閉、點外面或按 Esc 都會關閉。
// badge 是 null 時不顯示內容（視窗正在關閉、或要顯示的那則已經不在）。
withDefaults(defineProps<{
  /** 視窗的無障礙名稱（畫面上不顯示） */
  title: string
  badge: { label: string, color: 'neutral' | 'primary' | 'secondary' | 'success' | 'error' } | null
  hint: string
  /** 屬性列的垂直對齊：有選單的列比文字高，用 center；內容可能換行時用 start */
  propsAlign?: 'center' | 'start'
}>(), { propsAlign: 'center' })

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :close="false"
    :ui="{ content: 'sm:max-w-2xl', header: 'sr-only', body: 'p-0 sm:p-0' }"
  >
    <template #body>
      <article v-if="badge" class="flex flex-col">
        <div class="flex items-center gap-2 px-6 pt-4 sm:px-8">
          <UBadge
            :label="badge.label"
            :color="badge.color"
            variant="outline"
            class="rounded-tag px-1.5 py-0 text-label font-medium"
          />
          <span class="text-meta text-dimmed">{{ hint }}</span>
          <UButton
            icon="i-lucide-x"
            aria-label="關閉"
            color="neutral"
            variant="ghost"
            size="sm"
            class="ml-auto text-muted hover:text-highlighted"
            @click="open = false"
          />
        </div>

        <div class="flex flex-col gap-5 px-6 pt-3 pb-8 sm:px-8">
          <slot name="title" />

          <!-- 屬性列 -->
          <dl
            class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-ui"
            :class="propsAlign === 'center' ? 'items-center' : 'items-start'"
          >
            <slot name="props" />
          </dl>

          <div class="border-t border-default" />

          <slot />
        </div>
      </article>
    </template>
  </UModal>
</template>
