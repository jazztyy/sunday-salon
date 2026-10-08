// 單一場次的完整資料：/data/sessions/{slug}.json。場次頁和首頁（瀏覽器換了本週那一場時）用。
import { queryCollection } from '@nuxt/content/server'
import { toSession } from '#shared/utils/content'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'file')?.replace(/\.json$/, '') ?? ''
  const item = await queryCollection(event, 'sessions').where('slug', '=', slug).first()
  if (!item) throw createError({ statusCode: 404, statusMessage: `找不到場次 ${slug}` })
  return toSession(item as unknown as Record<string, unknown>)
})
