// 複習題（/review）：從場次的測驗題和概念卡產生選擇題。筆記頁也用這裡把複習筆記的 key 對回題目。
// 規格見 SPEC.md「複習」。
import type { Concept, QuizItem, Session } from '~/types/session'

export interface ReviewQuestion {
  /** 穩定的 key：測驗題 `q:{slug}:{題目雜湊}`、概念卡題 `c:{概念卡 id}`。筆記和作答紀錄都用它 */
  key: string
  kind: 'quiz' | 'concept'
  /** 測驗題所屬的場次；概念卡題是第一次用到這張卡的場次 */
  session: Session
  /** 題目（概念卡題的選項在 buildConceptOptions 才產生，這裡的 o 是空的） */
  item: QuizItem
  conceptId?: string
}

export const quizKey = (slug: string, q: string) => `q:${slug}:${textHash(q)}`
export const conceptKey = (id: string) => `c:${id}`

/** 概念卡題的題目文字：給定義，選詞條 */
export const conceptQuestion = (c: Concept) => `「${c.summary}」這是哪個概念？`

/**
 * 指定場次的所有複習題。sessions 是要出題的場次（新到舊），concepts 是全部概念卡。
 * 概念卡題每張卡只出一次，算在最早用到它的場次。
 */
export const buildReviewQuestions = (sessions: Session[], concepts: Concept[]): ReviewQuestion[] => {
  const byId = new Map(concepts.map(c => [c.id, c]))
  const out: ReviewQuestion[] = []
  for (const s of sessions) {
    for (const item of s.quiz) out.push({ key: quizKey(s.slug, item.q), kind: 'quiz', session: s, item })
  }
  const seen = new Set<string>()
  for (const s of [...sessions].reverse()) {
    for (const id of s.concepts) {
      const c = byId.get(id)
      if (!c || seen.has(id)) continue
      seen.add(id)
      out.push({
        key: conceptKey(id),
        kind: 'concept',
        session: s,
        conceptId: id,
        item: { scope: 'all', q: conceptQuestion(c), o: [], a: 0, e: '', refs: [] },
      })
    }
  }
  return out
}

/** 洗牌（不改原陣列） */
export const shuffled = <T>(list: T[]): T[] => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * 概念卡題的選項：正確詞條＋最多 3 個干擾項（優先挑同領域的卡，比較不會一眼看穿），順序打亂。
 * 在瀏覽器開始一輪複習時才產生。
 */
export const withConceptOptions = (q: ReviewQuestion, concepts: Concept[]): ReviewQuestion => {
  const target = concepts.find(c => c.id === q.conceptId)
  if (!target) return q
  const others = concepts.filter(c => c.id !== target.id)
  const near = shuffled(others.filter(c => c.tags.some(t => target.tags.includes(t))))
  const far = shuffled(others.filter(c => !near.includes(c)))
  const options = shuffled([target, ...[...near, ...far].slice(0, 3)])
  return {
    ...q,
    item: {
      ...q.item,
      o: options.map(c => c.title),
      a: options.indexOf(target),
      e: `${target.title}（${target.en}）。`,
    },
  }
}
