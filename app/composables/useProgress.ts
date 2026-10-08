// 學習進度（立場題、論證卡猜題、名詞卡自評、測驗作答）的讀寫。元件只透過這裡存取，不直接碰 localStorage key，
// 之後搬到 Supabase（SPEC.md 第 12 節）時只要改這個檔案。key 一覽見 utils/storageKeys.ts，格式見 SPEC.md「瀏覽器儲存」。
//
// 3.9 起，立場題、論證卡、測驗作答都改用「題目 key」記答案（questionKey／answerKey，有 id 用 id，沒有用題目雜湊），
// 不再用題目索引：調整順序、插入新題不會對錯題；改了某一題，只有那一題的作答重來。
// 新格式都有 v: 2。讀到舊格式（依索引存）時當場換算，下次寫入就存成新格式。
import type { Argument, QuizItem, Vote } from '~/types/session'
import type { PicksV2, QuizV2 } from '~/utils/progressFormat'

// 預設值一律用 {}：VueUse 依預設值的型別選序列化方式，預設 null 會被當成字串存（變成 "[object Object]"）。
// 格式換算是純函式，在 utils/progressFormat.ts（有測試）。

/**
 * 以題目 key 記一個數字的進度（立場題選項、論證卡猜的前提）。
 * 舊格式 {題目索引: 數字} 用目前的題目順序換算（舊資料存的時候順序還沒變過）。
 */
const useKeyedPicks = (storageKey: string, keys: MaybeRefOrGetter<string[]>) => {
  const stored = useSalonStorage<PicksV2 | Record<string, unknown>>(storageKey, {})

  const picks = computed(() => readPicks(stored.value, toValue(keys)))

  const set = (key: string, value: number | undefined) => {
    const { [key]: _old, ...rest } = picks.value
    stored.value = { v: 2, picks: value === undefined ? rest : { ...rest, [key]: value } }
  }

  return { picks, set }
}

/** 立場題：{題目 key: 選項索引}。3.4 以前的 {pre, post} 物件不是數字，自然被略過 */
export const useVotes = (slug: string, votes: MaybeRefOrGetter<Vote[]>) => {
  const keyOf = (v: Vote) => questionKey(v, v.q)
  const { picks, set } = useKeyedPicks(STORAGE_KEYS.votes(slug), () => toValue(votes).map(keyOf))
  return {
    pickOf: (v: Vote) => picks.value[keyOf(v)],
    choose: (v: Vote, option: number) => set(keyOf(v), option),
  }
}

/** 論證卡猜題：{論證 key: 前提索引}，-1 表示直接看答案 */
export const useArgPicks = (slug: string, args: MaybeRefOrGetter<Argument[]>) => {
  const keyOf = (a: Argument) => questionKey(a, a.name)
  const { picks, set } = useKeyedPicks(STORAGE_KEYS.args(slug), () => toValue(args).map(keyOf))
  return {
    pickOf: (a: Argument) => picks.value[keyOf(a)],
    save: (a: Argument, value: number | undefined) => set(keyOf(a), value),
  }
}

export type CardRate = 'shaky' | 'known'

/** 名詞卡自評：{概念卡 id: 'shaky' | 'known'}。2.0 用卡片索引存的舊值對不到 id，自然被忽略 */
export const useCardRates = (slug: string) => {
  const stored = useSalonStorage<Record<string, CardRate>>(STORAGE_KEYS.cards(slug), {})
  const rates = computed(() => asRecord(stored.value) as Record<string, CardRate>)
  const rate = (id: string, r: CardRate) => { stored.value = { ...rates.value, [id]: r } }
  return { rates, rate }
}

/**
 * 測驗作答。where：'inline' 是「邊看邊想」，'recall' 是「看完回想」（多記一份打亂後的順序）。
 * 對外仍然用題目在 quiz 陣列裡的索引（元件都是照索引排的），存的時候換成 answerKey。
 * 舊格式 {sig, ans: {索引: 選項}, order: [索引]}：簽章和目前題目相同才換算，不同就當作沒答（和以前一樣）。
 */
export const useQuizAnswers = (slug: string, quiz: MaybeRefOrGetter<QuizItem[]>, where: 'inline' | 'recall') => {
  const stored = useSalonStorage<QuizV2 | Record<string, unknown>>(
    where === 'inline' ? STORAGE_KEYS.quizInline(slug) : STORAGE_KEYS.quizRecall(slug),
    {},
  )

  const keys = computed(() => toValue(quiz).map(answerKey))

  /** 換算成新格式；沒有資料或舊資料對不上時是 null */
  const current = computed(() => readQuiz(stored.value, toValue(quiz)))

  /** {題目索引: 選項索引} */
  const picks = computed(() => picksByIndex(current.value?.ans ?? {}, keys.value))

  /** 打亂後的順序（題目索引）。存的順序裡沒有的新題目接在最後，刪掉的題目略過；沒存過就是 null */
  const order = computed(() => current.value?.order ? orderByIndex(current.value.order, keys.value) : null)

  /** 作答（已經答過就不改） */
  const answer = (index: number, option: number) => {
    const key = keys.value[index]
    if (!key || picks.value[index] !== undefined) return
    stored.value = { v: 2, ans: { ...current.value?.ans, [key]: option }, ...(current.value?.order ? { order: current.value.order } : {}) }
  }

  /** 清空作答；recall 同時存一個新的順序（題目索引） */
  const reset = (newOrder?: number[]) => {
    stored.value = { v: 2, ans: {}, ...(newOrder ? { order: newOrder.map(i => keys.value[i]!).filter(Boolean) } : {}) }
  }

  return { picks, order, answer, reset }
}
