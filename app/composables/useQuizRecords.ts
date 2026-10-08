// 作答紀錄（/notes 的「作答紀錄」）：把每一場測驗題在三個地方的作答收在一起，方便複習時不用再回到場次頁。
// - 邊看邊想、看完回想：useQuizAnswers（salon-quiz-inline-{slug}、salon-quiz-{slug}），和場次頁同一套判斷
// - 複習：salon-review-log（{quizKey: {right, wrong, …}}）
// 只列至少答過一次的題目。規格見 SPEC.md「筆記」。
import type { QuizItem } from '~/types/session'
import type { StudySession as Session } from '~/types/content'
import type { ReviewLogEntry } from '~/composables/useReview'

export interface QuizRecord {
  /** quizKey：q:{slug}:{id 或題目雜湊}，和複習筆記、複習作答紀錄同一個 key */
  key: string
  session: Session
  /** 題目在 session.quiz 的索引 */
  index: number
  item: QuizItem
  /** 講座標籤或「整合回顧」 */
  lec: string
  /** 邊看邊想選的選項 */
  inline?: number
  /** 看完回想選的選項 */
  recall?: number
  /** /review 的作答紀錄 */
  review?: ReviewLogEntry
  /** 任何一次答錯過 */
  missed: boolean
}

export const useQuizRecords = (sessions: Ref<Session[]>) => {
  const stores = sessions.value.map(s => ({
    session: s,
    inline: useQuizAnswers(s.slug, s.quiz, 'inline').picks,
    recall: useQuizAnswers(s.slug, s.quiz, 'recall').picks,
  }))
  const { log } = useReviewLog()

  const records = computed<QuizRecord[]>(() => stores.flatMap(({ session, inline, recall }) => {
    const inlineAns = inline.value
    const recallAns = recall.value
    return session.quiz.flatMap((item, index) => {
      const key = quizKey(session.slug, item.q, item.id)
      const rec = {
        key,
        session,
        index,
        item,
        lec: scopeLabel(session, item.scope),
        inline: inlineAns[index],
        recall: recallAns[index],
        review: log.value?.[key],
      }
      if (rec.inline === undefined && rec.recall === undefined && !rec.review) return []
      const missed = (rec.inline !== undefined && rec.inline !== item.a)
        || (rec.recall !== undefined && rec.recall !== item.a)
        || (rec.review?.wrong ?? 0) > 0
      return [{ ...rec, missed }]
    })
  }))

  return { records }
}
