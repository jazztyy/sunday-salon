// 篩選條件和網址 query 同步（/archive、/concepts 共用），讓篩選後的結果可以分享。
//
// 為什麼不直接讀 route.query（SPEC.md 3.1「實作注意」）：
// 預先產生的頁面初次載入時，Nuxt 會把網址修正回產生時的路徑（query 會被清掉），而且這一步發生在元件掛載之後。
// 所以初次載入改讀 head 腳本存下來的原始 search（takeInitialLocation），並等 onNuxtReady 之後才寫回網址，
// 否則寫上去的 query 會被 Nuxt 的修正蓋掉。

/** 網址上的一個篩選參數 */
export interface UrlFilterParam {
  /** 參數名，例如 q、tag */
  key: string
  /** 目前的狀態 → 網址上的值；回傳 undefined 就不寫這個參數 */
  read: () => string | string[] | undefined
  /** 初次載入：網址上這個參數的所有值（已去掉空字串，可能是空陣列）→ 套用到狀態，不合法的值自己濾掉 */
  apply: (values: string[]) => void
}

/** route.query 的一個值攤平成字串陣列，去掉 null 和空字串 */
export const queryValues = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((t): t is string => typeof t === 'string' && t.length > 0)

/**
 * params 的順序就是套用和寫進網址的順序（例：/archive 的月份要在年份之後套用，才知道那一年有哪些月份）。
 * 回傳 urlReady：Nuxt 就緒、初始值套用完之前是 false，頁面另外監聽網址時用它擋掉初次載入。
 */
export const useUrlFilters = (params: UrlFilterParam[]) => {
  const route = useRoute()
  const router = useRouter()
  const urlReady = ref(false)

  const syncUrl = () =>
    router.replace({
      query: {
        ...route.query,
        ...Object.fromEntries(params.map(p => [p.key, p.read()])),
      },
      hash: route.hash,
    })

  // 監聽器建在元件範圍內（離開頁面會自動清除），就緒前不寫網址
  watch(() => params.map(p => p.read()), () => {
    if (urlReady.value) syncUrl()
  })

  onNuxtReady(() => {
    const initial = new URLSearchParams(takeInitialLocation().search)
    // 在站內換頁進來時 route.query 是對的；初次載入時它被清空，改用 head 腳本存下的原始 search
    const fromRoute = Object.keys(route.query).length > 0
    for (const p of params) {
      p.apply(fromRoute ? queryValues(route.query[p.key]) : initial.getAll(p.key).filter(Boolean))
    }
    urlReady.value = true
    syncUrl()
  })

  return { urlReady }
}
