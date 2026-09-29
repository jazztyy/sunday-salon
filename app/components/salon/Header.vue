<script setup lang="ts">
// 頂部列：站名＋網站導覽（本週／全部場次／概念卡）＋手機「影片章節」按鈕＋深淺色切換。
// 場次頁會傳入 tabs，第二列顯示五個學習階段分頁；其他頁面只有第一列。
// 規格見 DESIGN.md「導覽」。頂部列高度寫入 CSS 變數 --tb，SessionView 的 sticky 位移依賴它。
import type { TabKey } from '~/types/session'

defineProps<{
  tabs?: { key: TabKey, label: string }[]
}>()

const emit = defineEmits<{ 'open-chapters': [] }>()

const tab = defineModel<TabKey>('tab')

const route = useRoute()

const NAV = [
  { label: '本週', to: '/', match: (p: string) => p === '/' || p.startsWith('/s/') },
  { label: '全部場次', to: '/archive', match: (p: string) => p.startsWith('/archive') },
  { label: '概念卡', to: '/concepts', match: (p: string) => p.startsWith('/concepts') || p.startsWith('/c/') },
]

const navItems = computed(() => NAV.map(item => ({ ...item, active: item.match(route.path) })))

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
    <div class="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 pt-2.5" :class="{ 'pb-2.5': !tabs }">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-4">
          <NuxtLink
            to="/"
            class="shrink-0 rounded-control font-serif text-title font-black tracking-[.08em] text-highlighted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            悅讀聊天室
          </NuxtLink>

          <nav
            aria-label="網站"
            class="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :aria-current="item.active ? 'page' : undefined"
              class="shrink-0 whitespace-nowrap border-b-2 px-1.5 py-1 text-ui font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              :class="item.active ? 'border-primary text-highlighted' : 'border-transparent text-muted hover:text-highlighted'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="tabs"
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
        v-if="tabs"
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
