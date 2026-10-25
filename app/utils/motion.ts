// 程式驅動的進場動畫（WAAPI），給「補充資料」分頁的捲動動畫用（DESIGN.md 7.1）。
// 一律 fill: 'both'：有延遲時先套用起始狀態，才不會先露出完整內容再閃一下。
// 播完把起始狀態的 inline style 清掉、取消動畫，元素回到 CSS 原本的樣子。

export type StyleFrame = Partial<Record<'opacity' | 'transform' | 'filter' | 'clipPath' | 'backgroundSize', string>>

type Target = HTMLElement | SVGElement

/** 先把元素擺到起始狀態（捲到之前藏起來） */
export const setFrame = (el: Target, frame: StyleFrame) => {
  for (const [k, v] of Object.entries(frame)) (el.style as unknown as Record<string, string>)[k] = v
}

/** 從 from 播到 CSS 原本的樣子（to 省略時，from 的每個屬性都回到預設值） */
export const playFrom = (el: Target, from: StyleFrame, options: KeyframeAnimationOptions, to?: StyleFrame) => {
  const end: StyleFrame = to ?? Object.fromEntries(Object.keys(from).map(k => [k, REST[k as keyof StyleFrame]]))
  const anim = el.animate([from as Keyframe, end as Keyframe], { fill: 'both', ...options })
  anim.onfinish = () => {
    for (const k of Object.keys(from)) (el.style as unknown as Record<string, string>)[k] = ''
    anim.cancel()
  }
  return anim
}

/** 各屬性的「原本的樣子」 */
const REST: Required<StyleFrame> = {
  opacity: '1',
  transform: 'none',
  filter: 'none',
  clipPath: 'inset(0% 0% 0% 0%)',
  backgroundSize: '100% 100%',
}

/** 進場的緩動：快出慢停，不回彈 */
export const EASE_OUT = 'cubic-bezier(.22,1,.36,1)'
