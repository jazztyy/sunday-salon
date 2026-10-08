// 全站共用的確認彈窗（取代瀏覽器的 window.confirm）。<ConfirmDialog> 掛在 app.vue。
// 用法：if (await confirm({ title: '刪除這則筆記？', description: '刪除後無法復原。', confirmLabel: '刪除' })) { … }
// 按確認回傳 true；按取消、點外面、按 Esc 都回傳 false。規格見 DESIGN.md「確認彈窗」。

export interface ConfirmOptions {
  title: string
  description?: string
  /** 確認按鈕文字，預設「確定」 */
  confirmLabel?: string
  /** 取消按鈕文字，預設「取消」 */
  cancelLabel?: string
}

let resolver: ((ok: boolean) => void) | null = null

export const useConfirm = () => {
  const request = useState<ConfirmOptions | null>('confirm-dialog', () => null)

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    resolver?.(false) // 前一個還沒回答就被新的取代時，當作取消
    request.value = options
    return new Promise((resolve) => { resolver = resolve })
  }

  /** 由 <ConfirmDialog> 呼叫 */
  const answer = (ok: boolean) => {
    resolver?.(ok)
    resolver = null
    request.value = null
  }

  return { request, confirm, answer }
}
