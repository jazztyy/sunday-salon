// 單張概念卡（含內文）：/data/concepts/{id}.json。/c/{id} 頁面和全站的概念卡彈窗用。
import { queryCollection } from '@nuxt/content/server'
import type { ConceptItem } from '../../../../app/types/content'
import { toConceptFull } from '#shared/utils/content'

export default defineEventHandler(async (event) => {
  const id = decodeURIComponent(getRouterParam(event, 'file') ?? '').replace(/\.json$/, '')
  const item = await queryCollection(event, 'concepts').where('stem', '=', `concepts/${id}`).first()
  if (!item) throw createError({ statusCode: 404, statusMessage: `找不到概念卡 ${id}` })
  return toConceptFull(item as unknown as ConceptItem)
})
