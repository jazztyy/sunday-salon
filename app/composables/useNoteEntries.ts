// 筆記頁（/notes）的資料：把各種來源的筆記整理成同一個形狀（NoteEntry），頁面只管篩選、版面和視窗。
// - 討論筆記：salon-notes-{slug}（useDiscussNotes）
// - 複習筆記、概念筆記：salon-review-notes（useReviewNotes）；測驗題 q:{slug}:{雜湊}、概念卡題 c:{id}
// - 題目已修改：上面兩種裡對不到現在題目的筆記
// - 我的筆記：salon-mynotes（useMyNotes）
// 每種來源一個轉換函式（下面的 xxxCandidates），新增種類時加一個，再到 utils/noteKinds.ts 登記名稱和顏色。
// 規格見 SPEC.md「筆記」。
import type { ConceptSummary, StudySession as Session } from '~/types/content'
import type { MyNote } from '~/composables/useMyNotes'
import type { NoteKind } from '~/utils/noteKinds'

export interface NoteEntry {
  /** 穩定的 key：討論 `d:{slug}:{題號}`、複習／概念 `r:{題目 key}`、題目已修改 `o:d:{slug}:{key}`／`o:r:{key}`、我的筆記 `m:{id}` */
  key: string
  kind: NoteKind
  /** 屬於哪一場；null 或對不到場次的放「其他筆記」 */
  slug: string | null
  /** 卡片和視窗的標題：題目、詞條或我的筆記的標題（可能是空字串） */
  title: string
  /** 卡片第一行的小字：講座標籤、「概念卡」或修改日期 */
  meta: string
  /** 視窗屬性列的「場次」（我的筆記在視窗裡用選單，不用這個） */
  where: string
  /** 視窗屬性列的「連結」。leaves：會換頁的連結點了要先關掉視窗；概念卡連結只是開另一個彈窗 */
  link: { to: string, label: string, leaves: boolean } | null
  body: string
  /** 有內容才列出來；我的筆記沒寫內容也算（有標題、或剛新增） */
  filled: boolean
  setBody: (text: string) => void
  /** 搜尋索引（筆記內容另外用 body） */
  search: { title: string, question: string }
  /** 匯出的種類標籤，例：「討論筆記・講座 8」 */
  exportLabel: string
  /** 匯出時標題是題目（用引用），詞條和我的筆記用粗體 */
  quote: boolean
  /** 刪除前確認的文字 */
  confirmRemove: { title: string, description: string }
  /** 刪除：我的筆記整則刪除；其他種類清空筆記內容（題目和概念卡本身不受影響） */
  remove: () => void
  /** 我的筆記本身（視窗裡改標題、場次用） */
  mine?: MyNote
}

const shorten = (text: string) => text.length > 24 ? `${text.slice(0, 24)}…` : text

export const noteDateText = (iso: string) =>
  new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })

/** 討論、複習、概念、題目已修改共用的刪除確認：清空內容，不刪題目 */
const clearConfirm = (label: string, name: string, target: '題目' | '概念卡') => ({
  title: `刪除這則${label}？`,
  description: `「${shorten(name)}」的筆記內容會被清空，無法復原；${target}本身不受影響，之後還可以重寫。`,
})

/**
 * editing：編輯視窗打開的那則 key。編輯中就算清空也先留在畫面上。
 * 回傳的 entries 依場次無關的固定順序：討論 → 複習 → 概念 → 題目已修改 → 我的筆記（最近修改的在前），頁面再依場次分組。
 */
export const useNoteEntries = (sessions: Ref<Session[]>, concepts: Ref<ConceptSummary[]>, editing: Ref<string | null>) => {
  const discussStores = sessions.value.map(s => ({ session: s, ...useDiscussNotes(s.slug) }))
  const { notes: myNotes, add, update, remove } = useMyNotes()
  const { notes: reviewNotes, setNote: setReviewNote } = useReviewNotes()

  const bySlug = computed(() => new Map(sessions.value.map(s => [s.slug, s])))

  // ---- 討論筆記：每一題都是候選，有內容（或正在編輯）才列出 ----
  const discussCandidates = computed<NoteEntry[]>(() =>
    discussStores.flatMap(({ session, getNote, setNote }) =>
      session.discuss.map((item, i) => {
        const label = item.scope === 'all' ? '整合回顧' : lecOf(session, item.scope)
        const body = getNote(item)
        return {
          key: `d:${session.slug}:${i}`,
          kind: 'discuss' as const,
          slug: session.slug,
          title: item.q,
          meta: label,
          where: `${session.chip}・${label}`,
          link: { to: `/s/${session.slug}#sunday`, label: '回到題目，看 Kagan 怎麼說', leaves: true },
          body,
          filled: !!body.trim(),
          setBody: (v: string) => setNote(item, v),
          search: { title: '', question: item.q },
          exportLabel: `討論筆記・${label}`,
          quote: true,
          confirmRemove: clearConfirm('討論筆記', item.q, '題目'),
          remove: () => setNote(item, ''),
        }
      }),
    ),
  )

  // ---- 複習筆記、概念筆記：key 對回題目（測驗題算在它的場次，概念卡題算在第一次用到這張卡的場次）----
  const reviewQuestions = computed(() => new Map(buildReviewQuestions(sessions.value, concepts.value).map(q => [q.key, q])))
  const conceptTitles = computed(() => new Map(concepts.value.map(c => [c.id, c.title])))

  // 概念卡題的筆記（key `c:{id}`）就是概念卡彈窗裡寫的筆記，所以另外歸成「概念筆記」
  const reviewCandidates = computed<NoteEntry[]>(() => {
    const quiz: NoteEntry[] = []
    const concept: NoteEntry[] = []
    for (const q of reviewQuestions.value.values()) {
      const body = noteText(reviewNotes.value?.[q.key])
      const setBody = (v: string) => setReviewNote(q.key, v, reviewNoteQuestion(q, concepts.value))
      const common = { key: `r:${q.key}`, slug: q.session.slug, body, filled: !!body.trim(), setBody, remove: () => setBody('') }
      if (q.kind === 'quiz') {
        const label = q.item.scope === 'all' ? '整合回顧' : lecOf(q.session, q.item.scope)
        quiz.push({
          ...common,
          kind: 'review',
          title: q.item.q,
          meta: label,
          where: `${q.session.chip}・${label}`,
          link: { to: `/s/${q.session.slug}#recall`, label: '回到這一場的「看完回想」', leaves: true },
          search: { title: '', question: q.item.q },
          exportLabel: `複習筆記・${label}`,
          quote: true,
          confirmRemove: clearConfirm('複習筆記', q.item.q, '題目'),
        })
      }
      else {
        const title = conceptTitles.value.get(q.conceptId ?? '') ?? ''
        concept.push({
          ...common,
          kind: 'concept',
          title,
          meta: '概念卡',
          where: `${q.session.chip}・概念卡`,
          link: { to: `/c/${q.conceptId}`, label: '看概念卡', leaves: false },
          search: { title, question: q.item.q },
          exportLabel: '概念筆記',
          quote: false,
          confirmRemove: clearConfirm('概念筆記', title, '概念卡'),
        })
      }
    }
    return [...quiz, ...concept]
  })

  // ---- 題目已修改 ----
  /**
   * 筆記的 key 是題目文字的雜湊，題目改掉（或概念卡移除）後就對不到，原處不再顯示。
   * 集中列在這裡，可以看、搬到新題目或刪掉。3.9 起連題目一起存，可以顯示原題目；更早的筆記沒有題目。
   */
  type OrphanRaw = { key: string, slug: string | null, session: Session | null, q: string, text: string, set: (v: string) => void }

  const orphanStored = computed(() => {
    const out: OrphanRaw[] = []
    for (const { session, notes, keyOf, setByKey } of discussStores) {
      const current = new Set(session.discuss.map(keyOf))
      for (const [k, v] of Object.entries(notes.value ?? {})) {
        if (current.has(k) || !noteText(v).trim()) continue
        const q = noteQuestion(v)
        out.push({ key: `o:d:${session.slug}:${k}`, slug: session.slug, session, q, text: noteText(v), set: t => setByKey(k, q, t) })
      }
    }
    for (const [k, v] of Object.entries(reviewNotes.value ?? {})) {
      if (reviewQuestions.value.has(k) || !noteText(v).trim()) continue
      // 測驗題 key 是 q:{slug}:{雜湊}，算在那一場；概念卡題 c:{id} 的卡已經沒有場次用到，放「其他筆記」
      const session = bySlug.value.get(k.match(/^q:([^:]+):/)?.[1] ?? '') ?? null
      const q = noteQuestion(v)
      out.push({ key: `o:r:${k}`, slug: session?.slug ?? null, session, q, text: noteText(v), set: t => setReviewNote(k, t, q) })
    }
    return out
  })

  // 其他種類的題目還在，編輯中清空也會留在畫面上；這種清空就從 storage 刪掉了，所以記下打開時的資料，編輯中照樣顯示
  const orphanOpened = ref<OrphanRaw | null>(null)
  watch(editing, (k) => { orphanOpened.value = orphanStored.value.find(e => e.key === k) ?? null })

  const orphanCandidates = computed<NoteEntry[]>(() => {
    const o = orphanOpened.value
    const list = o && !orphanStored.value.some(e => e.key === o.key) ? [...orphanStored.value, { ...o, text: '' }] : orphanStored.value
    return list.map((o) => {
      const title = o.q || '（找不到原本的題目）'
      return {
        key: o.key,
        kind: 'orphan' as const,
        slug: o.slug,
        title,
        meta: '原題目已修改',
        where: o.session?.chip ?? '不屬於任何場次',
        link: null,
        body: o.text,
        filled: !!o.text.trim(),
        setBody: o.set,
        search: { title: '', question: o.q },
        exportLabel: '題目已修改',
        quote: !!o.q,
        confirmRemove: { title: '刪除這則題目已修改？', description: `「${shorten(title)}」的筆記會被刪除，無法復原。` },
        remove: () => o.set(''),
      }
    })
  })

  // ---- 我的筆記：最近修改的在前；沒寫內容也列出 ----
  const mineCandidates = computed<NoteEntry[]>(() =>
    [...(myNotes.value ?? [])]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((note) => {
        const date = noteDateText(note.updatedAt)
        return {
          key: `m:${note.id}`,
          kind: 'mine' as const,
          slug: note.slug,
          title: note.title,
          meta: date,
          where: '',
          link: null,
          body: note.body,
          filled: true,
          setBody: (v: string) => update(note.id, { body: v }),
          search: { title: note.title, question: '' },
          exportLabel: `我的筆記・${date}`,
          quote: false,
          confirmRemove: { title: `刪除「${shorten(note.title || '未命名筆記')}」？`, description: '這則筆記會從這個瀏覽器刪除，無法復原。' },
          remove: () => remove(note.id),
          mine: note,
        }
      }),
  )

  const candidates = computed(() => [
    ...discussCandidates.value,
    ...reviewCandidates.value,
    ...orphanCandidates.value,
    ...mineCandidates.value,
  ])

  /** 有內容的筆記（不受編輯中影響，搜尋索引用這份） */
  const filled = computed(() => candidates.value.filter(e => e.filled))

  /** 畫面上的筆記：有內容的，加上正在編輯的那則 */
  const entries = computed(() => candidates.value.filter(e => e.filled || e.key === editing.value))

  return { entries, filled, addMine: add, updateMine: update }
}
