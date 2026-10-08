import { describe, expect, it } from 'vitest'
import { addDays, nextBox, nextLogEntry, REVIEW_INTERVALS } from '~/utils/leitner'
import type { ReviewLogEntry } from '~/composables/useReview'

describe('addDays', () => {
  it('跨月、跨年、閏年', () => {
    expect(addDays('2026-10-08', 1)).toBe('2026-10-09')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-10-08', 30)).toBe('2026-11-07')
  })
})

describe('nextBox', () => {
  it('有把握答對 +1，最高到最後一格', () => {
    expect(nextBox(0, true, true)).toBe(1)
    expect(nextBox(4, true, true)).toBe(5)
    expect(nextBox(REVIEW_INTERVALS.length - 1, true, true)).toBe(REVIEW_INTERVALS.length - 1)
  })

  it('猜對不變', () => {
    expect(nextBox(0, true, false)).toBe(0)
    expect(nextBox(3, true, false)).toBe(3)
  })

  it('答錯回到 0，不看有沒有把握', () => {
    expect(nextBox(4, false, true)).toBe(0)
    expect(nextBox(4, false, false)).toBe(0)
  })
})

describe('nextLogEntry', () => {
  const now = '2026-10-08T03:00:00.000Z'

  it('第一次有把握答對：box 1，兩天後到期', () => {
    expect(nextLogEntry(undefined, true, true, '2026-10-08', now)).toEqual({
      right: 1, wrong: 0, lastCorrect: true, last: now, box: 1, due: '2026-10-10',
    })
  })

  it('第一次答錯：box 0，明天到期', () => {
    expect(nextLogEntry(undefined, false, true, '2026-10-08', now)).toEqual({
      right: 0, wrong: 1, lastCorrect: false, last: now, box: 0, due: '2026-10-09',
    })
  })

  it('累計對錯次數，到期日從今天算', () => {
    const prev: ReviewLogEntry = { right: 2, wrong: 1, lastCorrect: true, last: 'x', box: 3, due: '2026-10-01' }
    expect(nextLogEntry(prev, true, true, '2026-10-08', now)).toMatchObject({ right: 3, wrong: 1, box: 4, due: '2026-10-23' })
    expect(nextLogEntry(prev, true, false, '2026-10-08', now)).toMatchObject({ right: 3, box: 3, due: '2026-10-15' })
    expect(nextLogEntry(prev, false, true, '2026-10-08', now)).toMatchObject({ wrong: 2, lastCorrect: false, box: 0, due: '2026-10-09' })
  })
})
