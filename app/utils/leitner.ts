// 複習作答紀錄的間隔重複（簡化的 Leitner）。純函式，useReviewLog（寫紀錄）和 /review（預告下次複習日）共用。
// 每題有一個熟練程度 box（0–5）：有把握答對 → box +1；猜對 → box 不變；答錯 → 回到 0。
// 下次到期日 = 今天 + REVIEW_INTERVALS[box] 天（台灣日期）。規格見 SPEC.md「複習」。

// 紀錄的型別 ReviewLogEntry 留在 composables/useReview.ts（其他檔案從那裡 import），這裡只 import 型別。
import type { ReviewLogEntry } from '~/composables/useReview'

/** box → 間隔天數 */
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30] as const

/** 台灣日期加幾天，回傳 YYYY-MM-DD */
export const addDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T12:00:00+08:00`)
  d.setUTCDate(d.getUTCDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(d)
}

/** 作答後的 box。sure：答對時是有把握（true）還是猜的（false）；答錯時不看 */
export const nextBox = (prevBox: number, correct: boolean, sure: boolean): number =>
  !correct ? 0 : sure ? Math.min(prevBox + 1, REVIEW_INTERVALS.length - 1) : prevBox

/** 作答後這一題的新紀錄。prev：之前的紀錄（沒做過是 undefined）；today：台灣日期；nowIso：作答時間 */
export const nextLogEntry = (
  prev: ReviewLogEntry | undefined,
  correct: boolean,
  sure: boolean,
  today: string,
  nowIso: string,
): ReviewLogEntry => {
  const box = nextBox(prev?.box ?? 0, correct, sure)
  return {
    right: (prev?.right ?? 0) + (correct ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    lastCorrect: correct,
    last: nowIso,
    box,
    due: addDays(today, REVIEW_INTERVALS[box]!),
  }
}
