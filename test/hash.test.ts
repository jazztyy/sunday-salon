// textHash／quizSignature／quizKey／conceptKey 的固定輸出。
// 這些值是使用者 localStorage 裡筆記與作答紀錄的 key 和簽章：演算法一改，
// 每個人存過的筆記、作答都會對不到題目（等於全部遺失）。這裡的期望值不能「更新快照」了事。
import { describe, expect, it } from 'vitest'
import { quizSignature, textHash } from '~/utils/quizSignature'
import { conceptKey, quizKey } from '~/utils/review'
import { quiz } from './fixtures'

describe('textHash', () => {
  it.each([
    ['', '45h'],
    ['a', '3t3a'],
    ['hello world', 'eslcxt'],
    ['死亡是壞事嗎？', 'u3ju3q'],
    ['伊比鳩魯論證', 'q9j8sa'],
  ])('%j → %s', (input, expected) => {
    expect(textHash(input)).toBe(expected)
  })
})

describe('quizSignature', () => {
  it('固定輸出', () => {
    expect(quizSignature([])).toBe('3hnx9')
    expect(quizSignature([quiz('死亡是壞事嗎？', ['是', '不是'], 1)])).toBe('btvsca')
  })

  it('正解改變，簽章就不同', () => {
    expect(quizSignature([quiz('死亡是壞事嗎？', ['是', '不是'], 0)])).toBe('btvri1')
  })

  it('解析、範圍、參考段落不影響簽章', () => {
    const a = quiz('死亡是壞事嗎？', ['是', '不是'], 1)
    expect(quizSignature([{ ...a, e: '解析', scope: 'v1', refs: [['v1', 30]] }])).toBe('btvsca')
  })
})

describe('quizKey / conceptKey', () => {
  it('格式固定', () => {
    expect(quizKey('2026-10-04-death', '死亡是壞事嗎？')).toBe('q:2026-10-04-death:u3ju3q')
    expect(quizKey('s1', 'hello world')).toBe('q:s1:eslcxt')
    expect(conceptKey('deprivation')).toBe('c:deprivation')
  })
})
