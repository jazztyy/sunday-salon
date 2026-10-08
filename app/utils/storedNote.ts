// 討論筆記（salon-notes-{slug}）和複習／概念筆記（salon-review-notes）裡的一則筆記。
// 3.9 起連題目（概念筆記是詞條）一起存：題目文字改掉後，key 對不到新題目，筆記頁仍然可以顯示原題目和內容。
// 3.9 以前只存筆記字串，讀取時兩種都接受；舊筆記下次修改時才換成新格式。

export type StoredNote = string | { q: string, text: string }

export const noteText = (v: StoredNote | undefined): string =>
  typeof v === 'string' ? v : v?.text ?? ''

/** 存筆記時記下的題目或詞條；3.9 以前的舊筆記沒有，回傳空字串 */
export const noteQuestion = (v: StoredNote | undefined): string =>
  typeof v === 'string' ? '' : v?.q ?? ''
