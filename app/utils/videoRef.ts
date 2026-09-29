// 影片段落的顯示工具：秒數格式、[videoId, 秒數] → 「講座 5 · 17:17」。
import type { Session, VideoRef } from '~/types/session'

/** 秒數 → mm:ss（超過一小時照樣累計分鐘，例：72:05） */
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/** videoId → 講座標籤（video.lec 的 ' · ' 前半，例：'講座 5'）；找不到影片時回傳空字串 */
export const lecOf = (session: Session, vid: string) =>
  session.videos.find(v => v.id === vid)?.lec.split(' · ')[0] ?? ''

/** [videoId, 秒數] → '講座 5 · 17:17' */
export const refLabel = (session: Session, [vid, sec]: VideoRef) => {
  const lec = lecOf(session, vid)
  return lec ? `${lec} · ${mmss(sec)}` : mmss(sec)
}
