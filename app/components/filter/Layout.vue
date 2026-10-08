<script setup lang="ts">
// 篩選頁的兩欄版面（/archive、/concepts、/review 共用）：
// 左邊是篩選欄（桌機固定在左邊，往下捲也看得到；手機放在上方），右邊是內容。
// 篩選邏輯留在各頁，這裡只負責版面。
withDefaults(defineProps<{
  /** 篩選欄的無障礙名稱（aria-label），例如「篩選」「複習設定」 */
  asideLabel?: string
  /** 右欄各區塊的間距 */
  mainClass?: string
}>(), {
  asideLabel: '篩選',
  mainClass: 'gap-8',
})
</script>

<template>
  <div class="flex flex-col gap-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10">
    <aside
      :aria-label="asideLabel"
      class="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--tb,64px)+1.5rem)] lg:max-h-[calc(100vh-var(--tb,64px)-3rem)] lg:overflow-y-auto lg:pr-1"
    >
      <slot name="aside" />
    </aside>

    <div class="flex min-w-0 flex-col" :class="mainClass">
      <slot />
    </div>
  </div>
</template>
