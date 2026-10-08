// 影片段落的顯示工具：秒數格式、影片長度、[videoId, 秒數] → 「講座 5 · 17:17」。
import type { Scope, VideoRef } from '~/types/session'

/** 查講座標籤需要的場次欄位。完整 Session、SessionSummary、StudySession 都符合 */
export interface WithVideos { videos: { id: string, lec: string }[] }

/** 秒數 → mm:ss（超過一小時照樣累計分鐘，例：72:05）。用在時間點，不要拿來顯示長度 */
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/** 影片長度（秒）→ '48 分鐘'。長度一律用「分鐘」，才不會和時間點（mm:ss）混淆 */
export const minutesLabel = (s: number) => `${Math.round(s / 60)} 分鐘`

/** 總長度（秒）→ '約 2 小時 10 分'；不到一小時時 → '約 55 分鐘' */
export const totalLabel = (s: number) => {
  const m = Math.round(s / 60)
  const h = Math.floor(m / 60)
  if (!h) return `約 ${m} 分鐘`
  return m % 60 ? `約 ${h} 小時 ${m % 60} 分` : `約 ${h} 小時`
}

/** videoId → 講座標籤（例：'講座 5'）；找不到影片時回傳空字串 */
export const lecOf = (session: WithVideos, vid: string) =>
  session.videos.find(v => v.id === vid)?.lec ?? ''

/** [videoId, 秒數] → '講座 5 · 17:17' */
export const refLabel = (session: WithVideos, [vid, sec]: VideoRef) => {
  const lec = lecOf(session, vid)
  return lec ? `${lec} · ${mmss(sec)}` : mmss(sec)
}

/** 題目範圍 → 標籤：'all' 是「整合回顧」，其餘是影片 id → 講座標籤（找不到影片時是空字串） */
export const scopeLabel = (session: WithVideos, scope: Scope) =>
  scope === 'all' ? '整合回顧' : lecOf(session, scope)
