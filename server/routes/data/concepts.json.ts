// 概念卡列表（依詞條排序），不含內文；links 是內文連到的卡（反向連結用）。
import { queryCollection } from '@nuxt/content/server'
import type { ConceptItem } from '../../../app/types/content'
import { toConceptSummary } from '#shared/utils/content'

export default defineEventHandler(async (event) => {
  const items = await queryCollection(event, 'concepts').order('title', 'ASC').all()
  return items.map(i => toConceptSummary(i as unknown as ConceptItem))
})
