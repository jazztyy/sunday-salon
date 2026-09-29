<script setup lang="ts">
// 頂部列：站名＋場次 chip＋手機「影片章節」按鈕＋深淺色切換，第二列是五個學習階段分頁。
// 規格見 DESIGN.md「導覽」。頂部列高度寫入 CSS 變數 --tb，SessionView 的 sticky 位移依賴它。
import type { Session, TabKey } from '~/types/session'

defineProps<{
  tabs: { key: TabKey, label: string }[]
  session: Session
  sessions: Session[]
}>()

const emit = defineEmits<{ 'open-chapters': [] }>()

const tab = defineModel<TabKey>('tab', { required: true })

const root = useTemplateRef<HTMLElement>('root')

const syncHeight = () => {
  if (!root.value) return
  document.documentElement.style.setProperty('--tb', `${root.value.offsetHeight}px`)
}

onMounted(syncHeight)
useResizeObserver(root, syncHeight)
useEventListener('resize', syncHeight)

const onTabChange = (value: string | number) => {
  tab.value = value as TabKey
}
</script>

<template>
  <div ref="root" class="sticky top-0 z-20 border-b border-default bg-default">
    <div class="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 pt-2.5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="font-serif text-title font-black tracking-[.08em] text-highlighted">悅讀聊天室</span>

        <div class="flex flex-wrap items-center gap-2">
          <nav class="flex flex-wrap gap-1.5" aria-label="場次">
            <UButton
              v-for="s in sessions"
              :key="s.id"
              :to="`/s/${s.id}`"
              :label="s.chip"
              color="neutral"
              :variant="s.id === session.id ? 'solid' : 'outline'"
              size="xs"
              :aria-current="s.id === session.id ? 'page' : undefined"
              class="rounded-full px-3"
              :ui="{ label: 'text-ui font-medium' }"
            />
          </nav>
          <UButton
            label="影片章節"
            color="neutral"
            variant="outline"
            size="xs"
            class="rounded-full px-3 lg:hidden"
            :ui="{ label: 'text-ui font-medium' }"
            @click="emit('open-chapters')"
          />
          <UColorModeButton size="xs" />
        </div>
      </div>

      <UTabs
        :model-value="tab"
        :items="tabs"
        value-key="key"
        variant="link"
        color="primary"
        :content="false"
        aria-label="學習階段"
        class="-mx-1 min-w-0"
        :ui="{
          list: 'mb-0 gap-0.5 overflow-x-auto border-b-0 p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          indicator: 'bottom-0 h-0.5',
          trigger: 'flex-none items-baseline rounded-none px-2.5 pt-2 pb-2.5 data-[state=inactive]:text-muted data-[state=active]:text-highlighted',
          label: 'text-small',
        }"
        @update:model-value="onTabChange"
      >
        <template #leading="{ index }">
          <span class="font-mono text-label font-medium">{{ index + 1 }}</span>
        </template>
      </UTabs>
    </div>
  </div>
</template>
