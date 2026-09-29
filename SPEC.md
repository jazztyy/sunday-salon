# 悅讀聊天室 功能規格

> 版本 3.4 ・ 2026-09-29
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
│   │   ├── study/                   # VideoSection / QuizItem / DiscussCard（邊看邊想、週日討論共用）
│   │   ├── recall/                  # Timeline / Questions / Quiz / Terms
│   │   └── sunday/                  # Vote
│   ├── composables/
│   │   ├── useContent.ts            # 所有內容查詢的入口
│   │   ├── useRelatedSessions.ts    # 延續討論的計算
│   │   ├── usePlayer.ts             # 播放器共用狀態
│   │   ├── useDiscussNotes.ts       # 討論題的「我的想法」筆記
│   │   └── useSalonStorage.ts       # 瀏覽器儲存
│   ├── utils/videoRef.ts            # 影片段落與長度的顯示文字（mmss、minutesLabel、totalLabel、lecOf、refLabel）
│   ├── utils/quizSignature.ts       # 題目簽章與文字雜湊（quizSignature、textHash）
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
- 場次標頭（標題、日期、講者、影片數與總長、tag）只在「看之前」顯示。切到其他分頁代表已經知道在哪一場，第一屏留給內容；頁面仍保留一個螢幕閱讀器才讀得到的 h1。
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
│ 場次標頭（只在看之前）  │          │ 播放器        │
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
| 想一想 | `discuss` 裡 `scope` 是這支的題目（`<StudyDiscussCard>`） | 可以先按「寫下我的想法」寫筆記（選填）。按「我想好了，看 Kagan 怎麼說」→ 顯示 `answer` 和參考段落連結；有筆記時兩者並排 |

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
| 立場題 | `<SundayVote>` | 每題有「討論前」「討論後」兩列選項。兩次選擇不同時，提示「你從 A 改成了 B，是哪個理由說動你的？」 |
| 討論議題 | `<StudyDiscussCard>` | 本場全部討論題，先依影片分組，最後是「整合回顧」。卡片和「邊看邊想」相同，一樣可以寫筆記、看 Kagan 怎麼說和參考段落。寫過筆記時出現「複製我的筆記」，把有筆記的題目依分組輸出成 Markdown（`# {chip}：我的討論筆記` → `## 講座 N：影片標題` → `### 題目` → 筆記），可以貼進 Heptabase 或任何筆記軟體 |

- 討論題只有一份資料（`discuss`），兩個分頁共用，不另外寫一套題目。
- 3.0 的「進行方式」（同儕教學四步驟）區塊已移除。

> 立場題的選擇**只存在每個人自己的瀏覽器**，網站看不到全體的分布。現場的立場分布要用會議軟體的投票功能統計。

### 5.5 活動後（`after`，`<TabAfter>`）

活動前顯示 `after` 的預告文字（「尚未舉行」）。活動結束後在場次檔加上 `recap`（格式見 7.1），分頁改成回顧，沒填的區塊不顯示：

| 區塊 | 資料 | 顯示 |
|---|---|---|
| 討論錄音 | `recap.audio`、`recap.chapters` | 錄音連結按鈕（開新分頁），下方列出錄音的時間戳（只顯示，不連結） |
| 立場變化 | `recap.votes` | 每題各選項「討論前% → 討論後%」和總人數。人數來自**現場會議軟體的投票**，Kai 活動後手動填入；網站本身不收票 |
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
| 手機 | 第一次點時間戳後 `playing` 變成 true，播放器固定在頂部。「收起影片」呼叫 `hide()`，暫停並隱藏播放器 |
| 字幕 | 會帶入 `cc_lang_pref=zh-Hant`。字幕說明（`captionTip`）顯示在播放器正下方。第一場的三支影片（Jason Hui 轉載版）畫面上已經**內嵌繁體中文字幕**，YouTube 的字幕軌是空的，所以不需要開字幕。換成其他影片時要重新確認，沒有內嵌字幕就改寫 `captionTip`。2026-09-29 實測過 `cc_load_policy=1` 和用 API 設定自動翻譯字幕：嵌入播放器的翻譯字幕請求被 YouTube 擋下（429），不可靠，所以沒有採用 |

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
startsAt: "2026-10-04T20:00:00+08:00"   # （第 12 節第一期新增）活動開始：鎖定並公布「討論前」、開放「討論後」
endsAt: "2026-10-04T22:00:00+08:00"     # （第 12 節第一期新增）活動結束：鎖定並公布「討論後」
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
  - q: 立場題
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
recap:                            # 活動結束後才加上，整段可以省略
  audio: { url: https://…, label: 收聽討論錄音 }   # 可省略
  chapters:                       # 錄音時間戳 [秒數, 段落]，可以是 []
    - [0, 開場]
  votes:                          # 依 votes 的題目順序，每題各選項的人數；沒有就寫 []
    - pre: [3, 4, 3]              # 討論前，數量要和選項一樣多
      post: [5, 3, 2]             # 討論後
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
- `quiz` 和 `discuss` 的 `scope` 只能是本場某支影片的 id，或 `'all'`。
- 每支影片至少要有一題測驗、一題討論；`'all'` 也至少各一題。
- 討論題的 `answer` 在影片沒回答時要直接說明（例如延伸題：「Kagan 在影片裡沒有談到……」），不可以替講者補答案。
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
| 影片 id 不在本場 `videos` 裡 | 場次 `picks`、`args`、`quiz` 與 `discuss` 的 `refs` |
| `scope` 不是本場影片 id 也不是 `'all'` | 場次 `quiz`、`discuss` |
| 某支影片或 `'all'` 沒有測驗題或討論題 | 場次 `quiz`、`discuss` |
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
| `salon-quiz-{slug}` | 「看完回想」的自我測驗 `{sig: 題目簽章, order: [題目順序], ans: {題目索引: 選項索引}}` |
| `salon-quiz-inline-{slug}` | 「邊看邊想」的測驗作答 `{sig: 題目簽章, ans: {題目索引: 選項索引}}`，索引是 `quiz` 陣列裡的位置（3.1 起） |
| `salon-during-part-{slug}` | 「邊看邊想」上次停在哪個子分頁：影片 id 或 `all`（3.2 起） |
| `salon-cards-{slug}` | 名詞卡自評 `{概念卡 id: 'shaky' 或 'known'}`（3.0 起） |
| `salon-vote-{slug}` | 立場題 `{題目索引: {pre: 選項, post: 選項}}` |
| `salon-notes-{slug}` | 討論題的「我的想法」`{題目文字的雜湊: 筆記}`（3.3 起）。用題目文字雜湊（`textHash()`）當 key，調整題目順序不影響；**改了題目文字，舊筆記就不再顯示** |

- `slug` 就是 2.0 的 `id`，值沒變，所以舊訪客的進度都還在。
- `salon-cards-{slug}` 在 3.0 改成用概念卡 id 當 key。2.0 用卡片索引（`"0"`、`"1"`）存的舊值會被忽略，名詞卡自評等於重來一次。
- `salon-session`（上次查看的場次）在 3.0 已不再使用。
- `salon-quiz-inline-{slug}` 和 `salon-quiz-{slug}` 分開存，所以隔天在「看完回想」重測時從頭開始。
- 兩者都記下**題目簽章**（`utils/quizSignature.ts`，由題目、選項、正解算出）。發佈後修改了任何一題，簽章就會不同，作答紀錄自動重置，避免舊答案對到新題目。
- 討論題的「看 Kagan 怎麼說」展開狀態不存。
- `salon-quiz-{slug}` 沒有紀錄或簽章不同時，掛載後直接存一個打亂的順序（預先產生的 HTML 用固定順序，避免 hydration 不一致）。

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
| 部署時的內容檢查 | `deploy.yml` 目前直接執行 `npx nuxt generate`，**不會跑內容檢查**。應改成 `npm run generate` |
| 錄音平台 | 「活動後」目前只放錄音連結。平台（Spotify、SoundCloud、YouTube…）決定後再考慮內嵌播放器，和剪輯流程一起討論 |
| 全體立場統計 | 目前：用現場會議軟體投票，人數填進 `recap.votes`；立場題存在各自的瀏覽器。**已決定的下一步**：接 Supabase，用「**名字＋4 位數 PIN**」辨識參加者（先取名的人拿到名字；換裝置輸入名字＋PIN 就看得到自己之前的選擇）。不用 IP 或瀏覽器指紋。規格草案見**第 12 節** |
| favicon | 目前沒有，放進 `public/` 即可。圖示還沒決定 |
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
| 上次的分頁、子分頁 | `salon-tab`、`salon-during-part-{slug}` | **不要** | 介面偏好，本來就該跟著裝置 |

不需要 Supabase 的：場次內容、概念卡、tag（仍是建置時產生的靜態資料）。已決定不做的：活動資訊、事先收集問題、複習提醒（見修改紀錄 3.3）。

### 12.2 身分：名字＋PIN

**使用者看到的流程**

1. **沒取名不能投票**（Kai 決定）：沒取名時點立場題的選項，會跳出「取名／登入」視窗，完成後再記下剛才點的選項。立場題上方提示「取個名字就能投票，換裝置也看得到自己的選擇」。
2. **取新名字**：輸入名字＋設定 4 位數 PIN（輸入兩次）。名字沒人用過就取得成功。上雲前就存在瀏覽器裡的舊選擇與筆記（`salon-vote-*`、`salon-notes-*`）**一起上傳**，上傳後清掉瀏覽器裡的版本。名字已被使用時顯示「這個名字已經有人用了，換一個，或用 PIN 登入」。
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

-- 立場題：同一人、同一場、同一題、同一階段只有一筆（再選就是改選）
votes (
  participant_id uuid not null references participants on delete cascade,
  session_slug   text not null,               -- 例：w1
  question       int  not null,               -- votes 的題目索引
  phase          text not null check (phase in ('pre', 'post')),
  choice         int  not null,
  updated_at     timestamptz not null default now(),
  primary key (participant_id, session_slug, question, phase)
)

-- 場次時程：決定兩輪投票的開放、鎖定與公布（12.5）。每週新增場次時一起寫入，時間和場次檔的 startsAt／endsAt 一致
sessions_schedule (
  session_slug text primary key,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null check (ends_at > starts_at)
)

-- 我的想法（第二期）：key 和瀏覽器版一樣用題目文字的雜湊
notes (
  participant_id uuid not null references participants on delete cascade,
  session_slug   text not null,
  question_hash  text not null,               -- textHash(題目)
  body           text not null check (char_length(body) <= 5000),
  updated_at     timestamptz not null default now(),
  primary key (participant_id, session_slug, question_hash)
)

-- 學習進度（第三期）：內容和瀏覽器版的 JSON 完全相同，一種進度一列
progress (
  participant_id uuid not null references participants on delete cascade,
  session_slug   text not null,
  kind           text not null check (kind in ('quiz', 'quiz-inline', 'arg', 'cards')),
  data           jsonb not null,              -- 例：quiz 是 {sig, order, ans}
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
| `vote_counts(session_slug)` | 任何人（不用登入） | 回傳每題每階段各選項的**人數**，不含任何身分資訊。**只回傳已經公布的階段**（12.5），還沒公布的階段一律不回傳，在資料庫裡擋，不靠前端隱藏 |

RLS：

- `participants`、`participant_devices`：前端**不能直接讀寫**，只能透過上面的函式（`security definer`）。
- `votes`、`notes`、`progress`：只能讀寫 `participant_id = current_participant()` 的列，也就是只看得到、改得到自己的。
- `votes` 的寫入另外檢查時程：只有在該階段開放期間（12.5）才能新增或修改，超過時間一律拒絕。
- 統計只透過 `vote_counts()`，不直接開放 `votes` 給別人讀。

### 12.5 立場題的新行為（第一期）

| 狀態 | 行為 |
|---|---|
| 沒取名 | 不能投票，點選項會跳出取名／登入視窗 |
| 已取名 | 選擇直接寫進 `votes`（樂觀更新：畫面先變，失敗再退回並提示） |
| 時程 | 場次檔新增 `startsAt`、`endsAt`（含時區，例 `"2026-10-04T20:00:00+08:00"`），同步寫進 `sessions_schedule`。開放、鎖定都在資料庫裡判斷，不能只靠前端 |
| 活動開始前 | 只能投「討論前」。「討論後」顯示「活動開始後開放」。**不公布任何分布**，只顯示「已有 N 人投票」 |
| 活動進行中（`startsAt` 到 `endsAt`） | 「討論前」**鎖定並公布**全體分布（所有人都看得到，不必自己投過）。「討論後」開放投票，還不公布 |
| 活動結束後（`endsAt` 之後） | 「討論後」**鎖定並公布**。頁面顯示兩輪的分布與變化，兩輪都不能再投 |
| 自己的選擇 | 任何時候都看得到自己兩輪選了什麼，以及「你從 A 改成了 B」的提示（沿用現有設計） |
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
- **匿名登入防濫用**：在 Supabase 開啟匿名登入時，同時開啟 CAPTCHA（Cloudflare Turnstile），並保留預設的匿名登入頻率限制。
- **重設 PIN**：Kai 手動在 Supabase 後台更新該參加者的 `pin_hash`（`crypt('新PIN', gen_salt('bf'))`），並清空 `failed_attempts` 和 `locked_until`。
- **測試**：用 SQL 驗證 RLS：A 看不到、改不到 B 的票和筆記，未登入只能呼叫 `vote_counts()`，猜錯 5 次會鎖定。再用 Playwright 跑兩個獨立瀏覽器：取名 → 投票 → 另一個瀏覽器登入同名 → 看到同樣的選擇。

### 12.8 分期

| 期 | 內容 |
|---|---|
| 第一期 | 名字＋PIN 身分、立場題上雲、兩輪時程（開放／鎖定／公布）、「活動後」讀即時統計、場次檔新增 `startsAt`／`endsAt` |
| 第二期 | 「我的想法」上雲同步 |
| 第三期 | 測驗、論證猜題、名詞卡的進度上雲同步 |

三期都做（Kai 決定），依序進行，每期完成後再開始下一期。

### 12.9 決定紀錄（Kai 已確認）

| # | 問題 | 狀態 |
|---|---|---|
| 1 | 沒取名能不能投票？ | **已決定**：不行，引導去取名 |
| 2 | 全體分布什麼時候顯示？ | **已決定**：活動開始時鎖定並公布「討論前」、開放「討論後」；活動結束時鎖定並公布「討論後」 |
| 3 | 「討論前」要不要在活動開始後鎖定？ | **已決定**：要（`startsAt`） |
| 4 | 頁面上要不要寫明主辦人看得到誰投了什麼？ | **已決定**：不用 |
| 5 | 忘記 PIN？ | **已決定**：Kai 手動重設 |
| 6 | 名字規則？ | **已決定**：不設禁用字，最長 5 個字 |
| 7 | 第二期（筆記上雲）、第三期（學習進度上雲）要不要做？ | **已決定**：兩期都做 |


---

## 修改紀錄

| 日期 | 版本 | 變更 |
|---|---|---|
| 2026-09-29 | 3.4 | 新增第 12 節「身分與雲端資料（Supabase）」：名字＋4 位數 PIN（最長 5 字、沒取名不能投票、忘記 PIN 由 Kai 重設）、匿名登入連結裝置、資料表與 RLS、兩輪投票時程（活動開始公布討論前、結束公布討論後）、三期都做。規格已確認，尚未實作 |
| 2026-09-29 | 3.3 | 依參加者試用回饋調整：場次標頭只在「看之前」；影片長度改成 `duration` 並顯示「48 分鐘」、標頭顯示全場總長；字幕說明移到播放器下方並改寫（影片有內嵌中文字幕）；手機「播放這一講」；子分頁完成打勾；自我測驗預設打亂、出處作答後才顯示；討論題「我的想法」（`salon-notes-{slug}`）與「複製我的筆記」；「活動後」新增 `recap`。不做：網站上的活動資訊（時間、連結、報名）、事先收集問題、複習提醒 |
| 2026-09-29 | 3.2 | 「邊看邊想」改成子分頁（講座 5｜講座 6｜講座 7｜整合回顧），一次一段；切換時播放器 `cue()` 換片、章節清單跟著換。章節清單一次只列一支影片，上方有影片切換按鈕。新增 `salon-during-part-{slug}` |
| 2026-09-29 | 1.0 | 初版：五個分頁、論證地圖預測試、白紙回想、測驗、名詞卡自評、立場題、內嵌播放器 |
| 2026-09-29 | 2.0 | 改寫成 Nuxt 4 + Nuxt UI 4 + Tailwind CSS 4 + VueUse + TypeScript，用 `nuxt generate` 輸出靜態網站。每場一個網址 `/s/{id}`。資料改成 TypeScript 型別、每場一個檔案。v1 移到 `legacy/index.html` 凍結。新增 GitHub Pages 部署 workflow（目前只能手動觸發）。網站名稱從「週日沙龍」改為「悅讀聊天室」，repo、網址前綴、localStorage key、元件名稱沿用舊名 |
| 2026-09-29 | 3.0 | 內容改用 Nuxt Content 3：場次是 `content/sessions/{年}/` 下的 YAML，概念卡是 `content/concepts/{id}.md`，tag 受控於 `taxonomy.yml`。新增概念卡模型（參考 Zettelkasten／Heptabase 形式）：`[[wikilink]]`、反向連結、相關概念。新增 `/archive`（依月份、依主題）、`/concepts`、`/c/{id}`，場次網址改為 `/s/{slug}`。新增「延續討論」（主辦人推薦＋共同概念）。頂部列改成三個導覽，移除場次 chip，分頁只在場次頁。新增建置前內容檢查 `npm run check`。欄位 `id` → `slug`、`date` 改 ISO 並新增 `dateLabel`、移除 `terms`。`salon-cards-{slug}` 改用概念卡 id。初次載入同時保留 hash 與 query。每週流程改成 Claude 提案、Kai 確認 |
| 2026-09-29 | 3.1 | 「邊看邊想」改成逐支影片分段：影片標頭 → 帶著這個問題看 → 論證 → 看完這段，測一下 → 想一想（「我想好了，看 Kagan 怎麼說」），最後是「整合回顧」。「看完回想」保留全部題目打亂的自我測驗，作答和邊看邊想分開存（新增 `salon-quiz-inline-{slug}`）。「週日討論」移除「進行方式」，改成立場題＋依影片分組的「討論議題」，和邊看邊想共用 `discuss`。`quiz` 改成 `{scope, q, o, a, e, refs}`（移除 `t`），`discuss` 改成 `{scope, q, note?, ext, answer, refs}`。內容檢查新增 `scope` 與每支影片至少一題測驗、一題討論的規則。新增 `utils/videoRef.ts`、`study/` 元件，移除 `sunday/Discuss.vue`。每週流程加上逐支影片寫題 |
