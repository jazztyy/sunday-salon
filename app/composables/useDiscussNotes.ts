// 討論題的「我的想法」筆記，存在 salon-notes-{slug}：{題目雜湊: {q: 題目, text: 筆記}}（3.9 以前是 {題目雜湊: 筆記}）。
// 規格見 SPEC.md「瀏覽器儲存」。
// 用題目 key 當 key（有 id 用 id，沒有用題目文字的雜湊，不是索引）：調整題目順序不會對錯題；改了題目文字，舊筆記對不到新題目，
// 但因為連題目一起存，筆記頁會把它列在「題目已修改」。
// 同一頁有多張卡片共用這份資料，VueUse 會在同一個頁面內同步。
/** 討論題：完整的 DiscussItem 或筆記頁用的精簡版都可以 */
type DiscussRef = { q: string, id?: string }

export const useDiscussNotes = (slug: string) => {
  const notes = useSalonStorage<Record<string, StoredNote>>(STORAGE_KEYS.discussNotes(slug), {})

  const keyOf = (item: DiscussRef) => questionKey(item, item.q)

  const getNote = (item: DiscussRef) => noteText(notes.value?.[keyOf(item)])

  /** 直接用 key 改（筆記頁改「題目已修改」的筆記用）。清成空白時刪掉這一筆，不留空字串 */
  const setByKey = (key: string, q: string, text: string) => {
    const next = { ...notes.value }
    if (text.trim()) next[key] = { q, text }
    else delete next[key]
    notes.value = next
  }

  const setNote = (item: DiscussRef, text: string) => setByKey(keyOf(item), item.q, text)

  return { notes, keyOf, getNote, setNote, setByKey }
}
