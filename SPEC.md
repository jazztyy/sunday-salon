# 悅讀聊天室 功能規格

> 版本 2.0 ・ 2026-09-29
>
> 這份文件描述網站**做什麼、怎麼運作、資料怎麼放**。視覺規範請看 [DESIGN.md](DESIGN.md)。
> 要改功能時，先在這份文件寫下變更並討論，確定後再改程式，最後更新文末的修改紀錄。

---

## 1. 目的與讀者

**目的**：每週日線上讀書會的會前導讀與會後回顧。讓參加者在活動前看完影片或文章、整理好想法，也讓沒參加的人事後能補上。

**讀者**：讀書會的參加者與旁聽者。大多數人沒有相關背景，會用手機或筆電觀看。

**成功的樣子**：參加者週日帶著自己的立場和問題來討論，而不是現場才第一次接觸內容。

### 1.1 名稱與技術識別

網站名稱是「**悅讀聊天室**」（2.0 以前叫「週日沙龍」）。畫面上、文件裡提到網站時都用新名稱。

下面這些技術識別**沿用舊名，不改**：

| 項目 | 值 | 不改的原因 |
|---|---|---|
| GitHub repo | `jazztyy/sunday-salon` | 改名會讓網址和既有連結失效 |
| 網址前綴 | `/sunday-salon/` | 跟著 repo 名稱 |
| localStorage key | `salon-*` | 改名會讓訪客已存的作答進度全部消失 |
| 元件名稱 | `Salon*`（例如 `<SalonHeader>`） | 純內部命名，改了沒有好處 |

分頁名稱「週日討論」維持不變（指的是活動日，不是網站名稱）。

---

## 2. 技術選擇

### 2.1 技術棧

| 項目 | 選擇 |
|---|---|
| 框架 | Nuxt 4（Vue 3，`<script setup lang="ts">`） |
| UI 元件 | Nuxt UI 4 |
| 樣式 | Tailwind CSS 4（token 定義在 `app/assets/css/main.css`） |
| 工具函式 | VueUse（`@vueuse/nuxt`） |
| 語言 | TypeScript |
| 外部資源 | Google Fonts（字型）、YouTube IFrame API（播放器） |

**這樣選的原因**：
1. 這是 Kai 平常主要使用的技術棧，維護起來最順手。
2. 功能變多後，單一 `index.html` 不好改。拆成元件後，每個分頁、每種互動各自一個檔案。
3. 場次資料有 TypeScript 型別，寫錯欄位（例如前提的質疑、接受都沒填）在編輯器裡就會報錯。

### 2.2 輸出與發佈

- 用 `nuxt generate` 輸出**純靜態檔案**到 `.output/public`，可以直接放上 GitHub Pages。
- 部署設定在 `nuxt.config.ts`：`nitro.preset: 'github_pages'`，網址前綴由環境變數 `NUXT_APP_BASE_URL` 決定（部署時是 `/sunday-salon/`，本機是 `/`）。
- **限制**：GitHub Pages 只放靜態檔案，網站上線後**沒有伺服器**，不能用 Nuxt 的 `server/api` 路由。需要「全體共享」的資料（例如全體立場統計、留言）時，要改用第三方服務。

### 2.3 發佈目標

| | GitHub Pages（主要） | claude.ai 網頁（舊版備份） |
|---|---|---|
| 網址 | `jazztyy.github.io/sunday-salon`（**目前未開啟**） | `claude.ai/artifact/3dy9oveq665PvQkckUJVNu`（私人） |
| 內容 | Nuxt 版本，持續更新 | v1 單一檔案版本（`legacy/index.html`），**凍結，不再更新** |
| 播放器 | 內嵌，點時間戳直接跳段 | 平台擋掉外部嵌入，時間戳改成開新分頁 |

### 2.4 專案結構

```
site/
├── app/
│   ├── app.vue                  # <UApp> + <NuxtPage>
│   ├── app.config.ts            # Nuxt UI 色票對應（primary / secondary / …）
│   ├── assets/css/main.css      # 設計 token（見 DESIGN.md）
│   ├── pages/
│   │   ├── index.vue            # /     → 最新一場
│   │   └── s/[id].vue           # /s/w1 → 指定場次
│   ├── components/
│   │   ├── SessionView.vue      # 單一場次的頁面骨架
│   │   ├── VideoLink.vue        # 所有影片連結
│   │   ├── WhyNote.vue          # 學習法註記
│   │   ├── salon/Header.vue     # 頂部列
│   │   ├── video/               # Panel.vue、ChapterList.vue
│   │   ├── tab/                 # Before / During / Recall / Sunday / After
│   │   ├── argument/Card.vue    # 論證卡片
│   │   ├── recall/              # Timeline / Questions / Quiz / Terms
│   │   └── sunday/              # Vote / Discuss
│   ├── composables/
│   │   ├── usePlayer.ts         # 播放器共用狀態
│   │   └── useSalonStorage.ts   # 瀏覽器儲存
│   ├── data/sessions/
│   │   ├── index.ts             # 場次清單
│   │   └── w1.ts                # 每場一個檔案
│   └── types/session.ts         # 場次資料型別
├── legacy/index.html            # v1 單一檔案版本（凍結）
├── public/                      # 原樣複製的靜態檔案（favicon 等）
├── .github/workflows/deploy.yml # GitHub Pages 部署
├── nuxt.config.ts
├── DESIGN.md
└── SPEC.md
```

### 2.5 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 本機開發（`http://localhost:3000`） |
| `npm run generate` | 輸出靜態網站到 `.output/public` |
| `npm run preview` | 預覽輸出結果 |
| `npm run typecheck` | 檢查 TypeScript 型別（含場次資料） |

也可以用 `npx serve .output/public` 預覽輸出的靜態檔案。

---

## 3. 資訊架構

### 3.1 網址

| 網址 | 內容 |
|---|---|
| `/` | 最新一場（`sessions` 陣列的最後一筆） |
| `/s/{id}` | 指定場次，例如 `/s/w1`。找不到時顯示 404 |
| `…#before` 等 | 網址 hash 對應分頁：`#before`、`#during`、`#recall`、`#sunday`、`#after`。可以直接分享某個分頁的連結 |

- 沒有 hash 時，打開上次停留的分頁；第一次來的人從「看之前」開始。
- **實作注意**：靜態頁面初次載入時，Nuxt 路由會把網址換成預先產生頁面的路徑，hash 會在任何元件掛載前被拿掉。所以 `nuxt.config.ts` 在 `<head>` 放了一行腳本，先把 hash 存到 `window.__salonInitialHash`，`SessionView` 掛載時讀取一次。改動路由或分頁邏輯時不要拿掉它。
- 切換分頁時會捲回頁面頂部。

### 3.2 版面

```
頂部列：站名 ・ 場次 chip ・ 主題切換 ・（手機）影片章節按鈕
        分頁：1 看之前 ・ 2 邊看邊想 ・ 3 看完回想 ・ 4 週日討論 ・ 5 活動後

主內容（依分頁切換）              側欄（桌機固定顯示）
┌──────────────────────┐          ┌──────────────┐
│ 場次標頭（每個分頁都有）│          │ 播放器        │
│ 分頁內容              │          │ 目前章節      │
│ 下一步按鈕            │          │ 章節清單 ×3   │
│ 頁尾                  │          └──────────────┘
└──────────────────────┘
```

---

## 4. 各分頁功能

### 4.1 看之前（`before`，`<TabBefore>`）

| 區塊 | 內容 | 互動 |
|---|---|---|
| 導言 | 一段話說明本場主題 | — |
| 五分鐘看懂全貌 | 3–6 點重點 | — |
| 帶著這三個問題看 | 每支影片一題引導問題 | — |
| 時間不夠先看這幾段 | 精選片段（總長約一小時以內）＋字幕設定說明 | 點片段 → 播放器跳到該段 |
| 講者的立場 | 講者本人的觀點整理 | 收合 |

### 4.2 邊看邊想（`during`，`<TabDuring>`）— 論證地圖

每個論證一張可以收合的卡片（`<ArgumentCard>`），標題列顯示「已作答／未作答」。

**流程（預測試）**：
1. 使用者打開卡片，看到前提和結論，還看不到講者的判斷。
2. 使用者點選自己覺得最可疑的前提。
3. 揭曉：每個前提標上「質疑」（紅）或「接受」（綠）並附上理由，同時顯示「你選了 P2，Kagan 也質疑這一步」這類回饋，以及結論評語。
4. 可以按「重新猜」重來。

**退路**：「直接看答案」會跳過猜題直接揭曉，這時不顯示回饋。

**規則**：每個前提**只能有「質疑」或「接受」其中一種**判斷，不能兩個都沒有（否則揭曉後會有空白的前提）。型別 `Premise` 已經強制這條規則。

### 4.3 看完回想（`recall`，`<TabRecall>`）

| 區塊 | 元件 | 功能 |
|---|---|---|
| 複習節奏 | `<RecallTimeline>` | 四個時間點：看完當天 → 隔天 → 活動前 → 活動後一週 |
| 白紙回想 | `<RecallQuestions>` | 每支影片 3 題，先自己回答，再打開「對照重點」 |
| 自我測驗 | `<RecallQuiz>` | 單選題。作答後鎖定選項，顯示正解、解析和原片段連結。分數即時更新。「打亂順序，重新作答」會清空作答紀錄並重新排序題目 |
| 名詞卡 | `<RecallTerms>` | 點卡片翻面 → 自評「還不熟／記得」。可以篩選「只看還不熟的」，上方顯示各狀態張數 |

### 4.4 週日討論（`sunday`，`<TabSunday>`）

| 區塊 | 元件 | 功能 |
|---|---|---|
| 進行方式 | — | 同儕教學四步驟：先各自表態 → 看分布 → 和立場不同的人互相說服 → 再表態 |
| 立場題 | `<SundayVote>` | 每題有「討論前」「討論後」兩列選項。兩次選擇不同時，提示「你從 A 改成了 B，是哪個理由說動你的？」 |
| 討論題 | `<SundayDiscuss>` | 帶編號的問題清單，超出影片內容的題目標上「延伸」 |

> 立場題的選擇**只存在每個人自己的瀏覽器**，網站看不到全體的分布。現場的立場分布要用會議軟體的投票功能統計。

### 4.5 活動後（`after`，`<TabAfter>`）

目前是待補狀態。規劃中的內容：Podcast 連結（Spotify for Creators 或 YouTube）、錄音章節時間戳、討論回顧、精彩語錄。**格式待討論**（見第 9 節）。

---

## 5. 播放器規格

播放器狀態集中在 `usePlayer()`（`app/composables/usePlayer.ts`），所有元件共用同一份狀態。

| 項目 | 規格 |
|---|---|
| 載入 | `<VideoPanel>` 掛載後呼叫 `mount()`，動態插入 `https://www.youtube.com/iframe_api`。成功時 `embed` 變成 true |
| 預設影片 | 本場第一支影片，不自動播放 |
| 時間戳連結 | 一律用 `<VideoLink :vid :t>`。有播放器（`embed`）時攔截點擊，改成呼叫 `play()`；沒有播放器時照常開新分頁到 YouTube |
| 跳轉 | 同一支影片用 `seekTo`；不同影片用 `loadVideoById` 並從指定秒數開始。播放器還沒準備好時先記下來，準備好再跳 |
| 目前章節 | 每秒讀取一次播放時間寫進 `seconds`，章節清單據此標出目前章節，並顯示在播放器下方 |
| 手機 | 第一次點時間戳後 `playing` 變成 true，播放器固定在頂部。「收起影片」呼叫 `hide()`，暫停並隱藏播放器 |
| 字幕 | 會帶入 `cc_lang_pref=zh-Hant`，但 YouTube 的自動翻譯字幕仍需要使用者手動開啟（頁面上有說明） |

---

## 6. 資料結構

- 型別定義在 `app/types/session.ts`（`Session`、`Video`、`Argument`、`Premise`、`QuizItem`……）。
- **每場一個檔案**：`app/data/sessions/wN.ts`，export 一個 `Session`。
- 在 `app/data/sessions/index.ts` 的 `sessions` 陣列最後加上新場次，場次 chip 會自動出現，首頁會顯示最新一場。

```ts
export const w1: Session = {
  id: 'w1',                       // 唯一值，用在網址與 localStorage key，發佈後不可以改
  chip: '10/4 靈魂',              // 場次 chip 標籤：日期 + 兩個字的主題
  date: '2026 年 10 月 4 日（週日）',
  eyebrow: 'Session 01 · Yale PHIL 176 Death',  // 英文系列名稱
  title: '靈魂存在嗎？…',          // h1，用問句
  lede: '…',                      // 一段導言
  speaker: '…',
  captionTip: '…',                // 字幕設定說明
  picks: [[講座標籤, videoId, 秒數, '起–迄', '說明'], …],  // 時間不夠看的片段
  tldr: ['…'],                    // 3–6 點，可以用 <b>
  stance: [['面向', '講者立場'], …],
  videos: [{
    id, lec: '講座 5 · 48:02', short: '短標題', title: '完整標題',
    guide: '引導問題',
    chapters: [[秒數, '章節名稱'], …],        // 約 10–12 個
    recall: [['回想題', '對照重點'], …],      // 3 題
  }],
  args: [{
    name, kind: '論證類型', vid: videoId, t: 秒數, ts: '講座 5 · 17:17',
    prem: [['前提內容', '質疑理由' 或 null, '接受理由'（質疑為 null 時必填）], …],
    concl: '結論', verdict: '結論評語',
  }],
  votes: [{ q: '立場題', o: ['選項', …] }],   // 2–4 題，每題 2–4 個選項
  discuss: [['題目', '補充說明', 是否延伸], …],
  quiz: [{ q, o: ['選項'…], a: 正解索引, e: '解析', t: [videoId, 秒數] }],
  terms: [['詞條', 'English', '定義'], …],
  after: '活動後區塊的說明文字',
}
```

**資料規則**：
- 每個前提的「質疑」和「接受」必須剛好填一個（型別會檢查）。
- 所有秒數都要對照逐字稿確認，不可以估算。
- 講者的觀點要寫成「Kagan 認為……」，不可以寫成事實（見 DESIGN.md「文案規範」）。

---

## 7. 瀏覽器儲存（localStorage）

全部存在使用者自己的瀏覽器，不會上傳，也不跨裝置同步。key 和 v1 相同，舊訪客的進度會保留。

- 一律透過 `useSalonStorage(key, 預設值)` 讀寫（包裝 VueUse 的 `useLocalStorage`）。
- 使用 `initOnMounted`：預先產生的 HTML 一律用預設值，頁面掛載後才讀 localStorage，避免 hydration 不一致。
- 無痕模式或儲存被封鎖時，VueUse 會退回記憶體中的值，網站照常運作，只是不會記住狀態。

| Key | 內容 |
|---|---|
| `salon-session` | 上次查看的場次 id |
| `salon-tab` | 上次停留的分頁 |
| `salon-arg-{id}` | 論證卡片的猜題紀錄 `{卡片索引: 前提索引}`，`-1` 表示直接看答案 |
| `salon-quiz-{id}` | 測驗 `{order: [題目順序], ans: {題目索引: 選項索引}}` |
| `salon-cards-{id}` | 名詞卡自評 `{卡片索引: 'shaky' 或 'known'}` |
| `salon-vote-{id}` | 立場題 `{題目索引: {pre: 選項, post: 選項}}` |

> 修改資料結構時要考慮舊資料的相容性。例如 1.0 版測驗改成 `{order, ans}` 格式時，就有加上舊格式的判斷，避免舊訪客打開時出錯。

---

## 8. 每週更新流程

1. **取得來源**：用 `yt-dlp` 下載字幕並轉成帶時間戳的逐字稿，存到 `~/Documents/sunday-salon/`（逐字稿**不放進 repo**）。
2. **撰寫內容**：照第 6 節的資料結構，新增 `app/data/sessions/wN.ts`，並加到 `index.ts` 的 `sessions` 陣列最後。
3. **知識查核**：逐條檢查有沒有把觀點寫成事實、譯名會不會造成誤會、講者有沒有簡化原典、內容有沒有學界爭議，有的話就在頁面上註明。
4. **本機測試**：`npm run typecheck` 通過，再用 `npm run dev` 打開確認：
   - 每個時間戳都能跳到正確的段落
   - 每張論證卡片揭曉後，所有前提都有判斷
   - 暗色、淺色主題，390px 寬度沒有橫向捲軸
5. **發佈**：commit 並 push 到 GitHub。部署 workflow 啟用自動觸發後，push 到 `main` 就會自動更新網站；在那之前要到 GitHub Actions 手動執行（見第 9 節）。

---

## 9. 待決問題

| 問題 | 選項或備註 |
|---|---|
| 上線方式 | GitHub Pages 免費方案需要**公開 repo**。目前 repo 是私人、Pages 關閉。`.github/workflows/deploy.yml` 目前**只能手動觸發**（`workflow_dispatch`），等 Kai 確認後再開啟 push 到 `main` 自動部署 |
| 「活動後」的格式 | Podcast 連結＋章節時間戳＋回顧摘要＋語錄？回顧要多詳細？ |
| 全體立場統計 | 目前只能用會議軟體投票。網站沒有伺服器，要做到網站上需要第三方服務（表單或資料庫） |
| 事先收集問題 | 公開網站的訪客無法寫入資料。可以放 Google 表單連結 |
| favicon | 目前沒有，放進 `public/` 即可 |
| 場次多了之後 | 過去的場次要怎麼呈現？chip 列表會越來越長 |

---

## 修改紀錄

| 日期 | 版本 | 變更 |
|---|---|---|
| 2026-09-29 | 1.0 | 初版：五個分頁、論證地圖預測試、白紙回想、測驗、名詞卡自評、立場題、內嵌播放器 |
| 2026-09-29 | 2.0 | 改寫成 Nuxt 4 + Nuxt UI 4 + Tailwind CSS 4 + VueUse + TypeScript，用 `nuxt generate` 輸出靜態網站。每場一個網址 `/s/{id}`。資料改成 TypeScript 型別、每場一個檔案。v1 移到 `legacy/index.html` 凍結。新增 GitHub Pages 部署 workflow（目前只能手動觸發）。網站名稱從「週日沙龍」改為「悅讀聊天室」，repo、網址前綴、localStorage key、元件名稱沿用舊名 |
