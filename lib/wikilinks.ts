// [[概念名稱]] / [[概念名稱|顯示文字]] → [顯示文字](/c/{id})
// 名稱可以是概念卡的 title 或 aliases。nuxt.config.ts（建置時轉換）和 scripts/check-content.mjs（檢查）共用這份規則。
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

export const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

export interface ConceptMeta { id: string, title: string, aliases: string[] }

// 只認檔案開頭的第一段 frontmatter：開頭可以有 BOM，換行可以是 CRLF，內文裡的 --- 不影響
const FRONTMATTER = /^﻿?---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/

/** Markdown → frontmatter（YAML 物件，沒有或不是物件時為 {}）與內文 */
export const parseFrontmatter = (src: string): { data: Record<string, any>, body: string } => {
  const m = FRONTMATTER.exec(src)
  if (!m) return { data: {}, body: src }
  const data = YAML.parse(m[1] ?? '')
  return {
    data: data && typeof data === 'object' && !Array.isArray(data) ? data : {},
    body: src.slice(m[0].length),
  }
}

// 建置時每解析一張概念卡就會呼叫一次 readConcepts，所以依資料夾快取。
// 檔案清單或任何一個檔案的修改時間變了才重新讀（dev 模式改卡片也會更新）
const cache = new Map<string, { sig: string, concepts: ConceptMeta[] }>()

/** 讀取所有概念卡的名稱。回傳的陣列會被快取共用，不要修改它 */
export const readConcepts = (root: string): ConceptMeta[] => {
  const dir = path.join(root, 'content/concepts')
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  const sig = files.map(f => `${f}:${fs.statSync(path.join(dir, f)).mtimeMs}`).join('|')
  const hit = cache.get(dir)
  if (hit?.sig === sig) return hit.concepts
  const concepts = files.map((f) => {
    const { data: fm } = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'))
    return { id: f.replace(/\.md$/, ''), title: fm.title, aliases: fm.aliases ?? [] }
  })
  cache.set(dir, { sig, concepts })
  return concepts
}

// readConcepts 命中快取時回傳同一個陣列，名稱對照表也跟著重用
const nameMaps = new WeakMap<ConceptMeta[], Map<string, string>>()

/** 名稱 → 概念卡 id */
export const buildNameMap = (concepts: ConceptMeta[]): Map<string, string> => {
  const hit = nameMaps.get(concepts)
  if (hit) return hit
  const map = new Map<string, string>()
  for (const c of concepts) for (const name of [c.title, ...c.aliases]) map.set(name, c.id)
  nameMaps.set(concepts, map)
  return map
}

export const replaceWikilinks = (body: string, names: Map<string, string>): string =>
  body.replace(WIKILINK, (raw, name: string, label?: string) => {
    const id = names.get(name.trim())
    return id ? `[${(label ?? name).trim()}](/c/${id})` : raw
  })
