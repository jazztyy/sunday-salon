<script setup lang="ts">
// 篩選頁的兩欄版面（/archive、/concepts、/review、/notes 共用）：
// 左邊是篩選欄（桌機固定在左邊，往下捲也看得到；手機放在上方），右邊是內容。
// 篩選邏輯留在各頁，這裡只負責版面。
//
// 篩選欄由上到下：
// - #top：一直看得到的主要動作（新增筆記）
// - #search：搜尋框。手機上和「篩選（N）」開關按鈕排在同一行
// - #summary：「已選」摘要
// 以上一直看得到；手機上整個篩選欄固定在頂部列下方（sticky），往下滑也能搜尋、篩選。
// 展開的選項太長時在篩選欄裡面捲動。複習頁傳 :sticky-mobile="false"（那裡是設定，不是篩選，做題時不要佔畫面）。
// - #aside：選項本身（chip、下拉選單、複習設定、匯出）。手機（lg 以下）預設收起，
//   上面一顆「篩選（2）」開關按鈕展開；桌機照常攤開，開關按鈕不顯示
// - #bottom：一直看得到，接在選項後面（例如複習的「開始複習」）
// 每個 slot 只渲染一次，手機收起只是加 class（max-lg:hidden），桌機和手機共用同一份 DOM：
// 預先產生的 HTML 和 hydration 一致，元件狀態也不會有兩份。展開狀態不記住，每次進來都是收起。
const props = withDefaults(defineProps<{
  /** 篩選欄的無障礙名稱（aria-label），例如「篩選」「複習設定」 */
  asideLabel?: string
  /** 右欄各區塊的間距 */
  mainClass?: string
  /** 手機開關按鈕的文字 */
  toggleLabel?: string
  /** 收起來的選項裡有幾個條件生效，> 0 時顯示成「篩選（2）」 */
  activeCount?: number
  /** 開關按鈕下面一行的目前設定摘要（複習：「今天該複習的・全部討論過的・10 題」） */
  toggleHint?: string
  /** 手機上篩選欄固定在頂部列下方 */
  stickyMobile?: boolean
}>(), {
  asideLabel: '篩選',
  mainClass: 'gap-8',
  toggleLabel: '篩選',
  activeCount: 0,
  toggleHint: '',
  stickyMobile: true,
})

const slots = useSlots()

/**
 * 手機固定在頂部列下方：滿版、實色底、下框線；展開的選項太長時在裡面捲動。
 * 不用半透明加 backdrop-blur：blur 會讓裡面 position: fixed 的元素（筆記頁的浮動「新增筆記」）改成相對篩選欄定位。
 */
const STICKY_MOBILE = 'max-lg:sticky max-lg:top-[var(--tb,57px)] max-lg:z-10 max-lg:-mx-4 max-lg:max-h-[calc(100dvh-var(--tb,57px))] max-lg:gap-2.5 max-lg:overflow-y-auto max-lg:border-b max-lg:border-default max-lg:bg-default max-lg:px-4 max-lg:py-2.5'

const open = ref(false)
const panelId = useId()
const toggleBtn = useTemplateRef<{ $el: HTMLElement }>('toggle')

/** 面板底部的「收起」：按鈕跟著面板消失，焦點交回開關按鈕（focus 會把它捲進畫面） */
const collapse = () => {
  open.value = false
  nextTick(() => toggleBtn.value?.$el.focus())
}
</script>

<template>
  <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10">
    <aside
      :aria-label="asideLabel"
      class="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--tb,64px)+1.5rem)] lg:max-h-[calc(100vh-var(--tb,64px)-3rem)] lg:overflow-y-auto lg:pr-1"
      :class="stickyMobile && STICKY_MOBILE"
    >
      <slot name="top" />

      <!-- 有搜尋框：手機上搜尋框和精簡的開關按鈕排一行 -->
      <div v-if="slots.search" class="flex items-center gap-2">
        <div class="min-w-0 flex-1">
          <slot name="search" />
        </div>
        <UButton
          ref="toggle"
          color="neutral"
          variant="outline"
          :aria-expanded="open"
          :aria-controls="panelId"
          :aria-label="`${toggleLabel}${props.activeCount ? `，已選 ${props.activeCount} 個條件` : ''}`"
          class="shrink-0 gap-1.5 rounded-control px-2.5 py-1.5 lg:hidden"
          :class="props.activeCount && 'ring-primary'"
          @click="open = !open"
        >
          <UIcon name="i-lucide-sliders-horizontal" class="size-4 shrink-0" :class="props.activeCount ? 'text-primary' : 'text-muted'" />
          <span class="text-ui font-medium text-highlighted">
            {{ toggleLabel }}<template v-if="props.activeCount">（{{ props.activeCount }}）</template>
          </span>
          <UIcon
            name="i-lucide-chevron-down"
            class="size-4 shrink-0 text-muted transition-transform duration-200"
            :class="open && 'rotate-180'"
          />
        </UButton>
      </div>

      <slot name="summary" />

      <!-- 沒有搜尋框：整行的開關按鈕（可以帶一行摘要） -->
      <UButton
        v-if="!slots.search"
        ref="toggle"
        color="neutral"
        variant="outline"
        :aria-expanded="open"
        :aria-controls="panelId"
        class="w-full gap-2 rounded-control px-3 py-2 text-left lg:hidden"
        @click="open = !open"
      >
        <UIcon name="i-lucide-sliders-horizontal" class="size-4 shrink-0 text-muted" />
        <span class="flex min-w-0 flex-col">
          <span class="text-ui font-medium text-highlighted">
            {{ toggleLabel }}<template v-if="props.activeCount">（{{ props.activeCount }}）</template>
          </span>
          <span v-if="toggleHint" class="truncate text-meta text-muted">{{ toggleHint }}</span>
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="ml-auto size-4 shrink-0 text-muted transition-transform duration-200"
          :class="open && 'rotate-180'"
        />
      </UButton>

      <!-- 選項：桌機一直攤開；手機收起時 max-lg:hidden，展開時淡入上浮（animate-reveal） -->
      <div :id="panelId" class="flex flex-col gap-5" :class="open ? 'max-lg:animate-reveal' : 'max-lg:hidden'">
        <slot name="aside" />

        <UButton
          :label="`收起${toggleLabel}`"
          icon="i-lucide-chevron-up"
          color="neutral"
          variant="ghost"
          size="sm"
          class="justify-center rounded-control text-ui text-muted lg:hidden"
          @click="collapse"
        />
      </div>

      <slot name="bottom" />
    </aside>

    <div class="flex min-w-0 flex-col" :class="mainClass">
      <slot />
    </div>
  </div>
</template>
