// 題目的儲存 key 與簽章。
// - questionKey：筆記、立場題、論證卡用。有 id 用 id，沒有用題目文字的雜湊（3.9 以前全部是雜湊，沒填 id 的 key 不變）。
// - answerKey：測驗作答用。題目（或 id）、選項、正解任何一處改變就不同，所以只有改過的那一題會重來。
// - quizSignature：3.9 以前的測驗作答依題目索引存，整份測驗共用一個簽章；只剩讀舊資料時用。
import type { QuizItem } from '~/types/session'

/** 文字 → 短雜湊（djb2，base36）。用來當 localStorage 裡的 key 或簽章，不用於安全用途 */
export const textHash = (text: string): string => {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export const quizSignature = (quiz: QuizItem[]): string =>
  textHash(JSON.stringify(quiz.map(q => [q.q, q.o, q.a])))

/** 筆記、立場題、論證卡的 key：有 id 用 id，沒有用 text（題目或論證名稱）的雜湊 */
export const questionKey = (item: { id?: string }, text: string): string => item.id ?? textHash(text)

/** 測驗作答的 key：id（沒有就用題目）＋選項＋正解。改了選項或正解，這一題的舊答案就不算 */
export const answerKey = (item: Pick<QuizItem, 'q' | 'o' | 'a'> & { id?: string }): string =>
  textHash(JSON.stringify([item.id ?? item.q, item.o, item.a]))
