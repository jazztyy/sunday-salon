// /archive 搜尋用的文字（影片、章節、論證名稱）。另外放一個檔，免得每一頁的場次列表都帶著它。
import { queryCollection } from '@nuxt/content/server'
import { toSession, toSessionSearch } from '#shared/utils/content'

export default defineEventHandler(async (event) => {
  const items = await queryCollection(event, 'sessions').order('date', 'DESC').all()
  return items.map(i => toSessionSearch(toSession(i as unknown as Record<string, unknown>)))
})
