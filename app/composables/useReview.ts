// 複習的瀏覽器儲存：每題的筆記（salon-review-notes）和作答紀錄（salon-review-log）。
// key 是 ReviewQuestion.key（utils/review.ts）。規格見 SPEC.md「複習」「瀏覽器儲存」。
//
// 作答紀錄用簡化的 Leitner 間隔重複：每題有一個熟練程度 box（0–5）。
// 有把握答對 → box +1；猜對 → box 不變；答錯 → 回到 0。下次到期日 = 今天 + INTERVALS[box] 天。

export interface ReviewLogEntry {
  right: number
  wrong: number
  /** 最近一次是否答對 */
  lastCorrect: boolean
  /** ISO 時間 */
  last: string
  /** 熟練程度 0–5 */
  box: number
  /** 下次該複習的日期（台灣時間 YYYY-MM-DD） */
  due: string
}

/** box → 間隔天數 */
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30] as const

/** 台灣日期加幾天，回傳 YYYY-MM-DD */
export const addDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T12:00:00+08:00`)
  d.setUTCDate(d.getUTCDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(d)
}

export const useReviewNotes = () => {
  const notes = useSalonStorage<Record<string, string>>('salon-review-notes', {})

  const getNote = (key: string) => notes.value?.[key] ?? ''

  /** 清成空白時刪掉這一筆 */
  const setNote = (key: string, text: string) => {
    const next = { ...notes.value }
    if (text.trim()) next[key] = text
    else delete next[key]
    notes.value = next
  }

  return { notes, getNote, setNote }
}

export const useReviewLog = () => {
  const log = useSalonStorage<Record<string, ReviewLogEntry>>('salon-review-log', {})

  /** 沒做過的題目，或到期日在今天以前 */
  const isDue = (key: string, today: string) => {
    const e = log.value?.[key]
    return !e || (e.due ?? '') <= today
  }

  /** sure：答對時是有把握（true）還是猜的（false）；答錯時不看 */
  const record = (key: string, correct: boolean, sure: boolean) => {
    const prev = log.value?.[key]
    const prevBox = prev?.box ?? 0
    const box = !correct ? 0 : sure ? Math.min(prevBox + 1, REVIEW_INTERVALS.length - 1) : prevBox
    const today = taipeiToday()
    log.value = {
      ...log.value,
      [key]: {
        right: (prev?.right ?? 0) + (correct ? 1 : 0),
        wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
        lastCorrect: correct,
        last: new Date().toISOString(),
        box,
        due: addDays(today, REVIEW_INTERVALS[box]!),
      },
    }
  }

  return { log, isDue, record }
}
