// 內容集合定義。欄位規則見 SPEC.md「資料結構」。
// 跨檔案的規則（tag 在詞彙表裡、概念卡存在、[[連結]] 連得到…）由 scripts/check-content.mjs 在建置前檢查。
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const chapter = z.tuple([z.number().int().nonnegative(), z.string()])

const video = z.object({
  id: z.string(), // YouTube video id
  lec: z.string(), // 例：'講座 5 · 48:02'
  short: z.string(),
  title: z.string(),
  guide: z.string(), // 帶著這個問題看
  chapters: z.array(chapter),
  recall: z.array(z.tuple([z.string(), z.string()])),
})

// [前提內容, 質疑理由 | null, 接受理由?]：質疑與接受剛好填一個
const premise = z.union([
  z.tuple([z.string(), z.string()]),
  z.tuple([z.string(), z.null(), z.string()]),
])

const argument = z.object({
  name: z.string(),
  kind: z.string(),
  vid: z.string(),
  t: z.number().int().nonnegative(),
  ts: z.string(),
  prem: z.array(premise),
  concl: z.string(),
  verdict: z.string(),
})

export default defineContentConfig({
  collections: {
    // 每一場一個檔案：content/sessions/{年}/{月-日}-{主題}.yml
    sessions: defineCollection({
      type: 'data',
      source: 'sessions/**/*.yml',
      schema: z.object({
        slug: z.string(), // 網址與 localStorage key 用，例：'w1'，發佈後不可以改
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // 活動日期 ISO，用來依月份分組
        chip: z.string(),
        dateLabel: z.string(),
        eyebrow: z.string(),
        title: z.string(),
        lede: z.string(),
        speaker: z.string(),
        tags: z.array(z.string()), // 必須在 taxonomy.yml 裡
        concepts: z.array(z.string()), // 這場用到的概念卡 id（決定名詞卡內容與自動關聯）
        related: z.array(z.object({ slug: z.string(), reason: z.string() })).default([]), // 人工連結：為什麼值得一起看
        captionTip: z.string(),
        picks: z.array(z.tuple([z.string(), z.string(), z.number(), z.string(), z.string()])),
        tldr: z.array(z.string()),
        stance: z.array(z.tuple([z.string(), z.string()])),
        videos: z.array(video),
        args: z.array(argument),
        argsNote: z.string().optional(),
        votes: z.array(z.object({ q: z.string(), o: z.array(z.string()) })),
        discuss: z.array(z.tuple([z.string(), z.string(), z.boolean()])),
        quiz: z.array(z.object({
          q: z.string(),
          o: z.array(z.string()),
          a: z.number().int().nonnegative(),
          e: z.string(),
          t: z.tuple([z.string(), z.number()]),
        })),
        after: z.string(),
      }),
    }),

    // 概念卡：content/concepts/{id}.md，內文可以用 [[概念名稱]] 連到其他概念卡
    concepts: defineCollection({
      type: 'page',
      source: 'concepts/*.md',
      schema: z.object({
        title: z.string(), // 顯示名稱，也是 [[連結]] 用的名字
        en: z.string(),
        aliases: z.array(z.string()).default([]), // 其他寫法，[[連結]] 也認得
        summary: z.string(), // 一句話定義，用在名詞卡正面和卡片牆
        tags: z.array(z.string()), // 必須在 taxonomy.yml 裡
        related: z.array(z.string()).default([]), // 相關概念卡 id
      }),
    }),

    // 詞彙表：tag 只能從這裡選
    taxonomy: defineCollection({
      type: 'data',
      source: 'taxonomy.yml',
      schema: z.object({
        facets: z.array(z.object({
          key: z.string(),
          label: z.string(),
          tags: z.array(z.string()),
        })),
      }),
    }),
  },
})
