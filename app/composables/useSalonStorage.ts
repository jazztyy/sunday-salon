// 存在使用者自己瀏覽器的狀態（猜題、測驗、名詞卡、立場題）。
// key 一覽見 SPEC.md「瀏覽器儲存」。
//
// initOnMounted：伺服器端預先產生的 HTML 一律用預設值，掛載後才讀 localStorage，避免 hydration 不一致。
// 無痕模式或儲存被封鎖時 VueUse 會退回記憶體中的值，網站照常運作。
// writeDefaults: false：只有真的寫入時才建立 key。
// 寫入失敗（多半是容量滿了）時跳提示：VueUse 預設只印在 console，使用者會以為存好了，重新整理才發現不見。

import type { RemovableRef } from '@vueuse/core'

const isQuotaError = (e: unknown) =>
  e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)

/** 同一頁有很多個 useSalonStorage，一次寫入失敗只提示一次 */
let lastWarned = 0

export const useSalonStorage = <T>(key: string, defaults: T): RemovableRef<T> => {
  const toast = useToast()
  return useLocalStorage<T>(key, defaults, {
    initOnMounted: true,
    mergeDefaults: false,
    // 沒有資料時不要把預設值寫進去：/notes 會替每一場建立好幾個讀取，否則每場都多出空的 key
    writeDefaults: false,
    onError: (e) => {
      console.error(e)
      if (!isQuotaError(e) || Date.now() - lastWarned < 10_000) return
      lastWarned = Date.now()
      toast.add({
        title: '沒有存到',
        description: '這個瀏覽器的儲存空間滿了，剛才的修改重新整理後會消失。請先到「筆記」匯出備份，再刪掉不需要的筆記。',
        icon: 'i-lucide-triangle-alert',
        color: 'error',
        duration: 15_000,
      })
    },
  })
}
