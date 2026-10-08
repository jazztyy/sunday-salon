// 相關場次（「延續討論」）：像雙向連結一樣，把和這場有關的其他場次找出來。
// 1. 人工連結：這場 related 列出的場次，加上 related 指向這場的場次（反向連結，用對方寫的理由）。
// 2. 共同概念：和這場共用至少一張概念卡的場次，依共用數量多寡、日期新舊排序。
// 排除自己、同一場只出現一次（人工連結優先），最多 5 筆。
import type { MaybeRefOrGetter } from 'vue'
import type { Session } from '~/types/session'
import type { SessionSummary } from '~/types/content'

export interface RelatedSession {
  session: SessionSummary
  kind: 'manual' | 'shared'
  reason: string
  /** 共用的概念卡 id（人工連結也會附上，沒有就是空陣列） */
  shared: string[]
}

const MAX_ITEMS = 5
const MAX_TITLES = 3

/** 「都談到：A、B、C 等 5 個概念」 */
const sharedReason = (titles: string[]): string => {
  const head = titles.slice(0, MAX_TITLES).join('、')
  const rest = titles.length > MAX_TITLES ? ` 等 ${titles.length} 個概念` : ''
  return `都談到：${head}${rest}`
}

export const useRelatedSessions = (session: MaybeRefOrGetter<Pick<Session, 'slug' | 'concepts' | 'related'>>) => {
  const { data: sessions } = useSessionIndex()
  const { data: concepts } = useConceptIndex()

  return computed<RelatedSession[]>(() => {
    const current = toValue(session)
    const others = sessions.value.filter(s => s.slug !== current.slug)
    const titleOf = new Map(concepts.value.map(c => [c.id, c.title]))
    const mine = new Set(current.concepts)
    const sharedWith = (s: SessionSummary) => s.concepts.filter(id => mine.has(id))

    const manual = new Map<string, RelatedSession>()
    for (const { slug, reason } of current.related) {
      const s = others.find(o => o.slug === slug)
      if (s && !manual.has(slug)) manual.set(slug, { session: s, kind: 'manual', reason, shared: sharedWith(s) })
    }
    for (const s of others) {
      const back = s.related.find(r => r.slug === current.slug)
      if (back && !manual.has(s.slug)) manual.set(s.slug, { session: s, kind: 'manual', reason: back.reason, shared: sharedWith(s) })
    }

    const shared = others
      .filter(s => !manual.has(s.slug))
      .map(s => ({ s, ids: sharedWith(s) }))
      .filter(({ ids }) => ids.length > 0)
      .sort((a, b) => b.ids.length - a.ids.length || b.s.date.localeCompare(a.s.date))
      .map(({ s, ids }): RelatedSession => ({
        session: s,
        kind: 'shared',
        reason: sharedReason(ids.map(id => titleOf.get(id) ?? id)),
        shared: ids,
      }))

    return [...manual.values(), ...shared].slice(0, MAX_ITEMS)
  })
}
