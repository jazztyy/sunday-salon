// 所有 localStorage key 集中在這裡（值的格式見 SPEC.md「瀏覽器儲存」）。
// key 一旦發佈就不能改名，改了訪客的資料就讀不到；新增種類時在這裡加一個。
// 之後搬到 Supabase（SPEC.md 第 12 節）時，也從這份清單對應到資料表。
export const STORAGE_KEYS = {
  /** 上次停留的分頁 */
  tab: 'salon-tab',
  /** 「邊看邊想」上次停在哪個子分頁 */
  duringPart: (slug: string) => `salon-during-part-${slug}`,
  /** 論證卡猜題 */
  args: (slug: string) => `salon-arg-${slug}`,
  /** 「看完回想」的自我測驗 */
  quizRecall: (slug: string) => `salon-quiz-${slug}`,
  /** 「邊看邊想」的測驗 */
  quizInline: (slug: string) => `salon-quiz-inline-${slug}`,
  /** 名詞卡自評 */
  cards: (slug: string) => `salon-cards-${slug}`,
  /** 立場題 */
  votes: (slug: string) => `salon-vote-${slug}`,
  /** 討論題的「我的想法」 */
  discussNotes: (slug: string) => `salon-notes-${slug}`,
  /** /review 每題的筆記（也是概念卡彈窗的筆記） */
  reviewNotes: 'salon-review-notes',
  /** /review 的作答紀錄（間隔重複） */
  reviewLog: 'salon-review-log',
  /** /notes 自己新增的筆記 */
  myNotes: 'salon-mynotes',
  /** /review 的範圍（預設範圍或自己選的場次） */
  reviewScope: 'salon-review-scope',
} as const
