// 瀏覽器儲存（localStorage）讀好了沒，給要放載入骨架的頁面用（/notes、/review）。
//
// useSalonStorage 用 initOnMounted：預先產生的 HTML 和 hydration 那一刻都還是預設值（空的筆記、沒有作答紀錄），
// 直接畫出來會先閃一下「還沒有筆記」或錯的題數，所以這段時間回傳 false，頁面先放骨架，掛載後才換成真的內容。
// 站內換頁時新頁面在掛載後同一個 tick 就讀完、瀏覽器還沒畫出來，不會閃，直接回傳 true（不然每次換頁都多閃一次骨架）。

export const useStorageReady = () => {
  const fromPrerender = import.meta.server || useNuxtApp().isHydrating
  const mounted = useMounted()
  return computed(() => !fromPrerender || mounted.value)
}
