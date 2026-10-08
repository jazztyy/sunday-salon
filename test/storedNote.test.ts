import { describe, expect, it } from 'vitest'
import { noteQuestion, noteText } from '~/utils/storedNote'

describe('noteText', () => {
  it('3.9 以前的字串格式', () => expect(noteText('舊筆記')).toBe('舊筆記'))
  it('{q, text} 格式', () => expect(noteText({ q: '題目', text: '內容' })).toBe('內容'))
  it('沒有筆記', () => expect(noteText(undefined)).toBe(''))
  it('空字串照原樣', () => expect(noteText('')).toBe(''))
})

describe('noteQuestion', () => {
  it('字串格式沒有題目', () => expect(noteQuestion('舊筆記')).toBe(''))
  it('{q, text} 格式', () => expect(noteQuestion({ q: '題目', text: '內容' })).toBe('題目'))
  it('沒有筆記', () => expect(noteQuestion(undefined)).toBe(''))
})
