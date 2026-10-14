import { describe, expect, it } from 'vitest'
import { lecOf, minutesLabel, mmss, recordingOf, refLabel, scopeLabel, totalLabel, youtubeId } from '~/utils/videoRef'
import { session } from './fixtures'

describe('mmss', () => {
  it.each([
    [0, '00:00'],
    [5, '00:05'],
    [65, '01:05'],
    [1037, '17:17'],
    [4325, '72:05'], // 超過一小時照樣累計分鐘
  ])('%i → %s', (s, expected) => expect(mmss(s)).toBe(expected))
})

describe('minutesLabel', () => {
  it('四捨五入到分鐘', () => {
    expect(minutesLabel(2880)).toBe('48 分鐘')
    expect(minutesLabel(2910)).toBe('49 分鐘')
  })
})

describe('totalLabel', () => {
  it('不到一小時', () => expect(totalLabel(55 * 60)).toBe('約 55 分鐘'))
  it('整點', () => expect(totalLabel(2 * 3600)).toBe('約 2 小時'))
  it('小時＋分', () => expect(totalLabel(130 * 60)).toBe('約 2 小時 10 分'))
  it('59.5 分鐘進位成 1 小時', () => expect(totalLabel(3570)).toBe('約 1 小時'))
})

describe('lecOf / refLabel', () => {
  const s = session('s1', { videos: [{ id: 'abc', lec: '講座 5' }, { id: 'def', lec: '講座 6' }] })

  it('找得到影片', () => expect(lecOf(s, 'def')).toBe('講座 6'))
  it('找不到影片回傳空字串', () => expect(lecOf(s, 'zzz')).toBe(''))
  it('有講座標籤', () => expect(refLabel(s, ['abc', 1037])).toBe('講座 5 · 17:17'))
  it('找不到影片只顯示時間', () => expect(refLabel(s, ['zzz', 65])).toBe('01:05'))
})

describe('scopeLabel', () => {
  // 只有 videos 的精簡場次也能用
  const s = { videos: [{ id: 'abc', lec: '講座 5' }] }

  it("'all' 是整合回顧", () => expect(scopeLabel(s, 'all')).toBe('整合回顧'))
  it('影片 id → 講座標籤', () => expect(scopeLabel(s, 'abc')).toBe('講座 5'))
  it('找不到影片回傳空字串', () => expect(scopeLabel(s, 'zzz')).toBe(''))
})

describe('youtubeId', () => {
  it.each([
    ['https://youtu.be/kvUpM2r06QQ', 'kvUpM2r06QQ'],
    ['https://youtu.be/kvUpM2r06QQ?si=abc', 'kvUpM2r06QQ'],
    ['https://www.youtube.com/watch?v=kvUpM2r06QQ&t=30s', 'kvUpM2r06QQ'],
    ['https://m.youtube.com/watch?v=kvUpM2r06QQ', 'kvUpM2r06QQ'],
    ['https://www.youtube.com/embed/kvUpM2r06QQ', 'kvUpM2r06QQ'],
    ['https://www.youtube.com/live/kvUpM2r06QQ', 'kvUpM2r06QQ'],
  ])('%s → %s', (url, expected) => expect(youtubeId(url)).toBe(expected))

  it.each([
    'https://open.spotify.com/episode/abc',
    'https://www.youtube.com/@Kai-li9zp',
    'https://youtu.be/',
    'not a url',
  ])('%s → null', url => expect(youtubeId(url)).toBeNull())
})

describe('recordingOf', () => {
  it('YouTube 錄音回傳 id 和時間戳', () => {
    const recap = { audio: { url: 'https://youtu.be/kvUpM2r06QQ', label: '收聽' }, chapters: [[0, '開場']] as [number, string][] }
    expect(recordingOf({ recap })).toEqual({ id: 'kvUpM2r06QQ', chapters: [[0, '開場']] })
  })

  it('沒填 chapters 時是空陣列', () => {
    expect(recordingOf({ recap: { audio: { url: 'https://youtu.be/kvUpM2r06QQ', label: '收聽' } } })?.chapters).toEqual([])
  })

  it('沒有錄音或不在 YouTube 時為 null', () => {
    expect(recordingOf({})).toBeNull()
    expect(recordingOf({ recap: {} })).toBeNull()
    expect(recordingOf({ recap: { audio: { url: 'https://open.spotify.com/episode/abc', label: '收聽' } } })).toBeNull()
  })
})
