import { describe, expect, it } from 'vitest'
import type { Concept } from '~/types/session'
import {
  buildReviewQuestions, conceptKey, conceptQuestion, quizKey,
  reviewNoteQuestion, shuffled, withConceptOptions,
} from '~/utils/review'
import { concept, quiz, session } from './fixtures'

// 新到舊，和 /review 傳入的順序一樣
const concepts = [concept('a', ['死亡']), concept('b', ['死亡']), concept('c', ['倫理'])]
const newer = session('2026-10-11-new', { quiz: [quiz('新題')], concepts: ['b', 'a', 'missing'] })
const older = session('2026-10-04-old', { quiz: [quiz('舊題一'), quiz('舊題二')], concepts: ['a', 'c'] })
const sessions = [newer, older]

describe('buildReviewQuestions', () => {
  const qs = buildReviewQuestions(sessions, concepts)

  it('測驗題的 key 穩定，依場次順序', () => {
    const quizQs = qs.filter(q => q.kind === 'quiz')
    expect(quizQs.map(q => q.key)).toEqual([
      quizKey('2026-10-11-new', '新題'),
      quizKey('2026-10-04-old', '舊題一'),
      quizKey('2026-10-04-old', '舊題二'),
    ])
    expect(quizQs[0]!.session).toBe(newer)
  })

  it('概念卡題每張只出一次，算在最早用到它的場次；找不到的卡略過', () => {
    const cq = qs.filter(q => q.kind === 'concept')
    expect(cq.map(q => [q.key, q.session.slug])).toEqual([
      [conceptKey('a'), '2026-10-04-old'],
      [conceptKey('c'), '2026-10-04-old'],
      [conceptKey('b'), '2026-10-11-new'],
    ])
    expect(cq[0]!.conceptId).toBe('a')
    expect(cq[0]!.item.q).toBe(conceptQuestion(concepts[0]!))
    expect(cq[0]!.item.o).toEqual([])
  })

  it('不改傳入的 sessions 順序', () => {
    expect(sessions).toEqual([newer, older])
  })
})

describe('reviewNoteQuestion', () => {
  const qs = buildReviewQuestions(sessions, concepts)

  it('測驗題存題目', () => {
    expect(reviewNoteQuestion(qs.find(q => q.kind === 'quiz')!, concepts)).toBe('新題')
  })

  it('概念卡題存詞條', () => {
    expect(reviewNoteQuestion(qs.find(q => q.key === 'c:c')!, concepts)).toBe('詞條-c')
  })

  it('找不到概念卡回傳空字串', () => {
    expect(reviewNoteQuestion(qs.find(q => q.key === 'c:c')!, [])).toBe('')
  })

  it('同一個陣列之後換掉內容（新陣列）也查得到', () => {
    const q = qs.find(q => q.key === 'c:a')!
    expect(reviewNoteQuestion(q, concepts)).toBe('詞條-a')
    expect(reviewNoteQuestion(q, [concept('a', [], '改過的詞條')])).toBe('改過的詞條')
  })
})

describe('shuffled', () => {
  it('不改原陣列，元素相同', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const copy = [...input]
    const out = shuffled(input)
    expect(input).toEqual(copy)
    expect(out).not.toBe(input)
    expect([...out].sort((x, y) => x - y)).toEqual(copy)
  })

  it('空陣列', () => expect(shuffled([])).toEqual([]))
})

describe('withConceptOptions', () => {
  const many: Concept[] = [
    concept('t', ['死亡', '心靈']),
    concept('n1', ['死亡']),
    concept('n2', ['心靈']),
    concept('f1', ['倫理']),
    concept('f2', ['倫理']),
    concept('f3', ['政治']),
  ]
  const q = buildReviewQuestions([session('s', { concepts: ['t'] })], many)[0]!

  it('正解索引指向目標詞條，選項不重複，最多 4 個，干擾項優先同領域', () => {
    for (let i = 0; i < 200; i++) {
      const r = withConceptOptions(q, many)
      const o = r.item.o
      expect(o.length).toBe(4)
      expect(new Set(o).size).toBe(o.length)
      expect(o[r.item.a]).toBe('詞條-t')
      expect(o).toContain('詞條-n1')
      expect(o).toContain('詞條-n2')
      expect(r.item.e).toBe('詞條-t（en-t）。')
      expect(r.key).toBe(q.key)
    }
  })

  it('卡片不足 4 張時全部列出', () => {
    const few = [concept('t'), concept('x')]
    const fq = buildReviewQuestions([session('s', { concepts: ['t'] })], few)[0]!
    const r = withConceptOptions(fq, few)
    expect([...r.item.o].sort()).toEqual(['詞條-t', '詞條-x'])
    expect(r.item.o[r.item.a]).toBe('詞條-t')
  })

  it('找不到目標卡時原樣回傳', () => {
    expect(withConceptOptions(q, [concept('x')])).toBe(q)
  })

  it('不改原題目', () => {
    withConceptOptions(q, many)
    expect(q.item.o).toEqual([])
  })
})
