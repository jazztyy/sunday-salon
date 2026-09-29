<script setup lang="ts">
// 單一場次的頁面骨架：頂部列、分頁內容、側欄（播放器＋章節）、手機章節抽屜。
// 分頁與網址 hash 同步（#before / #during / #recall / #sunday / #after），規格見 SPEC.md「資訊架構」。
import type { Session, TabKey } from '~/types/session'

defineProps<{ session: Session }>()

const TABS: { key: TabKey, label: string }[] = [
  { key: 'before', label: '看之前' },
  { key: 'during', label: '邊看邊想' },
  { key: 'recall', label: '看完回想' },
  { key: 'sunday', label: '週日討論' },
  { key: 'after', label: '活動後' },
]

const route = useRoute()
const router = useRouter()
const lastTab = useSalonStorage<TabKey>('salon-tab', 'before')
const { embed, playing } = usePlayer()

const isTab = (v: string): v is TabKey => TABS.some(t => t.key === v)

const tab = ref<TabKey>('before')

// 初次載入時 Nuxt 路由會拿掉 hash，改讀 <head> 腳本事先記下的值（見 nuxt.config.ts）。
// 只用一次：之後在站內切換場次時，改讀當下的網址。
onMounted(() => {
  const fromHash = takeInitialLocation().hash.slice(1)
  tab.value = isTab(fromHash) ? fromHash : lastTab.value
})

watch(tab, (value) => {
  lastTab.value = value
  if (route.hash !== `#${value}`) router.replace({ hash: `#${value}` })
  if (import.meta.client) window.scrollTo({ top: 0 })
})

const nextTab = computed(() => TABS[TABS.findIndex(t => t.key === tab.value) + 1])

const chaptersOpen = ref(false)

</script>

<template>
  <div class="min-h-dvh pb-20">
    <SalonHeader v-model:tab="tab" :tabs="TABS" @open-chapters="chaptersOpen = true" />

    <div
      class="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 pt-7 lg:grid-cols-[minmax(0,1fr)_300px]"
      :class="{ 'lg:grid-cols-[minmax(0,1fr)_420px]': embed }"
    >
      <main class="flex min-w-0 max-w-[760px] flex-col gap-10">
        <header class="flex flex-col gap-3">
          <p class="font-mono text-meta font-medium uppercase tracking-[.12em] text-primary">{{ session.eyebrow }}</p>
          <h1 class="font-serif text-h1 font-black leading-tight text-highlighted">{{ session.title }}</h1>
          <p class="flex flex-wrap gap-x-5 gap-y-1 text-small text-muted">
            <span>日期 <b class="font-medium text-highlighted">{{ session.dateLabel }}</b></span>
            <span>講者 <b class="font-medium text-highlighted">{{ session.speaker }}</b></span>
            <span>影片 <b class="font-medium text-highlighted">{{ session.videos.length }} 支</b></span>
          </p>
          <ul v-if="session.tags.length" class="flex flex-wrap gap-1.5" aria-label="標籤">
            <li v-for="tag in session.tags" :key="tag">
              <NuxtLink
                :to="`/archive?tag=${encodeURIComponent(tag)}`"
                class="rounded-tag focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <UBadge :label="tag" color="neutral" variant="subtle" class="rounded-tag text-meta hover:bg-accented" />
              </NuxtLink>
            </li>
          </ul>
        </header>

        <TabBefore v-if="tab === 'before'" :session="session" />
        <TabDuring v-else-if="tab === 'during'" :session="session" />
        <TabRecall v-else-if="tab === 'recall'" :session="session" />
        <TabSunday v-else-if="tab === 'sunday'" :session="session" />
        <TabAfter v-else :session="session" />

        <div v-if="nextTab" class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
          <span class="text-small text-muted">下一步</span>
          <UButton color="neutral" :label="`${nextTab.label} →`" @click="tab = nextTab.key" />
        </div>

        <footer class="flex flex-col gap-1.5 border-t border-default pt-5 text-ui text-muted">
          <p>課程內容來自耶魯大學公開課 PHIL 176《Death》（Shelly Kagan），影片連結指向 YouTube 上的轉載版本。</p>
          <p>頁面上的摘要、論證整理與題目由主辦方依影片內容整理，觀點以影片原文為準。</p>
        </footer>
      </main>

      <!-- 桌機：側欄固定。手機：開始播放後播放器固定在頂部（章節清單改用抽屜） -->
      <aside
        class="lg:sticky lg:top-[calc(var(--tb,116px)+16px)] lg:block lg:max-h-[calc(100dvh-var(--tb,116px)-32px)] lg:self-start lg:overflow-y-auto"
        :class="embed && playing
          ? 'sticky top-[var(--tb,116px)] z-10 order-first -mx-4 block border-b border-default bg-default px-4 pt-2 lg:order-none lg:mx-0 lg:border-0 lg:px-0 lg:pt-0'
          : 'hidden'"
      >
        <VideoPanel :session="session" />
      </aside>
    </div>

    <UDrawer v-model:open="chaptersOpen" title="影片章節" class="lg:hidden">
      <template #body>
        <VideoChapterList :session="session" hide-title @played="chaptersOpen = false" />
      </template>
    </UDrawer>
  </div>
</template>
