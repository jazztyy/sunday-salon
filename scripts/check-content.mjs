// 內容檢查：先用 lib/schema.ts 的 zod schema（嚴格模式，拼錯的欄位也會抓）逐檔驗證欄位，
// 再檢查 schema 檢查不到的跨檔案規則。`npm run check`，`npm run generate` 前也會自動執行。
// 有任何錯誤就以 exit code 1 結束，建置會中止。規則見 SPEC.md「資料結構」、「內容檢查」。
// 內容資料夾預設是 ./content，測試時可以用 CONTENT_DIR 指到別的地方。
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { WIKILINK, buildNameMap, parseFrontmatter, readConcepts } from '../lib/wikilinks.ts'
import { strictSchemas } from '../lib/schema.ts'

const root = process.cwd()
const contentDir = path.resolve(root, process.env.CONTENT_DIR ?? 'content')
// readConcepts 吃的是「content/ 的上一層」
const contentRoot = path.dirname(contentDir)
const errors = []
const err = (file, msg) => errors.push(`${path.relative(contentRoot, file)}：${msg}`)

const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])

// 題目文字 → 短雜湊（djb2，base36）。要和 app/utils/quizSignature.ts 的 textHash 完全一樣，
// 網站存作答與筆記用的 key 是 id ?? textHash(題目)
const textHash = (text) => {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

// zod 錯誤 → 中文訊息，前面標出欄位位置，例：quiz[2].refs[0][1]
const fieldPath = p => p.reduce((s, k) => typeof k === 'number' ? `${s}[${k}]` : s ? `${s}.${k}` : k, '')
const describe = (i) => {
  switch (i.code) {
    case 'unrecognized_keys': return `不認得的欄位${i.keys.map(k => `「${k}」`).join('、')}（拼錯了嗎？）`
    case 'invalid_type': return i.received === 'undefined' ? '缺少必填欄位' : `型別應該是 ${i.expected}，實際是 ${i.received}`
    case 'invalid_string': return i.validation === 'regex' ? '格式不符' : `格式不符（${i.validation}）`
    case 'too_small': return `至少要有 ${i.minimum} 個`
    case 'too_big': return `最多 ${i.maximum}`
    default: return i.message
  }
}
/** 用 schema 驗證，失敗就記錯誤並回傳 false */
const validate = (file, schema, data) => {
  const r = schema.safeParse(data)
  if (r.success) return true
  for (const i of r.error.issues) err(file, `${i.path.length ? `欄位 ${fieldPath(i.path)}：` : ''}${describe(i)}`)
  return false
}

// 詞彙表
const taxonomyFile = path.join(contentDir, 'taxonomy.yml')
const taxonomy = YAML.parse(fs.readFileSync(taxonomyFile, 'utf8'))
const taxonomyOk = validate(taxonomyFile, strictSchemas.taxonomy, taxonomy)
const facets = taxonomyOk ? taxonomy.facets : []
const allTags = new Set(facets.flatMap(f => f.tags))
const domainTags = new Set(facets.find(f => f.key === 'domain')?.tags ?? [])

// 概念卡
const concepts = readConcepts(contentRoot)
const conceptIds = new Set(concepts.map(c => c.id))
const names = buildNameMap(concepts)
const seenNames = new Map()
for (const c of concepts) {
  const file = path.join(contentDir, 'concepts', `${c.id}.md`)
  const { data: fm, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'))
  // 欄位不對時先修欄位，下面的規則都假設欄位型別正確
  if (!validate(file, strictSchemas.concept, fm)) continue
  if (!fm.title) err(file, '缺少 title')
  if (!fm.summary) err(file, '缺少 summary')
  for (const n of [fm.title, ...(fm.aliases ?? [])]) {
    if (seenNames.has(n)) err(file, `名稱「${n}」和 ${seenNames.get(n)} 重複，[[連結]] 會無法判斷`)
    seenNames.set(n, c.id)
  }
  for (const t of fm.tags ?? []) if (!allTags.has(t)) err(file, `tag「${t}」不在 taxonomy.yml`)
  if (!(fm.tags ?? []).some(t => domainTags.has(t))) err(file, '至少要有一個「領域」tag（卡片牆依領域分組）')
  for (const r of fm.related ?? []) {
    if (r === c.id) err(file, 'related 不能連到自己')
    else if (!conceptIds.has(r)) err(file, `related 的概念卡「${r}」不存在`)
  }
  for (const [, name] of body.matchAll(WIKILINK)) if (!names.has(name.trim())) err(file, `[[${name}]] 找不到對應的概念卡`)
}

// 場次
const sessionFiles = walk(path.join(contentDir, 'sessions')).filter(f => f.endsWith('.yml'))
const sessions = sessionFiles.map(file => ({ file, data: YAML.parse(fs.readFileSync(file, 'utf8')) }))
const slugs = new Set()
const valid = new Set()
for (const { file, data: s } of sessions) {
  // 欄位不對時先修欄位，下面的規則都假設欄位型別正確（slug 仍然登記，免得 related 跟著報錯）
  if (typeof s?.slug === 'string') {
    if (slugs.has(s.slug)) err(file, `slug「${s.slug}」重複`)
    slugs.add(s.slug)
  }
  if (!validate(file, strictSchemas.session, s)) continue
  valid.add(s)
  if (!/^[a-z0-9-]+$/.test(s.slug)) err(file, `slug「${s.slug}」只能用英文小寫、數字、連字號`)
  // 檔名：content/sessions/{年}/{月-日}-{主題}.yml，年和月-日都要和 date 一致
  const [year, month, day] = s.date.split('-')
  if (path.basename(path.dirname(file)) !== year) err(file, `檔案要放在 content/sessions/${year}/`)
  if (!path.basename(file).startsWith(`${month}-${day}-`)) err(file, `檔名要以 ${month}-${day}- 開頭（和 date ${s.date} 一致）`)
  for (const t of s.tags ?? []) if (!allTags.has(t)) err(file, `tag「${t}」不在 taxonomy.yml`)
  for (const c of s.concepts ?? []) if (!conceptIds.has(c)) err(file, `概念卡「${c}」不存在`)
  const durations = new Map((s.videos ?? []).map(v => [v.id, v.duration]))
  const videoIds = new Set(durations.keys())
  const lecOf = new Map((s.videos ?? []).map(v => [v.id, v.lec]))
  const checkVid = (id, where) => { if (!videoIds.has(id)) err(file, `${where} 的影片「${id}」不在 videos 裡`) }
  // 影片時間點：秒數要小於該影片的長度（影片 id 不存在時由 checkVid 報錯）
  const checkTime = (id, sec, where) => {
    const d = durations.get(id)
    if (d > 0 && sec >= d) err(file, `${where}的時間 ${sec} 秒超過「${lecOf.get(id)}」的長度 ${d} 秒`)
  }
  // 章節時間要嚴格遞增
  const checkIncreasing = (chapters, where) => {
    chapters.forEach(([t, label], i) => {
      if (i > 0 && t <= chapters[i - 1][0]) err(file, `${where}的章節「${label}」（${t} 秒）沒有晚於前一個章節（${chapters[i - 1][0]} 秒），章節時間要由小到大`)
    })
  }
  for (const v of s.videos ?? []) {
    if (!(v.duration > 0)) err(file, `影片「${v.lec}」缺少 duration（影片長度，秒）`)
    else for (const [t, label] of v.chapters) if (t >= v.duration) err(file, `影片「${v.lec}」的章節「${label}」（${t} 秒）超過影片長度 ${v.duration} 秒`)
    checkIncreasing(v.chapters, `影片「${v.lec}」`)
    if (/\d:\d/.test(v.lec)) err(file, `影片「${v.lec}」的 lec 只寫講座標籤，長度改填 duration`)
  }
  for (const p of s.picks ?? []) {
    checkVid(p[1], `picks「${p[4]}」`)
    checkTime(p[1], p[2], `picks「${p[4]}」`)
  }
  // 立場題：選項 2–4 個（SPEC 7.1）
  for (const v of s.votes ?? []) {
    if (v.o.length < 2 || v.o.length > 4) err(file, `立場題「${v.q}」有 ${v.o.length} 個選項，要 2–4 個`)
  }
  if (s.recap) {
    const rv = s.recap.votes ?? []
    if (rv.length && rv.length !== (s.votes ?? []).length) err(file, `recap.votes 要和 votes 一樣是 ${(s.votes ?? []).length} 題`)
    rv.forEach((r, i) => {
      const n = s.votes?.[i]?.o.length
      if (r.length !== n) err(file, `recap.votes 第 ${i + 1} 題的人數要對應 ${n} 個選項`)
    })
    checkIncreasing(s.recap.chapters ?? [], '錄音')
    const sessionConcepts = new Set(s.concepts ?? [])
    for (const c of s.recap.concepts ?? []) {
      if (!conceptIds.has(c)) err(file, `recap.concepts 的概念卡「${c}」不存在`)
      else if (!sessionConcepts.has(c)) err(file, `recap.concepts 的概念卡「${c}」也要列在這場的 concepts 裡`)
    }
  }
  for (const a of s.args ?? []) {
    checkVid(a.vid, `論證「${a.name}」`)
    checkTime(a.vid, a.t, `論證「${a.name}」`)
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
    for (const [vid, sec] of item.refs ?? []) {
      checkVid(vid, `${kind}「${item.q}」的參考段落`)
      checkTime(vid, sec, `${kind}「${item.q}」的參考段落`)
    }
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
  // 題目的儲存 key（id ?? 題目文字的雜湊）在同一類裡不可以重複，否則作答和筆記會混在一起
  const checkKeys = (kind, items, textOf) => {
    const seen = new Map()
    for (const item of items) {
      const text = textOf(item)
      const key = item.id ?? textHash(text)
      const label = item.id ? ` id「${item.id}」` : '題目文字'
      if (seen.has(key)) err(file, `${kind}「${text}」和「${seen.get(key)}」的${label}相同，儲存的 key 會重複，請改題目或補上不同的 id`)
      else seen.set(key, text)
    }
  }
  checkKeys('測驗', s.quiz ?? [], q => q.q)
  checkKeys('討論題', s.discuss ?? [], d => d.q)
  checkKeys('立場題', s.votes ?? [], v => v.q)
  checkKeys('論證', s.args ?? [], a => a.name)
}
for (const { file, data: s } of sessions) {
  if (!valid.has(s)) continue
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
