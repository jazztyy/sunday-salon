// Nuxt UI 主題對應。色票定義在 app/assets/css/main.css 的 @theme。
// 規範見 DESIGN.md「顏色」。
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'venus', // 金星金：位置與重點
      secondary: 'dusk', // 暮色藍：連結與方法
      success: 'emerald', // 接受、答對（實際色值在 main.css 覆寫）
      error: 'red', // 質疑、答錯（實際色值在 main.css 覆寫）
      neutral: 'mist',
    },
    // 概念卡內文（Markdown）的樣式：連結用暮色藍（連結與方法），段落間距配合卡片密度。規範見 DESIGN.md「顏色」。
    prose: {
      a: { base: 'text-secondary underline underline-offset-2 hover:text-highlighted transition-colors' },
      p: { base: 'my-3 leading-relaxed text-pretty text-toned' },
    },
    // 讓 tailwind-merge 認得自訂的字級與圓角 token。
    // 沒有這段的話，傳給 UButton/UBadge 的 text-small 會被當成顏色，預設的 text-sm 不會被取代。
    tv: {
      twMergeConfig: {
        extend: {
          theme: {
            text: ['label', 'meta', 'ui', 'small', 'body-sm', 'body', 'lead', 'title', 'h2', 'h1'],
            radius: ['tag', 'control', 'card', 'sheet'],
          },
        },
      },
    },
  },
})
