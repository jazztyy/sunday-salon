// 過場換掉內容時的焦點處理。只能在瀏覽器端呼叫（例如 <Transition> 的 @after-enter）。
//
// 按鈕跟著舊內容一起消失（「下一步」「下一題」「看選項」），焦點會掉到 <body>，鍵盤使用者得從頁首重新 Tab。
// 新內容出現後，焦點還在 <body> 才移到指定的元素；使用者已經點了別的地方就不動。

export const focusIfLost = (target: HTMLElement | null | undefined) => {
  const active = document.activeElement
  if (active && active !== document.body) return
  target?.focus({ preventScroll: true })
}
