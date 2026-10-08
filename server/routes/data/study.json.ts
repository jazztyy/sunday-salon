// 筆記、複習用的題目資料（新的在前），只有 /notes、/review 用。
import { queryCollection } from '@nuxt/content/server'
import { toSession, toStudySession } from '#shared/utils/content'

export default defineEventHandler(async (event) => {
  const items = await queryCollection(event, 'sessions').order('date', 'DESC').all()
  return items.map(i => toStudySession(toSession(i as unknown as Record<string, unknown>)))
})
