// 內容集合定義。欄位的 zod schema 在 lib/schema.ts（檢查腳本與型別檢查共用同一份），規則見 SPEC.md「資料結構」。
// 跨檔案的規則（tag 在詞彙表裡、概念卡存在、[[連結]] 連得到…）由 scripts/check-content.mjs 在建置前檢查。
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { schemas } from './lib/schema'

export default defineContentConfig({
  collections: {
    // 每一場一個檔案：content/sessions/{年}/{月-日}-{主題}.yml
    sessions: defineCollection({
      type: 'data',
      source: 'sessions/**/*.yml',
      schema: schemas.session,
    }),

    // 概念卡：content/concepts/{id}.md，內文可以用 [[概念名稱]] 連到其他概念卡
    concepts: defineCollection({
      type: 'page',
      source: 'concepts/*.md',
      schema: schemas.concept,
    }),

    // 詞彙表：tag 只能從這裡選
    taxonomy: defineCollection({
      type: 'data',
      source: 'taxonomy.yml',
      schema: schemas.taxonomy,
    }),
  },
})
