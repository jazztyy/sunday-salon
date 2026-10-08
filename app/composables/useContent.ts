// 讀取內容的共用入口：場次、概念卡、詞彙表。所有頁面和元件都透過這裡查詢，不要直接呼叫 queryCollection。
// 靜態輸出時這些查詢在建置階段執行，結果存進頁面 payload，瀏覽器端不需要資料庫。
import type { Concept, Session, TagFacet } from '~/types/session'

/** 概念卡 id = 檔名（content/concepts/{id}.md） */
export const conceptIdOf = (stem: string): string => stem.split('/').pop() ?? stem

/** 內容集合的欄位 → 元件使用的 Session 型別（去掉 Nuxt Content 附加的 id/stem/meta） */
const toSession = (item: Record<string, unknown>): Session => {
  const { id: _id, stem: _stem, extension: _ext, meta: _meta, ...rest } = item
  return rest as unknown as Session
}

/** 所有場次，新的在前 */
export const useAllSessions = () =>
  useAsyncData('sessions:all', async () => {
    const items = await queryCollection('sessions').order('date', 'DESC').all()
    return items.map(i => toSession(i as unknown as Record<string, unknown>))
  }, { default: () => [] as Session[] })

/** 台灣時間的今天，ISO 日期（YYYY-MM-DD），和場次的 date 同格式可以直接比大小 */
export const taipeiToday = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())

/**
 * 本週場次：日期在今天或之後、最近的那一場（週一到週日都顯示這週日的討論）。
 * 全部都過了就顯示最後一場。sessions 要依日期新到舊排序（useAllSessions 的順序）。
 */
export const pickCurrentSession = (sessions: Session[], today: string): Session | null =>
  sessions.filter(s => s.date >= today).at(-1) ?? sessions[0] ?? null

/** 單一場次；slug 省略時取最新一場 */
export const useSession = (slug?: string) =>
  useAsyncData(`session:${slug ?? 'latest'}`, async () => {
    const q = queryCollection('sessions')
    const item = slug ? await q.where('slug', '=', slug).first() : await q.order('date', 'DESC').first()
    return item ? toSession(item as unknown as Record<string, unknown>) : null
  })

/** 所有概念卡（含內文，給 <ContentRenderer> 用的原始 item 放在 raw） */
export const useAllConcepts = () =>
  useAsyncData('concepts:all', async () => {
    const items = await queryCollection('concepts').order('title', 'ASC').all()
    return items.map(i => ({
      id: conceptIdOf(i.stem),
      title: i.title,
      en: i.en,
      aliases: i.aliases ?? [],
      summary: i.summary,
      tags: i.tags ?? [],
      related: i.related ?? [],
      raw: i,
    }))
  }, { default: () => [] })

export type ConceptWithRaw = Concept & { raw: Awaited<ReturnType<ReturnType<typeof queryCollection<'concepts'>>['first']>> }

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
