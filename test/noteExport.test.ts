import { describe, expect, it } from 'vitest'
import { buildNoteExport, type NoteExportGroup } from '~/utils/noteExport'

const groups: NoteExportGroup[] = [
  {
    title: '10/4 靈魂・靈魂存在嗎？',
    items: [
      { label: '討論筆記・講座 5', head: '你有自由意志嗎？', quote: true, body: '第一行\n第二行 **粗體**' },
      { label: '概念筆記', head: '靈魂', quote: false, body: '  概念筆記內容\n\n\n' },
      { label: '題目已修改', head: '（找不到原本的題目）', quote: false, body: '   ' },
    ],
  },
  {
    title: '其他筆記',
    items: [
      { label: '我的筆記・2026/9/4', head: '未命名筆記', quote: false, body: '沒有標題的筆記' },
    ],
  },
]

describe('buildNoteExport', () => {
  it('Markdown：## 場次、### 種類、> 題目，換行加行尾兩個空白', () => {
    expect(buildNoteExport('md', groups, '2026-10-08')).toBe([
      '# 悅讀聊天室筆記',
      '匯出日期：2026-10-08　共 4 則',
      '',
      '## 10/4 靈魂・靈魂存在嗎？',
      '',
      '### 討論筆記・講座 5',
      '',
      '> 你有自由意志嗎？',
      '',
      '第一行  ',
      '第二行 **粗體**',
      '',
      '### 概念筆記',
      '',
      '**靈魂**',
      '',
      '概念筆記內容',
      '',
      '### 題目已修改',
      '',
      '**（找不到原本的題目）**',
      '',
      '（沒有內容）',
      '',
      '## 其他筆記',
      '',
      '### 我的筆記・2026/9/4',
      '',
      '**未命名筆記**',
      '',
      '沒有標題的筆記',
      '',
    ].join('\n'))
  })

  it('純文字：■ 場次、【】種類、「題目：」、――― 分隔', () => {
    expect(buildNoteExport('txt', groups, '2026-10-08')).toBe([
      '悅讀聊天室筆記',
      '匯出日期：2026-10-08　共 4 則',
      '',
      '■ 10/4 靈魂・靈魂存在嗎？',
      '',
      '【討論筆記・講座 5】',
      '題目：你有自由意志嗎？',
      '第一行',
      '第二行 **粗體**',
      '',
      '―――',
      '',
      '【概念筆記】',
      '靈魂',
      '概念筆記內容',
      '',
      '―――',
      '',
      '【題目已修改】',
      '（找不到原本的題目）',
      '（沒有內容）',
      '',
      '―――',
      '',
      '■ 其他筆記',
      '',
      '【我的筆記・2026/9/4】',
      '未命名筆記',
      '沒有標題的筆記',
      '',
      '―――',
      '',
    ].join('\n'))
  })

  it('內文裡的連續空行壓成一行空行', () => {
    const out = buildNoteExport('txt', [{ title: 'A', items: [{ label: 'L', head: 'H', quote: false, body: 'a\n\n\n\nb' }] }], '2026-10-08')
    expect(out).toContain('a\n\nb')
  })

  it('沒有筆記時只有標題和日期', () => {
    expect(buildNoteExport('md', [], '2026-10-08')).toBe('# 悅讀聊天室筆記\n匯出日期：2026-10-08　共 0 則\n')
  })
})
