# 悅讀聊天室 功能規格

> 版本 3.0 ・ 2026-09-29
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

**瀏覽器端沒有資料庫**：所有頁面都是預先產生的。查詢在建置階段執行，結果存進每頁的 payload，瀏覽器只讀 payload，不下載 SQLite，也不需要 WASM。`better-sqlite3` 只在 `npm install` 和建置時用到。

### 2.2 輸出與發佈

- 用 `npm run generate` 輸出**純靜態檔案**到 `.output/public`，可以直接放上 GitHub Pages。這個指令會先跑內容檢查，檢查失敗就不建置。
- 部署設定在 `nuxt.config.ts`：`nitro.preset: 'github_pages'`，網址前綴由環境變數 `NUXT_APP_BASE_URL` 決定（部署時是 `/sunday-salon/`，本機是 `/`）。
- 預先產生的頁面從 `/`、`/archive`、`/concepts` 開始，順著連結爬出所有場次頁與概念卡頁（`crawlLinks`）。所以**每一場都要出現在 `/archive`，每一張概念卡都要出現在 `/concepts`**，否則不會被產生。
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
├── content/                         # 所有內容（見第 7 節）
│   ├── sessions/2026/10-04-靈魂.yml  # 每場一個檔案，依年份分資料夾
│   ├── concepts/soul.md             # 每張概念卡一個檔案，檔名就是 id
│   └── taxonomy.yml                 # tag 詞彙表
├── content.config.ts                # 內容 schema（zod）
├── lib/wikilinks.ts                 # [[概念名稱]] 轉連結的規則（建置與檢查共用）
├── scripts/check-content.mjs        # 建置前的內容檢查（見第 8 節）
├── app/
│   ├── app.vue                      # <UApp> + <NuxtPage>
│   ├── app.config.ts                # Nuxt UI 色票對應（primary / secondary / …）
│   ├── assets/css/main.css          # 設計 token（見 DESIGN.md）
│   ├── pages/
│   │   ├── index.vue                # /            → 最新一場
│   │   ├── s/[slug].vue             # /s/w1        → 指定場次
│   │   ├── archive.vue              # /archive     → 全部場次
│   │   ├── concepts/index.vue       # /concepts    → 概念卡牆
│   │   └── c/[id].vue               # /c/soul      → 單張概念卡
│   ├── components/
│   │   ├── SessionView.vue          # 單一場次的頁面骨架
│   │   ├── RelatedSessions.vue      # 延續討論
│   │   ├── VideoLink.vue            # 所有影片連結
│   │   ├── WhyNote.vue              # 學習法註記
│   │   ├── salon/Header.vue         # 頂部列
│   │   ├── concept/Card.vue         # 概念卡（卡片牆、相關概念）
│   │   ├── video/                   # Panel.vue、ChapterList.vue
│   │   ├── tab/                     # Before / During / Recall / Sunday / After
│   │   ├── argument/Card.vue        # 論證卡片
│   │   ├── recall/                  # Timeline / Questions / Quiz / Terms
│   │   └── sunday/                  # Vote / Discuss
│   ├── composables/
│   │   ├── useContent.ts            # 所有內容查詢的入口
│   │   ├── useRelatedSessions.ts    # 延續討論的計算
│   │   ├── usePlayer.ts             # 播放器共用狀態
│   │   └── useSalonStorage.ts       # 瀏覽器儲存
│   └── types/session.ts             # 元件用的型別（要和 content.config.ts 同步）
├── legacy/index.html                # v1 單一檔案版本（凍結）
├── public/                          # 原樣複製的靜態檔案（favicon 等）
├── .github/workflows/deploy.yml     # GitHub Pages 部署
├── nuxt.config.ts
├── DESIGN.md
└── SPEC.md
```

### 2.5 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 本機開發（`http://localhost:3000`） |
| `npm run check` | 內容檢查（見第 8 節） |
| `npm run generate` | 先跑 `check`，通過後輸出靜態網站到 `.output/public` |
| `npm run preview` | 預覽輸出結果 |
| `npm run typecheck` | 檢查 TypeScript 型別 |

也可以用 `npx serve .output/public` 預覽輸出的靜態檔案。

---

## 3. 資訊架構

### 3.1 網址

| 網址 | 內容 |
|---|---|
| `/` | 最新一場（`date` 最新的場次） |
| `/s/{slug}` | 指定場次，例如 `/s/w1`。找不到時顯示 404 |
| `…#before` 等 | 場次頁的網址 hash 對應分頁：`#before`、`#during`、`#recall`、`#sunday`、`#after`。可以直接分享某個分頁的連結 |
| `/archive` | 全部場次。可以切換「依月份」和「依主題」 |
| `/archive?tag=…` | 依主題篩選後的結果，可以分享 |
| `/concepts` | 概念卡牆，依「領域」分組 |
| `/c/{id}` | 單張概念卡，例如 `/c/soul`。找不到時顯示 404 |

- 場次頁沒有 hash 時，打開上次停留的分頁；第一次來的人從「看之前」開始。
- 切換分頁時會捲回頁面頂部。
- **實作注意**：靜態頁面初次載入時，Nuxt 路由會把網址換成預先產生頁面的路徑，**hash 和 query 都會在任何元件掛載前被拿掉**。所以 `nuxt.config.ts` 在 `<head>` 放了一行腳本，先把它們存到 `window.__salonInitialHash`、`window.__salonInitialSearch`。元件掛載時呼叫 `takeInitialLocation()`（`useContent.ts`）讀取一次，讀完就清掉。場次頁的分頁 hash 和 `/archive` 的 `?tag=` 都靠它。改動路由、分頁或篩選邏輯時不要拿掉它。
  - 另外，Nuxt 會在元件掛載**之後**再做一次網址修正（網址多了 query 或結尾的 `/` 時會改回產生時的路徑）。所以要把狀態**寫回網址**的頁面（例如 `/archive` 的 `?tag=`），必須等 `onNuxtReady()` 之後才寫，否則會被覆蓋。只改 hash 的場次頁不受影響。

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
│ 場次標頭（含 tag）     │          │ 播放器        │
│ 分頁內容              │          │ 目前章節      │
│ 延續討論（看之前、活動後）│        │ 章節清單 ×3   │
│ 下一步按鈕            │          └──────────────┘
│ 頁尾                  │
└──────────────────────┘
```

### 3.4 全部場次（`/archive`）

| 檢視 | 內容 |
|---|---|
| 依月份 | 所有場次依 `date` 分到各月份，新的在前。每場一張場次卡（日期、標題、tag） |
| 依主題 | 上方是依面向（領域／思想家／系列）分組的 tag。可以多選，結果是**同時符合所有選取 tag** 的場次（AND）。選取的 tag 寫進網址 `?tag=`，可以分享 |

- 從場次頁或概念卡上的 tag 點進來（`/archive?tag=…`）時，會直接打開「依主題」並選好那個 tag。

### 3.5 概念卡牆（`/concepts`）與概念卡頁（`/c/{id}`）

- 卡片牆依 tag 的「領域」分組，每張卡顯示詞條、英文與一句話定義（`summary`），點了進入 `/c/{id}`。
- 概念卡頁的區塊，由上到下：

| 區塊 | 內容 |
|---|---|
| 標頭 | 詞條、英文、別名、tag |
| 定義 | `summary` |
| 內文 | Markdown 內文，`[[概念名稱]]` 已轉成連到其他概念卡的連結 |
| 相關概念 | `related` 列出的概念卡 |
| 出現在這些場次 | 反向連結：`concepts` 裡有這張卡的所有場次，新的在前 |

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
| 時間不夠先看這幾段 | 精選片段（總長約一小時以內）＋字幕設定說明 | 點片段 → 播放器跳到該段 |
| 講者的立場 | 講者本人的觀點整理 | 收合 |
| 延續討論 | 相關場次（見 4.3） | 點了進入該場 |

### 5.2 邊看邊想（`during`，`<TabDuring>`）— 論證地圖

每個論證一張可以收合的卡片（`<ArgumentCard>`），標題列顯示「已作答／未作答」。

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
| 自我測驗 | `<RecallQuiz>` | 單選題。作答後鎖定選項，顯示正解、解析和原片段連結。分數即時更新。「打亂順序，重新作答」會清空作答紀錄並重新排序題目 |
| 名詞卡 | `<RecallTerms>` | 內容就是本場 `concepts` 列出的概念卡（詞條、英文、`summary`）。點卡片翻面 → 自評「還不熟／記得」。可以篩選「只看還不熟的」，上方顯示各狀態張數 |

### 5.4 週日討論（`sunday`，`<TabSunday>`）

| 區塊 | 元件 | 功能 |
|---|---|---|
| 進行方式 | — | 同儕教學四步驟：先各自表態 → 看分布 → 和立場不同的人互相說服 → 再表態 |
| 立場題 | `<SundayVote>` | 每題有「討論前」「討論後」兩列選項。兩次選擇不同時，提示「你從 A 改成了 B，是哪個理由說動你的？」 |
| 討論題 | `<SundayDiscuss>` | 帶編號的問題清單，超出影片內容的題目標上「延伸」 |

> 立場題的選擇**只存在每個人自己的瀏覽器**，網站看不到全體的分布。現場的立場分布要用會議軟體的投票功能統計。

### 5.5 活動後（`after`，`<TabAfter>`）

目前是待補狀態，下方有「延續討論」（見 4.3）。規劃中的內容：Podcast 連結（Spotify for Creators 或 YouTube）、錄音章節時間戳、討論回顧、精彩語錄。**格式待討論**（見第 11 節）。

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
| 手機 | 第一次點時間戳後 `playing` 變成 true，播放器固定在頂部。「收起影片」呼叫 `hide()`，暫停並隱藏播放器 |
| 字幕 | 會帶入 `cc_lang_pref=zh-Hant`，但 YouTube 的自動翻譯字幕仍需要使用者手動開啟（頁面上有說明） |

---

## 7. 資料結構

- 內容全部放在 `content/`，schema 定義在 `content.config.ts`（zod）。
- 元件使用的型別在 `app/types/session.ts`。**改欄位時兩邊要一起改。**
- 所有查詢都透過 `app/composables/useContent.ts`（`useAllSessions`、`useSession`、`useAllConcepts`、`useTaxonomy`），元件和頁面不要直接呼叫 `queryCollection`。

### 7.1 場次：`content/sessions/{年}/{月-日}-{主題}.yml`

每場一個檔案，依活動日期放進該年的資料夾，例如 `content/sessions/2026/10-04-靈魂.yml`。不需要另外登記，新增檔案就會出現在 `/archive`，日期最新的會成為首頁。

```yaml
slug: w1                          # 唯一值，用在網址與 localStorage key，發佈後不可以改
date: "2026-10-04"                # ISO 日期，要加引號。決定月份分組與排序
dateLabel: 2026 年 10 月 4 日（週日）   # 畫面上顯示的日期
chip: 10/4 靈魂                   # 短標籤：日期 + 兩個字的主題（頁面標題用）
eyebrow: Session 01 · Yale PHIL 176 Death
title: 靈魂存在嗎？如果存在，它會永生嗎？   # h1，用問句
lede: …                           # 一段導言
speaker: Shelly Kagan（耶魯大學哲學系）
tags: [心靈哲學, 柏拉圖, Yale PHIL 176 Death]   # 必須在 taxonomy.yml 裡
concepts: [soul, dualism, physicalism]        # 這場用到的概念卡 id
related:                          # 人工連結，沒有就寫 []
  - slug: w3
    reason: 同樣在問人死後還剩下什麼
captionTip: …                     # 字幕設定說明
picks:                            # 時間不夠看的片段：[講座標籤, videoId, 秒數, 起–迄, 說明]
  - [講座 5, S-fwH_uBPD0, 0, 00:00–15:20, …]
tldr: [ … ]                       # 3–6 點，可以用 <b>
stance:                           # [面向, 講者立場]
  - [靈魂存在嗎, …]
videos:
  - id: S-fwH_uBPD0
    lec: 講座 5 · 48:02
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
  - q: 立場題
    o: [選項, 選項]
discuss:                          # [題目, 補充說明, 是否延伸]
  - [ …, …, false ]
quiz:
  - q: 題目
    o: [選項, 選項, 選項]
    a: 0                          # 正解索引，從 0 開始
    e: 解析
    t: [S-fwH_uBPD0, 1037]        # 原片段
after: 活動後區塊的說明文字
```

2.0 → 3.0 的欄位變動：`id` 改名為 `slug`（值 `w1` 不變，localStorage 才不會失效）；`date` 改成 ISO 日期，原本的顯示文字移到 `dateLabel`；新增 `tags`、`concepts`、`related`；`terms` 移除，名詞卡改用本場的概念卡。

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
  - key: thinker
    label: 思想家
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
- 講者的觀點要寫成「Kagan 認為……」，不可以寫成事實（見 DESIGN.md「文案規範」）。
- 概念卡的 `summary` 只寫中立、通用的定義（見 4.2）。

---

## 8. 內容檢查

`scripts/check-content.mjs` 檢查 schema 管不到的跨檔案規則。執行 `npm run check`；`npm run generate` 會先自動執行。有任何錯誤就列出檔案和原因，並中止建置。

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
| 影片 id 不在本場 `videos` 裡 | 場次 `picks`、`args`、`quiz` |
| 檔案不在 `date` 年份的資料夾 | 場次 |

---

## 9. 瀏覽器儲存（localStorage）

全部存在使用者自己的瀏覽器，不會上傳，也不跨裝置同步。

- 一律透過 `useSalonStorage(key, 預設值)` 讀寫（包裝 VueUse 的 `useLocalStorage`）。
- 使用 `initOnMounted`：預先產生的 HTML 一律用預設值，頁面掛載後才讀 localStorage，避免 hydration 不一致。
- 無痕模式或儲存被封鎖時，VueUse 會退回記憶體中的值，網站照常運作，只是不會記住狀態。

| Key | 內容 |
|---|---|
| `salon-tab` | 上次停留的分頁 |
| `salon-arg-{slug}` | 論證卡片的猜題紀錄 `{卡片索引: 前提索引}`，`-1` 表示直接看答案 |
| `salon-quiz-{slug}` | 測驗 `{order: [題目順序], ans: {題目索引: 選項索引}}` |
| `salon-cards-{slug}` | 名詞卡自評 `{概念卡 id: 'shaky' 或 'known'}`（3.0 起） |
| `salon-vote-{slug}` | 立場題 `{題目索引: {pre: 選項, post: 選項}}` |

- `slug` 就是 2.0 的 `id`，值沒變，所以舊訪客的進度都還在。
- `salon-cards-{slug}` 在 3.0 改成用概念卡 id 當 key。2.0 用卡片索引（`"0"`、`"1"`）存的舊值會被忽略，名詞卡自評等於重來一次。
- `salon-session`（上次查看的場次）在 3.0 已不再使用。

> 修改資料結構時要考慮舊資料的相容性。例如 1.0 版測驗改成 `{order, ans}` 格式時，就有加上舊格式的判斷，避免舊訪客打開時出錯。

---

## 10. 每週更新流程

1. **取得來源**：用 `yt-dlp` 下載字幕並轉成帶時間戳的逐字稿，存到 `~/Documents/sunday-salon/`（逐字稿**不放進 repo**）。
2. **撰寫場次**：照第 7.1 節，新增 `content/sessions/{年}/{月-日}-{主題}.yml`。
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
   - 名詞卡、概念卡頁的反向連結、延續討論都正確
   - 暗色、淺色主題，390px 寬度沒有橫向捲軸
8. **發佈**：commit 並 push 到 GitHub。部署 workflow 啟用自動觸發後，push 到 `main` 就會自動更新網站；在那之前要到 GitHub Actions 手動執行（見第 11 節）。

---

## 11. 待決問題

| 問題 | 選項或備註 |
|---|---|
| 上線方式 | GitHub Pages 免費方案需要**公開 repo**。目前 repo 是私人、Pages 關閉。`.github/workflows/deploy.yml` 目前**只能手動觸發**（`workflow_dispatch`），等 Kai 確認後再開啟 push 到 `main` 自動部署 |
| 部署時的內容檢查 | `deploy.yml` 目前直接執行 `npx nuxt generate`，**不會跑內容檢查**。應改成 `npm run generate` |
| 「活動後」的格式 | Podcast 連結＋章節時間戳＋回顧摘要＋語錄？回顧要多詳細？ |
| 全體立場統計 | 目前只能用會議軟體投票。網站沒有伺服器，要做到網站上需要第三方服務（表單或資料庫） |
| 事先收集問題 | 公開網站的訪客無法寫入資料。可以放 Google 表單連結 |
| favicon | 目前沒有，放進 `public/` 即可 |
| Heptabase 匯入 | Kai 之後會透過 MCP 連線在 Heptabase 做筆記和討論。**未決定、未實作**：是否要把 Heptabase 的卡片匯入或同步成概念卡？同步方向、以哪邊為準都還沒定 |
| 語意相似（4.3 的 C） | 什麼時候加 embeddings？初步想法是累積約 30–40 場再評估，要在建置時算好，不能在瀏覽器呼叫 API |
| 概念卡命名慣例 | 譯名有多種時選哪個當 `title`？書名要不要加《》？人名概念（例如「笛卡兒的二元論」）要獨立成卡還是寫在內文？ |
| 圖譜或白板檢視 | 讀者之後需不需要看到概念卡之間的關係圖，或每場的白板檢視？目前只有列表 |

---

## 修改紀錄

| 日期 | 版本 | 變更 |
|---|---|---|
| 2026-09-29 | 1.0 | 初版：五個分頁、論證地圖預測試、白紙回想、測驗、名詞卡自評、立場題、內嵌播放器 |
| 2026-09-29 | 2.0 | 改寫成 Nuxt 4 + Nuxt UI 4 + Tailwind CSS 4 + VueUse + TypeScript，用 `nuxt generate` 輸出靜態網站。每場一個網址 `/s/{id}`。資料改成 TypeScript 型別、每場一個檔案。v1 移到 `legacy/index.html` 凍結。新增 GitHub Pages 部署 workflow（目前只能手動觸發）。網站名稱從「週日沙龍」改為「悅讀聊天室」，repo、網址前綴、localStorage key、元件名稱沿用舊名 |
| 2026-09-29 | 3.0 | 內容改用 Nuxt Content 3：場次是 `content/sessions/{年}/` 下的 YAML，概念卡是 `content/concepts/{id}.md`，tag 受控於 `taxonomy.yml`。新增概念卡模型（參考 Zettelkasten／Heptabase 形式）：`[[wikilink]]`、反向連結、相關概念。新增 `/archive`（依月份、依主題）、`/concepts`、`/c/{id}`，場次網址改為 `/s/{slug}`。新增「延續討論」（主辦人推薦＋共同概念）。頂部列改成三個導覽，移除場次 chip，分頁只在場次頁。新增建置前內容檢查 `npm run check`。欄位 `id` → `slug`、`date` 改 ISO 並新增 `dateLabel`、移除 `terms`。`salon-cards-{slug}` 改用概念卡 id。初次載入同時保留 hash 與 query。每週流程改成 Claude 提案、Kai 確認 |
