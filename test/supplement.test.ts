import { describe, expect, it } from 'vitest'
import { PAGE_SPRING, springSettled, springStep } from '~/utils/spring'
import { bookPages, leavesBefore, quoteSegments, spanPercent, visiblePages } from '~/utils/supplement'
import type { Supplement } from '~/types/session'

describe('quoteSegments', () => {
  it('切出劃線段落', () => {
    expect(quoteSegments('==甲==乙==丙==')).toEqual([
      { text: '甲', hl: true },
      { text: '乙', hl: false },
      { text: '丙', hl: true },
    ])
  })
  it('沒有劃線時整段一般文字', () => {
    expect(quoteSegments('甲乙')).toEqual([{ text: '甲乙', hl: false }])
  })
})

describe('spanPercent', () => {
  it('一小時以下是 0，三十年是 100', () => {
    expect(spanPercent(0.5)).toBe(0)
    expect(spanPercent(30 * 365 * 24)).toBe(100)
    expect(spanPercent(1e9)).toBe(100)
  })
  it('一天大約在四分之一', () => {
    expect(spanPercent(24)).toBeCloseTo(25.5, 0)
  })
})

describe('翻頁書', () => {
  const plot: Supplement['plot'] = {
    title: '',
    intro: '',
    chapters: [
      { num: 'I', arc: '甲', title: '一', body: '' },
      { num: 'II', arc: '甲', title: '二', body: '' },
      { num: 'III', arc: '乙', title: '三', body: '' },
    ],
    ending: { line: '光', sub: '' },
  }
  it('封面、目錄、每章、結尾', () => {
    const pages = bookPages(plot)
    expect(pages.map(p => p.kind)).toEqual(['cover', 'toc', 'chapter', 'chapter', 'chapter', 'end'])
    expect(pages.filter(p => p.kind === 'chapter').map(p => p.kind === 'chapter' && p.first)).toEqual([true, false, true])
  })
  it('兩頁攤開時，翻過 f 張看到 2f−1 和 2f', () => {
    expect(visiblePages(0, true, 6)).toEqual([0])
    expect(visiblePages(1, true, 6)).toEqual([1, 2])
    expect(visiblePages(3, true, 6)).toEqual([5])
    expect(visiblePages(2, false, 6)).toEqual([2])
  })
  it('要看第 i 頁得翻過幾張', () => {
    expect(leavesBefore(2, true)).toBe(1)
    expect(leavesBefore(3, true)).toBe(2)
    expect(leavesBefore(3, false)).toBe(3)
  })
})

describe('翻頁的彈簧', () => {
  const run = (from: number, to: number) => {
    let x = from
    let v = 0
    let min = Math.min(from, to)
    let max = Math.max(from, to)
    let t = 0
    while (!springSettled(x, v, to) && t < 5) {
      [x, v] = springStep(x, v, to, 1 / 240, PAGE_SPRING)
      min = Math.min(min, x)
      max = Math.max(max, x)
      t += 1 / 240
    }
    return { x, min, max, t }
  }
  it('往前翻：停在 −180，不會轉過頭', () => {
    const r = run(0, -180)
    expect(r.x).toBeCloseTo(-180, 1)
    expect(r.min).toBeGreaterThanOrEqual(-180)
    expect(r.t).toBeLessThan(2)
  })
  it('往回翻：停在 0，不會轉過頭', () => {
    const r = run(-180, 0)
    expect(r.max).toBeLessThanOrEqual(0)
  })
})
