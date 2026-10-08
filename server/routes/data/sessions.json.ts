// 精簡場次列表（新的在前）。建置時預先產生成 /data/sessions.json，頁面 payload 和瀏覽器都用它。
import { queryCollection } from '@nuxt/content/server'
import { toSession, toSessionSummary } from '#shared/utils/content'

export default defineEventHandler(async (event) => {
  const items = await queryCollection(event, 'sessions').order('date', 'DESC').all()
  return items.map(i => toSessionSummary(toSession(i as unknown as Record<string, unknown>)))
})
