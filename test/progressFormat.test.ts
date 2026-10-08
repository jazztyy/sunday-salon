// 學習進度的格式換算：舊格式（依索引）→ 新格式（依題目 key）。寫錯會讓訪客的作答默默消失或對到別題。
import { describe, expect, it } from 'vitest'
import type { QuizItem } from '~/types/session'
import { answerKey, questionKey, quizSignature, textHash } from '~/utils/quizSignature'
import { orderByIndex, picksByIndex, readPicks, readQuiz } from '~/utils/progressFormat'

const quiz: QuizItem[] = [
  { scope: 'v1', q: '第一題', o: ['甲', '乙'], a: 0, e: '', refs: [] },
  { scope: 'v1', q: '第二題', o: ['甲', '乙', '丙'], a: 2, e: '', refs: [] },
  { scope: 'all', q: '第三題', o: ['甲', '乙'], a: 1, e: '', refs: [] },
]
const keys = quiz.map(answerKey)

describe('questionKey / answerKey', () => {
  it('沒有 id 時和 3.9 以前的題目雜湊相同', () => {
    expect(questionKey({}, '第一題')).toBe(textHash('第一題'))
  })
  it('有 id 就用 id', () => {
    expect(questionKey({ id: 'free-will' }, '第一題')).toBe('free-will')
  })
  it('改了選項或正解，作答 key 就不同；有 id 時改題目文字不影響', () => {
    const base = quiz[0]!
    expect(answerKey({ ...base, o: ['甲', '丙'] })).not.toBe(answerKey(base))
    expect(answerKey({ ...base, a: 1 })).not.toBe(answerKey(base))
    expect(answerKey({ ...base, id: 'x', q: '改過' })).toBe(answerKey({ ...base, id: 'x' }))
  })
})

describe('readPicks（立場題、論證卡）', () => {
  const k = ['a', 'b', 'c']
  it('舊格式依目前順序換算，略過不是數字的值（3.4 以前的 {pre, post}）和超出範圍的索引', () => {
    expect(readPicks({ 0: 1, 1: { pre: 0 }, 2: -1, 9: 0 }, k)).toEqual({ a: 1, c: -1 })
  })
  it('新格式原樣讀', () => {
    expect(readPicks({ v: 2, picks: { b: 2, x: 'bad' } }, k)).toEqual({ b: 2 })
  })
  it('沒有資料或格式壞掉都是空的', () => {
    expect(readPicks(undefined, k)).toEqual({})
    expect(readPicks('[object Object]', k)).toEqual({})
    expect(readPicks([1, 2], k)).toEqual({})
  })
})

describe('readQuiz（測驗作答）', () => {
  const sig = quizSignature(quiz)
  it('舊格式簽章相同時換算答案和順序', () => {
    const v2 = readQuiz({ sig, ans: { 0: 0, 2: 0 }, order: [2, 0, 1] }, quiz)
    expect(v2).toEqual({ v: 2, ans: { [keys[0]!]: 0, [keys[2]!]: 0 }, order: [keys[2], keys[0], keys[1]] })
  })
  it('舊格式簽章不同（題目改過）當作沒答，和以前一樣', () => {
    expect(readQuiz({ sig: 'old', ans: { 0: 0 } }, quiz)).toBeNull()
    expect(readQuiz({}, quiz)).toBeNull()
  })
  it('新格式：改過的那一題對不到，其他題照舊', () => {
    const stored = { v: 2, ans: { [keys[0]!]: 1, [keys[1]!]: 2 } }
    const edited = [quiz[0]!, { ...quiz[1]!, o: ['甲', '乙', '丁'] }, quiz[2]!]
    const v2 = readQuiz(stored, edited)!
    expect(picksByIndex(v2.ans, edited.map(answerKey))).toEqual({ 0: 1 })
  })
})

describe('orderByIndex', () => {
  it('新題目接在最後，刪掉的略過', () => {
    expect(orderByIndex(['c', 'gone', 'a'], ['a', 'b', 'c'])).toEqual([2, 0, 1])
  })
})
