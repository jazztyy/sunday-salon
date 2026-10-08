// 內容集合的 item → 各頁面用的資料形狀。只在 server/routes/data/ 的端點裡用（建置時執行）。
// 形狀定義見 app/types/content.ts。
import type { Session } from '../../app/types/session'
import type { ConceptFull, ConceptItem, ConceptSummary, SessionSearch, SessionSummary, StudySession } from '../../app/types/content'

/** 概念卡 id = 檔名（content/concepts/{id}.md） */
export const conceptIdOf = (stem: string): string => stem.split('/').pop() ?? stem

/** 內容集合的欄位 → 元件使用的 Session 型別（去掉 Nuxt Content 附加的 id/stem/meta） */
export const toSession = (item: Record<string, unknown>): Session => {
  const { id: _id, stem: _stem, extension: _ext, meta: _meta, ...rest } = item
  return rest as unknown as Session
}

const videoSummaries = (s: Session) => s.videos.map(v => ({ id: v.id, lec: v.lec, short: v.short }))

export const toSessionSummary = (s: Session): SessionSummary => ({
  slug: s.slug,
  date: s.date,
  dateLabel: s.dateLabel,
  chip: s.chip,
  title: s.title,
  lede: s.lede,
  tags: s.tags,
  concepts: s.concepts,
  related: s.related,
  videos: videoSummaries(s),
})

export const toSessionSearch = (s: Session): SessionSearch => ({
  slug: s.slug,
  videos: s.videos.flatMap(v => [v.lec, v.title, v.short, v.guide]),
  chapters: s.videos.flatMap(v => v.chapters.map(c => c[1])),
  args: s.args.map(a => a.name),
})

export const toStudySession = (s: Session): StudySession => ({
  slug: s.slug,
  date: s.date,
  chip: s.chip,
  title: s.title,
  concepts: s.concepts,
  quiz: s.quiz,
  videos: videoSummaries(s),
  discuss: s.discuss.map(d => ({ scope: d.scope, q: d.q, ...('id' in d && d.id ? { id: d.id as string } : {}) })),
})

/**
 * 內文連到哪些概念卡。內文是 minimark AST，連結節點為 ['a', { href: '/c/{id}' }, …]，
 * 序列化後會出現 "/c/{id}"（前後都有引號，避免 soul 誤中 soul-x）。
 */
const linkedIds = (body: unknown): string[] =>
  [...new Set([...JSON.stringify(body ?? '').matchAll(/"\/c\/([^"/?#]+)"/g)].map(m => decodeURIComponent(m[1]!)))]

export const toConceptSummary = (i: ConceptItem): ConceptSummary => ({
  id: conceptIdOf(i.stem),
  title: i.title,
  en: i.en,
  aliases: i.aliases ?? [],
  summary: i.summary,
  tags: i.tags ?? [],
  related: i.related ?? [],
  links: linkedIds(i.body),
})

export const toConceptFull = (i: ConceptItem): ConceptFull => ({ ...toConceptSummary(i), raw: i })
