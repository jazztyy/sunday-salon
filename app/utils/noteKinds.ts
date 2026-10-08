// 筆記頁（/notes）的筆記種類。種類的名稱、徽章顏色和顯示方式集中在這裡，
// <NoteCard>、編輯視窗、種類篩選都從這裡讀。資料怎麼來（哪個 storage、怎麼對回題目）在 useNoteEntries。
// 規格見 SPEC.md「筆記」。

export type NoteKind = 'discuss' | 'review' | 'concept' | 'orphan' | 'mine'

export interface NoteKindInfo {
  /** 徽章、篩選、匯出用的名稱 */
  label: string
  /** 徽章顏色（Nuxt UI color） */
  color: 'neutral' | 'primary' | 'secondary'
  /** 平常沒有，有這種筆記（或正在篩選它）時才出現在種類篩選，排在最後 */
  hiddenWhenEmpty?: boolean
  /** 編輯視窗大標題的字級：題目用 text-title，詞條短，用 text-h2 */
  headClass: 'text-title' | 'text-h2'
  /** 編輯視窗標題下的說明 */
  notice?: string
}

/** 順序就是同一場裡筆記的排列順序 */
export const NOTE_KINDS: Record<NoteKind, NoteKindInfo> = {
  discuss: { label: '討論筆記', color: 'neutral', headClass: 'text-title' },
  review: { label: '複習筆記', color: 'secondary', headClass: 'text-title' },
  concept: { label: '概念筆記', color: 'secondary', headClass: 'text-h2' },
  orphan: {
    label: '題目已修改',
    color: 'neutral',
    headClass: 'text-title',
    hiddenWhenEmpty: true,
    notice: '這題的題目後來改過了（或概念卡已移除），筆記對不到現在的題目，所以收在這裡。可以把內容搬到新題目或「我的筆記」；清空就是刪除。',
  },
  mine: { label: '我的筆記', color: 'primary', headClass: 'text-h2' },
}
