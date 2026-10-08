// 建置後檢查（npm run generate 之後執行）：
// 1. 每一場、每張概念卡都有產生頁面和資料檔。頁面是靠連結爬出來的，漏掉時建置不會報錯。
// 2. 每一頁的 payload 不能太大。以前每一頁都塞進全部場次，總大小隨場次數的平方成長；這裡擋住退回去的情況。
// 規格見 SPEC.md「資料載入」。
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const OUT = join(ROOT, '.output', 'public')

/** 一般頁面的 payload 上限。/notes、/review 要帶全部題目，另外給比較寬的上限 */
const PAYLOAD_LIMIT = 150 * 1024
const STUDY_PAYLOAD_LIMIT = 1024 * 1024
const STUDY_PAGES = new Set(['notes', 'review'])

const errors = []

if (!existsSync(OUT)) {
  console.error('找不到 .output/public，請先執行 npm run generate')
  process.exit(1)
}

const sessionDir = join(ROOT, 'content', 'sessions')
const slugs = readdirSync(sessionDir, { recursive: true, encoding: 'utf8' })
  .filter(f => f.endsWith('.yml'))
  .map(f => readFileSync(join(sessionDir, f), 'utf8').match(/^slug:\s*['"]?([\w-]+)/m)?.[1])
  .filter(Boolean)
const ids = readdirSync(join(ROOT, 'content', 'concepts')).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3))

const mustExist = [
  'index.html',
  'data/sessions.json',
  'data/study.json',
  'data/search.json',
  'data/concepts.json',
  ...slugs.flatMap(s => [`s/${s}/index.html`, `data/sessions/${s}.json`]),
  ...ids.flatMap(id => [`c/${id}/index.html`, `data/concepts/${id}.json`]),
]
for (const f of mustExist) {
  if (!existsSync(join(OUT, f))) errors.push(`缺少 ${f}`)
}

/** 所有 _payload.json */
const payloads = readdirSync(OUT, { recursive: true, encoding: 'utf8' }).filter(f => f.endsWith('_payload.json'))
let largest = { file: '', size: 0 }
for (const f of payloads) {
  const size = statSync(join(OUT, f)).size
  const page = f.split('/')[0]
  const limit = STUDY_PAGES.has(page) ? STUDY_PAYLOAD_LIMIT : PAYLOAD_LIMIT
  if (size > limit) errors.push(`${f} 有 ${(size / 1024).toFixed(0)}KB，超過上限 ${(limit / 1024).toFixed(0)}KB`)
  if (size > largest.size && !STUDY_PAGES.has(page)) largest = { file: f, size }
}

if (errors.length) {
  console.error(`建置輸出檢查失敗（${errors.length} 個問題）：`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`建置輸出檢查通過：${slugs.length} 場、${ids.length} 張概念卡、${payloads.length} 個 payload；一般頁面最大 ${relative('.', largest.file)} ${(largest.size / 1024).toFixed(0)}KB`)
