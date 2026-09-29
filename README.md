# 悅讀聊天室

每週線上讀書會的會前導讀頁：影片章節（內嵌播放器，點時間直接跳段）、論證地圖、白紙回想、自我測驗、名詞卡與討論題。過去的場次可以依月份或主題瀏覽，概念卡把談過同一個概念的場次連在一起。

## 技術

Nuxt 4 + Nuxt Content 3 + Nuxt UI 4 + Tailwind CSS 4 + VueUse + TypeScript。用 `npm run generate` 輸出純靜態網站，部署到 GitHub Pages。

內容用 Nuxt Content 3 管理，全部放在 `content/`，不用改程式。

## 編輯內容

| 要做的事 | 檔案 |
|---|---|
| 新增一場 | `content/sessions/{年}/{月-日}-{主題}.yml`，例如 `content/sessions/2026/10-04-靈魂.yml`。放進去就會出現在全部場次，日期最新的會成為首頁 |
| 新增概念卡 | `content/concepts/{id}.md`，id 用英文小寫加連字號（例如 `free-will`）。內文可以用 `[[概念名稱]]` 或 `[[名稱\|顯示文字]]` 連到其他卡 |
| 這場用到哪些概念卡 | 場次檔的 `concepts` 填概念卡 id |
| 推薦一起看的場次 | 場次檔的 `related` 填 `slug` 和一句 `reason` |
| 新增 tag | 先加到 `content/taxonomy.yml`，才能在場次或概念卡的 `tags` 使用 |

改完先跑 `npm run check`。它會找出 tag 不在詞彙表、概念卡不存在、`[[連結]]` 連不到、名稱重複、前提質疑／接受沒有剛好填一個等錯誤，並指出是哪個檔案。`npm run generate` 會自動先跑一次，有錯就不建置。

欄位說明和完整規則見 SPEC.md 第 7、8 節；概念卡怎麼寫見 DESIGN.md 8.1。

## 指令

```bash
npm install
npm run dev        # 本機開發 http://localhost:3000
npm run check      # 內容檢查
npm run typecheck  # 型別檢查
npm run generate   # 內容檢查通過後，輸出靜態網站到 .output/public
npm run preview    # 預覽輸出結果（或 npx serve .output/public）
```

## 文件

- [DESIGN.md](DESIGN.md)：設計系統（顏色、字級、元件目錄、實作規則）
- [SPEC.md](SPEC.md)：功能規格（網址、概念卡與關聯、分頁功能、資料結構、內容檢查、瀏覽器儲存、每週更新流程）

舊的單一檔案版本保留在 `legacy/index.html`，不再更新。

> repo 名稱、網址前綴 `/sunday-salon/` 與 localStorage key `salon-*` 沿用舊名「週日沙龍」，原因見 SPEC.md 1.1。
