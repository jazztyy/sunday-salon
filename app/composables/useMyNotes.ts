// 「我的筆記」：使用者自己在 /notes 新增的筆記，存在 salon-mynotes。規格見 SPEC.md「筆記」「瀏覽器儲存」。
// 每則可以選屬於哪一場（slug），也可以不屬於任何場次（slug 為 null）。

export interface MyNote {
  id: string
  title: string
  body: string
  /** 屬於哪一場；null = 不屬於任何場次 */
  slug: string | null
  /** ISO 時間 */
  createdAt: string
  updatedAt: string
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const useMyNotes = () => {
  const notes = useSalonStorage<MyNote[]>(STORAGE_KEYS.myNotes, [])

  const add = (slug: string | null): MyNote => {
    const now = new Date().toISOString()
    const note: MyNote = { id: newId(), title: '', body: '', slug, createdAt: now, updatedAt: now }
    notes.value = [note, ...(notes.value ?? [])]
    return note
  }

  const update = (id: string, patch: Partial<Pick<MyNote, 'title' | 'body' | 'slug'>>) => {
    notes.value = (notes.value ?? []).map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)
  }

  const remove = (id: string) => {
    notes.value = (notes.value ?? []).filter(n => n.id !== id)
  }

  return { notes, add, update, remove }
}
