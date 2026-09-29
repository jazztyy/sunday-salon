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

/** [videoId, 秒數]：影片段落 */
export type VideoRef = [videoId: string, seconds: number]

/** 題目範圍：某支影片的 id，或 'all'（整合回顧，跨影片） */
export type Scope = string

export interface DiscussItem {
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
  /** 活動前「活動後」分頁的預告文字（還沒有 recap 時顯示） */
  after: string
  /** 活動結束後才填 */
  recap?: Recap
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

export type TabKey = 'before' | 'during' | 'recall' | 'sunday' | 'after'
