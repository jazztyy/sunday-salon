// 內容的 zod schema：唯一來源。欄位規則見 SPEC.md「資料結構」。
// content.config.ts（Nuxt Content 集合）、scripts/check-content.mjs（建置前檢查，嚴格模式）、
// app/types/session.ts（型別一致性檢查）都從這裡匯入。
// 檢查腳本在純 Node 執行（型別剝除），所以這裡直接匯入 zod，不經過 @nuxt/content；兩者是同一份 zod。
import { z } from 'zod'

/** 題目代號：選填，只能用英文小寫、數字、連字號 */
const ID = /^[a-z0-9-]+$/

/**
 * strict = true 時每個物件都不接受未知欄位（拼錯的欄位名稱會被抓出來），給檢查腳本用。
 * Nuxt Content 集合用寬鬆版（未知欄位直接忽略），兩者其他規則完全相同。
 */
const build = (strict: boolean) => {
  // 嚴格版只差在未知欄位的處理，推導出的型別相同，所以統一當成一般物件型別
  const obj = <T extends z.ZodRawShape>(shape: T) =>
    (strict ? z.object(shape).strict() : z.object(shape)) as z.ZodObject<T>
  const id = z.string().regex(ID).max(40).optional() // 穩定的題目代號，見 app/types/session.ts

  const chapter = z.tuple([z.number().int().nonnegative(), z.string()])

  // [videoId, 秒數]：影片段落
  const ref = z.tuple([z.string(), z.number().int().nonnegative()])

  const video = obj({
    id: z.string(), // YouTube video id
    lec: z.string(), // 講座標籤，例：'講座 5'
    duration: z.number().int().positive(), // 影片長度（秒），顯示「48 分鐘」與全場總時數
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

  const argument = obj({
    id,
    name: z.string(),
    kind: z.string(),
    vid: z.string(),
    t: z.number().int().nonnegative(),
    ts: z.string(),
    prem: z.array(premise),
    concl: z.string(),
    verdict: z.string(),
  })

  const session = obj({
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
    related: z.array(obj({ slug: z.string(), reason: z.string() })).default([]), // 人工連結：為什麼值得一起看
    captionTip: z.string(),
    picks: z.array(z.tuple([z.string(), z.string(), z.number(), z.string(), z.string()])),
    tldr: z.array(z.string()),
    stance: z.array(z.tuple([z.string(), z.string()])),
    videos: z.array(video),
    args: z.array(argument),
    argsNote: z.string().optional(),
    votes: z.array(obj({ id, q: z.string(), o: z.array(z.string()) })),
    // 討論題與測驗題都標明範圍：某支影片的 id，或 'all'（整合回顧，跨影片）
    discuss: z.array(obj({
      id,
      scope: z.string(),
      q: z.string(), // 題目
      note: z.string().optional(), // 補充說明（灰字）
      ext: z.boolean().default(false), // 超出影片內容的延伸題
      answer: z.string(), // 「Kagan 怎麼說」：想完才打開；影片沒回答時要明說
      refs: z.array(ref).min(1), // 參考段落
    })),
    quiz: z.array(obj({
      id,
      scope: z.string(),
      q: z.string(),
      o: z.array(z.string()),
      a: z.number().int().nonnegative(),
      e: z.string(), // 解析
      refs: z.array(ref).min(1), // 原片段
    })),
    after: z.string(), // 活動前「活動後」分頁的預告文字（還沒有 recap 時顯示）
    // 活動結束後才填（SPEC.md 5.5）。立場統計來自現場的會議軟體投票
    recap: obj({
      audio: obj({ url: z.string().url(), label: z.string() }).optional(), // 錄音連結，例：Podcast 單集頁
      chapters: z.array(chapter).default([]), // 錄音的時間戳 [秒數, 段落]
      votes: z.array(z.array(z.number().int().nonnegative())).default([]), // 依 votes 的題目順序，每題各選項的人數
      questions: z.array(z.string()).default([]), // 現場冒出的好問題、沒聊完的問題
      concepts: z.array(z.string()).default([]), // 這場討論後新增的概念卡 id
    }).optional(),
  })

  // 概念卡的 frontmatter（id 是檔名，不在這裡）
  const concept = obj({
    title: z.string(), // 顯示名稱，也是 [[連結]] 用的名字
    en: z.string(),
    aliases: z.array(z.string()).default([]), // 其他寫法，[[連結]] 也認得
    summary: z.string(), // 一句話定義，用在名詞卡正面和卡片牆
    tags: z.array(z.string()), // 必須在 taxonomy.yml 裡
    related: z.array(z.string()).default([]), // 相關概念卡 id
  })

  const taxonomy = obj({
    facets: z.array(obj({
      key: z.string(),
      label: z.string(),
      tags: z.array(z.string()),
    })),
  })

  return { session, concept, taxonomy }
}

/** Nuxt Content 集合用（未知欄位忽略） */
export const schemas = build(false)

/** 檢查腳本用（未知欄位視為錯誤） */
export const strictSchemas = build(true)

/** schema 推導出的型別（套用預設值之後），app/types/session.ts 用來檢查手寫型別有沒有跟著改 */
export type SessionData = z.infer<typeof schemas.session>
export type ConceptData = z.infer<typeof schemas.concept>
