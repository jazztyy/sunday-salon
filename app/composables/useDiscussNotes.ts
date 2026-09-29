// 討論題的「我的想法」筆記，存在 salon-notes-{slug}：{題目雜湊: 筆記}。規格見 SPEC.md「瀏覽器儲存」。
// 用題目文字的雜湊當 key（不是索引）：調整題目順序不會對錯題；改了題目文字，舊筆記就不再顯示。
// 同一頁有多張卡片共用這份資料，VueUse 會在同一個頁面內同步。
import type { DiscussItem } from '~/types/session'

export const useDiscussNotes = (slug: string) => {
  const notes = useSalonStorage<Record<string, string>>(`salon-notes-${slug}`, {})

  const keyOf = (item: DiscussItem) => textHash(item.q)

  const getNote = (item: DiscussItem) => notes.value?.[keyOf(item)] ?? ''

  /** 清成空白時刪掉這一筆，不留空字串 */
  const setNote = (item: DiscussItem, text: string) => {
    const next = { ...notes.value }
    if (text.trim()) next[keyOf(item)] = text
    else delete next[keyOf(item)]
    notes.value = next
  }

  return { notes, getNote, setNote }
}
