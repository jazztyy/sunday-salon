// 「補充資料」分頁的純邏輯（SPEC.md 5.6）：引文劃線的切段、時間長條的對數刻度、翻頁書的頁。
import type { Supplement, SupplementChapter } from '~/types/session'

export interface QuoteSegment {
  text: string
  /** 讀書會劃線的段落 */
  hl: boolean
}

/** '==劃線==其他' → [{ text: '劃線', hl: true }, { text: '其他', hl: false }]。== 成對由內容檢查保證 */
export const quoteSegments = (text: string): QuoteSegment[] =>
  text.split('==').map((t, i) => ({ text: t, hl: i % 2 === 1 })).filter(s => s.text)

/** 長條的最右邊：三十年（小時） */
const SPAN_MAX_HOURS = 30 * 365 * 24

/** 涵蓋時間（小時）→ 長條長度（%），對數刻度，一小時以下算 0 */
export const spanPercent = (hours: number) =>
  Math.min(100, Math.max(0, (Math.log10(Math.max(1, hours)) / Math.log10(SPAN_MAX_HOURS)) * 100))

/** 長條的刻度：小時、天、週、月、年、十年 */
export const SPAN_TICKS = ([['小時', 1], ['天', 24], ['週', 168], ['月', 730], ['年', 8760], ['十年', 87600]] as const)
  .map(([label, hours]) => ({ label, at: spanPercent(hours) }))

/** 翻頁書的一頁：封面 → 目錄 → 每章一頁 → 結尾頁（有 ending 才有） */
export type BookPage =
  | { kind: 'cover' }
  | { kind: 'toc' }
  | { kind: 'chapter', chapter: SupplementChapter, first: boolean }
  | { kind: 'end', line: string, sub: string }

export const bookPages = (plot: Supplement['plot']): BookPage[] => [
  { kind: 'cover' },
  { kind: 'toc' },
  ...plot.chapters.map((chapter, i) => ({
    kind: 'chapter' as const,
    chapter,
    // 每個段落（arc）的第一章，目錄在這一列標出段落名稱
    first: i === 0 || plot.chapters[i - 1]!.arc !== chapter.arc,
  })),
  ...(plot.ending ? [{ kind: 'end' as const, ...plot.ending }] : []),
]

/** 頁面的簡短名稱（翻頁書下方的「目前在哪一頁」） */
export const bookPageLabel = (p: BookPage) =>
  p.kind === 'cover' ? '封面' : p.kind === 'toc' ? '目錄' : p.kind === 'end' ? '完' : `${p.chapter.num}　${p.chapter.title}`

/**
 * 翻過幾張書頁（f）時看得到哪幾頁。兩頁攤開：左頁 2f−1、右頁 2f；一次一頁：第 f 頁。
 * 封面時（f = 0）只有右頁
 */
export const visiblePages = (f: number, spread: boolean, total: number) =>
  (spread ? [2 * f - 1, 2 * f] : [f]).filter(i => i >= 0 && i < total)

/** 要看第 i 頁，得翻過幾張書頁 */
export const leavesBefore = (i: number, spread: boolean) => (spread ? Math.ceil(i / 2) : i)
