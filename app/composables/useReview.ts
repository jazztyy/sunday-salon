// 複習的瀏覽器儲存：每題的筆記（salon-review-notes）和作答紀錄（salon-review-log）。
// key 是 ReviewQuestion.key（utils/review.ts）。規格見 SPEC.md「複習」「瀏覽器儲存」。
// 作答紀錄的間隔重複（Leitner box、到期日）在 utils/leitner.ts。
import { nextLogEntry } from '~/utils/leitner'

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

export const useReviewNotes = () => {
  const notes = useSalonStorage<Record<string, StoredNote>>('salon-review-notes', {})

  const getNote = (key: string) => noteText(notes.value?.[key])

  /** q：題目（概念筆記是詞條），一起存起來，題目改掉後筆記頁還認得出是哪一題。清成空白時刪掉這一筆 */
  const setNote = (key: string, text: string, q: string) => {
    const next = { ...notes.value }
    if (text.trim()) next[key] = { q, text }
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
    log.value = {
      ...log.value,
      [key]: nextLogEntry(log.value?.[key], correct, sure, taipeiToday(), new Date().toISOString()),
    }
  }

  return { log, isDue, record }
}
