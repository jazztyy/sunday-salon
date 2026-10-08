// 在瀏覽器產生檔案並下載（Blob），不經過任何伺服器。只能在瀏覽器端呼叫（例如按鈕的 click）。

export const downloadText = (filename: string, text: string, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
