// 單元測試（npm test）。只測 app/utils 裡的純邏輯，不啟動 Nuxt；
// util 檔要自己 import 用到的函式（不能靠 Nuxt auto-import），型別 import 不受影響。
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
