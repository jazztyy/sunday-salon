// 各頁面實際需要的資料形狀。完整的 Session 很大（每場約 30KB），只有場次頁需要；
// 列表、概念卡、筆記、複習只拿自己用得到的欄位，免得每一頁的 payload 都塞進全部場次。
// 對應的資料端點在 server/routes/data/，轉換函式在 shared/utils/content.ts。規格見 SPEC.md「資料載入」。
import type { Concept, DiscussItem, Session, Video } from './session'

export type VideoSummary = Pick<Video, 'id' | 'lec' | 'short'>

/** 列表用的精簡場次：全部場次、概念卡、首頁挑場次、延續討論 */
export interface SessionSummary extends Pick<Session, 'slug' | 'date' | 'dateLabel' | 'chip' | 'title' | 'lede' | 'tags' | 'concepts' | 'related'> {
  videos: VideoSummary[]
}

/** /archive 搜尋用的文字：影片（講座、標題、短標題、帶著這個問題看）、章節、論證名稱。只有 /archive 載入 */
export interface SessionSearch {
  slug: string
  videos: string[]
  chapters: string[]
  args: string[]
}

/** 筆記、複習用：題目相關的欄位 */
export interface StudySession extends Pick<Session, 'slug' | 'date' | 'chip' | 'title' | 'concepts' | 'quiz'> {
  videos: VideoSummary[]
  discuss: (Pick<DiscussItem, 'scope' | 'q'> & { id?: string })[]
}

/** 概念卡列表：不含內文 */
export interface ConceptSummary extends Concept {
  /** 內文連到的其他概念卡 id（算反向連結用，建置時從內文找出來） */
  links: string[]
}

/** 概念卡集合的原始 item（Nuxt Content 產生的型別在這裡看不到，只列用得到的欄位） */
export interface ConceptItem {
  stem: string
  title: string
  en: string
  aliases?: string[]
  summary: string
  tags?: string[]
  related?: string[]
  body: unknown
  [key: string]: unknown
}

/** 單張概念卡：raw 是給 <ContentRenderer> 的原始 item（含內文） */
export interface ConceptFull extends ConceptSummary {
  raw: ConceptItem
}
