<script setup lang="ts">
// 頂部列：站名＋網站導覽（本週／全部場次／概念卡）＋手機「影片章節」按鈕＋深淺色切換。
// 場次頁會傳入 tabs，第二列顯示五個學習階段分頁；其他頁面只有第一列。
// 層級：第一列是全站導覽（只用字色：選中金色、其他灰色，沒有底色或底線），第二列是「這一場」的學習階段（金色底線，唯一有底線的導覽），
// 第二列前面的場次標記（context）說明這些分頁屬於哪一場。
// 規格見 DESIGN.md「導覽」。頂部列高度寫入 CSS 變數 --tb，SessionView 的 sticky 位移依賴它。
import type { TabKey } from '~/types/session'

defineProps<{
  tabs?: { key: TabKey, label: string }[]
  /** 第二列前面的場次標記，例：'10/4 靈魂' */
  context?: string
}>()

const emit = defineEmits<{ 'open-chapters': [] }>()

const tab = defineModel<TabKey>('tab')

const route = useRoute()
const { baseURL } = useRuntimeConfig().app

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
        <div class="flex min-w-0 items-center gap-2 sm:gap-4">
          <NuxtLink
            to="/"
            class="flex shrink-0 items-center gap-2 rounded-control font-serif text-lead font-black sm:text-title tracking-normal text-highlighted transition-colors hover:text-primary sm:tracking-[.08em] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <!-- 網站 icon（public/favicon.svg），純裝飾，站名本身就是連結文字 -->
            <img :src="`${baseURL}favicon.svg`" alt="" aria-hidden="true" width="28" height="28" class="size-6 shrink-0 sm:size-7">
            悅讀聊天室
          </NuxtLink>

          <nav
            aria-label="網站"
            class="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :aria-current="item.active ? 'page' : undefined"
              class="shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-ui font-medium sm:px-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
              :class="item.active ? 'text-primary' : 'text-muted hover:text-highlighted'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <!-- 手機寬度只顯示圖示，讓出空間給導覽列；文字在 sm 以上才出現 -->
          <UButton
            v-if="tabs"
            icon="i-lucide-list-video"
            aria-label="影片章節"
            color="neutral"
            variant="outline"
            size="xs"
            class="rounded-full sm:px-3 lg:hidden"
            @click="emit('open-chapters')"
          >
            <span class="hidden text-ui font-medium sm:inline">影片章節</span>
          </UButton>
          <UColorModeButton size="xs" />
        </div>
      </div>

      <div v-if="tabs" class="flex min-w-0 items-center gap-2">
        <span v-if="context" class="hidden shrink-0 items-center gap-2 font-mono text-meta text-muted sm:inline-flex">
          {{ context }}<span aria-hidden="true" class="text-dimmed">›</span>
        </span>
      <UTabs
        :model-value="tab"
        :items="tabs"
        value-key="key"
        variant="link"
        color="primary"
        :content="false"
        aria-label="學習階段"
        class="-mx-1 min-w-0 sm:mx-0"
        :ui="{
          list: 'mb-0 gap-0 overflow-x-auto sm:gap-0.5 border-b-0 p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          indicator: 'bottom-0 h-0.5',
          trigger: 'group flex-none items-center gap-1 rounded-none px-1 pt-2 pb-2.5 sm:gap-1.5 sm:px-2.5 data-[state=inactive]:text-muted data-[state=active]:text-highlighted',
          label: 'text-ui leading-none sm:text-small',
        }"
        @update:model-value="onTabChange"
      >
        <!-- 手機寬度縮小間距與字級，讓五個分頁不用橫向捲動就放得下（360px 寬） -->
        <!-- 步驟數字：不加框，和文字垂直置中（leading-none）；目前階段用金色 -->
        <template #leading="{ index }">
          <span
            class="shrink-0 font-mono text-meta font-medium leading-none tabular-nums group-data-[state=active]:text-primary"
          >{{ index + 1 }}</span>
        </template>
      </UTabs>
      </div>
    </div>
  </div>
</template>
