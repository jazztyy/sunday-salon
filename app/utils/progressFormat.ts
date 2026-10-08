// 學習進度的儲存格式換算（純函式，composables/useProgress.ts 用；測試在 test/progressFormat.test.ts）。
// 3.9 以前依題目索引存，3.9 起依題目 key 存（v: 2）。讀到舊格式時換算，下次寫入就存成新格式。
// 這裡寫錯會讓訪客的作答默默消失或對到別題，改動時要跑測試。
import type { QuizItem } from '~/types/session'
import { answerKey, quizSignature } from '~/utils/quizSignature'

export interface PicksV2 { v: 2, picks: Record<string, number> }
export interface QuizV2 { v: 2, ans: Record<string, number>, order?: string[] }

/** 物件才要，其他（null、陣列、數字、字串）都當作沒有資料 */
export const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}

const isNumber = (v: unknown): v is number => typeof v === 'number'

/** 依索引存的舊資料 {"0": 值} → {題目 key: 值}；不是數字的值（例如 3.4 以前立場題的 {pre, post}）略過 */
export const fromIndexed = (old: Record<string, unknown>, keys: string[]): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const [i, v] of Object.entries(old)) {
    const key = keys[Number(i)]
    if (key !== undefined && isNumber(v)) out[key] = v
  }
  return out
}

/** 立場題、論證卡：存的資料 → {題目 key: 數字}。keys 是目前題目順序的 key（舊資料存的時候順序還沒變過） */
export const readPicks = (raw: unknown, keys: string[]): Record<string, number> => {
  const r = asRecord(raw)
  if (r.v === 2) return Object.fromEntries(Object.entries(asRecord(r.picks)).filter(([, v]) => isNumber(v))) as Record<string, number>
  return fromIndexed(r, keys)
}

/**
 * 測驗作答：存的資料 → 新格式；沒有資料，或舊資料的簽章和目前題目不同（題目改過）時是 null。
 * 舊格式 {sig, ans: {索引: 選項}, order: [索引]}。
 */
export const readQuiz = (raw: unknown, quiz: QuizItem[]): QuizV2 | null => {
  const r = asRecord(raw)
  if (r.v === 2) {
    return {
      v: 2,
      ans: Object.fromEntries(Object.entries(asRecord(r.ans)).filter(([, v]) => isNumber(v))) as Record<string, number>,
      order: Array.isArray(r.order) ? r.order.filter((k): k is string => typeof k === 'string') : undefined,
    }
  }
  if (!r.sig || r.sig !== quizSignature(quiz)) return null
  const keys = quiz.map(answerKey)
  const order = Array.isArray(r.order) ? r.order.map(i => keys[Number(i)]).filter((k): k is string => !!k) : undefined
  return { v: 2, ans: fromIndexed(asRecord(r.ans), keys), order }
}

/** {題目 key: 選項} → {題目索引: 選項}，只留目前還在的題目 */
export const picksByIndex = (ans: Record<string, number>, keys: string[]): Record<number, number> => {
  const out: Record<number, number> = {}
  keys.forEach((k, i) => { if (isNumber(ans[k])) out[i] = ans[k] })
  return out
}

/** 存的順序（題目 key）→ 題目索引：存的順序裡沒有的新題目接在最後，刪掉的題目略過 */
export const orderByIndex = (saved: string[], keys: string[]): number[] => {
  const indexOf = new Map(keys.map((k, i) => [k, i]))
  const known = saved.map(k => indexOf.get(k)).filter((i): i is number => i !== undefined)
  const seen = new Set(known)
  return [...known, ...keys.map((_, i) => i).filter(i => !seen.has(i))]
}
