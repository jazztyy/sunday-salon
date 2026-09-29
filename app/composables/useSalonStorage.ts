// 存在使用者自己瀏覽器的狀態（猜題、測驗、名詞卡、立場題）。
// key 一覽見 SPEC.md「瀏覽器儲存」。
//
// initOnMounted：伺服器端預先產生的 HTML 一律用預設值，掛載後才讀 localStorage，避免 hydration 不一致。
// 無痕模式或儲存被封鎖時 VueUse 會退回記憶體中的值，網站照常運作。

import type { RemovableRef } from '@vueuse/core'

export const useSalonStorage = <T>(key: string, defaults: T): RemovableRef<T> =>
  useLocalStorage<T>(key, defaults, { initOnMounted: true, mergeDefaults: false })
