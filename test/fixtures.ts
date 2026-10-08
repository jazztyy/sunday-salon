// 測試用的最小資料：只填受測函式會讀到的欄位，其餘用型別斷言帶過。
import type { Concept, QuizItem, Session, Video } from '~/types/session'

export const quiz = (q: string, o: string[] = ['甲', '乙'], a = 0): QuizItem =>
  ({ scope: 'all', q, o, a, e: '', refs: [] })

export const concept = (id: string, tags: string[] = [], title = `詞條-${id}`): Concept =>
  ({ id, title, en: `en-${id}`, aliases: [], summary: `定義-${id}`, tags, related: [] })

export const session = (slug: string, opts: { quiz?: QuizItem[], concepts?: string[], videos?: Partial<Video>[] } = {}): Session =>
  ({
    slug,
    quiz: opts.quiz ?? [],
    concepts: opts.concepts ?? [],
    videos: opts.videos ?? [],
  }) as unknown as Session
