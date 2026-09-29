// 內容檢查：跨檔案的規則，schema 檢查不到的部分。`npm run check`，`npm run generate` 前也會自動執行。
// 有任何錯誤就以 exit code 1 結束，建置會中止。規則見 SPEC.md「資料結構」。
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { WIKILINK, buildNameMap, readConcepts } from '../lib/wikilinks.ts'

const root = process.cwd()
const errors = []
const err = (file, msg) => errors.push(`${path.relative(root, file)}：${msg}`)

const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])

// 詞彙表
const taxonomyFile = path.join(root, 'content/taxonomy.yml')
const taxonomy = YAML.parse(fs.readFileSync(taxonomyFile, 'utf8'))
const allTags = new Set(taxonomy.facets.flatMap(f => f.tags))
const domainTags = new Set(taxonomy.facets.find(f => f.key === 'domain')?.tags ?? [])

// 概念卡
const concepts = readConcepts(root)
const conceptIds = new Set(concepts.map(c => c.id))
const names = buildNameMap(concepts)
const seenNames = new Map()
for (const c of concepts) {
  const file = path.join(root, 'content/concepts', `${c.id}.md`)
  const src = fs.readFileSync(file, 'utf8')
  const fm = YAML.parse(src.split('---\n')[1] ?? '') ?? {}
  if (!fm.title) err(file, '缺少 title')
  if (!fm.summary) err(file, '缺少 summary')
  for (const n of [fm.title, ...(fm.aliases ?? [])]) {
    if (seenNames.has(n)) err(file, `名稱「${n}」和 ${seenNames.get(n)} 重複，[[連結]] 會無法判斷`)
    seenNames.set(n, c.id)
  }
  for (const t of fm.tags ?? []) if (!allTags.has(t)) err(file, `tag「${t}」不在 taxonomy.yml`)
  if (!(fm.tags ?? []).some(t => domainTags.has(t))) err(file, '至少要有一個「領域」tag（卡片牆依領域分組）')
  for (const r of fm.related ?? []) if (!conceptIds.has(r)) err(file, `related 的概念卡「${r}」不存在`)
  for (const [, name] of src.matchAll(WIKILINK)) if (!names.has(name.trim())) err(file, `[[${name}]] 找不到對應的概念卡`)
}

// 場次
const sessionFiles = walk(path.join(root, 'content/sessions')).filter(f => f.endsWith('.yml'))
const sessions = sessionFiles.map(file => ({ file, data: YAML.parse(fs.readFileSync(file, 'utf8')) }))
const slugs = new Set()
for (const { file, data: s } of sessions) {
  if (slugs.has(s.slug)) err(file, `slug「${s.slug}」重複`)
  slugs.add(s.slug)
  if (!String(file).includes(`/sessions/${String(s.date).slice(0, 4)}/`)) err(file, `檔案要放在 content/sessions/${String(s.date).slice(0, 4)}/`)
  for (const t of s.tags ?? []) if (!allTags.has(t)) err(file, `tag「${t}」不在 taxonomy.yml`)
  for (const c of s.concepts ?? []) if (!conceptIds.has(c)) err(file, `概念卡「${c}」不存在`)
  const videoIds = new Set((s.videos ?? []).map(v => v.id))
  const checkVid = (id, where) => { if (!videoIds.has(id)) err(file, `${where} 的影片「${id}」不在 videos 裡`) }
  for (const p of s.picks ?? []) checkVid(p[1], `picks「${p[4]}」`)
  for (const a of s.args ?? []) {
    checkVid(a.vid, `論證「${a.name}」`)
    a.prem.forEach((p, i) => {
      const hasObj = typeof p[1] === 'string'
      const hasAcc = typeof p[2] === 'string'
      if (hasObj === hasAcc) err(file, `論證「${a.name}」P${i + 1}：質疑與接受必須剛好填一個`)
    })
  }
  // 測驗與討論題：範圍是影片 id 或 'all'，參考段落的影片要存在
  const scopes = new Set([...videoIds, 'all'])
  const checkItem = (kind, item) => {
    if (!scopes.has(item.scope)) err(file, `${kind}「${item.q}」的 scope「${item.scope}」不是影片 id 也不是 all`)
    if (!item.refs?.length) err(file, `${kind}「${item.q}」至少要有一個參考段落`)
    for (const [vid] of item.refs ?? []) checkVid(vid, `${kind}「${item.q}」的參考段落`)
  }
  for (const q of s.quiz ?? []) {
    if (q.a >= q.o.length) err(file, `測驗「${q.q}」的正解索引超出選項數`)
    checkItem('測驗', q)
  }
  for (const d of s.discuss ?? []) {
    checkItem('討論題', d)
    if (!d.answer) err(file, `討論題「${d.q}」缺少 answer（Kagan 怎麼說）`)
  }
  // 每支影片和整合回顧都至少要有一題測驗、一題討論（邊看邊想依影片排列）
  for (const sc of scopes) {
    const label = sc === 'all' ? '整合回顧' : `影片 ${sc}`
    if (!(s.quiz ?? []).some(q => q.scope === sc)) err(file, `${label}沒有測驗題`)
    if (!(s.discuss ?? []).some(d => d.scope === sc)) err(file, `${label}沒有討論題`)
  }
}
for (const { file, data: s } of sessions) {
  for (const r of s.related ?? []) {
    if (r.slug === s.slug) err(file, 'related 不能連到自己')
    else if (!slugs.has(r.slug)) err(file, `related 的場次「${r.slug}」不存在`)
  }
}

if (errors.length) {
  console.error(`內容檢查失敗（${errors.length} 項）：\n` + errors.map(e => `  ✗ ${e}`).join('\n'))
  process.exit(1)
}
console.log(`內容檢查通過：${sessions.length} 場、${concepts.length} 張概念卡、${allTags.size} 個 tag`)
