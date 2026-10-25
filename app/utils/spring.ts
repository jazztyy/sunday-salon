// 彈簧動畫：翻頁書的書頁角度（DESIGN.md 6.9）。逐格算出數值交給 onUpdate，不依賴動畫套件。
// 預設是過阻尼（damping > 2√(stiffness·mass)），不會衝過終點：書頁轉過頭會在 3D 裡跑到別的書頁後面。

export interface SpringConfig {
  stiffness: number
  damping: number
  mass: number
}

/** 翻頁用：約 0.8 秒停下，不回彈 */
export const PAGE_SPRING: SpringConfig = { stiffness: 120, damping: 24, mass: 1 }

/** 往前推進一步（半隱式歐拉法），回傳 [新位置, 新速度] */
export const springStep = (x: number, v: number, to: number, dt: number, c: SpringConfig): [number, number] => {
  const a = (-c.stiffness * (x - to) - c.damping * v) / c.mass
  const nv = v + a * dt
  return [x + nv * dt, nv]
}

/** 和終點夠近、也幾乎不動時就算停下 */
export const springSettled = (x: number, v: number, to: number) => Math.abs(x - to) < 0.01 && Math.abs(v) < 0.01

/**
 * 從 from 彈到 to，每一格呼叫 onUpdate（最後一格剛好是 to）。delay 是毫秒。回傳停止函式。
 * 每格再切成 1/240 秒的小步，掉幀時也算得穩
 */
export const animateSpring = (
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  { delay = 0, config = PAGE_SPRING }: { delay?: number, config?: SpringConfig } = {},
) => {
  let x = from
  let v = 0
  let last = 0
  let raf = 0
  const start = performance.now() + delay
  const tick = (now: number) => {
    if (now < start) {
      raf = requestAnimationFrame(tick)
      return
    }
    const dt = Math.min(0.064, last ? (now - last) / 1000 : 1 / 60)
    last = now
    const steps = Math.max(1, Math.ceil(dt * 240))
    for (let i = 0; i < steps; i++) [x, v] = springStep(x, v, to, dt / steps, config)
    const done = springSettled(x, v, to)
    onUpdate(done ? to : x)
    if (!done) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
