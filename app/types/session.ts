// 場次與概念卡的資料結構。
// 內容檔案的驗證在 content.config.ts（zod schema）與 scripts/check-content.mjs；這裡是元件使用的型別，
// 兩邊要保持一致。規則見 SPEC.md「資料結構」。

/** [秒數, 章節名稱] */
export type Chapter = [seconds: number, label: string]

/** [回想題, 對照重點] */
export type RecallItem = [question: string, answer: string]

export interface Video {
  /** YouTube video id */
  id: string
  /** 例：'講座 5 · 48:02' */
  lec: string
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
  q: string
  o: string[]
}

/** [題目, 補充說明, 是否為延伸題] */
export type DiscussItem = [question: string, context: string, extended: boolean]

export interface QuizItem {
  q: string
  o: string[]
  /** 正解索引 */
  a: number
  /** 解析 */
  e: string
  /** [videoId, 秒數] 原片段 */
  t: [videoId: string, seconds: number]
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
  /** 場次標籤：日期 + 兩個字的主題 */
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
  after: string
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

export type TabKey = 'before' | 'during' | 'recall' | 'sunday' | 'after'
