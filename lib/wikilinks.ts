// [[概念名稱]] / [[概念名稱|顯示文字]] → [顯示文字](/c/{id})
// 名稱可以是概念卡的 title 或 aliases。nuxt.config.ts（建置時轉換）和 scripts/check-content.mjs（檢查）共用這份規則。
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

export const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

export interface ConceptMeta { id: string, title: string, aliases: string[] }

export const readConcepts = (root: string): ConceptMeta[] => {
  const dir = path.join(root, 'content/concepts')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map((f) => {
    const src = fs.readFileSync(path.join(dir, f), 'utf8')
    const fm = YAML.parse(src.split('---\n')[1] ?? '') ?? {}
    return { id: f.replace(/\.md$/, ''), title: fm.title, aliases: fm.aliases ?? [] }
  })
}

/** 名稱 → 概念卡 id */
export const buildNameMap = (concepts: ConceptMeta[]): Map<string, string> => {
  const map = new Map<string, string>()
  for (const c of concepts) for (const name of [c.title, ...c.aliases]) map.set(name, c.id)
  return map
}

export const replaceWikilinks = (body: string, names: Map<string, string>): string =>
  body.replace(WIKILINK, (raw, name: string, label?: string) => {
    const id = names.get(name.trim())
    return id ? `[${(label ?? name).trim()}](/c/${id})` : raw
  })
