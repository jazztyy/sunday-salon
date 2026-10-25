// 捲動到才播放的動畫（「補充資料」分頁，DESIGN.md 7.1）。
// 元素還在畫面下方（1.6 個螢幕高以內）時先 arm（擺到起始狀態），捲到畫面 85% 的高度時 run（播放）。
// 已經在畫面上、或在畫面上方的元素一律不動，才不會閃一下。prefers-reduced-motion 時什麼都不做，內容維持原樣。

type Target = HTMLElement | SVGElement

interface Watched {
  el: Target
  arm: (el: Target) => void
  run: (el: Target) => void
  /** 0：還沒處理；1：已經藏起來，等著播；2：播過了或不播 */
  state: 0 | 1 | 2
}

export const useScrollReveal = () => {
  const reduced = usePreferredReducedMotion()
  const items: Watched[] = []

  const check = () => {
    const h = window.innerHeight || document.documentElement.clientHeight
    const atBottom = window.scrollY + h >= document.documentElement.scrollHeight - 4
    for (const w of items) {
      if (w.state === 2) continue
      const r = w.el.getBoundingClientRect()
      if (w.state === 0) {
        if (r.top >= h && r.top < h * 1.6) {
          w.arm(w.el)
          w.state = 1
        }
        else if (r.top < h && r.bottom > 0) w.state = 2
        continue
      }
      // 頁面捲到底時，最後幾個元素可能永遠到不了 85%，看得到就播
      if (r.top < h * 0.85 || (r.top < h && atBottom)) {
        w.state = 2
        w.run(w.el)
      }
    }
  }

  let ticking = false
  const schedule = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      check()
    })
  }

  if (import.meta.client) {
    useEventListener(window, 'scroll', schedule, { passive: true })
    useEventListener(window, 'resize', schedule)
  }

  /** 登記一個元素。要在掛載之後呼叫（onMounted） */
  const reveal = (el: Target | null | undefined, arm: (el: Target) => void, run: (el: Target) => void) => {
    if (!el || reduced.value === 'reduce') return
    items.push({ el, arm, run, state: 0 })
    schedule()
  }

  /** 程式驅動的動畫（WAAPI、requestAnimationFrame）要不要播 */
  const motionOk = () => reduced.value !== 'reduce'

  return { reveal, motionOk }
}
