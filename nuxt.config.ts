import { buildNameMap, readConcepts, replaceWikilinks } from './lib/wikilinks'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 要預先產生的資料端點（server/routes/data/）。頁面連結爬不到 JSON，所以列在這裡：
 * 每一場一個 /data/sessions/{slug}.json、每張概念卡一個 /data/concepts/{id}.json。
 */
const dataRoutes = (): string[] => {
  const root = join(process.cwd(), 'content')
  const slugs = readdirSync(join(root, 'sessions'), { recursive: true, encoding: 'utf8' })
    .filter(f => f.endsWith('.yml'))
    .map(f => readFileSync(join(root, 'sessions', f), 'utf8').match(/^slug:\s*['"]?([\w-]+)/m)?.[1])
    .filter((s): s is string => !!s)
  const ids = readdirSync(join(root, 'concepts')).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3))
  return [
    '/data/sessions.json',
    '/data/study.json',
    '/data/search.json',
    '/data/concepts.json',
    ...slugs.map(s => `/data/sessions/${s}.json`),
    ...ids.map(id => `/data/concepts/${encodeURIComponent(id)}.json`),
  ]
}

// 靜態輸出（nuxt generate）部署到 GitHub Pages。
// 專案網址前綴由環境變數 NUXT_APP_BASE_URL 決定（部署時為 /sunday-salon/），本機開發時為 /。
export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  modules: ['@nuxt/ui', '@nuxt/content', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },

  // 中文字型改用 Google Fonts CSS（有 unicode-range 分片），不讓 @nuxt/fonts 下載整套字檔
  ui: { fonts: false },

  // 暗色為預設，使用者仍可切換成淺色
  colorMode: { preference: 'dark', fallback: 'dark' },

  app: {
    // 換頁過場：舊頁淡出後新頁淡入上浮（main.css 的 .page-*）。out-in 讓新頁等舊頁離開才掛載，
    // 場次頁讀網址 hash（takeInitialLocation）和換頁後捲回頂部都在新頁掛載之後，不受影響
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      title: '悅讀聊天室',
      meta: [
        { name: 'description', content: '悅讀聊天室：每週線上讀書會的會前導讀、影片章節、論證地圖、概念卡與討論題。' },
      ],
      // Nuxt 路由初始化時會把網址換成預先產生頁面的路徑（hash 會被拿掉），
      // 所以在任何程式執行前先記下原始的 hash 與 query，由 takeInitialLocation()（composables/useContent.ts）讀取。
      script: [
        { innerHTML: 'window.__salonInitialHash=location.hash;window.__salonInitialSearch=location.search', tagPosition: 'head' },
      ],
      link: [
        // 網站 icon：夜空裡的金星（public/favicon.svg）。路徑要加上部署時的網址前綴
        { rel: 'icon', href: `${process.env.NUXT_APP_BASE_URL ?? '/'}favicon.ico`, sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: `${process.env.NUXT_APP_BASE_URL ?? '/'}favicon.svg` },
        { rel: 'apple-touch-icon', href: `${process.env.NUXT_APP_BASE_URL ?? '/'}apple-touch-icon.png` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;900&display=swap',
        },
      ],
    },
  },

  hooks: {
    // 概念卡內文的 [[概念名稱]] 在解析前轉成 /c/{id} 連結（規則見 lib/wikilinks.ts）
    'content:file:beforeParse'(ctx) {
      if (ctx.collection.name !== 'concepts') return
      ctx.file.body = replaceWikilinks(ctx.file.body, buildNameMap(readConcepts(process.cwd())))
    },
  },

  nitro: {
    preset: 'github_pages',
    // 場次與概念卡頁面由 /archive、/concepts 的連結爬出來；資料端點見 dataRoutes()
    prerender: { crawlLinks: true, routes: ['/', '/archive', '/concepts', ...dataRoutes()] },
  },
})
