// 場次與概念卡的資料結構。
// 內容檔案的驗證在 lib/schema.ts（zod schema）與 scripts/check-content.mjs；這裡是元件使用的型別，
// 兩邊要保持一致：檔案最後有型別層級的檢查，對不上時 `npm run typecheck` 會失敗。規則見 SPEC.md「資料結構」。
import type { ConceptData, SessionData } from '../../lib/schema'

/** [秒數, 章節名稱] */
export type Chapter = [seconds: number, label: string]

/** [回想題, 對照重點] */
export type RecallItem = [question: string, answer: string]

export interface Video {
  /** YouTube video id */
  id: string
  /** 講座標籤，例：'講座 5' */
  lec: string
  /** 影片長度（秒） */
  duration: number
  /** 短標題，用在側欄與收合標題 */
  short: string
  title: string
  /** 帶著這個問題看 */
  guide: string
  chapters: Chapter[]
  recall: RecallItem[]
}

/**
 * [前提內容, 質疑理由, 接受理由]
 * 質疑與接受必須剛好填一個：質疑為 null 時，接受必填。
 */
export type Premise =
  | [text: string, objection: string, accept?: undefined]
  | [text: string, objection: null, accept: string]

export interface Argument {
  /**
   * 選填。穩定的論證代號：有填就用它當儲存的 key，沒填用論證名稱（name）的雜湊；
   * 發佈後要改論證名稱（name）時先補上 id，舊作答和筆記才不會對不到
   */
  id?: string
  name: string
  /** 論證類型，例：'最佳解釋推論'、'《斐多篇》' */
  kind: string
  /** 對應影片 id */
  vid: string
  /** 影片秒數 */
  t: number
  /** 顯示用的講座標示，例：'講座 5 · 17:17' */
  ts: string
  prem: Premise[]
  concl: string
  verdict: string
}

export interface Vote {
  /**
   * 選填。穩定的題目代號：有填就用它當儲存的 key，沒填用題目文字的雜湊；
   * 發佈後要改題目文字時先補上 id，舊作答和筆記才不會對不到
   */
  id?: string
  q: string
  o: string[]
}

/** [videoId, 秒數]：影片段落 */
export type VideoRef = [videoId: string, seconds: number]

/** 題目範圍：某支影片的 id，或 'all'（整合回顧，跨影片） */
export type Scope = string

export interface DiscussItem {
  /**
   * 選填。穩定的題目代號：有填就用它當儲存的 key，沒填用題目文字的雜湊；
   * 發佈後要改題目文字時先補上 id，舊作答和筆記才不會對不到
   */
  id?: string
  scope: Scope
  q: string
  /** 補充說明 */
  note?: string
  /** 超出影片內容的延伸題 */
  ext: boolean
  /** 「Kagan 怎麼說」：想完才打開；影片沒回答時要明說 */
  answer: string
  /** 參考段落，至少一段 */
  refs: VideoRef[]
}

export interface QuizItem {
  /**
   * 選填。穩定的題目代號：有填就用它當儲存的 key，沒填用題目文字的雜湊；
   * 發佈後要改題目文字時先補上 id，舊作答和筆記才不會對不到
   */
  id?: string
  scope: Scope
  q: string
  o: string[]
  /** 正解索引 */
  a: number
  /** 解析 */
  e: string
  /** 原片段，至少一段 */
  refs: VideoRef[]
}

/** [講座標籤, videoId, 秒數, '起–迄', 說明] */
export type Pick = [lec: string, videoId: string, seconds: number, range: string, label: string]

export interface Session {
  /** 唯一值，用在網址（/s/{slug}）與 localStorage key，發佈後不可以改 */
  slug: string
  /** 活動日期 ISO（2026-10-04），用來依月份分組 */
  date: string
  /** 顯示用的日期：'2026 年 10 月 4 日（週日）' */
  dateLabel: string
  /** 場次標籤：日期 + 3–6 個字的主題，例：'10/4 靈魂與永生'（篩選 chip、頁面標題用） */
  chip: string
  eyebrow: string
  /** h1，用問句 */
  title: string
  lede: string
  speaker: string
  /** 必須在 content/taxonomy.yml 裡 */
  tags: string[]
  /** 這場用到的概念卡 id：決定名詞卡內容，也用來計算相關場次 */
  concepts: string[]
  /** 人工連結：其他場次 + 為什麼值得一起看 */
  related: { slug: string, reason: string }[]
  captionTip: string
  picks: Pick[]
  /** 3–6 點，可以含 <b> */
  tldr: string[]
  stance: [label: string, value: string][]
  videos: Video[]
  args: Argument[]
  /** 論證地圖上方的補充說明（例如論證順序和原典不同），沒有就省略 */
  argsNote?: string
  votes: Vote[]
  discuss: DiscussItem[]
  quiz: QuizItem[]
  /** 活動前「活動後」分頁的預告文字（還沒有 recap 時顯示） */
  after: string
  /** 活動結束後才填 */
  recap?: Recap
  /** 補充資料：有填才出現「補充資料」分頁（SPEC.md 5.6） */
  supplement?: Supplement
}

/** 原文引文。text 裡用 ==…== 標出讀書會劃線的段落 */
export interface SupplementQuote {
  text: string
  /** 出處，例：'第六章 · 魏岑芳譯' */
  cite: string
}

/** 只適用某一本書的示意圖（components/supplement/{書}/） */
export type SupplementFigureKey = 'ivan-slope' | 'ivan-train' | 'ivan-syllogism' | 'ivan-people' | 'ivan-sack'

export interface SupplementChapter {
  /** 章節編號，例：'XII'，不可以重複 */
  num: string
  /** 所屬的段落，例：'最後三天'（目錄和頁首用） */
  arc: string
  title: string
  body: string
  /** 最後看見光的那一章，用金色標出 */
  light?: boolean
}

export interface SupplementSpan {
  /** 對應 chapters 的 num */
  num: string
  /** 顯示的長度，例：'二十多年' */
  label: string
  /** 涵蓋的時間（小時），長條用對數刻度 */
  hours: number
  /** 倒敘之前的序章，用淡色 */
  prologue?: boolean
}

/**
 * 補充資料。巢狀欄位的預設值 Nuxt Content 不會補（SPEC.md 7），
 * 有預設值的欄位在這裡都是選填，元件自己補
 */
export interface Supplement {
  eyebrow: string
  title: string
  /** 原文書名 */
  original?: string
  epigraph?: SupplementQuote
  lede: string
  /** 原著裡的一份文件，例：第一章的訃聞 */
  notice?: { lines: string[], name: string, role: string, date: string, note: string, caption: string }
  /** [項目, 內容] */
  facts?: [label: string, value: string][]
  plot: {
    title: string
    intro: string
    chapters: SupplementChapter[]
    /** 翻頁書的最後一頁 */
    ending?: { line: string, sub: string }
    spans?: { title: string, caption: string, rows: SupplementSpan[] }
  }
  themes?: {
    title: string
    intro: string
    /** 主旨前的示意圖 */
    figures?: SupplementFigureKey[]
    items: { title: string, body: string, quotes?: SupplementQuote[], figure?: SupplementFigureKey }[]
  }
  /** 原著和本場影片的對照 */
  pairs?: {
    title: string
    intro: string
    items: {
      lec: string
      title: string
      kagan: string
      novel: string
      quote?: SupplementQuote
      /** 本場的投票或討論題 */
      think?: { label: string, text: string }
    }[]
  }
  questions?: { title: string, items: { q: string, sub?: string }[] }
  sources?: string[]
}

/**
 * 活動回顧（SPEC.md 5.5）。每個欄位都可能沒填：Nuxt Content 不會替巢狀物件補 schema 的預設值，
 * 讀取時要自己補（見 tab/After.vue）
 */
export interface Recap {
  /** 錄音連結 */
  audio?: { url: string, label: string }
  /** 錄音時間戳 */
  chapters?: Chapter[]
  /** 討論回顧：每段一個小標和內文 */
  notes?: { title: string, body: string }[]
  /** 依 votes 的題目順序，每題各選項的人數（現場投票） */
  votes?: number[][]
  /** 現場冒出的好問題、沒聊完的問題 */
  questions?: string[]
  /** 這場討論後新增的概念卡 id */
  concepts?: string[]
}

/** 概念卡（content/concepts/{id}.md） */
export interface Concept {
  /** 檔名，也是網址 /c/{id} */
  id: string
  title: string
  en: string
  aliases: string[]
  /** 一句話定義：名詞卡正面、卡片牆 */
  summary: string
  tags: string[]
  /** 相關概念卡 id */
  related: string[]
}

/** 詞彙表的一個面向，例如「領域」 */
export interface TagFacet {
  key: string
  label: string
  tags: string[]
}

/** 'extra' 是補充資料，只在場次有 supplement 時出現 */
export type TabKey = 'before' | 'during' | 'recall' | 'sunday' | 'after' | 'extra'

// ── schema 與手寫型別的一致性檢查（只在型別層級，不產生程式碼） ──
// schema 推導的型別必須能指定給手寫型別，兩邊的欄位名稱也必須完全相同。
// 這裡報錯代表 lib/schema.ts 和上面的 interface 只改了一邊。
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type Assert<T extends true> = T
type Fits<A, B> = [A] extends [B] ? true : false
type SameKeys<A, B> = Equals<keyof A, keyof B>
type Item<T> = T extends readonly (infer U)[] ? U : never

type S = SessionData
export type SchemaDriftCheck = [
  Assert<Fits<S, Session>>,
  Assert<SameKeys<S, Session>>,
  Assert<SameKeys<Item<S['quiz']>, QuizItem>>,
  Assert<SameKeys<Item<S['discuss']>, DiscussItem>>,
  Assert<SameKeys<Item<S['votes']>, Vote>>,
  Assert<SameKeys<Item<S['args']>, Argument>>,
  Assert<SameKeys<Item<S['videos']>, Video>>,
  Assert<SameKeys<NonNullable<S['recap']>, Recap>>,
  Assert<SameKeys<NonNullable<S['supplement']>, Supplement>>,
  Assert<SameKeys<Item<NonNullable<S['supplement']>['plot']['chapters']>, SupplementChapter>>,
  Assert<Fits<ConceptData, Omit<Concept, 'id'>>>,
  Assert<SameKeys<ConceptData, Omit<Concept, 'id'>>>,
]
