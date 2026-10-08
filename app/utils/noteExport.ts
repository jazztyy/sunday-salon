// 筆記匯出（/notes 的「Markdown」「純文字」）：依場次分組的筆記 → 檔案內容。純函式，下載在 utils/download.ts。
// 格式見 SPEC.md「筆記」的匯出：Markdown 用 ## 場次、### 種類、> 引用題目；純文字用 ■ 場次、【】種類、――― 分隔。
// 格式由 test/noteExport.test.ts 固定，改格式要一起改測試。

export type NoteExportFormat = 'md' | 'txt'

export interface NoteExportItem {
  /** 種類標籤，例：「討論筆記・講座 8」「我的筆記・2026/9/2」 */
  label: string
  /** 題目、詞條或標題 */
  head: string
  /** head 是題目時用引用（> ／「題目：」），詞條和標題用粗體／原樣 */
  quote: boolean
  body: string
}

export interface NoteExportGroup {
  /** 場次「chip・題目」或「其他筆記」 */
  title: string
  items: NoteExportItem[]
}

/** today：匯出日期（YYYY-MM-DD），由呼叫端給，方便測試 */
export const buildNoteExport = (format: NoteExportFormat, groups: NoteExportGroup[], today: string): string => {
  const md = format === 'md'
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const out: string[] = []
  out.push(md ? '# 悅讀聊天室筆記' : '悅讀聊天室筆記')
  out.push(`匯出日期：${today}　共 ${total} 則`, '')
  for (const g of groups) {
    out.push(md ? `## ${g.title}` : `■ ${g.title}`, '')
    for (const p of g.items) {
      if (md) {
        out.push(`### ${p.label}`, '')
        out.push(p.quote ? `> ${p.head}` : `**${p.head}**`, '')
      }
      else {
        out.push(`【${p.label}】`)
        out.push(p.quote ? `題目：${p.head}` : p.head)
      }
      const body = p.body.trim() || '（沒有內容）'
      // Markdown 的單一換行會被合併成同一行，行尾加兩個空白保留換行
      out.push(md ? body.replace(/\n/g, '  \n') : body, '')
      if (!md) out.push('―――', '')
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}
