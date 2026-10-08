// 讀取內容的共用入口：場次、概念卡、詞彙表。所有頁面和元件都透過這裡查詢，不要直接呼叫 queryCollection。
//
// 資料來自建置時預先產生的 JSON 端點（server/routes/data/），每種形狀只拿頁面用得到的欄位（app/types/content.ts）：
// - 列表（useSessionIndex、useConceptIndex）：每場約 1KB、每張卡約 0.3KB，全站共用。/archive 的搜尋文字另外放（useSessionSearch）。
// - 完整的一場（useSession）、一張概念卡含內文（useConcept）：只在需要的頁面或打開彈窗時載入。
// - 筆記、複習的題目（useStudySessions）：只有 /notes、/review。
// 預先產生頁面時結果存進該頁的 payload；瀏覽器端碰到 payload 沒有的資料（例如在任何頁面打開概念卡彈窗）
// 就去抓同一個 JSON 檔。
//
// ⚠️ 不要在瀏覽器端直接呼叫 queryCollection：Nuxt Content 會在沒有任何提示的情況下下載 1MB 的 SQLite wasm 和整份資料。
import type { Session, TagFacet } from '~/types/session'
import type { ConceptFull, ConceptSummary, SessionSearch, SessionSummary, StudySession } from '~/types/content'

/** /data/{path} 的完整網址（部署時有 /sunday-salon/ 前綴）。要在 setup 裡呼叫 */
const useDataUrl = () => {
  const base = useRuntimeConfig().app.baseURL
  return (path: string) => `${base}data/${path}`
}

/** 精簡場次列表，新的在前 */
export const useSessionIndex = () => {
  const url = useDataUrl()
  return useAsyncData('sessions:index', () => $fetch<SessionSummary[]>(url('sessions.json')), { default: () => [] as SessionSummary[] })
}

/** /archive 搜尋用的文字 */
export const useSessionSearch = () => {
  const url = useDataUrl()
  return useAsyncData('sessions:search', () => $fetch<SessionSearch[]>(url('search.json')), { default: () => [] as SessionSearch[] })
}

/** 筆記、複習用的題目資料，新的在前 */
export const useStudySessions = () => {
  const url = useDataUrl()
  return useAsyncData('sessions:study', () => $fetch<StudySession[]>(url('study.json')), { default: () => [] as StudySession[] })
}

/** 概念卡列表（不含內文），依詞條排序 */
export const useConceptIndex = () => {
  const url = useDataUrl()
  return useAsyncData('concepts:index', () => $fetch<ConceptSummary[]>(url('concepts.json')), { default: () => [] as ConceptSummary[] })
}

/** 抓一場的完整資料；找不到回傳 null */
const useSessionLoader = () => {
  const url = useDataUrl()
  return (slug: string) => slug
    ? $fetch<Session>(url(`sessions/${slug}.json`)).catch(() => null)
    : Promise.resolve(null)
}

/** 單一場次（完整資料） */
export const useSession = (slug: string) => {
  const load = useSessionLoader()
  return useAsyncData(`session:${slug}`, () => load(slug))
}

/**
 * 本週場次（首頁）：依台灣日期挑，見 pickCurrentSession。
 * 預先產生的 HTML 用建置當天的日期；掛載後用瀏覽器的今天重挑，挑到別場時再抓那一場的 JSON，這樣不必每週重新建置。
 * today 放在 useState 裡，hydration 時沿用建置日期，避免不一致。index 是 useSessionIndex() 的結果。
 */
export const useCurrentSession = (index: Ref<SessionSummary[]>) => {
  // 不在這裡 await useSessionIndex()：composable 裡 await 之後就拿不到 Nuxt 的 context，由頁面先載入列表再傳進來
  const today = useToday()
  const slug = computed(() => pickCurrentSession(index.value, today.value)?.slug ?? '')
  const load = useSessionLoader()
  return useAsyncData('session:current', () => load(slug.value), { watch: [slug] })
}

/** 單張概念卡（含內文） */
export const useConcept = (id: string) => {
  const url = useDataUrl()
  return useAsyncData(`concept:${id}`, () => $fetch<ConceptFull>(url(`concepts/${encodeURIComponent(id)}.json`)).catch(() => null))
}

/** 台灣時間的今天，ISO 日期（YYYY-MM-DD），和場次的 date 同格式可以直接比大小 */
export const taipeiToday = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())

/**
 * 今天（台灣時間）。預先產生時是建置日期，掛載後換成瀏覽器的今天；hydration 時沿用建置日期，避免不一致。
 * 首頁、全部場次、複習、筆記共用同一個 state。
 */
export const useToday = () => {
  const today = useState('home:today', () => taipeiToday())
  onMounted(() => { today.value = taipeiToday() })
  return today
}

/**
 * 本週場次：日期在今天或之後、最近的那一場（週一到週日都顯示這週日的討論）。
 * 全部都過了就顯示最後一場。sessions 要依日期新到舊排序（useSessionIndex 的順序）。
 */
export const pickCurrentSession = <T extends { date: string }>(sessions: T[], today: string): T | null =>
  sessions.filter(s => s.date >= today).at(-1) ?? sessions[0] ?? null

/** 詞彙表的面向（領域、人物、系列） */
export const useTaxonomy = () =>
  useAsyncData('taxonomy', async () => {
    const item = await queryCollection('taxonomy').first()
    return (item?.facets ?? []) as TagFacet[]
  }, { default: () => [] as TagFacet[] })

/**
 * 初次載入時的網址 hash 與 query。
 * Nuxt 會在元件掛載前把預先產生頁面的網址改掉（hash、query 都會不見），
 * 所以 nuxt.config.ts 的 head 腳本先把原始值存在 window；這裡讀一次就清掉。
 */
export const takeInitialLocation = (): { hash: string, search: string } => {
  const w = window as Window & { __salonInitialHash?: string, __salonInitialSearch?: string }
  const out = {
    hash: w.__salonInitialHash ?? window.location.hash,
    search: w.__salonInitialSearch ?? window.location.search,
  }
  w.__salonInitialHash = undefined
  w.__salonInitialSearch = undefined
  return out
}
