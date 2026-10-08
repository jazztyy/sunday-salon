# 悅讀聊天室 功能規格

> 版本 3.11 ・ 2026-10-08
>
> 這份文件描述網站**做什麼、怎麼運作、資料怎麼放**。視覺規範請看 [DESIGN.md](DESIGN.md)。
> 要改功能時，先在這份文件寫下變更並討論，確定後再改程式，最後更新文末的修改紀錄。

---

## 1. 目的與讀者

**目的**：每週日線上讀書會的會前導讀與會後回顧。讓參加者在活動前看完影片或文章、整理好想法，也讓沒參加的人事後能補上。

**讀者**：讀書會的參加者與旁聽者。大多數人沒有相關背景，會用手機或筆電觀看。

**成功的樣子**：參加者週日帶著自己的立場和問題來討論，而不是現場才第一次接觸內容。場次累積之後，讀者可以從一個概念找到所有談過它的場次。

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
| 內容 | Nuxt Content 3（場次 YAML、概念卡 Markdown、詞彙表 YAML） |
| UI 元件 | Nuxt UI 4 |
| 樣式 | Tailwind CSS 4（token 定義在 `app/assets/css/main.css`） |
| 工具函式 | VueUse（`@vueuse/nuxt`） |
| 語言 | TypeScript |
| 建置用 | `better-sqlite3`（Nuxt Content 在建置時用 SQLite 存內容） |
| 外部資源 | Google Fonts（字型）、YouTube IFrame API（播放器） |

**這樣選的原因**：
1. 這是 Kai 平常主要使用的技術棧，維護起來最順手。
2. 功能變多後，單一 `index.html` 不好改。拆成元件後，每個分頁、每種互動各自一個檔案。
3. 內容和程式分開。寫一場只要新增一個 YAML 檔，寫一張概念卡只要新增一個 Markdown 檔，不用碰 TypeScript。
4. 內容有 schema（`content.config.ts`）和跨檔案檢查（`scripts/check-content.mjs`），寫錯欄位在建置前就會被擋下。

**瀏覽器端沒有資料庫**：所有頁面都是預先產生的。查詢在建置階段執行，結果存進每頁的 payload 和預先產生的 JSON 檔（見 2.6），瀏覽器只讀這兩種，不下載 SQLite，也不需要 WASM。`better-sqlite3` 只在 `npm install` 和建置時用到。**不要在瀏覽器端呼叫 `queryCollection`**：Nuxt Content 會在沒有任何提示的情況下下載約 1MB 的 SQLite wasm 和整份資料。

### 2.2 輸出與發佈

- 用 `npm run generate` 輸出**純靜態檔案**到 `.output/public`，可以直接放上 GitHub Pages。這個指令會先跑內容檢查，檢查失敗就不建置；建置完再跑建置輸出檢查（`scripts/check-output.mjs`）：每一場、每張概念卡都要有頁面和資料檔，一般頁面的 payload 不能超過 150KB（`/notes`、`/review` 是 1MB）。
- 部署設定在 `nuxt.config.ts`：`nitro.preset: 'github_pages'`，網址前綴由環境變數 `NUXT_APP_BASE_URL` 決定（部署時是 `/sunday-salon/`，本機是 `/`）。
- 預先產生的頁面從 `/`、`/archive`、`/concepts` 開始，順著連結爬出所有場次頁與概念卡頁（`crawlLinks`）。所以**每一場都要出現在 `/archive`，每一張概念卡都要出現在 `/concepts`**，否則不會被產生（建置輸出檢查會擋下）。資料端點（`/data/*.json`）爬不到，由 `nuxt.config.ts` 的 `dataRoutes()` 依內容檔列出。
- **限制**：GitHub Pages 只放靜態檔案，網站上線後**沒有伺服器**。`server/routes/data/` 的端點只在建置時執行一次，輸出成 JSON 檔；不能放需要即時運算或寫入的路由。需要「全體共享」的資料（例如全體立場統計、留言）時，要改用第三方服務（第 12 節）。

### 2.3 發佈目標

| | GitHub Pages（主要） | claude.ai 網頁（舊版備份） |
|---|---|---|
| 網址 | `jazztyy.github.io/sunday-salon`（**目前未開啟**） | `claude.ai/artifact/3dy9oveq665PvQkckUJVNu`（私人） |
| 內容 | Nuxt 版本，持續更新 | v1 單一檔案版本（`legacy/index.html`），**凍結，不再更新** |
| 播放器 | 內嵌，點時間戳直接跳段 | 平台擋掉外部嵌入，時間戳改成開新分頁 |

### 2.4 專案結構

```
site/
├── content/                         # 所有內容（見第 7 節）
│   ├── sessions/2026/10-04-靈魂.yml  # 每場一個檔案，依年份分資料夾
│   ├── concepts/soul.md             # 每張概念卡一個檔案，檔名就是 id
│   └── taxonomy.yml                 # tag 詞彙表
├── content.config.ts                # 內容集合設定（schema 從 lib/schema.ts 匯入）
├── lib/schema.ts                    # 內容 schema（zod）唯一來源：網站和內容檢查共用
├── lib/wikilinks.ts                 # [[概念名稱]] 轉連結的規則、frontmatter 解析（建置與檢查共用）
├── scripts/check-content.mjs        # 建置前的內容檢查（見第 8 節）
├── scripts/check-output.mjs         # 建置後的輸出檢查（頁面齊全、payload 大小）
├── server/routes/data/              # 建置時預先產生的 JSON 資料端點（見 2.6）
├── shared/utils/content.ts          # 內容 item → 各頁面資料形狀的轉換（資料端點用）
├── test/                            # vitest 單元測試（app/utils 的純邏輯）
├── app/
│   ├── app.vue                      # <UApp> + <NuxtPage>
│   ├── app.config.ts                # Nuxt UI 色票對應（primary / secondary / …）
│   ├── assets/css/main.css          # 設計 token（見 DESIGN.md）
│   ├── pages/
│   │   ├── index.vue                # /            → 本週場次
│   │   ├── s/[slug].vue             # /s/w1        → 指定場次
│   │   ├── archive.vue              # /archive     → 全部場次
│   │   ├── concepts/index.vue       # /concepts    → 概念卡牆
│   │   ├── review.vue               # /review      → 複習
│   │   ├── notes.vue                # /notes       → 筆記、作答紀錄
│   │   └── c/[id].vue               # /c/soul      → 單張概念卡
│   ├── components/
│   │   ├── SessionView.vue          # 單一場次的頁面骨架
│   │   ├── RelatedSessions.vue      # 延續討論
│   │   ├── VideoLink.vue            # 所有影片連結
│   │   ├── MarkdownEditor.vue       # 筆記編輯器（一律用 <LazyMarkdownEditor>）
│   │   ├── NoteField.vue            # 有框的筆記小卡（討論卡、作答紀錄）
│   │   ├── SessionGroupHeading.vue  # 依場次分組的標題（筆記、作答紀錄）
│   │   ├── filter/                  # Layout / Chips / Search / Summary / Status（列表頁的篩選欄）
│   │   ├── note/                    # Card / Answers / Sheet / SheetProp（筆記頁）
│   │   ├── WhyNote.vue              # 學習法註記
│   │   ├── salon/Header.vue         # 頂部列
│   │   ├── concept/Card.vue         # 概念卡（卡片牆、相關概念）
│   │   ├── video/                   # Panel.vue、ChapterList.vue
│   │   ├── tab/                     # Before / During / Recall / Sunday / After
│   │   ├── argument/Card.vue        # 論證卡片
│   │   ├── study/                   # VideoSection / QuizItem / DiscussCard（邊看邊想、週日討論共用）
│   │   ├── recall/                  # Timeline / Questions / Quiz / Terms
│   │   └── sunday/                  # Vote
│   ├── composables/
│   │   ├── useContent.ts            # 所有內容查詢的入口（見 2.6）、useToday、pickCurrentSession
│   │   ├── useRelatedSessions.ts    # 延續討論的計算
│   │   ├── usePlayer.ts             # 播放器共用狀態
│   │   ├── useSalonStorage.ts       # 瀏覽器儲存的底層（容量滿時提示）
│   │   ├── useProgress.ts           # 學習進度：useVotes、useArgPicks、useCardRates、useQuizAnswers
│   │   ├── useDiscussNotes.ts       # 討論題的「我的想法」筆記
│   │   ├── useReview.ts             # 複習筆記、複習作答紀錄
│   │   ├── useMyNotes.ts            # /notes 自己新增的筆記
│   │   ├── useQuizRecords.ts        # 作答紀錄：測驗題在邊看邊想、看完回想、複習的作答
│   │   ├── useNoteEntries.ts        # /notes：各種筆記整理成統一的 NoteEntry
│   │   ├── useUrlFilters.ts         # 篩選條件和網址 query 的同步（/archive、/concepts）
│   │   ├── useConceptModal.ts       # 全站概念卡彈窗的狀態
│   │   └── useConfirm.ts            # 確認對話框
│   ├── utils/
│   │   ├── storageKeys.ts           # 所有 localStorage key（見第 9 節）
│   │   ├── quizSignature.ts         # 文字雜湊、題目 key（questionKey、answerKey）、舊格式的測驗簽章
│   │   ├── progressFormat.ts        # 學習進度新舊儲存格式的換算
│   │   ├── storedNote.ts            # 筆記的新舊儲存格式
│   │   ├── review.ts                # 複習出題、題目 key（quizKey、conceptKey）
│   │   ├── leitner.ts               # 間隔重複（box、到期日）
│   │   ├── noteKinds.ts             # 筆記種類（名稱、徽章顏色）
│   │   ├── noteExport.ts            # 筆記匯出（Markdown／純文字）
│   │   ├── download.ts              # 在瀏覽器下載文字檔
│   │   └── videoRef.ts              # 影片段落與長度的顯示文字（mmss、lecOf、refLabel、scopeLabel…）
│   └── types/
│       ├── session.ts               # 元件用的型別（和 lib/schema.ts 對不上時 typecheck 會失敗）
│       └── content.ts               # 各頁面實際載入的資料形狀（精簡場次、題目資料、概念卡列表）
├── legacy/index.html                # v1 單一檔案版本（凍結）
├── public/                          # 原樣複製的靜態檔案（favicon 等）
├── .github/workflows/ci.yml         # push、PR 時跑檢查、型別、測試、建置
├── .github/workflows/deploy.yml     # GitHub Pages 部署（手動觸發）
├── .nvmrc                           # Node 版本（22.20.0；檢查腳本直接載入 .ts，要 22.18 以上）
├── nuxt.config.ts
├── DESIGN.md
└── SPEC.md
```

### 2.5 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 本機開發（`http://localhost:3000`） |
| `npm run check` | 內容檢查（見第 8 節） |
| `npm run generate` | 先跑 `check`，通過後輸出靜態網站到 `.output/public`，再跑建置輸出檢查 |
| `npm run check:output` | 只跑建置輸出檢查（要先 generate） |
| `npm run preview` | 預覽輸出結果 |
| `npm run typecheck` | 檢查 TypeScript 型別 |
| `npm test` | 單元測試（vitest，只測 `app/utils` 的純邏輯，不啟動 Nuxt）。`app/utils` 的檔案要明確 import 用到的函式，不能靠 auto-import |

內容檢查可以用環境變數 `CONTENT_DIR` 指定別的內容資料夾（測試規則用）。

也可以用 `npx serve .output/public` 預覽輸出的靜態檔案。

### 2.6 資料載入

完整的一場資料很大（每場約 30KB），以前每一頁都把全部場次和全部概念卡塞進 payload，總輸出量隨場次數的平方成長，大約 60–100 場就會超過 GitHub Pages 1GB 的上限。3.10 起每一頁只載入用得到的形狀（`app/types/content.ts`）：

| 形狀 | 端點（建置時產生） | composable | 用在 |
|---|---|---|---|
| 精簡場次列表（標題、日期、tag、概念卡、影片的 id／講座） | `/data/sessions.json` | `useSessionIndex()` | 首頁挑場次、`/archive`、`/concepts`、概念卡「出現在」、延續討論 |
| `/archive` 搜尋文字（影片、章節、論證名稱） | `/data/search.json` | `useSessionSearch()` | 只有 `/archive` |
| 筆記、複習用的題目（quiz 全部、discuss 的題目） | `/data/study.json` | `useStudySessions()` | `/notes`、`/review` |
| 單一場次（完整） | `/data/sessions/{slug}.json` | `useSession(slug)`、`useCurrentSession(index)` | 場次頁、首頁 |
| 概念卡列表（不含內文；`links` 是內文連到的卡，建置時算好） | `/data/concepts.json` | `useConceptIndex()` | 名詞卡、概念卡牆、彈窗、相關概念 |
| 單張概念卡（含內文） | `/data/concepts/{id}.json` | `useConcept(id)` | `/c/{id}`、概念卡彈窗 |

- 所有 composable 都是 `useAsyncData` 加 `$fetch` 那個 JSON。預先產生頁面時結果存進該頁的 payload；瀏覽器端碰到 payload 沒有的資料（例如在任何頁面打開概念卡彈窗、首頁換了本週那一場）才去抓 JSON。
- 首頁：預先產生時內嵌建置當天挑到的那一場；掛載後用瀏覽器的今天重挑，挑到別場就抓那一場的 JSON。
- 概念卡彈窗（`<LazyConceptModal>`）只在打開時載入；文字編輯器一律用 `<LazyMarkdownEditor>`（TipTap 約 190KB gzip），不放進每一頁的首次載入。
- 新增頁面要用內容時，先看上表有沒有合適的形狀；需要新形狀時在 `app/types/content.ts`、`shared/utils/content.ts`、`server/routes/data/` 各加一個，並加進 `nuxt.config.ts` 的 `dataRoutes()` 和 `scripts/check-output.mjs`。

---

## 3. 資訊架構

### 3.1 網址

| 網址 | 內容 |
|---|---|
| `/` | 本週場次：依台灣日期，`date` 在今天或之後最近的一場；全部都過了就顯示最後一場。在瀏覽器端挑選，不必每週重新建置 |
| `/s/{slug}` | 指定場次，例如 `/s/w1`。找不到時顯示 404 |
| `…#before` 等 | 場次頁的網址 hash 對應分頁：`#before`、`#during`、`#recall`、`#sunday`、`#after`。可以直接分享某個分頁的連結 |
| `/archive` | 全部場次：搜尋、年份、月份、主題篩選，依月份分組的卡片網格 |
| `/archive?q=…&year=…&month=…&tag=…` | 篩選後的結果，可以分享 |
| `/concepts` | 概念卡牆，依「領域」分組；`?q=…` 是搜尋結果 |
| `/review` | 複習：從討論過的場次出選擇題（測驗題＋概念卡題），間隔重複排程，每題可以寫筆記 |
| `/notes` | 筆記：討論筆記、複習筆記和自己新增的筆記，依場次分組，可以搜尋；上方切到「作答紀錄」看每一場測驗題答過的結果 |
| `/c/{id}` | 單張概念卡，例如 `/c/soul`。找不到時顯示 404 |

- 場次頁沒有 hash 時，打開上次停留的分頁；第一次來的人從「看之前」開始。
- 場次標頭（標題、日期、講者、影片數與總長、tag）只在「看之前」顯示。切到其他分頁代表已經知道在哪一場，第一屏留給內容；頁面仍保留一個螢幕閱讀器才讀得到的 h1。
- 切換分頁時會捲回頁面頂部。
- 「看之前」不顯示右側的播放器與章節（還沒開始看影片），內容單欄置中；點了「時間不夠先看這幾段」的片段後才變回兩欄。
- 每個分頁底部有「下一步：{下一個分頁} →」。「邊看邊想」只在最後一段（整合回顧）顯示，其他段落用「下一段」按鈕，避免兩個往下走的按鈕同時出現。
- **實作注意**：靜態頁面初次載入時，Nuxt 路由會把網址換成預先產生頁面的路徑，**hash 和 query 都會在任何元件掛載前被拿掉**。所以 `nuxt.config.ts` 在 `<head>` 放了一行腳本，先把它們存到 `window.__salonInitialHash`、`window.__salonInitialSearch`。元件掛載時呼叫 `takeInitialLocation()`（`useContent.ts`）讀取一次，讀完就清掉。場次頁的分頁 hash 和 `/archive` 的 `?tag=` 都靠它。改動路由、分頁或篩選邏輯時不要拿掉它。
  - 另外，Nuxt 會在元件掛載**之後**再做一次網址修正（網址多了 query 或結尾的 `/` 時會改回產生時的路徑）。所以要把狀態**寫回網址**的頁面（例如 `/archive` 的 `?tag=`），必須等 `onNuxtReady()` 之後才寫，否則會被覆蓋。只改 hash 的場次頁不受影響。
  - 這套讀寫網址 query 的邏輯集中在 `composables/useUrlFilters.ts`（`/archive`、`/concepts` 共用）。新增可分享篩選的頁面時用它，不要自己再寫一份。

### 3.2 頂部列

- 左邊是站名，右邊是導覽：**本週**（`/`）・**全部場次**（`/archive`）・**概念卡**（`/concepts`），以及主題切換。
- 第二列的五個分頁**只在場次頁出現**（`/` 和 `/s/{slug}`）。其他頁面沒有分頁。
- 手機版的「影片章節」按鈕也只在場次頁出現。
- 2.0 的場次 chip 列已經移除，改由「全部場次」頁瀏覽過去的場次。

### 3.3 場次頁版面

```
頂部列：站名 ・ 本週／全部場次／概念卡 ・ 主題切換 ・（手機）影片章節按鈕
        分頁：1 看之前 ・ 2 邊看邊想 ・ 3 看完回想 ・ 4 週日討論 ・ 5 活動後

主內容（依分頁切換）              側欄（桌機固定顯示）
┌──────────────────────┐          ┌──────────────┐
│ 場次標頭（只在看之前）  │          │ 播放器        │
│ 分頁內容              │          │ 目前章節      │
│ 延續討論（看之前、活動後）│        │ 章節清單 ×3   │
│ 下一步按鈕            │          └──────────────┘
│                      │          （看之前不顯示，開始播放後才出現）
│ 頁尾                  │
└──────────────────────┘
```

### 3.4 全部場次（`/archive`）

| 區塊 | 內容 |
|---|---|
| 篩選欄 | 桌機（`lg` 以上）固定在左邊，往下捲也看得到；手機放在上方。最上面是**搜尋框**：模糊比對（Fuse.js，`threshold: 0.35`），範圍是標題、chip、tag、影片標題與引導問題、論證名稱、章節名稱、導言，打錯字或只打片段也找得到；只輸入講座編號（`12` 或 `講座 12`）時改成精準比對。接著是**年份**、**月份**（單選，可選「全部」；月份只列選定年份裡有場次的月份），再來是依面向（領域／人物／系列）分組的 tag（可以多選，結果是**同時符合所有選取 tag** 的場次，AND）。條件寫進網址 `?q=…&year=2026&month=10&tag=…`，可以分享 |
| 篩選欄的整理（3.11，全部列表頁共用） | **已選摘要**：搜尋框下面列出目前選的條件（年份、月份、tag、場次…），點 ✕ 取消一個，右邊「清除篩選」全部清掉；沒有條件時不顯示。**選項多時收起**：tag 每個面向先顯示用得最多的 8 個（chip 上顯示筆數，例「形上學 5」），場次先顯示最近 6 場，其他收在「顯示全部（N）」／「更早的場次（N）」；已選的一定顯示，只多出 1–2 個時不收。**不顯示結果數**（Kai 決定：側欄不需要「共 N 場」），數字只給螢幕閱讀器念 |
| 場次列表 | 依 `date` 分到各月份，新的在前，月份標題旁顯示場數。每月是卡片網格（手機 1 欄、`sm` 2 欄、`xl` 3 欄）。卡片：短日期、講座範圍、標題、最多 3 個 tag（其餘顯示 +N），整張可點。本週那一場（同首頁的判斷）加金色框線和「本週」標記 |

- 從場次頁或概念卡上的 tag 點進來（`/archive?tag=…`）時，會直接打開「依主題」並選好那個 tag。

### 3.5 概念卡牆（`/concepts`）與概念卡彈窗

- 版面和 `/archive` 一致：左邊固定的篩選欄，依序是搜尋框（Fuse.js 模糊比對詞條、英文、別名、定義與 tag，`threshold: 0.35`）、詞彙表各面向的 tag（多選，結果要全部符合）、**場次**（單選，只看那一場用到的卡），搜尋框下面是「已選」摘要和「清除篩選」（見 3.4）。條件同步到網址 `?q=…&tag=…&s=…`。
- 右邊依 tag 的「領域」分組，**每組是一列橫向滑動的卡片**（`<ConceptRow>`，`UCarousel`），不會無限往下長。箭頭在每組標題右側（手機可以直接左右滑），一次捲動一整頁的卡片。有搜尋字時不分組，改成依相關程度排列的「搜尋結果」一列。
- 卡片（`<ConceptCard>`）顯示詞條、英文、一句話定義（`summary`）、tag。**不顯示出現過幾場**，那個資訊只放在詳情。
- **點卡片開彈窗，不換頁**：`app.vue` 在 capture 階段攔下站內所有 `/c/{id}` 連結的點擊，改成打開全站共用的 `<ConceptModal>`（`useConceptModal`）。所以概念卡牆、場次裡的名詞卡、複習頁的「看概念卡」、概念卡內文的 `[[連結]]`、相關概念，點了都是開彈窗；在彈窗裡點別的概念卡會直接換內容。用 Cmd/Ctrl/中鍵點仍然照常開新分頁。彈窗裡點場次或 tag 會換頁，換頁時彈窗自動關閉。
- 直接打開 `/c/{id}` 網址（例如分享出去的連結）仍然是完整頁面。頁面和彈窗共用 `<ConceptDetail>`，區塊由上到下（「我的筆記」在內文和「出現在這些場次」之間）：

| 區塊 | 內容 |
|---|---|
| 左欄・標頭 | 「概念卡」小字、**詞條（`text-h1`，和頁面主標題一樣大）**、英文、別名、tag |
| 左欄・內文 | Markdown 內文，`[[概念名稱]]` 已轉成連到其他概念卡的連結 |
| 左欄・出現在這些場次 | 精簡列表，一行一場：場次 chip（`font-mono text-primary`）＋標題，點了進入場次頁。反向連結：`concepts` 裡有這張卡的所有場次，新的在前 |
| 左欄・相關概念 | 小標籤（圓角外框、只有詞條，滑過顯示定義），點了換成那張卡 |
| 右欄・我的筆記 | 寬螢幕（`lg`）固定在右側 340px，手機排在下面。Markdown 編輯器（`<MarkdownEditor>`），存在 `salon-review-notes` 的 `c:{id}`，和 `/review` 這張卡的概念卡題**共用同一則**，也會出現在 `/notes` 的「概念筆記」 |

- 彈窗寬度 `sm:max-w-5xl`，打開時不自動聚焦（避免關閉按鈕一打開就出現焦點框）。
- **`<MarkdownEditor>`**（`components/MarkdownEditor.vue`）：Nuxt UI 的 `UEditor`（TipTap），`content-type="markdown"`，讀寫都是 Markdown 字串，和筆記匯出的格式一致。工具列：標題（H2、H3）、粗體、斜體、刪除線、行內程式碼、項目清單、編號清單、引用、復原、重做；也可以直接打 `## `、`**…**`、`- ` 等語法。只在瀏覽器渲染（`ClientOnly`）。概念卡彈窗、`/notes` 的編輯彈窗、`/review` 的筆記、場次頁討論題的「我的想法」（3.9 起）都用它。

### 3.6 複習（`/review`）

頂部導覽的第四項（在「筆記」前面）。學習流程依據 `~/Desktop/pdf-parser/.claude/skills/study`（整合 11 本學習科學書籍的 skill）：主動提取、間隔重複（1/2/4/7/15/30 天）、交錯練習、連續再學習、費曼技巧、精熟學習。

- **題目來源**（`utils/review.ts` 的 `buildReviewQuestions`）：
  - **測驗題**：所選場次的 `quiz`，key 是 `q:{slug}:{題目雜湊}`。
  - **概念卡題**：所選場次 `concepts` 裡的每張卡出一題：「『{summary}』這是哪個概念？」，選項是正確詞條＋3 個干擾項（優先挑同領域的卡），開始一輪時才隨機產生。key 是 `c:{概念卡 id}`。每張卡只出一次，算在最早用到它的場次。
- **版面**和 `/archive` 一致：左邊固定的設定欄，右邊做題。設定欄依序是：
  - **出題方式**：今天該複習的（預設；沒做過的＋到期的）／上次答錯的／全部，附題數。
  - **範圍**：場次 chip，可多選。預設是已經討論過的場次（`date` 在台灣時間今天或之前；一場都還沒有時選本週那一場）。
  - **題型**：測驗題、概念卡，可多選。**題數**：10／20／全部。
  - **先回想再看選項**（開關，預設開）。
  - 可以出的題數和「開始複習」（進行中變成「重新抽題」）。
- **一題的流程**：
  1. 先回想：只顯示題目，按「我想好了，看選項」才出現選項（提取練習，附學習法註記）。
  2. 作答：用 `<StudyQuizItem>`，作答後鎖定，顯示對錯、解析、影片段落；概念卡題另有「看概念卡」。
  3. 答對時問「有把握／猜的」（預設有把握）。旁邊顯示「下次複習：明天／N 天後」。
  4. 筆記：「寫筆記」打開文字框，提示是費曼技巧（用最簡單的話向沒看過影片的朋友解釋）。已經有筆記的題目直接顯示。
  5. 「下一題」時才把結果寫進作答紀錄，所以可以先改「有把握／猜的」。
- **間隔重複**（`useReviewLog`，簡化的 Leitner；公式在 `utils/leitner.ts` 的 `nextBox`、`nextLogEntry`，作答時和畫面上的「下次複習」共用）：每題有熟練程度 `box`（0–5）。有把握答對 +1；猜對不變；答錯回到 0。下次到期日 = 今天 + `[1, 2, 4, 7, 15, 30][box]` 天（台灣日期）。
- **結果頁**：答對幾題；低於 8 成時建議先「只練答錯的」（精熟學習）；顯示做過的題目裡明天到期幾題；按鈕「只練答錯的」（立刻用答錯的題目再來一輪，連續再學習）和「再抽一輪」；下面列出答錯的題目和正解。
- 一輪的題目順序、作答只在這次瀏覽有效；作答紀錄和筆記存在瀏覽器。

### 3.7 筆記（`/notes`）

- 頂部導覽的最後一項。把這個瀏覽器裡的四種筆記集中在一頁：
  - **討論筆記**：各場討論題的「我的想法」（`salon-notes-{slug}`），在「邊看邊想」或「週日討論」寫的都會出現。卡片標題是題目，小字是講座標籤（或「整合回顧」），內容是筆記。編輯視窗裡可以修改，另有「回到題目，看 Kagan 怎麼說 ›」連到 `/s/{slug}#sunday`。清空內容等於刪除，和在討論卡片上清空一樣。
  - **複習筆記**：在 `/review` 做**測驗題**時寫的筆記（`salon-review-notes`，key 是題目的 key），算在它的場次。卡片標題是題目，小字是講座標籤或「整合回顧」，徽章用 `secondary`。編輯視窗裡有連到那一場「看完回想」的連結。
  - **概念筆記**：概念卡彈窗裡寫的筆記，也就是 `/review` 概念卡題的筆記（同一個 key `c:{id}`），算在第一次用到那張卡的場次。卡片標題是詞條，小字是「概念卡」。編輯視窗裡有「看概念卡 ›」（開概念卡彈窗）。題目文字改掉後，舊筆記對不到題目，不再顯示。
  - **題目已修改**：筆記的 key 是題目文字的雜湊，題目文字改掉（或概念卡不再被任何場次使用）後就對不到，原處不再顯示。這些筆記集中列成這一種，不會默默消失：標題是存筆記時記下的題目（3.9 以前的筆記沒記，顯示「（找不到原本的題目）」），小字是「原題目已修改」，算在原本的場次（概念卡的算「其他」）。編輯視窗有一段說明，可以把內容搬到新題目或我的筆記；清空或刪除就從瀏覽器刪掉。種類篩選只在有這種筆記時出現。
  - **我的筆記**：按「新增筆記」自己寫（`salon-mynotes`），有標題、內容、屬於哪一場（預設是本週那一場，可以選「不屬於任何場次」），可以編輯、刪除（刪除前確認）。
- **版面和 `/archive` 一致**：左邊是固定不動的篩選欄（`lg` 以上；手機放在上方），依序是「新增筆記」、搜尋框、**種類**（全部／討論筆記／複習筆記／概念筆記／我的筆記，附數量）、**場次**（全部、有筆記的場次 chip、「其他」），搜尋框下面是「已選」摘要和「清除篩選」（見 3.4）。右邊是 `<NoteCard>`（`components/note/Card.vue`）網格，外觀同場次卡：第一行是講座標籤或修改日期（`text-primary`）和種類徽章（討論筆記 `neutral`／我的筆記 `primary`），接著是標題（最多兩行）和內容（最多三行）。篩選條件不寫進網址（筆記是私人的，沒有分享的需要）。整張卡是按鈕，點了打開編輯視窗（`UModal`），樣式仿 Heptabase 卡片：上方是種類徽章、「自動儲存・只存在這個瀏覽器」和關閉圖示（**刪除不放在彈窗裡**，在外層卡片底部的垃圾桶圖示，四種筆記都有，刪除前確認：我的筆記整則刪除；討論、複習、概念筆記是清空筆記內容，題目和概念卡不受影響）；大字標題（我的筆記可以直接改，其他種類是題目或詞條）；一排屬性（場次——我的筆記可以改；修改時間；連結）；分隔線下面是沒有外框的書寫區（`<MarkdownEditor>`）。卡片上的內容預覽會去掉 Markdown 符號，只顯示文字。內容一改就自動儲存，沒有「完成」按鈕，按關閉、點外面或 Esc 關閉。新增筆記會直接打開編輯視窗。
- **依場次分組**，新的在前；每組標題是場次 chip（連到場次頁）和則數，下一行是那場的題目。組內先列討論筆記（題目順序），再列我的筆記（最近修改的在前）。不屬於任何場次的我的筆記放在最後的「其他筆記」。
- **匯出**：篩選欄最下面有「Markdown」「純文字」兩個按鈕，下載**目前篩選出來的筆記**（沒篩選就是全部），檔名 `悅讀聊天室筆記-{YYYY-MM-DD}.md`／`.txt`。內容依場次分組（和畫面上一樣），每則有種類標籤（討論筆記・講座 8、複習筆記・…、概念筆記、我的筆記・修改日期）、題目或標題、筆記內容。Markdown 用 `##` 場次、`###` 種類、`>` 引用題目，筆記內的換行用行尾兩個空白保留；純文字用 `■` 場次、`【】` 種類、`―――` 分隔。在瀏覽器產生檔案（Blob），不經過任何伺服器。
- **程式結構**（3.10）：每種筆記的名稱、徽章顏色（討論筆記 `neutral`、複習與概念筆記 `secondary`、題目已修改 `neutral`、我的筆記 `primary`）等定義在 `utils/noteKinds.ts`（`NOTE_KINDS`）；各來源整理成統一的 `NoteEntry` 在 `composables/useNoteEntries.ts`；匯出在 `utils/noteExport.ts`（有測試固定格式）。**新增一種筆記**只要在 `NOTE_KINDS` 加一筆、在 `useNoteEntries` 加一個轉換函式；只有需要可以編輯的標題或場次時才改視窗模板。種類篩選依 `NOTE_KINDS` 的順序，「題目已修改」只在有這種筆記時出現。
- 搜尋是 Fuse.js 模糊比對，範圍是筆記內容、標題、題目。正在編輯的那則不會因為搜尋、篩選或清空而從畫面上消失。
- **作答紀錄**（3.9 起）：頁面上方的 `UTabs`（pill）切換「筆記｜作答紀錄」，不寫進網址。作答紀錄是 `<NoteAnswers>`（`components/note/Answers.vue`），資料來自 `useQuizRecords`：每一場測驗題在「邊看邊想」（`salon-quiz-inline-{slug}`）、「看完回想」（`salon-quiz-{slug}`）、`/review`（`salon-review-log`）的作答，簽章不同（題目改過）就當作沒答；只列至少答過一次的題目。
  - 版面同筆記：左邊篩選欄是**結果**（全部／答錯過／都答對，附數量；任何一處答錯過就算「答錯過」）、**場次**、題數，以及「到「複習」用間隔重複練習 ›」；右邊依場次（新的在前）→ 講座（影片順序，整合回顧最後）分組，組內照題目順序。卡片是對錯徽章、題目（最多三行）、每個地方的對錯（✓／✗），有筆記時加「有筆記」。
  - 點卡片打開視窗，照**提取練習**設計：先只給題目和選項（不標答案，也不顯示自己選了哪個），自己想過再按「我想好了，看答案與解析」，才標出正解（綠）和自己選錯的選項（紅，註明是哪裡選的）、解析與影片段落連結（`/notes` 沒有播放器，開 YouTube 新分頁）。每次打開都從「先回想」開始。屬性列有場次・講座、各處作答紀錄（複習是對幾次、錯幾次）、「回到這一場的「邊看邊想」 ›」。
  - 視窗下方是筆記（`<MarkdownEditor>`），和 `/review` 同一則（`salon-review-notes` 的 `q:{slug}:{雜湊}`），所以會出現在「複習筆記」。提示文字引導用自己的話解釋為什麼是這個答案（費曼技巧）。
- 全部存在瀏覽器，預先產生的 HTML 是空的，掛載後才顯示。第 12 節接 Supabase 後再考慮跨裝置同步。

---

## 4. 概念卡與關聯

### 4.1 模型

參考 Zettelkasten 與 Heptabase 的**形式**（只參考形式，不串接）：

- **連結的單位是概念卡，不是場次。** 一張卡只講一個概念，可以被很多場次使用。
- **每一場像一張白板**：場次的 `concepts` 列出這場用到哪些卡。名詞卡、相關場次都從這份清單算出來。
- **概念卡頁顯示反向連結**（出現在這些場次）和相關卡片，讀者可以從一個概念走到所有談過它的場次。
- **卡片內文可以互相連結**：`[[概念名稱]]` 或 `[[名稱|顯示文字]]`。名稱比對 `title` 或 `aliases`，建置時轉成 `/c/{id}` 連結。

### 4.2 什麼寫在哪裡

| 內容 | 放在 |
|---|---|
| 一般、中立的一句話定義 | 概念卡 `summary` |
| 概念的展開說明、和其他概念的關係 | 概念卡內文 |
| 某位講者的看法（例如「Kagan 討論的是互動式二元論」） | 概念卡內文，或場次內容 |
| 這一場怎麼用這個概念 | 場次內容 |

**`summary` 只寫中立、通用的定義**，不可以寫某一場或某位講者的看法。因為同一張卡會出現在很多場次的名詞卡上。

### 4.3 延續討論（相關場次）

出現在「看之前」和「活動後」兩個分頁的底部，由 `<RelatedSessions>` 顯示，計算在 `useRelatedSessions.ts`。

| 來源 | 規則 | 顯示的理由 | 標籤 |
|---|---|---|---|
| A. 人工連結 | 本場 `related` 裡的場次，**加上** `related` 指向本場的其他場次（反向連結）。雙向顯示，理由沿用寫連結那一場的 `reason` | `reason` | 主辦人推薦 |
| B. 共同概念 | 和本場的 `concepts` 有交集的其他場次。已經在 A 出現的不重複列 | 「都談到：靈魂、二元論」 | 共同概念 |
| C. 語意相似 | 用 embeddings 找內容相近的場次 | — | **延後**，等累積約 30–40 場再評估 |

- A 排在前面；B 依共同概念數由多到少，數量相同時新的在前。
- **最多 5 場**。沒有任何相關場次時，整個區塊不顯示。

---

## 5. 各分頁功能

### 5.1 看之前（`before`，`<TabBefore>`）

| 區塊 | 內容 | 互動 |
|---|---|---|
| 導言 | 一段話說明本場主題 | — |
| 五分鐘看懂全貌 | 3–6 點重點 | — |
| 帶著這三個問題看 | 每支影片一題引導問題 | — |
| 時間不夠先看這幾段 | 精選片段（總長約一小時以內） | 點片段 → 播放器跳到該段 |
| 講者的立場 | 講者本人的觀點整理 | 收合 |
| 延續討論 | 相關場次（見 4.3） | 點了進入該場 |

### 5.2 邊看邊想（`during`，`<TabDuring>`）— 逐支影片

**依影片分成子分頁，一次只顯示一段。** 子分頁列是「講座 5｜講座 6｜講座 7｜整合回顧」，固定在頂部列下方，捲動時也能切換。每支影片一段（`<StudyVideoSection>`），由上到下：

| 區塊 | 內容 | 互動 |
|---|---|---|
| 影片標頭 | 講座標籤與長度（「講座 5・48 分鐘」）、標題、「從頭播放」 | 點「從頭播放」→ 播放器從 0 秒開始播這支。手機（1024px 以下）改成「▶ 播放這一講」按鈕，按下去在頂部展開播放器，因為手機的播放器平常是收起來的 |
| 帶著這個問題看 | 這支影片的 `guide` | — |
| 論證 | 這支影片的論證卡片（`args` 裡 `vid` 是這支的） | 預測試，見下方 |
| 看完這段，測一下 | `quiz` 裡 `scope` 是這支的題目（`<StudyQuizItem>`） | 作答後鎖定，顯示正解、解析和原片段連結 |
| 想一想 | `discuss` 裡 `scope` 是這支的題目（`<StudyDiscussCard>`） | 可以先按「寫下我的想法」寫筆記（選填，Markdown 卡片）。按「我想好了，看 Kagan 怎麼說」→ 顯示 `answer` 和參考段落連結；有筆記時兩者並排 |

最後一個子分頁是**「整合回顧」**：`scope` 是 `'all'` 的測驗題與討論題，跨影片整合。每一段底部有「下一段：… →」按鈕。

**左右連動**：切到某支影片的子分頁時，播放器換成那支影片（`usePlayer().cue()`，只換影片、不自動播放），章節清單也跟著換。切到整合回顧時播放器不變。點到其他影片的參考段落時，播放器和章節清單會換成那支影片，左側子分頁不動。

**這樣排的原因**：題目和討論要跟正在看的影片對齊，看完一段就練一段；一次只顯示一段，不用一路往下捲。跨影片的整合放在最後。

- 每一則測驗解析、每一則討論答案都連回一段或多段影片（`refs`）。
- 這裡的測驗作答另外存（`salon-quiz-inline-{slug}`），不影響「看完回想」的自我測驗。
- 討論題的「看 Kagan 怎麼說」只在這次瀏覽展開，不存進瀏覽器。
- 上次停在哪個子分頁記在 `salon-during-part-{slug}`。
- **進度**：某支影片（或整合回顧）的測驗全部作答後，子分頁標籤前面打勾。只看測驗，不追蹤影片播放。
- **我的想法**：每題討論題都可以寫筆記，選填，不寫也能看 Kagan 怎麼說。筆記存在瀏覽器（`salon-notes-{slug}`），換裝置或清除瀏覽器資料就不見。「週日討論」顯示同一份筆記。

**論證卡片**：每個論證一張可以收合的卡片（`<ArgumentCard>`），標題列顯示「已作答／未作答」。

**流程（預測試）**：
1. 使用者打開卡片，看到前提和結論，還看不到講者的判斷。
2. 使用者點選自己覺得最可疑的前提。
3. 揭曉：每個前提標上「質疑」（紅）或「接受」（綠）並附上理由，同時顯示「你選了 P2，Kagan 也質疑這一步」這類回饋，以及結論評語。
4. 可以按「重新猜」重來。

**退路**：「直接看答案」會跳過猜題直接揭曉，這時不顯示回饋。

**規則**：每個前提**只能有「質疑」或「接受」其中一種**判斷，不能兩個都沒有（否則揭曉後會有空白的前提）。schema 和內容檢查都會擋。

### 5.3 看完回想（`recall`，`<TabRecall>`）

| 區塊 | 元件 | 功能 |
|---|---|---|
| 複習節奏 | `<RecallTimeline>` | 四個時間點：看完當天 → 隔天 → 活動前 → 活動後一週 |
| 白紙回想 | `<RecallQuestions>` | 每支影片 3 題，先自己回答，再打開「對照重點」 |
| 自我測驗 | `<RecallQuiz>` | 本場**全部**測驗題（含整合回顧），**第一次打開就是打亂的順序**；題目的出處（講座幾）作答後才顯示，否則出處本身就是提示。作答後鎖定選項，顯示正解、解析和原片段連結。分數即時更新。「打亂順序，重新作答」會清空作答紀錄並重新排序題目 |
| 名詞卡 | `<RecallTerms>` | 內容就是本場 `concepts` 列出的概念卡（詞條、英文、`summary`）。點卡片翻面 → 自評「還不熟／記得」。可以篩選「只看還不熟的」，上方顯示各狀態張數 |

- 自我測驗是給隔天或活動前**重新測一次**用的（間隔重複＋交錯練習）。題目和「邊看邊想」一樣，但作答紀錄分開存，所以這裡從頭開始。

### 5.4 週日討論（`sunday`，`<TabSunday>`）

| 區塊 | 元件 | 功能 |
|---|---|---|
| 立場題 | `<SundayVote>` | 每題一列選項，選一個立場，可以改選。**只有一輪**（3.5 起拿掉「討論後」） |
| 討論議題 | `<StudyDiscussCard>` | 本場全部討論題，先依影片分組，最後是「整合回顧」。卡片和「邊看邊想」相同，一樣可以寫筆記、看 Kagan 怎麼說和參考段落。寫過筆記時出現「複製我的筆記」，把有筆記的題目依分組輸出成 Markdown（`# {chip}：我的討論筆記` → `## 講座 N：影片標題` → `### 題目` → 筆記），可以貼進 Heptabase 或任何筆記軟體 |

- 討論題只有一份資料（`discuss`），兩個分頁共用，不另外寫一套題目。
- 3.0 的「進行方式」（同儕教學四步驟）區塊已移除。

> 立場題的選擇**只存在每個人自己的瀏覽器**，網站看不到全體的分布。現場的立場分布要用會議軟體的投票功能統計。

### 5.5 活動後（`after`，`<TabAfter>`）

活動前顯示 `after` 的預告文字（「尚未舉行」）。活動結束後在場次檔加上 `recap`（格式見 7.1），分頁改成回顧，沒填的區塊不顯示：

| 區塊 | 資料 | 顯示 |
|---|---|---|
| 討論錄音 | `recap.audio`、`recap.chapters` | 錄音連結按鈕（開新分頁），下方列出錄音的時間戳（只顯示，不連結） |
| 大家的立場 | `recap.votes` | 每題各選項的比例和總人數。目前人數由 Kai 手動填入；接上 Supabase 後改讀即時統計（12.5） |
| 現場冒出的問題 | `recap.questions` | 好問題、沒聊完的問題 |
| 這場新增的概念卡 | `recap.concepts` | 概念卡卡片 |

下方有「延續討論」（見 4.3）。錄音放哪個平台還沒決定，目前只放連結，決定後再考慮內嵌播放器。

---

## 6. 播放器規格

播放器狀態集中在 `usePlayer()`（`app/composables/usePlayer.ts`），所有元件共用同一份狀態。

| 項目 | 規格 |
|---|---|
| 載入 | `<VideoPanel>` 掛載後呼叫 `mount()`，動態插入 `https://www.youtube.com/iframe_api`。成功時 `embed` 變成 true |
| 預設影片 | 本場第一支影片，不自動播放 |
| 時間戳連結 | 一律用 `<VideoLink :vid :t>`。有播放器（`embed`）時攔截點擊，改成呼叫 `play()`；沒有播放器時照常開新分頁到 YouTube |
| 跳轉 | 同一支影片用 `seekTo`；不同影片用 `loadVideoById` 並從指定秒數開始。播放器還沒準備好時先記下來，準備好再跳 |
| 目前章節 | 每秒讀取一次播放時間寫進 `seconds`，章節清單據此標出目前章節，並顯示在播放器下方 |
| 放大 | 桌機（1024px 以上）可以按「放大影片」，播放器浮到畫面中間。不加遮罩，頁面照樣可以捲動和點擊，邊看影片邊讀內容。擋到內容時可以拖曳側邊的小分頁把手移開（平常隱藏，滑鼠碰到把手或視窗邊框時出現；把手朝向畫面中間，視窗在左半邊時換到右側，才能貼齊左右邊緣），不會拖出畫面；每次放大都從中間開始。按「縮回側欄」或按 Esc 回到側欄。狀態在 `usePlayer().floating`，預設在側欄，不存進瀏覽器。視窗縮到 1024px 以下時自動回到側欄。播放不中斷 |
| 手機 | 第一次點時間戳後 `playing` 變成 true，播放器固定在頂部。「收起影片」呼叫 `hide()`，暫停並隱藏播放器 |
| 字幕 | 會帶入 `cc_lang_pref=zh-Hant`。字幕說明（`captionTip`）顯示在播放器正下方。第一場的三支影片（Jason Hui 轉載版）畫面上已經**內嵌繁體中文字幕**，YouTube 的字幕軌是空的，所以不需要開字幕。換成其他影片時要重新確認，沒有內嵌字幕就改寫 `captionTip`。2026-09-29 實測過 `cc_load_policy=1` 和用 API 設定自動翻譯字幕：嵌入播放器的翻譯字幕請求被 YouTube 擋下（429），不可靠，所以沒有採用 |

---

## 7. 資料結構

- 內容全部放在 `content/`，schema（zod）的唯一來源是 `lib/schema.ts`：`content.config.ts` 和內容檢查都從這裡匯入。內容檢查用嚴格版本，**拼錯或多出來的欄位會報錯**（Nuxt Content 本身會默默丟掉）。
- 元件使用的型別在 `app/types/session.ts`（手寫，有說明註解）。檔案最後有型別層級的比對：和 schema 推導出來的型別對不上時，`npm run typecheck` 會失敗。**改欄位時兩邊要一起改。**
- **Nuxt Content 不會替巢狀物件補 schema 的預設值**（例如 `recap` 裡的 `.default([])`）：只填部分欄位時，其他欄位讀出來是 `undefined`，元件要自己補（`tab/After.vue`）。頂層欄位的預設值則正常。
- 所有查詢都透過 `app/composables/useContent.ts`（見 2.6），元件和頁面不要直接呼叫 `queryCollection`。
- **題目的 `id`（選填）**：quiz、discuss、votes、args 都可以加 `id`（小寫英數和連字號，最長 40 字）。瀏覽器裡的筆記和作答用「題目 key」記：有 `id` 用 `id`，沒有用題目文字（論證是 `name`）的雜湊。**發佈後要改題目文字時，先把 `id` 補上，值填改之前的題目雜湊**（`textHash(舊題目)`，網站上的 key 就是它）——這樣筆記、複習紀錄、立場題、論證卡都沿用，只有那一題的測驗作答要重答。不補的話，大家的筆記會變成「題目已修改」。新寫的題目可以不填。

### 7.1 場次：`content/sessions/{年}/{月-日}-{主題}.yml`

每場一個檔案，依活動日期放進該年的資料夾，例如 `content/sessions/2026/10-04-靈魂.yml`。不需要另外登記，新增檔案就會出現在 `/archive`，首頁會依當天日期自動顯示本週那一場。

```yaml
slug: w1                          # 唯一值，用在網址與 localStorage key，發佈後不可以改
date: "2026-10-04"                # ISO 日期，要加引號。決定月份分組與排序
dateLabel: 2026 年 10 月 4 日（週日）   # 畫面上顯示的日期
startsAt: "2026-10-04T20:00:00+08:00"   # （第 12 節第一期新增）活動開始：立場題鎖定並公布
chip: 10/4 靈魂與永生             # 短標籤：日期 + 3–6 個字的主題（篩選 chip、頁面標題用）。用「A 與 B」「A 的 B」說出這場在談什麼，不要只寫一個詞（「自殺」「恐懼」單獨出現太衝）
eyebrow: Session 01 · Yale PHIL 176 Death
title: 靈魂存在嗎？如果存在，它會永生嗎？   # h1，用問句
lede: …                           # 一段導言
speaker: Shelly Kagan（耶魯大學哲學系）
tags: [心靈哲學, 柏拉圖, Yale PHIL 176 Death]   # 必須在 taxonomy.yml 裡
concepts: [soul, dualism, physicalism]        # 這場用到的概念卡 id
related:                          # 人工連結，沒有就寫 []
  - slug: w3
    reason: 同樣在問人死後還剩下什麼
captionTip: …                     # 字幕說明，顯示在播放器下方（影片是否有內嵌字幕、要不要自己開）
picks:                            # 時間不夠看的片段：[講座標籤, videoId, 秒數, 起–迄, 說明]
  - [講座 5, S-fwH_uBPD0, 0, 00:00–15:20, …]
tldr: [ … ]                       # 3–6 點，可以用 <b>
stance:                           # [面向, 講者立場]
  - [靈魂存在嗎, …]
videos:
  - id: S-fwH_uBPD0
    lec: 講座 5                     # 只寫講座標籤
    duration: 2882                  # 影片長度（秒）。畫面顯示「48 分鐘」，全場加總顯示「約 2 小時 10 分」
    short: 短標題
    title: 完整標題
    guide: 引導問題
    chapters:                     # [秒數, 章節名稱]，約 10–12 個
      - [0, …]
    recall:                       # [回想題, 對照重點]，3 題
      - [ …, … ]
args:
  - name: …
    kind: 最佳解釋推論
    vid: S-fwH_uBPD0
    t: 1037
    ts: 講座 5 · 17:17
    prem:                         # [前提, 質疑理由] 或 [前提, null, 接受理由]
      - [ …, 質疑理由 ]
      - [ …, null, 接受理由 ]
    concl: 結論
    verdict: 結論評語
argsNote: …                       # 可省略：論證地圖上方的補充說明
votes:                            # 2–4 題，每題 2–4 個選項
  - id: free-will                 # 選填：穩定的題目代號（見 7 開頭「題目的 id」），quiz、discuss、args 也都可以加
    q: 立場題
    o: [選項, 選項]
discuss:                          # 每支影片至少 1 題，'all' 至少 1 題
  - scope: S-fwH_uBPD0            # 影片 id，或 all（整合回顧，跨影片）
    q: 題目
    note: 補充說明                # 可省略
    ext: false                    # 超出影片內容的延伸題設 true，可省略（預設 false）
    answer: Kagan 怎麼說          # 影片沒回答時要明說
    refs:                         # 參考段落 [videoId, 秒數]，至少一段
      - [S-fwH_uBPD0, 1037]
quiz:                             # 每支影片至少 1 題，'all' 至少 1 題
  - scope: S-fwH_uBPD0
    q: 題目
    o: [選項, 選項, 選項]
    a: 0                          # 正解索引，從 0 開始
    e: 解析
    refs:                         # 原片段 [videoId, 秒數]，至少一段
      - [S-fwH_uBPD0, 1037]
after: 活動後區塊的預告文字（還沒有 recap 時顯示）
recap:                            # 活動結束後才加上，整段可以省略；裡面每個欄位也都可以省略
  audio: { url: https://…, label: 收聽討論錄音 }   # 可省略
  chapters:                       # 錄音時間戳 [秒數, 段落]，可以是 []
    - [0, 開場]
  votes:                          # 依 votes 的題目順序，每題各選項的人數，數量要和選項一樣多；沒有就寫 []
    - [3, 4, 3]
  questions: [ … ]                # 現場冒出的好問題、沒聊完的問題
  concepts: [soul]                # 這場討論後新增的概念卡 id
```

2.0 → 3.0 的欄位變動：`id` 改名為 `slug`（值 `w1` 不變，localStorage 才不會失效）；`date` 改成 ISO 日期，原本的顯示文字移到 `dateLabel`；新增 `tags`、`concepts`、`related`；`terms` 移除，名詞卡改用本場的概念卡。

3.2 → 3.3 的欄位變動：`videos[].lec` 只寫講座標籤（原本是「講座 5 · 48:02」，長度會被看成時間點），長度改填新欄位 `duration`（秒）；新增可省略的 `recap`。

3.0 → 3.1 的欄位變動：`quiz` 新增 `scope`，原本單一的 `t` 改成 `refs`（可以多段）；`discuss` 從 `[題目, 補充說明, 是否延伸]` 改成物件，新增 `scope`、`answer`、`refs`。

### 7.2 概念卡：`content/concepts/{id}.md`

檔名就是 id，也是網址 `/c/{id}`。id 用英文小寫加連字號（例如 `inference-to-best-explanation`），發佈後不要改。

```markdown
---
title: 靈魂                 # 詞條，也是 [[連結]] 用的名字
en: Soul
aliases: []                # 其他寫法，[[連結]] 也認得，例如 [斐多篇]
summary: 人身上非物質、可能在身體死亡後繼續存在的部分。   # 一句中立的定義
tags: [心靈哲學, 宗教哲學]   # 必須在 taxonomy.yml 裡，至少要有一個「領域」
related: [dualism, physicalism]   # 相關概念卡 id
---

[[二元論]]認為人有靈魂；[[物理主義]]認為沒有。……
柏拉圖的[[《斐多篇》|斐多篇]]處理的是靈魂是否不朽。
```

- `[[名稱]]` 在建置時由 `nuxt.config.ts` 的 `content:file:beforeParse` hook 轉成 `[名稱](/c/{id})`，規則在 `lib/wikilinks.ts`（檢查腳本也用同一份）。
- 找不到對應卡片的 `[[名稱]]` 會原樣留下，內容檢查會報錯。

### 7.3 詞彙表：`content/taxonomy.yml`

```yaml
facets:
  - key: domain
    label: 領域
    tags: [心靈哲學, 形上學, 知識論, 倫理學, 宗教哲學, 科學哲學]
  - key: person
    label: 人物
    tags: [蘇格拉底, 柏拉圖, 笛卡兒, Shelly Kagan]
  - key: series
    label: 系列
    tags: [Yale PHIL 176 Death]
```

- 場次和概念卡的 `tags` **只能從這裡選**。詞彙是受控的，避免同一件事出現兩個 tag（例如「心靈哲學」和「心智哲學」）。
- 需要新 tag 時，**先加進 `taxonomy.yml`**，再用在內容裡。

### 7.4 資料規則

- 每個前提的「質疑」和「接受」必須剛好填一個。
- 所有秒數都要對照逐字稿確認，不可以估算。
- `quiz` 和 `discuss` 的 `scope` 只能是本場某支影片的 id，或 `'all'`。
- 每支影片至少要有一題測驗、一題討論；`'all'` 也至少各一題。
- 討論題的 `answer` 在影片沒回答時要直接說明（例如延伸題：「Kagan 在影片裡沒有談到……」），不可以替講者補答案。
- 講者的觀點要寫成「Kagan 認為……」，不可以寫成事實（見 DESIGN.md「文案規範」）。
- 概念卡的 `summary` 只寫中立、通用的定義（見 4.2）。

---

## 8. 內容檢查

`scripts/check-content.mjs` 先用嚴格 schema 驗證每個檔案，再檢查 schema 管不到的跨檔案規則。執行 `npm run check`；`npm run generate` 會先自動執行。有任何錯誤就列出檔案和原因，並中止建置。

| 檢查 | 對象 |
|---|---|
| tag 不在 `taxonomy.yml` | 場次、概念卡 |
| 概念卡 id 不存在 | 場次 `concepts`、概念卡 `related` |
| `[[連結]]` 找不到對應的概念卡 | 概念卡內文 |
| 名稱或別名和其他卡重複（`[[連結]]` 會無法判斷） | 概念卡 `title`、`aliases` |
| 缺少 `title` 或 `summary` | 概念卡 |
| `slug` 重複 | 場次 |
| `related` 的場次不存在，或連到自己 | 場次 |
| 前提的質疑與接受不是剛好填一個 | 場次 `args` |
| 測驗正解索引超出選項數 | 場次 `quiz` |
| 影片 id 不在本場 `videos` 裡 | 場次 `picks`、`args`、`quiz` 與 `discuss` 的 `refs` |
| `scope` 不是本場影片 id 也不是 `'all'` | 場次 `quiz`、`discuss` |
| 某支影片或 `'all'` 沒有測驗題或討論題 | 場次 `quiz`、`discuss` |
| 檔案路徑和 `date` 不一致（年份資料夾、檔名的 `{月}-{日}-`） | 場次 |
| 欄位不符 schema、有不認得的欄位（拼錯）、缺少必填欄位 | 場次、概念卡、詞彙表 |
| 題目 key（`id` 或題目雜湊）重複 | 場次 `quiz`、`discuss`、`votes`、`args`（用 `name`） |
| 時間點超過影片長度 | 場次 `quiz`／`discuss` 的 `refs`、`picks`、`args.t`、影片 `chapters` |
| 章節時間沒有遞增 | 影片 `chapters`、`recap.chapters` |
| `slug` 不是小寫英數和連字號 | 場次 |
| `chip` 不是「月/日 主題」、日期和 `date` 不一致、主題不是 3–6 個字 | 場次 |
| 立場題選項不是 2–4 個 | 場次 `votes` |
| `related` 連到自己 | 概念卡 |
| `recap.concepts` 不在本場 `concepts` 裡 | 場次 |

---

## 9. 瀏覽器儲存（localStorage）

全部存在使用者自己的瀏覽器，不會上傳，也不跨裝置同步。

- key 全部定義在 `app/utils/storageKeys.ts`（`STORAGE_KEYS`），不要在元件裡自己拼字串。
- 元件透過具名的 composable 讀寫：學習進度用 `useProgress.ts`（`useVotes`、`useArgPicks`、`useCardRates`、`useQuizAnswers`），筆記用 `useDiscussNotes`、`useReviewNotes`、`useMyNotes`，作答紀錄用 `useReviewLog`。之後搬到 Supabase 時只改這些 composable 的內部。
- 底層一律是 `useSalonStorage(key, 預設值)`（包裝 VueUse 的 `useLocalStorage`）。**預設值要用 `{}`、`[]` 或字串**：VueUse 依預設值的型別選序列化方式，預設 `null` 會把物件存成 `"[object Object]"`。
- `writeDefaults: false`：只有真的寫入時才建立 key（`/notes` 會替每一場建立好幾個讀取，否則每場都多出空的 key）。
- 使用 `initOnMounted`：預先產生的 HTML 一律用預設值，頁面掛載後才讀 localStorage，避免 hydration 不一致。
- 無痕模式或儲存被封鎖時，VueUse 會退回記憶體中的值，網站照常運作，只是不會記住狀態。

| Key | 內容 |
|---|---|
| `salon-tab` | 上次停留的分頁 |
| `salon-arg-{slug}` | 論證卡片的猜題紀錄 `{v: 2, picks: {論證 key: 前提索引}}`，`-1` 表示直接看答案（3.10 起；以前是 `{卡片索引: 前提索引}`） |
| `salon-quiz-{slug}` | 「看完回想」的自我測驗 `{v: 2, order: [作答 key], ans: {作答 key: 選項索引}}`（3.10 起；以前是 `{sig, order: [題目索引], ans: {題目索引: 選項索引}}`） |
| `salon-quiz-inline-{slug}` | 「邊看邊想」的測驗作答 `{v: 2, ans: {作答 key: 選項索引}}`（3.10 起；3.1–3.9 是 `{sig, ans: {題目索引: 選項索引}}`） |
| `salon-during-part-{slug}` | 「邊看邊想」上次停在哪個子分頁：影片 id 或 `all`（3.2 起） |
| `salon-cards-{slug}` | 名詞卡自評 `{概念卡 id: 'shaky' 或 'known'}`（3.0 起） |
| `salon-vote-{slug}` | 立場題 `{v: 2, picks: {題目 key: 選項}}`（3.10 起；3.5–3.9 是 `{題目索引: 選項}`；3.4 以前的 `{pre, post}` 物件會被當成沒選） |
| `salon-review-notes` | `/review` 每題的筆記，`c:{id}` 同時是概念卡彈窗裡的筆記 `{題目 key: {q: 題目（概念卡是詞條）, text: 筆記}}`（3.9 起；以前是 `{題目 key: 筆記}`）。key 見 3.6（`q:{slug}:{題目 key}`、`c:{概念卡 id}`）；改了題目文字，舊筆記對不到新題目，在 `/notes` 列成「題目已修改」 |
| `salon-review-log` | `/review` 的作答紀錄 `{題目 key: {right, wrong, lastCorrect, last (ISO 時間), box (0–5), due (YYYY-MM-DD)}}`，間隔重複用 |
| `salon-mynotes` | `/notes` 自己新增的筆記 `[{id, title, body, slug (屬於哪一場，可為 null), createdAt, updatedAt}]`（ISO 時間），最新新增的在前 |
| `salon-notes-{slug}` | 討論題的「我的想法」`{題目 key: {q: 題目, text: 筆記}}`（3.9 起；3.3–3.8 是 `{題目文字的雜湊: 筆記}`）。用題目 key（`questionKey()`：有 `id` 用 `id`，沒有用題目文字的雜湊）當 key，調整題目順序不影響；**改了題目文字，舊筆記在原處不再顯示**，改列在 `/notes` 的「題目已修改」 |

- **筆記連題目一起存（3.9）**：`salon-notes-{slug}`、`salon-review-notes` 的值讀取時兩種格式都接受（`utils/storedNote.ts` 的 `noteText()`／`noteQuestion()`）；舊的字串筆記不主動轉換，下次修改時才換成新格式。
- **容量滿了要說**：localStorage 每個網站約 5MB，所有 `salon-*` 共用。`useSalonStorage` 寫入失敗（`QuotaExceededError`）時跳錯誤提示「沒有存到」，請使用者先匯出筆記再刪掉不需要的；同一頁 10 秒內只提示一次。修改仍留在記憶體，重新整理後消失。VueUse 預設只印在 console，使用者會以為存好了。
- **不做防抖**：筆記每打一個字就整包寫回 localStorage。實測 2,000 則（約 1.2MB）寫一次約 2ms，感覺不到；加防抖反而會讓同一頁多個元件各自持有的舊資料互相覆蓋。資料量大到有感時再改，或在第 12 節搬到 Supabase 時一起改成一則一列。
- `slug` 就是 2.0 的 `id`，值沒變，所以舊訪客的進度都還在。
- `salon-cards-{slug}` 在 3.0 改成用概念卡 id 當 key。2.0 用卡片索引（`"0"`、`"1"`）存的舊值會被忽略，名詞卡自評等於重來一次。
- `salon-session`（上次查看的場次）在 3.0 已不再使用。
- `salon-quiz-inline-{slug}` 和 `salon-quiz-{slug}` 分開存，所以隔天在「看完回想」重測時從頭開始。
- **題目 key 和作答 key（3.10）**：立場題、論證卡用題目 key（`questionKey()`：`id` 或題目／論證名稱的雜湊）；測驗作答用作答 key（`answerKey()`：`id` 或題目，加上選項和正解的雜湊）。所以調整順序、插入新題不會對錯題；改了某一題的選項或正解，只有那一題要重答。「看完回想」的順序存作答 key，新題目接在最後，刪掉的題目略過。
- **舊格式換算（3.10）**：依題目索引存的舊資料，讀取時用目前的題目順序換算（`utils/progressFormat.ts`，有測試）。測驗的舊資料要簽章（`quizSignature()`）和目前題目相同才換算，不同就當作沒答（和以前一樣）。換算後不主動寫回，下次作答時才存成新格式。
- 討論題的「看 Kagan 怎麼說」展開狀態不存。
- `salon-quiz-{slug}` 沒有紀錄（或舊資料對不上）時，掛載後直接存一個打亂的順序（預先產生的 HTML 用固定順序，避免 hydration 不一致）。

> 修改資料結構時要考慮舊資料的相容性。例如 1.0 版測驗改成 `{order, ans}` 格式時，就有加上舊格式的判斷，避免舊訪客打開時出錯。

---

## 10. 每週更新流程

1. **取得來源**：用 `yt-dlp` 下載字幕並轉成帶時間戳的逐字稿，存到 `~/Documents/sunday-salon/`（逐字稿**不放進 repo**）。
2. **撰寫場次**：照第 7.1 節，新增 `content/sessions/{年}/{月-日}-{主題}.yml`。
   - 測驗題和討論題**逐支影片寫**：每支至少一題測驗、一題討論，`scope` 填那支影片的 id。
   - 每題的 `refs` 都要對照逐字稿，確認段落真的談到這件事。
   - 最後寫 2 題以上的整合題（`scope: all`），測驗和討論都要有。
   - 延伸題的 `answer` 要說明影片沒有回答。
3. **Claude 提案**：Claude 列出這場要用的概念卡，分成三類給 Kai 確認：
   - **沿用**：已經有的概念卡。
   - **新增**：新的概念卡草稿（詞條、英文、別名、中立的 `summary`、內文）。
   - **連結**：建議的 tag（新 tag 另外標出來）和 `related`（附一句理由）。
4. **Kai 確認**：Kai 決定哪些要收。新 tag 先加進 `taxonomy.yml`，再寫進內容。
5. **寫入**：新增 `content/concepts/{id}.md`，把 id 填進場次的 `concepts`，填好 `tags` 和 `related`。
6. **知識查核**：逐條檢查有沒有把觀點寫成事實、`summary` 有沒有混進講者的看法、譯名會不會造成誤會、講者有沒有簡化原典、內容有沒有學界爭議，有的話就在頁面上註明。
7. **本機測試**：`npm run check` 和 `npm run typecheck` 通過，再用 `npm run dev` 打開確認：
   - 每個時間戳都能跳到正確的段落
   - 每張論證卡片揭曉後，所有前提都有判斷
   - 「邊看邊想」每支影片都有測驗和討論，解析和答案的段落連結都正確
   - 名詞卡、概念卡頁的反向連結、延續討論都正確
   - 暗色、淺色主題，390px 寬度沒有橫向捲軸
8. **發佈**：commit 並 push 到 GitHub。部署 workflow 啟用自動觸發後，push 到 `main` 就會自動更新網站；在那之前要到 GitHub Actions 手動執行（見第 11 節）。

---

## 11. 待決問題

| 問題 | 選項或備註 |
|---|---|
| 上線方式 | GitHub Pages 免費方案需要**公開 repo**。目前 repo 是私人、Pages 關閉。`.github/workflows/deploy.yml` 目前**只能手動觸發**（`workflow_dispatch`），等 Kai 確認後再開啟 push 到 `main` 自動部署 |
| 錄音平台 | 「活動後」目前只放錄音連結。平台（Spotify、SoundCloud、YouTube…）決定後再考慮內嵌播放器，和剪輯流程一起討論 |
| 全體立場統計 | 目前：用現場會議軟體投票，人數填進 `recap.votes`；立場題存在各自的瀏覽器。**已決定的下一步**：接 Supabase，用「**名字＋4 位數 PIN**」辨識參加者（先取名的人拿到名字；換裝置輸入名字＋PIN 就看得到自己之前的選擇）。不用 IP 或瀏覽器指紋。規格草案見**第 12 節** |
| Heptabase 匯入 | Kai 之後會透過 MCP 連線在 Heptabase 做筆記和討論。**未決定、未實作**：是否要把 Heptabase 的卡片匯入或同步成概念卡？同步方向、以哪邊為準都還沒定 |
| 語意相似（4.3 的 C） | 什麼時候加 embeddings？初步想法是累積約 30–40 場再評估，要在建置時算好，不能在瀏覽器呼叫 API |
| 概念卡命名慣例 | 譯名有多種時選哪個當 `title`？書名要不要加《》？人名概念（例如「笛卡兒的二元論」）要獨立成卡還是寫在內文？ |
| 圖譜或白板檢視 | 讀者之後需不需要看到概念卡之間的關係圖，或每場的白板檢視？目前只有列表 |

## 12. 身分與雲端資料（Supabase）— 已確認，未實作

> 狀態：**規格已確認（12.9），尚未實作**。實作要在能使用 Supabase MCP 的對話進行。Supabase 專案 ref：`ibeqhpspudnmbozoejzf`。
> 目標：讓參加者用「**名字＋4 位數 PIN**」辨識自己，**換裝置也看得到自己之前的選擇**，並讓大家看到全體的立場分布。

### 12.1 哪些資料要搬到 Supabase

依第 9 節的瀏覽器儲存逐一判斷：

| 資料 | 目前的 key | 搬到 Supabase？ | 原因 |
|---|---|---|---|
| 立場題 | `salon-vote-{slug}` | **要（第一期）** | 需要全體統計，也要跨裝置看到自己的選擇 |
| 我的想法（討論筆記） | `salon-notes-{slug}` | **要（第二期）** | 跨裝置同步；只有本人看得到 |
| 測驗作答 | `salon-quiz-{slug}`、`salon-quiz-inline-{slug}` | **要（第三期）** | 換裝置不用重做 |
| 論證猜題 | `salon-arg-{slug}` | **要（第三期）** | 同上 |
| 名詞卡自評 | `salon-cards-{slug}` | **要（第三期）** | 同上 |
| 複習筆記、概念筆記 | `salon-review-notes` | **要（第二期）** | 和討論筆記一起：`/notes` 跨裝置最有價值的就是筆記 |
| 我的筆記 | `salon-mynotes` | **要（第二期）** | 同上 |
| 複習作答紀錄 | `salon-review-log` | **要（第三期）** | 間隔重複的排程，換裝置不用重來 |
| 上次的分頁、子分頁 | `salon-tab`、`salon-during-part-{slug}` | **不要** | 介面偏好，本來就該跟著裝置 |

不需要 Supabase 的：場次內容、概念卡、tag（仍是建置時產生的靜態資料）。已決定不做的：活動資訊、事先收集問題、複習提醒（見修改紀錄 3.3）。

### 12.2 身分：名字＋PIN

**使用者看到的流程**

1. **沒取名不能投票**（Kai 決定）：沒取名時點立場題的選項，會跳出「取名／登入」視窗，完成後再記下剛才點的選項。立場題上方提示「取個名字就能投票，換裝置也看得到自己的選擇」。
2. **取新名字**：輸入名字＋設定 4 位數 PIN（輸入兩次）。名字沒人用過就取得成功。上雲前就存在瀏覽器裡的舊選擇與筆記（`salon-vote-*`、`salon-notes-*` 等，對照 `STORAGE_KEYS`）**一起上傳**，上傳後清掉瀏覽器裡的版本。上傳前先經過 `utils/progressFormat.ts`、`utils/storedNote.ts` 換成新格式，空物件跳過；比對 key 要精確（`salon-quiz-` 也會比對到 `salon-quiz-inline-`）。名字已被使用時顯示「這個名字已經有人用了，換一個，或用 PIN 登入」。
3. **用已有的名字登入**（換裝置時）：輸入名字＋PIN。成功後載入雲端的選擇、筆記與進度；這個瀏覽器原本的資料，雲端沒有的才補上去，**雲端已有的以雲端為準**。之後兩台裝置都改同一筆時，以最後寫入的為準。
4. **已登入時**：顯示「以『小明』的身分儲存」，旁邊可以「登出」「改 PIN」「刪除我的資料」。
5. **忘記 PIN**（Kai 決定）：沒有 email，無法自助重設。顯示「忘記 PIN 請聯絡主辦人」，由 Kai 手動重設。

**規則**

| 項目 | 規則 |
|---|---|
| 名字 | 去掉前後空白，**1–5 個字**（以字元計，中英文都算一個字），**不設禁用字**（Kai 決定）。比對時不分大小寫、全半形（NFKC 正規化後轉小寫），「Kai」和「ｋａｉ」算同一個名字 |
| PIN | 剛好 4 位數字。資料庫只存雜湊（`pgcrypto` 的 `crypt()` + bcrypt），比對在資料庫函式裡做，前端拿不到雜湊 |
| 猜錯限制 | 同一個名字連續錯 5 次，鎖 15 分鐘，期間一律回「請稍後再試」 |
| 錯誤訊息 | 登入失敗一律顯示「名字或 PIN 不正確」，不說是哪一個錯 |
| 誰看得到名字 | **網站上不公開任何人的名字**，統計只顯示人數。主辦人在 Supabase 後台看得到名字和選擇；頁面上**不另外說明**（Kai 決定） |
| 一個名字幾台裝置 | 不限，每台裝置登入後各自保持登入 |

> 安全性說明：4 位數 PIN 只有一萬種組合，搭配猜錯鎖定，足以擋住隨手冒用，但不是高安全性的設計。立場題和討論筆記不是機密資料，這個取捨可以接受；網站上不要收集更敏感的資料。

**技術做法**

用 Supabase 的**匿名登入**（`signInAnonymously()`）管理「這台裝置」的登入狀態，名字＋PIN 則是在資料庫裡把這台裝置連到某個參加者：

1. 頁面第一次需要雲端時，呼叫 `signInAnonymously()`，這台裝置得到一個 `auth.uid()`，supabase-js 會自動保存與更新登入狀態。
2. 「取名」和「登入」都是資料庫函式（RPC），成功時把 `auth.uid()` 寫進 `participant_devices`，連到那個參加者。
3. 所有權限規則（RLS）都透過「這個 `auth.uid()` 連到哪個參加者」判斷。
4. 登出＝刪掉這台裝置的連結，再 `signOut()`。

這樣不用自己發 token，登入狀態的保存、過期、更新都交給 supabase-js。

### 12.3 資料表

```sql
-- 參加者：名字唯一，PIN 只存雜湊。前端不能直接讀這張表
participants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 5),  -- 顯示用，保留使用者輸入的樣子
  name_key        text not null unique,       -- 比對用：NFKC 正規化＋小寫＋去空白
  pin_hash        text not null,
  failed_attempts int  not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now()
)

-- 裝置：哪個匿名登入（auth.uid）屬於哪個參加者
participant_devices (
  auth_uid       uuid primary key references auth.users on delete cascade,
  participant_id uuid not null references participants on delete cascade,
  created_at     timestamptz not null default now()
)

-- 立場題：同一人、同一場、同一題只有一筆（再選就是改選）
votes (
  participant_id uuid not null references participants on delete cascade,
  session_slug   text not null,               -- 例：w1
  question       text not null,               -- 題目 key（questionKey：id 或題目雜湊），不用索引，題目順序改了也對得到
  choice         int  not null,
  updated_at     timestamptz not null default now(),
  primary key (participant_id, session_slug, question)
)

-- 場次時程：活動開始時鎖定並公布立場題（12.5）。每週新增場次時一起寫入，時間和場次檔的 startsAt 一致
sessions_schedule (
  session_slug text primary key,
  starts_at    timestamptz not null
)

-- 筆記（第二期）：討論筆記、複習筆記、概念筆記。key 和瀏覽器版一樣
notes (
  participant_id uuid not null references participants on delete cascade,
  kind           text not null check (kind in ('discuss', 'review')),  -- discuss：salon-notes-*；review：salon-review-notes（含概念筆記 c:{id}）
  session_slug   text not null default '',    -- discuss 是場次；review 留空（key 本身已含場次，概念筆記不屬於任何場次）
  question_key   text not null,               -- discuss：題目 key；review：q:{slug}:{題目 key} 或 c:{概念卡 id}
  question       text not null default '',    -- 存筆記時的題目（概念筆記是詞條）；題目改掉後 /notes 靠它列出「題目已修改」
  body           text not null check (char_length(body) <= 20000),  -- 前端也要擋同樣的上限
  updated_at     timestamptz not null default now(),
  primary key (participant_id, kind, session_slug, question_key)
)

-- 我的筆記（第二期）：對應 salon-mynotes
my_notes (
  id             uuid primary key,
  participant_id uuid not null references participants on delete cascade,
  title          text not null default '',
  body           text not null check (char_length(body) <= 20000),
  session_slug   text,                        -- 可為 null（不屬於任何場次）
  created_at     timestamptz not null,
  updated_at     timestamptz not null
)

-- 學習進度（第三期）：內容和瀏覽器版的 JSON 完全相同，一種進度一列
progress (
  participant_id uuid not null references participants on delete cascade,
  session_slug   text not null,
  kind           text not null check (kind in ('quiz', 'quiz-inline', 'arg', 'cards', 'review-log')),
  data           jsonb not null,              -- 和瀏覽器版 3.10 的新格式相同，例：quiz 是 {v: 2, order, ans}；review-log 的 session_slug 留空
  updated_at     timestamptz not null default now(),
  primary key (participant_id, session_slug, kind)
)
```

### 12.4 資料庫函式與權限

| 函式 | 誰能呼叫 | 做什麼 |
|---|---|---|
| `current_participant()` | 內部用 | 依 `auth.uid()` 找 `participant_devices`，回傳參加者 id；沒有就是 null |
| `claim_name(name, pin)` | 已匿名登入 | 名字沒人用 → 建立參加者並連結這台裝置。已被使用 → 錯誤 `name_taken` |
| `login(name, pin)` | 已匿名登入 | 驗證 PIN（含猜錯鎖定）→ 連結這台裝置。錯誤：`invalid`、`locked` |
| `me()` | 已匿名登入 | 回傳自己的名字；沒取名回傳 null |
| `logout()` | 已連結 | 刪掉這台裝置的連結 |
| `change_pin(old_pin, new_pin)` | 已連結 | 驗證舊 PIN 後更新 |
| `delete_me()` | 已連結 | 刪除參加者（票、筆記、所有裝置連結一起刪） |
| `vote_counts(session_slug)` | 任何人（不用登入） | 活動開始前只回傳每題的**投票總人數**；活動開始後才回傳各選項的人數。不含任何身分資訊。在資料庫裡擋，不靠前端隱藏 |

RLS：

- `participants`、`participant_devices`：前端**不能直接讀寫**，只能透過上面的函式（`security definer`）。
- `votes`、`notes`、`progress`：只能讀寫 `participant_id = current_participant()` 的列，也就是只看得到、改得到自己的。
- `votes` 的寫入另外檢查時程：活動開始（`starts_at`）後一律拒絕新增或修改。
- 統計只透過 `vote_counts()`，不直接開放 `votes` 給別人讀。

### 12.5 立場題的新行為（第一期）

| 狀態 | 行為 |
|---|---|
| 沒取名 | 不能投票，點選項會跳出取名／登入視窗 |
| 已取名 | 選擇直接寫進 `votes`（樂觀更新：畫面先變，失敗再退回並提示） |
| 只有一輪 | 3.5 起拿掉「討論後」（Kai 決定：兩輪太麻煩） |
| 時程 | 場次檔新增 `startsAt`（含時區，例 `"2026-10-04T20:00:00+08:00"`），同步寫進 `sessions_schedule`。鎖定在資料庫裡判斷，不能只靠前端 |
| 活動開始前 | 可以投、可以改選。**不公布分布**，只顯示「已有 N 人投票」 |
| 活動開始後 | **鎖定並公布**全體分布（所有人都看得到，不必自己投過），不能再投或改選 |
| 自己的選擇 | 任何時候都看得到自己選了什麼 |
| 人數太少 | 某題某階段不到 3 人時不顯示比例，只顯示人數，避免從比例推回是誰 |
| 「活動後」分頁 | 立場變化改成讀 `vote_counts()`（即時）。場次檔的 `recap.votes` 保留，**有填時優先使用**（例如改用現場會議軟體統計的那一場） |

### 12.6 前端架構

- 套件：直接用 `@supabase/supabase-js`，只在瀏覽器端建立（`plugins/supabase.client.ts`）。不用 `@nuxtjs/supabase` 模組，它是為伺服器端渲染的 cookie 登入設計的，這個網站是純靜態。
- 設定：`runtimeConfig.public.supabaseUrl`、`supabaseKey`（anon／publishable key，可以公開）。建置時由環境變數 `NUXT_PUBLIC_SUPABASE_URL`、`NUXT_PUBLIC_SUPABASE_KEY` 帶入；GitHub Actions 用 repository variables。**service_role key 絕對不能出現在前端或 repo**。
- 新增 composable：
  - `useIdentity()`：`name`、`status`（`anonymous`／`named`／`offline`）、`claim()`、`login()`、`logout()`、`changePin()`、`deleteMe()`。
  - `useVotes(slug)`：取代 `<SundayVote>` 裡的 `useSalonStorage`；沒取名時退回瀏覽器儲存。
  - `useDiscussNotes(slug)`（第二期）：已取名時改讀寫 `notes`，介面不變。
  - `useSalonStorage` 的雲端版（第三期）：已取名時，`salon-quiz-*`、`salon-arg-*`、`salon-cards-*` 改讀寫 `progress`，瀏覽器裡保留一份當快取。元件介面不變。
- 身分入口：**不放在頂部列**（手機已經沒有空間，見 DESIGN.md 3.7）。放在需要它的地方：「立場題」區塊標題下方；沒取名時點選項也會打開。第二期起，「我的想法」旁邊也有入口。取名／登入用 `UModal`，裡面兩個分頁「取新名字」「用已有的名字登入」，PIN 用 `UPinInput`（4 格、`type="number"`、`mask`）。
- **連不上 Supabase 時**（沒設定、網路問題、免費方案專案暫停）：筆記與學習進度退回瀏覽器儲存，照常運作。立場題因為一定要取名，這時**暫停投票**，顯示「雲端暫時無法使用，稍後再試」。

### 12.7 營運與注意事項

- **免費方案會暫停**：Supabase 免費專案一段時間沒有活動會自動暫停（以官方說明為準），暫停時網站會進入上一節的離線模式。每週都有人用的話，通常不會碰到。
- **匿名登入防濫用**：**不開 CAPTCHA**（Kai 決定：使用者大約 5 人），只靠 Supabase 預設的匿名登入頻率限制（依 IP）。如果網站公開後出現大量垃圾帳號或名字被搶註，再開 CAPTCHA（Cloudflare Turnstile），前端只需要改匿名登入那一段。
- **重設 PIN**：Kai 手動在 Supabase 後台更新該參加者的 `pin_hash`（`crypt('新PIN', gen_salt('bf'))`），並清空 `failed_attempts` 和 `locked_until`。
- **測試**：用 SQL 驗證 RLS：A 看不到、改不到 B 的票和筆記，未登入只能呼叫 `vote_counts()`，猜錯 5 次會鎖定。再用 Playwright 跑兩個獨立瀏覽器：取名 → 投票 → 另一個瀏覽器登入同名 → 看到同樣的選擇。

### 12.8 分期

| 期 | 內容 |
|---|---|
| 第一期 | 名字＋PIN 身分、立場題上雲、活動開始時鎖定並公布、「活動後」讀即時統計、場次檔新增 `startsAt` |
| 第二期 | 「我的想法」上雲同步 |
| 第三期 | 測驗、論證猜題、名詞卡的進度上雲同步 |

三期都做（Kai 決定），依序進行，每期完成後再開始下一期。

### 12.9 決定紀錄（Kai 已確認）

| # | 問題 | 狀態 |
|---|---|---|
| 1 | 沒取名能不能投票？ | **已決定**：不行，引導去取名 |
| 2 | 全體分布什麼時候顯示？ | **已決定**：活動開始時公布，同時擋住投票 |
| 3 | 活動開始後要不要鎖定？ | **已決定**：要（`startsAt`）。3.5 起立場題只有一輪，不再有「討論後」 |
| 4 | 頁面上要不要寫明主辦人看得到誰投了什麼？ | **已決定**：不用 |
| 5 | 忘記 PIN？ | **已決定**：Kai 手動重設 |
| 6 | 名字規則？ | **已決定**：不設禁用字，最長 5 個字 |
| 7 | 第二期（筆記上雲）、第三期（學習進度上雲）要不要做？ | **已決定**：兩期都做 |


---

## 修改紀錄

| 日期 | 版本 | 變更 |
|---|---|---|
| 2026-10-08 | 3.11 | 場次 `chip` 的主題從兩個字改成 3–6 個字（「11/15 自殺」→「11/15 自殺與理性」），內容檢查加上 chip 格式與日期。篩選欄整理：「已選」摘要（點 ✕ 取消、清除篩選移到這裡）、tag 和場次選項多時收起、tag chip 顯示筆數、拿掉側欄底部的「共 N 場」 |
| 2026-10-08 | 3.10 | 為之後擴充整理架構。**資料載入**（新增 2.6）：每一頁不再內嵌全部場次和概念卡，改成精簡列表、單場、題目資料、單張概念卡等形狀，由建置時產生的 `/data/*.json` 提供；首頁掛載後換場次時才抓那一場；概念卡彈窗和文字編輯器改成需要時才載入；新增建置輸出檢查（頁面齊全、payload 上限）。**內容**：schema 集中到 `lib/schema.ts`，內容檢查改成嚴格比對，新增題目 key 重複、時間超過片長、章節遞增、檔名日期、slug 格式、立場題選項數等規則；題目可加選填的 `id`；手寫型別和 schema 對不上時 typecheck 失敗。**儲存**：key 集中到 `STORAGE_KEYS`；立場題、論證卡、測驗作答改用題目 key（`{v: 2, …}`），舊格式讀取時換算；元件改用 `useProgress.ts` 的具名 composable；`writeDefaults: false`。**工具**：vitest 單元測試、CI workflow、deploy 加上型別檢查和測試、`.nvmrc`。第 12 節補上筆記類資料表、立場題 `question` 改成 text |
| 2026-10-08 | 3.9 | 筆記儲存：`salon-notes-{slug}`、`salon-review-notes` 改成連題目一起存（`{q, text}`，舊格式照讀）；`/notes` 新增「題目已修改」，題目改掉後對不到的筆記不再默默消失；localStorage 容量滿時提示「沒有存到」。討論題的「我的想法」改用 `<MarkdownEditor>` 卡片，和其他筆記一致，可以隨時收起。`/notes` 新增「作答紀錄」（`<NoteAnswers>`、`useQuizRecords`）：每一場測驗題答過的結果，先回想再看答案，可以直接寫複習筆記 |
| 2026-09-29 | 3.8 | 播放器新增「放大影片」（桌機），浮到畫面中間、不加遮罩，頁面照樣可以捲動，可以拖曳移動，預設在側欄。「看之前」單欄改成置中 |
| 2026-09-29 | 3.7 | 「看之前」不顯示側欄，開始播放後才出現；「邊看邊想」只在最後一段顯示「下一步」 |
| 2026-09-29 | 3.6 | 12.7 匿名登入不開 CAPTCHA（Kai 決定：使用者約 5 人），只靠預設頻率限制，出現濫用再開 |
| 2026-09-29 | 3.5 | 立場題拿掉「討論後」，只有一輪（Kai 決定）：`<SundayVote>` 改成一列選項，`salon-vote-{slug}` 改成 `{題目索引: 選項}`，`recap.votes` 改成每題一個人數陣列，「活動後」改成「大家的立場」。第 12 節拿掉 `endsAt` 與 `votes.phase` |
| 2026-09-29 | 3.4 | 新增第 12 節「身分與雲端資料（Supabase）」：名字＋4 位數 PIN（最長 5 字、沒取名不能投票、忘記 PIN 由 Kai 重設）、匿名登入連結裝置、資料表與 RLS、活動開始時鎖定並公布立場題、三期都做。規格已確認，尚未實作 |
| 2026-09-29 | 3.3 | 依參加者試用回饋調整：場次標頭只在「看之前」；影片長度改成 `duration` 並顯示「48 分鐘」、標頭顯示全場總長；字幕說明移到播放器下方並改寫（影片有內嵌中文字幕）；手機「播放這一講」；子分頁完成打勾；自我測驗預設打亂、出處作答後才顯示；討論題「我的想法」（`salon-notes-{slug}`）與「複製我的筆記」；「活動後」新增 `recap`。不做：網站上的活動資訊（時間、連結、報名）、事先收集問題、複習提醒 |
| 2026-09-29 | 3.2 | 「邊看邊想」改成子分頁（講座 5｜講座 6｜講座 7｜整合回顧），一次一段；切換時播放器 `cue()` 換片、章節清單跟著換。章節清單一次只列一支影片，上方有影片切換按鈕。新增 `salon-during-part-{slug}` |
| 2026-09-29 | 1.0 | 初版：五個分頁、論證地圖預測試、白紙回想、測驗、名詞卡自評、立場題、內嵌播放器 |
| 2026-09-29 | 2.0 | 改寫成 Nuxt 4 + Nuxt UI 4 + Tailwind CSS 4 + VueUse + TypeScript，用 `nuxt generate` 輸出靜態網站。每場一個網址 `/s/{id}`。資料改成 TypeScript 型別、每場一個檔案。v1 移到 `legacy/index.html` 凍結。新增 GitHub Pages 部署 workflow（目前只能手動觸發）。網站名稱從「週日沙龍」改為「悅讀聊天室」，repo、網址前綴、localStorage key、元件名稱沿用舊名 |
| 2026-09-29 | 3.0 | 內容改用 Nuxt Content 3：場次是 `content/sessions/{年}/` 下的 YAML，概念卡是 `content/concepts/{id}.md`，tag 受控於 `taxonomy.yml`。新增概念卡模型（參考 Zettelkasten／Heptabase 形式）：`[[wikilink]]`、反向連結、相關概念。新增 `/archive`（依月份、依主題）、`/concepts`、`/c/{id}`，場次網址改為 `/s/{slug}`。新增「延續討論」（主辦人推薦＋共同概念）。頂部列改成三個導覽，移除場次 chip，分頁只在場次頁。新增建置前內容檢查 `npm run check`。欄位 `id` → `slug`、`date` 改 ISO 並新增 `dateLabel`、移除 `terms`。`salon-cards-{slug}` 改用概念卡 id。初次載入同時保留 hash 與 query。每週流程改成 Claude 提案、Kai 確認 |
| 2026-09-29 | 3.1 | 「邊看邊想」改成逐支影片分段：影片標頭 → 帶著這個問題看 → 論證 → 看完這段，測一下 → 想一想（「我想好了，看 Kagan 怎麼說」），最後是「整合回顧」。「看完回想」保留全部題目打亂的自我測驗，作答和邊看邊想分開存（新增 `salon-quiz-inline-{slug}`）。「週日討論」移除「進行方式」，改成立場題＋依影片分組的「討論議題」，和邊看邊想共用 `discuss`。`quiz` 改成 `{scope, q, o, a, e, refs}`（移除 `t`），`discuss` 改成 `{scope, q, note?, ext, answer, refs}`。內容檢查新增 `scope` 與每支影片至少一題測驗、一題討論的規則。新增 `utils/videoRef.ts`、`study/` 元件，移除 `sunday/Discuss.vue`。每週流程加上逐支影片寫題 |
