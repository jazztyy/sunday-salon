import { sessions } from './app/data/sessions'

// 靜態輸出（nuxt generate）部署到 GitHub Pages。
// 專案網址前綴由環境變數 NUXT_APP_BASE_URL 決定（部署時為 /sunday-salon/），本機開發時為 /。
export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },

  // 中文字型改用 Google Fonts CSS（有 unicode-range 分片），不讓 @nuxt/fonts 下載整套字檔
  ui: { fonts: false },

  // 暗色為預設，使用者仍可切換成淺色
  colorMode: { preference: 'dark', fallback: 'dark' },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      title: '悅讀聊天室',
      meta: [
        { name: 'description', content: '悅讀聊天室：每週線上讀書會的會前導讀、影片章節、論證地圖、討論題與自我測驗。' },
      ],
      // Nuxt 路由初始化時會把網址換成預先產生頁面的路徑（hash 會被拿掉），
      // 所以在任何程式執行前先記下使用者開啟的分頁 hash，SessionView 掛載時讀取。
      script: [
        { innerHTML: 'window.__salonInitialHash=location.hash', tagPosition: 'head' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;900&display=swap',
        },
      ],
    },
  },

  nitro: {
    preset: 'github_pages',
    // 明確列出每一場的網址，不依賴爬連結
    prerender: { crawlLinks: true, routes: ['/', ...sessions.map(s => `/s/${s.id}`)] },
  },
})
