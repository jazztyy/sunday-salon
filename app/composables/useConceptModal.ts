// 全站共用的概念卡彈窗狀態。app.vue 攔下站內所有 /c/{id} 連結的點擊，改成呼叫 open(id)，
// 這樣在任何頁面點概念卡都不會換頁（場次連結照常換頁）。規格見 SPEC.md「概念卡牆與概念卡頁」。
export const useConceptModal = () => {
  const id = useState<string | null>('concept-modal', () => null)
  const open = (conceptId: string) => { id.value = conceptId }
  const close = () => { id.value = null }
  return { id, open, close }
}
