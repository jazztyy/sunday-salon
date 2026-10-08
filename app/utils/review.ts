// 複習題（/review）：從場次的測驗題和概念卡產生選擇題。筆記頁也用這裡把複習筆記的 key 對回題目。
// 規格見 SPEC.md「複習」。
import type { StudySession } from '~/types/content'
import type { Concept, QuizItem, Session } from '~/types/session'
import { questionKey } from '~/utils/quizSignature'

/** 出題需要的場次欄位。完整 Session、StudySession 都符合 */
export type ReviewSession = Pick<Session, 'slug' | 'quiz' | 'concepts'>

/** S 是呼叫端傳入的場次型別，session 欄位保留它（例：StudySession 的 videos 可以直接用） */
export interface ReviewQuestion<S extends ReviewSession = StudySession> {
  /** 穩定的 key：測驗題 `q:{slug}:{題目雜湊}`、概念卡題 `c:{概念卡 id}`。筆記和作答紀錄都用它 */
  key: string
  kind: 'quiz' | 'concept'
  /** 測驗題所屬的場次；概念卡題是第一次用到這張卡的場次 */
  session: S
  /** 題目（概念卡題的選項在 buildConceptOptions 才產生，這裡的 o 是空的） */
  item: QuizItem
  conceptId?: string
}

/** 測驗題的 key（複習筆記、複習作答紀錄共用）：q:{slug}:{id 或題目雜湊} */
export const quizKey = (slug: string, q: string, id?: string) => `q:${slug}:${questionKey({ id }, q)}`
export const conceptKey = (id: string) => `c:${id}`

/** 和筆記一起存的題目：測驗題是題目，概念卡題是詞條（題目是整段定義，太長） */
export const reviewNoteQuestion = (q: ReviewQuestion<ReviewSession>, concepts: Concept[]): string =>
  q.kind === 'concept' ? (q.conceptId === undefined ? undefined : conceptIndex(concepts).get(q.conceptId))?.title ?? '' : q.item.q

// 概念卡 id → 卡片。同一個 concepts 陣列（通常是整份概念卡清單）只建一次索引，
// 一輪複習要對每題查一次，不用每次都線性搜尋。陣列被回收時索引跟著回收。
const conceptIndexCache = new WeakMap<Concept[], Map<string, Concept>>()
const conceptIndex = (concepts: Concept[]): Map<string, Concept> => {
  let idx = conceptIndexCache.get(concepts)
  if (!idx) {
    idx = new Map()
    // 重複 id 時保留第一張，和原本 Array.find 的結果一致
    for (const c of concepts) if (!idx.has(c.id)) idx.set(c.id, c)
    conceptIndexCache.set(concepts, idx)
  }
  return idx
}

/** 概念卡題的題目文字：給定義，選詞條 */
export const conceptQuestion = (c: Concept) => `「${c.summary}」這是哪個概念？`

/**
 * 指定場次的所有複習題。sessions 是要出題的場次（新到舊），concepts 是全部概念卡。
 * 概念卡題每張卡只出一次，算在最早用到它的場次。
 */
export const buildReviewQuestions = <S extends ReviewSession>(sessions: S[], concepts: Concept[]): ReviewQuestion<S>[] => {
  const byId = new Map(concepts.map(c => [c.id, c]))
  const out: ReviewQuestion<S>[] = []
  for (const s of sessions) {
    for (const item of s.quiz) out.push({ key: quizKey(s.slug, item.q, item.id), kind: 'quiz', session: s, item })
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
export const withConceptOptions = <S extends ReviewSession>(q: ReviewQuestion<S>, concepts: Concept[]): ReviewQuestion<S> => {
  const target = q.conceptId === undefined ? undefined : conceptIndex(concepts).get(q.conceptId)
  if (!target) return q
  const others = concepts.filter(c => c.id !== target.id)
  const near = shuffled(others.filter(c => c.tags.some(t => target.tags.includes(t))))
  const nearSet = new Set(near)
  const far = shuffled(others.filter(c => !nearSet.has(c)))
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
