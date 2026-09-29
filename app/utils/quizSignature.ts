// 測驗題目的簽章：題目、選項、正解任何一處改變，簽章就不同。
// 測驗作答紀錄是依題目索引存的，存的時候一起記下簽章；讀取時簽章不同就重置，
// 避免發佈後修改題目，舊答案對到新題目上。
import type { QuizItem } from '~/types/session'

export const quizSignature = (quiz: QuizItem[]): string => {
  const text = JSON.stringify(quiz.map(q => [q.q, q.o, q.a]))
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
