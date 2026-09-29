# 悅讀聊天室

每週線上讀書會的會前導讀頁：影片章節（內嵌播放器，點時間直接跳段）、論證地圖、白紙回想、自我測驗、名詞卡與討論題。

## 技術

Nuxt 4 + Nuxt UI 4 + Tailwind CSS 4 + VueUse + TypeScript。用 `nuxt generate` 輸出純靜態網站，部署到 GitHub Pages。

每場的內容在 `app/data/sessions/wN.ts`，新增一場就是加一個檔案，再登記到 `app/data/sessions/index.ts`。

## 指令

```bash
npm install
npm run dev        # 本機開發 http://localhost:3000
npm run typecheck  # 型別檢查
npm run generate   # 輸出靜態網站到 .output/public
npm run preview    # 預覽輸出結果（或 npx serve .output/public）
```

## 文件

- [DESIGN.md](DESIGN.md)：設計系統（顏色、字級、元件目錄、實作規則）
- [SPEC.md](SPEC.md)：功能規格（網址、分頁功能、資料結構、瀏覽器儲存、每週更新流程）

舊的單一檔案版本保留在 `legacy/index.html`，不再更新。

> repo 名稱、網址前綴 `/sunday-salon/` 與 localStorage key `salon-*` 沿用舊名「週日沙龍」，原因見 SPEC.md 1.1。
