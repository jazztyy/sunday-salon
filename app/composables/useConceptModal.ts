// 全站共用的概念卡彈窗狀態。app.vue 攔下站內所有 /c/{id} 連結的點擊，改成呼叫 open(id)，
// 這樣在任何頁面點概念卡都不會換頁（場次連結照常換頁）。規格見 SPEC.md「概念卡牆與概念卡頁」。
//
// sequence：彈窗裡「上一則／下一則」的閱讀順序。點的連結在 [data-concept-seq] 容器裡時（概念卡牆的一個領域、
// 場次的名詞卡），就是那個容器裡所有概念卡連結的順序；沒有容器時沿用目前的順序（例如在彈窗裡點相關概念），
// 不在目前順序裡就用全部概念卡的順序（<ConceptPager> 處理）。
export const useConceptModal = () => {
  const id = useState<string | null>('concept-modal', () => null)
  const sequence = useState<string[] | null>('concept-modal-seq', () => null)

  const open = (conceptId: string, seq?: string[] | null) => {
    if (seq?.includes(conceptId)) sequence.value = seq
    else if (!sequence.value?.includes(conceptId)) sequence.value = null
    id.value = conceptId
  }
  const close = () => {
    id.value = null
    sequence.value = null
  }
  return { id, sequence, open, close }
}
