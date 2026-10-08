# 悅讀聊天室 設計系統

> 版本 3.14 ・ 2026-10-08 ・ 對應 `app/assets/css/main.css`、`app/app.config.ts`、`app/components/` 與 `app/pages/`
>
> 改任何畫面之前先讀這份。新增元件前先查「元件目錄」有沒有現成的。規格有變動時，**先改這份文件，再改程式**。
> 功能與資料結構請看 [SPEC.md](SPEC.md)。

---

## 1. 設計原則

1. **一次只做一件事。** 場次頁照學習階段分成五個分頁（看之前 → 邊看邊想 → 看完回想 → 週日討論 → 活動後），不把所有內容堆在同一頁往下滾。長內容一律收合。
2. **影片永遠在手邊。** 章節和播放器固定在側欄（手機版固定在頂部），不管讀到哪裡，一點時間戳就跳到影片對應的段落。
3. **狀態用形式表達，不只靠文字。** 質疑是紅色、接受是綠色、目前位置是金色，一眼就能看出來。
4. **視覺語彙取自題材。** 主色是「金星金」：第一場的晨星與昏星其實都是金星。輔色是「暮色藍」。不用 emoji，不用漸層，也不用裝飾性插圖。
5. **暗色是預設。** 夜空底色配金星金，最貼近題材，也適合晚上看影片。淺色主題保留，可以用頂部列的切換按鈕切換。兩個主題都要能用，不是只顧暗色。
6. **每個互動都有退路。** 猜題可以「直接看答案」，播放器可以「收起影片」，沒有播放器時時間戳就退回一般連結。
7. **概念是連結的單位。** 場次之間不直接比，而是透過共用的概念卡相連。讀者從任何一張卡都能走到談過它的場次。

---

## 2. 顏色

### 2.0 規則

- 元件裡**只能用下面列出的 utility class**（例如 `text-muted`、`bg-elevated`、`text-primary`、`bg-primary-soft`）。不能寫 hex、rgb、`style="color: …"`，也不能用 Tailwind 的原生色票（`text-amber-500`、`bg-slate-800`）。
- 同一個 utility 在暗色和淺色下自動換值，元件裡**不要寫 `dark:` 變體**來換顏色。
- 色值只在兩個地方改：
  - `app/assets/css/main.css`：`.dark { … }` 是暗色（預設），`:root { … }` 是淺色。**兩處要同步修改。**
  - `app/app.config.ts` 的 `ui.colors`：決定 Nuxt UI 的 `primary`／`secondary`／`success`／`error`／`neutral` 用哪一組色票。
- `main.css` 的 `@theme` 另外定義了三組 50–950 色票：`venus`（金星金）、`dusk`（暮色藍）、`mist`（霧灰）。這三組是給 Nuxt UI 元件內部產生色階用的（例如 `UButton` 的 hover），**元件裡不要直接寫 `text-venus-300` 之類的 class**，一律用語意 utility。

### 2.1 基礎色

| 角色 | Utility | 暗色（預設） | 淺色 | 用途 |
|---|---|---|---|---|
| 頁面底色 | `bg-default` | `#0E1120` | `#F2F3F6` | 頁面、頂部列、sticky 區塊的底色 |
| 卡片 | `bg-elevated`（或 `bg-muted`） | `#161A2C` | `#FFFFFF` | 卡片、收合區塊、選項按鈕 |
| 卡片內次層 | `bg-accented` | `#1E2339` | `#E9EBF1` | 前提列、回想答案 |
| 反相 | `bg-inverted` / `text-inverted` | `#E7E8EF` / `#0E1120` | `#1A1D2B` / `#F2F3F6` | 主要按鈕、選中的 chip |
| 主要文字 | `text-highlighted`（或 `text-default`） | `#E7E8EF` | `#1A1D2B` | 標題、正文、強調的數值 |
| 次要文字 | `text-toned` | `#B3B7C7` | `#474C60` | 導言、解析、定義 |
| 輔助文字 | `text-muted` | `#868BA1` | `#767B8F` | 說明、標籤、未選中的分頁 |
| 更淡的文字 | `text-dimmed` | `#5F6480` | `#9A9EB0` | 停用狀態。**不要用在需要閱讀的文字** |
| 邊框 | `border-default` | `#2B3149` | `#D6D9E3` | 邊框、分隔線 |
| 淡邊框 | `border-muted` | `#1E2339` | `#E9EBF1` | 卡片內的分隔 |
| 強調邊框 | `border-accented` | `#3A4160` | `#B3B7C7` | hover 時的框線 |

### 2.2 品牌色

| 角色 | Utility | 暗色（預設） | 淺色 | 用途 | 不可以用在 |
|---|---|---|---|---|---|
| 金星金（primary） | `text-primary` / `border-primary` | `#E2B455` | `#95680F` | **位置與重點**：目前分頁底線、目前章節、講座標籤、eyebrow、使用者選取的前提、focus 外框 | 大面積底色、正文 |
| 金星金淡底 | `bg-primary-soft` | `#2F2815` | `#F4E8CF` | 翻開的名詞卡底色 | 其他地方 |
| 暮色藍（secondary） | `text-secondary` | `#AAB0E8` | `#3D4378` | **連結與方法**：所有連結、時間戳、「學習法」標籤、callout 標題、「延伸」標籤 | 表示對或錯 |
| 暮色藍淡底 | `bg-secondary-soft` | `#232849` | `#E3E5F3` | callout 底色、學習法和延伸標籤的底色 | — |

### 2.3 語意色（只用來表示「判斷結果」）

| 角色 | Utility | 暗色（預設） | 淺色 | 用途 |
|---|---|---|---|---|
| 接受／答對 | `text-success` / `bg-success-soft` | `#6CC291` / `#16301F` | `#2C7549` / `#DCEEE3` | Kagan **接受**的前提、答對、猜中、已作答 |
| 質疑／答錯 | `text-error` / `bg-error-soft` | `#E88C82` / `#3B1D1B` | `#A03F38` / `#F6DFDC` | Kagan **質疑**的前提、答錯、標成「還不熟」的名詞卡 |

> 規則：語意色不能拿來裝飾或強調。要強調，用 primary（金星金）。Nuxt UI 元件的 `color` prop 也一樣：`color="success"`／`color="error"` 只用在判斷結果。

### 2.4 其他

| 角色 | Utility | 值 | 用途 |
|---|---|---|---|
| 遮罩 | `bg-scrim` | 暗 `rgba(0,0,0,.6)`／淺 `rgba(10,12,20,.45)` | 自訂遮罩。`UDrawer` 自帶遮罩，一般不用另外加 |
| 陰影 | Nuxt UI 預設 | — | 只有浮起的圖層（`UDrawer`）有陰影。卡片不加陰影 |

`bg-*-soft` 和 `bg-scrim` 是本專案自訂的 utility，定義在 `main.css` 最下方的 `@utility`，值來自 `--salon-*` 變數。

---

## 3. 字體

| 角色 | Utility | 字體 | 用在 |
|---|---|---|---|
| 標題 | `font-serif` | Noto Serif TC 600／900 | h1、h2、站名、名詞卡詞條、引導問題、章節側欄標題 |
| 內文與介面 | `font-sans`（預設） | Noto Sans TC 400／500／700 | 其他所有文字 |
| 資料 | `font-mono` | IBM Plex Mono 400／500 | 時間戳、講座標籤（`講座 5 · 17:17`）、前提編號（P1）、eyebrow、分頁步驟數字、分數 |

- 字型從 Google Fonts 載入（`nuxt.config.ts` 的 `app.head.link`），不使用 `@nuxt/fonts`（`ui.fonts: false`），因為中文字型要靠 Google Fonts 的 unicode-range 分片才不會太大。
- 每個字體都有系統字型當備援，定義在 `main.css` 的 `--font-*`。
- 數字會上下對齊的地方（章節時間、分數）加 `tabular-nums`。
- 英文 eyebrow 用 `uppercase tracking-[.12em]`。

---

## 4. 字級

**只能用下面這 10 級**。需要新的字級時，先在這份文件討論，確定後再加到 `main.css` 的 `@theme`。不要用 Tailwind 內建的 `text-sm`、`text-lg` 等字級。

| Utility | 大小 | 用途 |
|---|---|---|
| `text-label` | 11px | 小標籤：學習法、延伸、分頁步驟數字、測驗題的出處（講座標籤或「整合回顧」） |
| `text-meta` | 12px | mono 資訊：eyebrow、講座標籤、章節時間、名詞卡英文、卡片狀態 |
| `text-ui` | 13px | 次要介面：chip、章節名稱、學習法說明、文字連結按鈕、播放器狀態列、頁尾 |
| `text-small` | 14px | 說明文字：muted、測驗解析、質疑／接受說明、名詞定義、主要按鈕、分頁 |
| `text-body-sm` | 15px | 卡片內正文：callout、結論評語、測驗選項、Kagan 立場表 |
| `text-body` | 16px | 內文（body 預設） |
| `text-lead` | 17px | 導言（lede）、h3、引導問題 |
| `text-title` | 19px | 站名、名詞卡詞條、收合區塊的 +／− 符號 |
| `text-h2` | 24px | 段落標題 h2 |
| `text-h1` | clamp(28px, 5vw, 40px) | 場次標題 h1，每頁只有一個 |

行高：內文 1.75（body 預設）、標題 `leading-tight`～`leading-snug`、說明文字 `leading-relaxed`。h1–h3 在 `main.css` 已加上 `text-wrap: balance`。

---

## 5. 圓角、間距、版面

### 5.1 圓角

| Utility | 值 | 用在 |
|---|---|---|
| `rounded-tag` | 3px | 小標籤（學習法、延伸、質疑／接受徽章） |
| `rounded-control` | 4px | 按鈕、測驗選項、前提列、回想答案 |
| `rounded-card` | 6px | 卡片、收合區塊、callout、播放器 |
| `rounded-sheet` | 12px | 手機抽屜的上緣 |
| `rounded-full` | 999px | chip（場次、章節按鈕）、立場選項 |

Nuxt UI 元件的預設圓角由 `--ui-radius: 0.25rem`（4px，等於 `rounded-control`）控制。

### 5.2 間距

用 Tailwind 內建的間距 scale（`gap-4`、`px-4`、`p-3`……），不要寫 `gap-[18px]` 這種任意值。

| 用途 | Utility | 值 |
|---|---|---|
| 頁面左右留白 | `px-4` | 16px，**任何寬度都不能小於 16px** |
| 大段落之間（標頭、section、頁尾） | `gap-10` | 40px |
| section 內部元素之間 | `gap-4` | 16px |

元件內部的間距照「元件目錄」的現有元件對齊。排版一律用 flex 或 grid 搭配 `gap`，不要用 margin 堆疊。

### 5.3 版面

| 寬度 | 版面 |
|---|---|
| ≥ 1024px（`lg:`） | 兩欄：主內容（最寬 760px）＋側欄。有播放器時側欄 420px，沒有時 300px。整體最寬 1240px。**「看之前」不顯示側欄**：單欄置中、最寬 760px（和 `/archive` 一樣），點了精選片段開始播放後才變回兩欄。切換分頁時內容會左右移動，這是已知的取捨（Kai 選擇置中） |
| < 1024px | 單欄。章節清單收進「影片章節」抽屜（`UDrawer`）；開始播放後，播放器固定在頂部列下方，可以收起 |

- 斷點只用 Tailwind 預設的 `lg`（1024px）。v1 是 1000px，2.0 改成 1024px。
- 版面寬度（760／300／420／1240px）是唯一允許的任意值，只寫在 `SessionView.vue` 和各頁面（`archive.vue`、`concepts/index.vue`、`c/[id].vue`）的最外層容器。沒有側欄的頁面是單欄，最寬 760px。
- 頂部列固定在頂部，高度由 `<SalonHeader>` 量測後寫進 CSS 變數 `--tb`，其他 sticky 元素都以 `top-[var(--tb)]` 為基準。
- 頁面**絕對不能出現橫向捲軸**。在 390px 寬度測試。

---

## 6. 元件目錄

元件都在 `app/components/`，Nuxt 會自動 import，子資料夾的名稱會變成前綴（`video/Panel.vue` → `<VideoPanel>`）。新增內容時照這裡的元件組合，不要另外發明樣式。

### 6.1 頁面骨架

| 元件 | 檔案 | 內含 Nuxt UI | 用途與規則 |
|---|---|---|---|
| 場次頁 | `SessionView.vue` | `UButton`、`UDrawer` | 頂部列＋場次標頭＋分頁內容＋下一步＋頁尾＋側欄。分頁與網址 hash 同步。**場次標頭只在「看之前」顯示**，其他分頁把第一屏留給內容，改放一個 `sr-only` 的 h1 |
| 頂部列 | `salon/Header.vue`（`<SalonHeader>`） | `UTabs`、`UColorModeButton`、`UButton` | 站名＋導覽＋主題切換＋（手機）影片章節按鈕，場次頁多一列分頁。影片章節按鈕在 640px 以下只顯示圖示（`i-lucide-list-video`，保留 `aria-label`），避免把導覽擠出畫面。640px 以下站名降一級（`text-lead`）、間距收緊，**兩列在 360px 寬都不需要橫向捲動**：第二列分頁的 trigger 用 `px-1 gap-1`、文字 `text-ui`（640px 以上 `px-2.5 gap-1.5 text-small`）。**導覽層級**：第一列全站導覽**只用字色區分**（選中 `text-primary`、其他 `text-muted`，沒有底色也沒有底線）；第二列學習階段是這一頁的主導覽，**金色底線只給它用**，前面有場次標記「10/4 靈魂 ›」（`context`，640px 以上才顯示）。步驟數字不加框（`font-mono text-meta leading-none`），和文字垂直置中（trigger 用 `items-center`），目前階段的數字用 `text-primary`。sticky，底色 `bg-default`，量測自身高度寫進 `--tb`。所有頁面共用 |
| 導覽 | 在 `<SalonHeader>` 裡 | `UButton`（`color="neutral" variant="link"`） | 五項：本週（`/`）・全部場次（`/archive`）・概念卡（`/concepts`）・複習（`/review`）・筆記（`/notes`），`text-ui`。目前所在的項目用 `text-primary`。2.0 的場次 chip 列已移除 |
| 分頁 | 在 `<SalonHeader>` 裡 | `UTabs` | **只在場次頁顯示**（`/`、`/s/{slug}`）。五個學習階段，前面有 mono 步驟數字。選中的分頁用 `text-primary` 底線。**分頁數量固定是 5 個**，新功能放進現有的分頁 |
| 下一步 | 在 `SessionView.vue` 裡 | `UButton color="neutral"` | 每個分頁的底部，靠右一個主要按鈕「下一步：看完回想 →」，不另外加文字標籤和分隔線。「邊看邊想」只在最後一段（整合回顧）顯示，其他段落由「下一段」按鈕代替，**同一個畫面只有一個往下走的按鈕** |

### 6.2 分頁

| 分頁 | 檔案 | 元件 |
|---|---|---|
| 1 看之前 | `tab/Before.vue` | `<TabBefore>` |
| 2 邊看邊想 | `tab/During.vue` | `<TabDuring>` |
| 3 看完回想 | `tab/Recall.vue` | `<TabRecall>` |
| 4 週日討論 | `tab/Sunday.vue` | `<TabSunday>` |
| 5 活動後 | `tab/After.vue` | `<TabAfter>` |

每個分頁元件都收 `session: Session` 一個 prop。

### 6.3 文字區塊

| 元件 | 寫法 | 用途與規則 |
|---|---|---|
| 場次標頭 | `SessionView.vue` 的 `<header>` | 只在「看之前」顯示。eyebrow（`font-mono text-meta text-primary`）＋h1（本場問題，用問句）＋meta（日期／講者／影片支數與總長「約 2 小時 10 分」）＋tag 列（見 6.8「tag 標籤」） |
| 導言 | `text-lead text-toned` | 一段話說明這場在談什麼。只出現在「看之前」 |
| 重點清單 | `<ul>` + 金色圓點 | 3–6 點，每點 1–2 句 |
| 學習法註記 | `WhyNote.vue`（`<WhyNote>`） | 說明某個設計**為什麼**這樣做，一句話。自動加上「學習法」標籤（`bg-secondary-soft text-secondary`）。每個 section 最多一則 |
| 次要說明 | `text-small text-muted` | 操作說明、補充資訊 |
| 重點提示框 | `bg-secondary-soft rounded-card` | 每個分頁最多一個，用在「時間不夠看哪幾段」這類捷徑資訊 |

### 6.4 容器

| 元件 | Nuxt UI | 用途與規則 |
|---|---|---|
| 收合區塊 | `UCollapsible` | 長內容一律收合。觸發列右側顯示 ＋／−，`bg-elevated rounded-card border-default` |
| 引導問題卡 | — | 每支影片一題，`font-serif`，上方標講座 |
| 複習節奏 | `recall/Timeline.vue`（`<RecallTimeline>`） | 4 格，`grid` 自動換行 |

### 6.5 按鈕

一律用 `UButton`，不要自己寫 `<button class="…">` 做按鈕外觀。

| 種類 | `UButton` 寫法 | 用途 |
|---|---|---|
| 主要按鈕 | `color="neutral"`（solid，預設） | 反相底色。每個畫面最多一個主要動作（例如「下一步」） |
| 次要按鈕 | `color="neutral" variant="outline"` | 有邊框、沒有底色。重設、篩選、收起影片 |
| 文字按鈕 | `color="secondary" variant="link"` | 看起來像連結。「直接看答案」「重新猜」「對照重點」 |
| 揭曉按鈕 | `color="secondary" variant="subtle"`＋`trailing-icon="i-lucide-chevron-down"` | 暮色藍外框＋淡底加向下箭頭（soft 在暗色主題太淡），一眼看得出可以點；打開後箭頭轉 180°、文字變「收起 Kagan 的觀點」。討論題的「我想好了，看 Kagan 怎麼說」。不要用 ghost（沒有底色會看起來像一般文字） |

按鈕文字用動詞開頭，直接說出按下去會發生什麼事，例如「打亂順序，重新作答」。

### 6.6 影片

| 元件 | 檔案 | 內含 Nuxt UI | 用途與規則 |
|---|---|---|---|
| 播放器面板 | `video/Panel.vue`（`<VideoPanel>`） | `UButton`（收起影片）、`UIcon` | 呼叫 `usePlayer().mount()` 建立播放器。只在 `embed` 為 true（YouTube API 載入成功）時顯示播放器。下方狀態列顯示「講座 N・目前章節」，再下面是字幕說明（`captionTip`，`i-lucide-captions` 圖示＋`text-meta text-muted`）：語言是看影片的第一個門檻，所以放在播放器正下方。**放大**（1024px 以上）：狀態列右側有次要按鈕「放大影片」（`i-lucide-maximize-2`），按下去播放器浮到畫面中間（`fixed` 置中、最寬 `max-w-3xl`、`bg-default rounded-card border-default` 加陰影）。**不加遮罩**：懸浮視窗以外的地方照樣可以捲動和點擊，邊看影片邊讀內容。側欄原位留一塊 `border-dashed` 的占位，裡面有「縮回側欄」。**可以拖曳**：懸浮視窗側邊垂直置中凸出一個小分頁當把手（只有 `i-lucide-grip-vertical` 圖示，`aria-label="拖曳移動"`，`bg-default border-default`，靠外的兩角 `rounded-card`，`cursor-grab`）。**把手永遠朝向畫面中間**：視窗中心在右半邊（含一開始置中）時把手在左側，拖過中線到左半邊時換到右側，拖曳中即時切換；把手那一側留出把手寬度，另一側可以貼齊畫面邊緣。**平常隱藏**，滑鼠碰到把手的位置、或經過視窗邊框與狀態列時淡入，拖曳中保持顯示。滑鼠停在影片畫面上時偵測不到（YouTube iframe 是跨網域，外層頁面收不到任何事件），所以把手放在視窗外側：從那一側靠近時一定先經過它。按住就能移動，視窗和把手都不會拖出畫面。每次放大都從中間開始，視窗大小改變時回到中間。按「縮回側欄」（`i-lucide-minimize-2`）或按 Esc 回到側欄。預設在側欄，不記住狀態。放大只切換同一個元素的樣式，**不可以用 Teleport 或搬動 DOM**，iframe 一搬就會重新載入、中斷播放 |
| 章節清單 | `video/ChapterList.vue`（`<VideoChapterList>`） | `UButton` | **一次只列一支影片的章節**，上方有「講座 N」切換按鈕（膠囊，選中為 solid），預設跟著播放器目前的影片。目前播放的章節用 `text-primary font-bold`。側欄和手機抽屜共用 |
| 影片子分頁 | `tab/During.vue` | `UTabs`（`variant="pill"`、`color="neutral"`） | 「邊看邊想」的講座 5｜講座 6｜講座 7｜整合回顧。該段測驗全部作答後，標籤前面加 `i-lucide-circle-check`（`text-success`）。sticky 在頂部列下方（`top-[var(--tb)]`、`bg-default`），每段底部有 outline 的「下一段：… →」。最後一段沒有「下一段」，改由頁面的「下一步」主要按鈕接手 |
| 抽屜 | `SessionView.vue` 裡的 `UDrawer` | `UDrawer` | 手機版的章節清單。點遮罩或按 Esc 關閉，點章節後自動關閉 |
| 時間戳連結 | `VideoLink.vue`（`<VideoLink vid t>`） | — | **所有指向影片的連結都要用 `<VideoLink>`**，不可以手寫 `<a href="https://www.youtube.com/…">`。有播放器時攔截點擊改成跳段，沒有時開新分頁 |
| 段落連結 | `<VideoLink>` ＋ `utils/videoRef.ts` | — | 測驗解析、討論答案下方的 `refs`。每段一個連結，文字用 `refLabel()` 產生（`▸ 講座 5 · 17:17`），`font-mono text-meta`，多段時 `flex-wrap` 橫排。秒數格式一律用 `mmss()`，講座標籤用 `lecOf()`，不要各自手寫 |
| 影片長度 | `utils/videoRef.ts` | — | **長度一律寫成「分鐘」**（`minutesLabel()` →「48 分鐘」、總長 `totalLabel()` →「約 2 小時 10 分」），不可以用 mm:ss，否則會被看成時間點。講座標籤和長度之間用「・」：「講座 5・48 分鐘」 |

### 6.7 學習互動

| 元件 | 檔案 | 內含 Nuxt UI | 狀態 |
|---|---|---|---|
| 論證卡片 | `argument/Card.vue`（`<ArgumentCard>`） | `UCollapsible`、`UBadge`、`UButton` | 未作答：前提可以點選 → 已作答：前提依判斷標成「質疑」（`text-error`）或「接受」（`text-success`），並顯示結論評語。使用者選的前提加上 `border-primary` 金框。標題列用 `UBadge` 顯示「已作答／未作答」 |
| 前提列 | 在 `<ArgumentCard>` 裡 | — | 左側是 mono 編號 P1、P2……；結論列用 ∴，上方有粗線 |
| 判斷徽章 | 在 `<ArgumentCard>` 裡 | `UBadge variant="outline"` | 「質疑」（`color="error"`）「接受」（`color="success"`）的框線小標籤，`rounded-tag` |
| 影片分段 | `study/VideoSection.vue`（`<StudyVideoSection>`） | `UButton` | 「邊看邊想」每支影片一段，照順序排。標頭（講座標籤與長度、標題、「從頭播放」；1024px 以下改成主要按鈕「▶ 播放這一講」，因為手機的播放器平常是收起來的）→ 帶著這個問題看 → 論證 → 看完這段，測一下 → 想一想。所有影片之後是「整合回顧」，放 `scope: all` 的題目 |
| 回想題 | `recall/Questions.vue`（`<RecallQuestions>`） | `UCollapsible` | 問題＋收合的「對照重點」 |
| 測驗題 | `study/QuizItem.vue`（`<StudyQuizItem>`） | — | 單題。**本身不存狀態**，作答由父元件保管，透過 `pick` prop 傳入、`pick` 事件回報。題目上方標出處（講座標籤或「整合回顧」，`font-mono text-label text-muted`）；`sourceAfterAnswer` 時作答後才顯示（出處本身就是提示）。選項作答後鎖定：正解 `border-success bg-success-soft`、選錯 `border-error bg-error-soft`，下方顯示「答對了。／再想想。」、解析和段落連結。「邊看邊想」和「看完回想」共用 |
| 自我測驗 | `recall/Quiz.vue`（`<RecallQuiz>`） | `UButton` | 用 `<StudyQuizItem>` 列出本場全部題目（含整合回顧），**第一次打開就是打亂的順序**，出處作答後才顯示，上方顯示分數。「打亂順序，重新作答」清空紀錄 |
| 討論卡 | `study/DiscussCard.vue`（`<StudyDiscussCard>`） | `UBadge`、`UButton` | `bg-elevated rounded-card border-default`。題目（`text-body font-medium`）＋補充說明（`text-small text-muted`）。延伸題加「延伸」標籤（`bg-secondary-soft text-secondary`）。按鈕列：揭曉按鈕＋筆記切換鈕（`variant="ghost"`；收起時是 `i-lucide-pencil-line`「寫下我的想法」或「看我的想法」，打開時是 `i-lucide-chevron-up`「收起我的想法」）。筆記小卡右上角也有收起圖示。有筆記時預設打開，收起狀態只在這次瀏覽有效。「我的想法」是一張 `rounded-control border-default bg-default` 小卡，裡面是 `<MarkdownEditor>`（label 註明「支援 Markdown，會收進「筆記」頁」），和概念卡、複習的筆記一致。「我想好了，看 Kagan 怎麼說」展開 `bg-accented rounded-control` 區塊：「Kagan 怎麼說」小標＋`answer`（`text-small text-toned`）＋段落連結。**兩者都打開時並排**（768px 以上兩欄），方便對照。展開狀態只在這次瀏覽有效，不存；筆記存在瀏覽器。「邊看邊想」和「週日討論」共用 |
| 名詞卡 | `recall/Terms.vue`（`<RecallTerms>`） | `UButton` | 卡片來自本場 `concepts` 的概念卡（詞條、英文、`summary`）。未翻開 → 翻開（`bg-primary-soft`）並顯示自評按鈕。hover 效果加在整張卡（`has-[>button:hover]:`），不加在裡面的翻面按鈕上，翻開後才不會上下兩截不同色。標成「還不熟」時加 `border-error` 紅框。自評以概念卡 id 儲存 |
| 立場題 | `sunday/Vote.vue`（`<SundayVote>`） | `UButton`（`rounded-full`） | 題目下方一列 pill，選中的用 solid。只有一輪 |
| 討論議題 | 在 `<TabSunday>` 裡 | `UButton` | 全部討論題，依影片分組（組標題是講座標籤與影片標題），最後一組是「整合回顧」。每題一張 `<StudyDiscussCard>`。有寫筆記時，標題右側出現次要按鈕「複製我的筆記」（Markdown），完成後用 toast 回饋。3.0 的 `<SundayDiscuss>` 已移除 |
| 待補區塊 | 在 `<TabAfter>` 裡 | — | `border-dashed border-default`，用在「尚未舉行」這類還沒有內容的區塊 |
| 活動回顧 | `tab/After.vue`（`<TabAfter>`） | `UButton` | 有 `recap` 時取代待補區塊。依序：討論錄音（主要按鈕＋`i-lucide-headphones`，下方時間戳列表，只顯示不連結）→ 大家的立場（每題一張 `bg-elevated` 卡，題目後面是總人數，各選項右側是比例，`font-mono text-meta`）→ 現場冒出的問題 → 這場新增的概念卡（`<ConceptCard>` 兩欄）。沒有資料的區塊整個不顯示 |

### 6.8 瀏覽與概念卡

| 元件 | 檔案 | 內含 Nuxt UI | 用途與規則 |
|---|---|---|---|
| tag 標籤 | 場次標頭、場次卡、概念卡頁裡 | `UBadge color="neutral" variant="outline"` | `rounded-tag text-label`，連到 `/archive?tag={tag}`。**tag 不用 primary 或語意色**，它是分類，不是重點或判斷 |
| 場次卡 | `pages/archive.vue` 裡 | — | `bg-elevated rounded-card border-default`，整張可以點，連到 `/s/{slug}`。內容：日期（`font-mono text-meta text-muted`，用 `dateLabel`）、標題（`font-serif`）、tag 列。hover 時 `border-accented` |
| 月份標題 | `pages/archive.vue` 裡 | — | 「依月份」檢視的分組標題，`h2` |
| 檢視切換 | `pages/archive.vue` 裡 | `UTabs` | 「依月份」「依主題」兩個選項 |
| 篩選版面 | `filter/Layout.vue`（`<FilterLayout>`） | — | 列表頁共用的兩欄版面：左邊 232px 的篩選欄（`lg` 以上 sticky 在頂部列下方，太高時自己捲動；手機放在上方），右邊內容。`/archive`、`/concepts`、`/review`、`/notes` 共用 |
| 筆記卡 | `note/Card.vue`（`<NoteCard>`） | `UBadge`、`UButton` | `/notes` 的卡片，外觀同場次卡。種類的名稱和徽章顏色讀 `utils/noteKinds.ts` 的 `NOTE_KINDS`，不要在元件裡另外寫 |
| 筆記視窗 | `note/Sheet.vue`（`<NoteSheet>`）、`note/SheetProp.vue`（`<NoteSheetProp>`） | `UModal` | 仿 Heptabase 卡片的文件式視窗：上方徽章＋灰字提示＋關閉，serif 大標，一排屬性（圖示＋名稱），分隔線下面是內容。筆記和作答紀錄共用 |
| 筆記小卡 | `NoteField.vue`（`<NoteField>`） | `<LazyMarkdownEditor>` | `rounded-control border-default bg-default` 小卡：名稱＋灰字說明，可以加收起的 ✕。討論卡的「我的想法」、作答紀錄的筆記用；概念卡的側欄筆記版面不同，不用它 |
| 場次分組標題 | `SessionGroupHeading.vue`（`<SessionGroupHeading>`） | — | 場次 chip 連結＋「N 則／題」＋下一行題目。筆記、作答紀錄共用 |
| tag 篩選 pill | `filter/Chips.vue`（`<FilterChips>`） | `UButton`（`rounded-full`） | 一組 chip：前面有面向名稱（`text-ui text-muted`），`role="group"` 用 `useId()` 接 `aria-labelledby`。未選取 `color="neutral" variant="outline"`；選取後 solid，並設 `aria-pressed`。`multiple` 可以多選（v-model 是陣列）；單選時可以加 `all-label` 的「全部」chip（對應 null）；有 `count` 時顯示成「{名稱} {數量}」。依面向（領域／人物／系列）分組時每組一個 `<FilterChips>`。選項多時用 `limit` 收起：`rank="count"` 留筆數最多的（tag），否則留前面的（場次，新的在前）；後面接 `variant="link"` 的「顯示全部（N）」／「收起」，已選的一定顯示，至少多出 3 個才收。**`list`**：一行一個的直排清單，日期放在固定寬度的左欄（`font-mono text-meta`），主題對齊；選中的那行 `bg-inverted text-inverted`，hover `bg-accented`。場次名稱長短不一，排成 pill 會參差不齊 |
| 篩選搜尋框 | `filter/Search.vue`（`<FilterSearch>`） | `UInput` | 搜尋圖示＋有字時出現清除鈕 |
| 場次下拉選單 | `filter/Select.vue`（`<FilterSelect>`） | `USelectMenu` | 單選的場次篩選（概念卡、筆記、作答紀錄）：一行的下拉選單，沒選時顯示「全部場次」，可以打字搜尋（主題或日期），選項是固定寬度的日期欄＋主題；選了之後右邊有 ✕ 清除。場次一年多 52 個，攤開成 chip 太長 |
| 複習範圍 | `filter/ScopePicker.vue`（`<FilterScopePicker>`） | `<FilterChips>` | 三個單選 pill（全部討論過的／最近 4 場／自己選，附題數）；「自己選」時下面出現依月份分組的勾選清單：月份標題是可收合的按鈕（`aria-expanded`，`text-meta text-muted`），右邊是 `variant="link"` 的全選；每一行 `role="checkbox"`，左邊是勾選框，日期欄同 `<FilterChips list>`，選中 `bg-inverted text-inverted`，hover `bg-accented`，`rounded-control`。還沒討論的場次沒勾時淡一點 |
| 概念卡牆的一組 | `concept/Row.vue`（`<ConceptRow>`） | `UButton` | 標題（領域＋「N 張」）＋卡片網格（手機一欄、`sm` 兩欄、`xl` 三欄，`gap-3`）。預設兩排，下面 `variant="link"` 的「顯示全部（N 張）／收起」（chevron、`aria-expanded`、`aria-controls`），只在有卡被收起時出現；有篩選時全部展開。收起用 CSS 隱藏，卡片仍在 DOM 裡（上一則／下一則要用） |
| 上一則／下一則 | `concept/Pager.vue`（`<ConceptPager>`） | `UIcon` | 一列：左「‹ 上一則・詞條」、中間 `font-mono text-meta text-dimmed` 的「3 / 12」、右「下一則・詞條 ›」；「上一則」「下一則」用 `text-dimmed`，詞條太長就截斷，hover `bg-accented`。彈窗裡固定在底部（`sticky bottom-0`、半透明 `bg-default` 加模糊），`/c/{id}` 頁面放在卡片下方 |
| 編輯器骨架 | `MarkdownEditorSkeleton.vue`（`<MarkdownEditorSkeleton>`） | `USkeleton` | 工具列＋三行字，和 `<MarkdownEditor>` 同高（換成真的編輯器時不跳）。`ClientOnly` 的 fallback，也用在 `<Suspense>` 等編輯器程式碼下載時 |
| 已選摘要 | `filter/Summary.vue`（`<FilterSummary>`） | `UButton` | 篩選欄搜尋框下面：「已選」＋右邊的「清除篩選」文字按鈕，下面一排已選條件（`color="primary" variant="subtle"`、`rounded-full`、後面 `i-lucide-x`，點了取消）。沒有任何條件時整個不顯示 |
| 結果數 | `filter/Status.vue`（`<FilterStatus>`） | — | 「共 N 場」只給螢幕閱讀器（`sr-only`、`aria-live="polite"`），畫面上不顯示 |
| 概念卡 | `concept/Card.vue`（`<ConceptCard>`） | — | 卡片牆和「相關概念」共用。`bg-elevated rounded-card border-default`，整張可以點，連到 `/c/{id}`。內容：詞條（`font-serif text-title`）、英文（`font-mono text-meta text-muted`）、`summary`（`text-small text-toned`） |
| 概念卡牆 | `pages/concepts/index.vue` | — | 依「領域」分組，每組一個 `h2`，下方用 `grid` 排 `<ConceptCard>`，手機一欄 |
| 概念卡頁 | `pages/c/[id].vue` | — | 由上到下：標頭（詞條 `h1`、英文、別名、tag 列）→ 定義（`summary`，`text-lead text-toned`）→ 內文（Markdown，`[[連結]]` 顯示成一般連結 `text-secondary`）→「相關概念」（`<ConceptCard>` grid）→「出現在這些場次」（場次卡清單）。沒有內容的區塊整個不顯示 |
| 延續討論 | `RelatedSessions.vue`（`<RelatedSessions>`） | `UBadge` | 「看之前」「活動後」分頁的底部。`h2` 標題「延續討論」，下方最多 5 列，每列：場次標題（連結）、日期、理由（`text-small text-toned`）、來源徽章。沒有相關場次時整個區塊不顯示 |
| 來源徽章 | 在 `<RelatedSessions>` 裡 | `UBadge variant="outline"` | 兩種，`rounded-tag text-label`：「主辦人推薦」（`color="primary"`，人工連結，理由是 `reason`）、「共同概念」（`color="neutral"`，自動計算，理由是「都談到：靈魂、二元論」）。不用 `success`／`error` |

---

## 7. 實作規則

- **只用 Tailwind utility。** 元件裡不寫 `<style>`，不寫 inline `style`，不寫 hex 色碼，不寫 px 字級。全域樣式只放在 `main.css`。唯一的例外是**跟著滑鼠即時計算的位置**（懸浮播放器拖曳時的 `transform`），只能用 `:style` 綁定。
- **Nuxt UI 優先。** 按鈕、分頁、抽屜、收合、徽章、主題切換都用 Nuxt UI 元件。Nuxt UI 沒有的才自己寫。
- **調整 Nuxt UI 元件用 `ui` prop**（例如 `:ui="{ base: 'rounded-full' }"`），不要用全域 CSS 覆寫它的 class。要全站改，改 `app.config.ts`。
- **所有影片連結都用 `<VideoLink>`。**
- **內容查詢一律透過 `useContent.ts`**，不要在元件或頁面裡直接呼叫 `queryCollection`。
- **站內連結用 `<NuxtLink>` 或 `UButton` 的 `to`**，不要手寫 `<a href="/…">`，網址前綴 `/sunday-salon/` 才會正確。
- **元件寫法**：`<script setup lang="ts">`，函式一律用箭頭函式（`const onClick = () => {}`），不用 `function` 宣告。
- **狀態**：會存進瀏覽器的狀態一律用 `useSalonStorage()`；播放器狀態一律用 `usePlayer()`。不要直接碰 `localStorage` 或 YouTube API。

---

### 7.1 動態

內容換掉時用短的過場，讓人看得出「換了什麼」，不是裝飾。

- **原則**：短（150–220ms）、只動透明度和小位移（上浮 6px 以內、左右 20px 以內），離開比進來快（120ms ease-in）。不做高度動畫、彈跳、縮放。`prefers-reduced-motion` 時全部關閉（`main.css` 全域規則）。
- **過場一覽**（`main.css`，搭配 `<Transition name="…">`）：
  - `page`：淡出 → 淡入上浮。換頁（`nuxt.config.ts` 的 `app.pageTransition`，out-in）。
  - `rise`：淡出 → 淡入上浮 6px。場次分頁、`/notes` 的檢視切換、複習的三個畫面、揭曉（解析、Kagan 怎麼說、我的想法、論證判斷、先回想→選項）、複習範圍的清單與月份展開。
  - `slide-next`／`slide-prev`：往左滑出、從右邊進來（後退相反）。邊看邊想的影片子分頁、複習換題、概念卡上一則／下一則。概念卡彈窗換卡時舊卡疊在上面淡出（不用 out-in），彈窗高度直接變成新卡的。
  - `fade`：單純淡入淡出。已選篩選 chip、寫筆記按鈕↔編輯器、骨架換成內容。
  - `animate-reveal`：CSS animation，淡入上浮 4px。用 class 藏起來的項目重新出現（「顯示全部」的 chip 與概念卡、名詞卡翻面），可加斷點前綴；也用在首頁換場次時新內容淡入。
- **掛載時不播**：頁面載入時依網址或上次停留位置跳到某個分頁、子分頁，直接換掉，不播過場。
- **小心 out-in**：短時間內連續切換好幾次（例如 hydration 時首頁「建置那一場 → 骨架 → 新的那一場」）會讓 out-in 卡在中間、什麼都不顯示。這種地方只做進場的 `animate-reveal`，不用 `<Transition mode="out-in">`。
- **焦點不能掉**：按鈕跟著舊內容一起消失時（下一步、下一段、下一題、看選項、收起我的想法），新內容出現後用 `focusIfLost()`（`utils/focus.ts`）把焦點交給合理的位置（目前分頁、題目卡、第一個選項、原本的開關按鈕）；使用者已經點了別處就不動。整塊換掉的區塊用 `tabindex="-1"`＋`focus-visible:outline-none`。
- **載入骨架**：用 `<USkeleton>`，形狀和尺寸照真的版面，換成內容時不跳；放在卡片或視窗上時加 `bg-accented`。骨架外層 `aria-busy="true"`＋`sr-only` 的「載入中…」，`USkeleton` 本身要包在 `aria-hidden` 裡（它自帶 `role="alert"`）。
  - 依 localStorage 的頁面（`/notes`、`/review`）掛載前放骨架（`useStorageReady()`），不先顯示空狀態或錯的數字；站內換頁不放。
  - 文字編輯器：`<MarkdownEditorSkeleton>`（工具列＋幾行字，和真的編輯器同高），當 `ClientOnly` 的 fallback，也包在 `<Suspense>` 裡等編輯器程式碼下載。
  - 首頁換到別場、正在抓資料時：頂部列＋場次標頭形狀的骨架。
  - 概念卡彈窗第一次打開、資料還沒到時：左右兩欄形狀的骨架；內文還沒到時三行骨架。
- **頁面只有一個根元素**：換頁過場要求；註解也算節點，要放在根元素裡面。

## 8. 文案規範

- **語言**：繁體中文。專有名詞第一次出現時，名詞卡要附英文原文。
- **講座標示**：`講座 5 · 17:17`，中間用半形間隔號 `·`，時間格式固定 `mm:ss`。程式裡一律用 `refLabel()` 產生。
- **討論題的答案**：寫 Kagan 在影片裡怎麼說，標出是誰說的。影片沒回答時直接寫出來（「Kagan 在影片裡沒有談到……」），不要替講者補答案。
- **觀點要標出是誰說的**：講者的判斷一律寫「Kagan 認為……」，不可以寫成事實。
- **來源和常識有衝突時要註明**：例如講者簡化了原典、學界有爭議、中文譯名會造成誤會。直接寫在對應的卡片或說明裡。
- **延伸內容要標記**：超出影片內容的題目或說明，加上「延伸」標籤。
- **不用 emoji**，也不用「值得注意的是」這類套話。句子短、直接。
- **學習法註記**的格式：`技巧名稱（可選）：一句話說明為什麼有效`。

### 8.1 概念卡

- **一張卡只講一個概念。** 需要講兩件事時拆成兩張卡，再用 `[[連結]]` 或 `related` 連起來。
- **`title` 用大家會拿去搜尋的詞**，也就是最常見的中文譯名。書名加《》。
- **其他寫法放進 `aliases`**：其他譯名、不加書名號的寫法、常見簡稱。不要為同義詞另開一張卡。
- **`summary` 是一句中立、通用的定義**，會出現在每一場的名詞卡和卡片牆上。不寫某一場的脈絡，也不寫某位講者的看法。
  - 可以：「人除了身體之外，還有一個非物質的靈魂。」
  - 不可以：「Kagan 認為二元論的論證都不成立。」
- **講者的看法寫在內文或場次內容裡**，照樣標出是誰說的（「Kagan 討論的是……」）。
- 內文句子短，每段一個重點。提到其他已有卡片的概念時用 `[[名稱]]` 連過去，每個概念在同一張卡裡只連第一次。
- **延續討論的 `reason`** 用一句話說明為什麼值得一起看，不要只寫「相關」。

---

### 確認彈窗

不使用瀏覽器內建的 `window.confirm` / `alert` / `prompt`（外觀無法控制）。需要確認時用 `useConfirm()`：`if (await confirm({ title, description, confirmLabel })) { … }`。彈窗是 `<ConfirmDialog>`（掛在 `app.vue`，全站一個）：深色卡片、襯線標題（`text-title`）、說明（`text-small text-muted`）、右下「取消」（`ghost`）和確認按鈕（`neutral` `solid`）。打開時不自動聚焦按鈕；點外面、按 Esc 都算取消。破壞性動作的確認按鈕也不用 `error` 色（語意色只表示判斷結果），改用文字說清楚後果（例如「無法復原」）。

### 捲軸

全站隱藏捲軸（`main.css` 的 `*` 規則：`scrollbar-width: none` 與 `::-webkit-scrollbar { display: none }`），頁面、彈窗、側欄、文字框都一樣，捲動功能照常。需要提示「還有更多內容」時用版面處理（例如概念卡列的箭頭），不要靠捲軸。

## 9. 無障礙與品質檢查清單

改完畫面後逐項確認：

- [ ] 只用了語意 utility，沒有 hex、px 字級、inline style、`<style>` 或原生色票
- [ ] **暗色（預設）和淺色兩個主題都看過**，用頂部列的切換按鈕切換
- [ ] 390px 寬度沒有橫向捲軸，文字沒有被截斷
- [ ] 所有可以操作的元素都能用鍵盤操作，而且有看得見的 focus 樣式（primary 外框）
- [ ] 狀態除了顏色之外，也有文字或形狀可以辨識（例如「質疑」「接受」徽章）
- [ ] 有 `prefers-reduced-motion` 的使用者不會看到動畫（`main.css` 已全域關閉）
- [ ] 過場時焦點不會掉到 `<body>`（按鈕跟著舊內容消失時用 `focusIfLost()`）
- [ ] 依 localStorage 的頁面掛載前是骨架，不會先閃空狀態或錯的數字
- [ ] 自訂的切換按鈕有 `aria-pressed` 或 `aria-expanded` 反映目前狀態（Nuxt UI 元件自帶）
- [ ] 從外部直接打開 `/s/{slug}#recall`、`/archive?tag=…` 時，分頁和篩選都正確（見 SPEC.md 3.1）

---

### 游標與語系

- **可點選的元素一律是手指游標。** 在 `main.css` 全域設定（連結、按鈕、分頁、`summary`…），停用的元素用一般游標（例如作答後鎖定的測驗選項）。新增可點的東西時用真正的 `<button>` 或連結，不要用 `<div @click>`，全域規則才會自動套用。
- Nuxt UI 內建文字（深淺色切換、抽屜關閉等無障礙標籤）用繁體中文：`app.vue` 的 `<UApp :locale="zh_tw">`。
- **可點選的元素一律要有 hover 變化**，照下表，不要自創：

| 元素類型 | hover | 例子 |
|---|---|---|
| 文字連結 | `hover:underline`（`underline-offset-2`） | `<VideoLink>`、參考段落、內文連結 |
| 收合標題列 | `hover:bg-accented` | 論證卡、白紙回想、Kagan 的立場 |
| 卡片連結 | `hover:border-secondary/70 hover:bg-accented` | 概念卡、場次卡 |
| 可選取的項目 | `hover:border-secondary/70 hover:bg-accented` | 測驗選項、名詞卡、自評按鈕 |
| 可點選的前提 | `hover:border-primary`（暗示「選它」） | 論證卡的 P1、P2… |
| 導覽文字 | `text-muted` → `hover:text-highlighted`；站名 `hover:text-primary` | 全站導覽 |
| 拖曳把手 | 平常 `opacity-0`，碰到把手或視窗邊框時淡入（`hover:opacity-100`、`group-hover:opacity-100`）；`text-muted` → `hover:text-highlighted`，游標 `cursor-grab`，拖曳中 `cursor-grabbing` | 懸浮播放器側邊的小分頁 |
| Nuxt UI 按鈕 | 用內建的 hover；內建太弱時加強（揭曉按鈕：`hover:bg-secondary/25 hover:ring-secondary`） | `UButton`、`UTabs` |

  目前所在的頁面或分頁（選中項目）不需要 hover 變化。都加上 `transition-colors`。暗色主題的 `--ui-border-accented` 調亮到 `#545C80`。框線的 hover 用暮色藍（`border-secondary/70`），灰色框線在暗色主題下變化太小。

## 修改紀錄

| 日期 | 版本 | 變更 |
|---|---|---|
| 2026-10-08 | 3.14 | 新增 7.1「動態」：換頁、分頁、子分頁、複習換題、揭曉、展開都有短過場（`page`、`rise`、`slide-next/prev`、`fade`、`animate-reveal`），概念卡換卡不再閃（預先載入＋舊卡疊著淡出）；載入骨架（筆記、複習、首頁換場次、概念卡彈窗、文字編輯器）；過場時保住焦點 |
| 2026-10-08 | 3.13 | 概念卡牆改成兩排網格＋「顯示全部」（`<ConceptRow>`），新增上一則／下一則（`<ConceptPager>`）。單選的場次篩選改成可搜尋的下拉選單（`<FilterSelect>`）；複習範圍改成預設＋自己選（`<FilterScopePicker>`）。篩選欄新增 `<FilterSummary>`（已選＋清除篩選），`<FilterChips>` 加上 `limit` 收起；側欄底部的「共 N 場」改成只給螢幕閱讀器的 `<FilterStatus>` |
| 2026-10-08 | 3.12 | 抽出共用元件，畫面不變：篩選欄 `<FilterLayout>`、`<FilterChips>`、`<FilterSearch>`、`<FilterFooter>`（`/archive`、`/concepts`、`/review`、`/notes`）；筆記視窗 `<NoteSheet>`、筆記小卡 `<NoteField>`、場次分組標題 `<SessionGroupHeading>`；筆記種類集中在 `NOTE_KINDS`。文字編輯器、概念卡彈窗改成需要時才載入 |
| 2026-10-08 | 3.11 | 討論卡的「我的想法」改成 `<MarkdownEditor>` 小卡，可以隨時收起；`/notes` 新增「作答紀錄」檢視（`<NoteAnswers>`：對錯徽章卡片，視窗先回想再揭曉答案）；名詞卡的 hover 改加在整張卡上，翻開後不再上下兩截不同色 |
| 2026-09-29 | 3.10 | 播放器可以「放大影片」浮到畫面中間（桌機，不加遮罩，頁面照樣可以捲動），預設在側欄，可以拖曳移動。「看之前」單欄改成置中 |
| 2026-09-29 | 3.9 | 「看之前」不顯示側欄，開始播放後才出現；「下一步」列拿掉文字標籤與分隔線，只留靠右的主要按鈕；「邊看邊想」同一時間只有一個往下走的按鈕（下一段／下一步） |
| 2026-09-29 | 3.8 | 立場題只有一輪：拿掉「討論前／討論後」兩列與改變提示；活動回顧的「立場變化」改成「大家的立場」 |
| 2026-09-29 | 3.7 | 場次標頭只在「看之前」顯示；手機頂部列在 360px 寬不需橫向捲動；影片長度一律寫「分鐘」（新增 `minutesLabel`、`totalLabel`）；字幕說明移到播放器下方；手機「播放這一講」按鈕；影片子分頁完成打勾；自我測驗預設打亂、出處作答後才顯示；討論卡加「我的想法」並與 Kagan 觀點並排；週日討論「複製我的筆記」；新增活動回顧區塊 |
| 2026-09-29 | 3.6 | 新增 hover 規則表並全面套用；暗色 `--ui-border-accented` 調亮；揭曉按鈕改 subtle |
| 2026-09-29 | 3.5 | 揭曉按鈕改成暮色藍淡底＋箭頭（原本 ghost 看起來不像可以點） |
| 2026-09-29 | 3.4 | 可點選元素全域手指游標；Nuxt UI 語系改為繁體中文 |
| 2026-09-29 | 3.3 | 頁首層級：全站導覽只用字色區分（選中金色），金色底線只留給學習階段；第二列加場次標記；步驟數字改成和文字置中（不加框，目前階段用金色） |
| 2026-09-29 | 3.2 | 新增影片子分頁；章節清單改成一次一支影片。版面規則：頁面底部留白要放在 `<main>`（grid 的子元素）上，不能放在 grid 外或 grid 的 padding，否則捲到頁尾時 sticky 側欄會被推上去蓋到頂部列 |
| 2026-09-29 | 1.0 | 初版。字級收斂成 10 級 token（18px→19px、22px→24px），圓角收斂成 5 級，移除所有 inline style 與寫死的顏色 |
| 2026-09-29 | 2.0 | 改用 Nuxt 4 + Nuxt UI 4 + Tailwind CSS 4。token 改成 Tailwind `@theme` 與 Nuxt UI `--ui-*` 變數，文件改列 utility class。暗色改為預設。斷點 1000px → 1024px。元件目錄改成對應 Vue 元件檔案與 Nuxt UI 元件。新增「實作規則」。網站名稱從「週日沙龍」改為「悅讀聊天室」 |
| 2026-09-29 | 3.0 | 新增設計原則「概念是連結的單位」。頂部列改成三個導覽（本週／全部場次／概念卡），移除場次 chip，分頁只在場次頁顯示。場次標頭加 tag 列。新增 6.8「瀏覽與概念卡」：tag 標籤、場次卡、tag 篩選 pill、`<ConceptCard>`、概念卡頁區塊、`<RelatedSessions>` 與兩種來源徽章。名詞卡改用概念卡。新增 8.1「概念卡」文案規範。實作規則加上內容查詢與站內連結 |
| 2026-09-29 | 3.1 | 「邊看邊想」改成逐支影片分段（`<StudyVideoSection>`），最後是「整合回顧」。新增 `<StudyQuizItem>`（無狀態單題，邊看邊想和看完回想共用）、`<StudyDiscussCard>`（「我想好了，看 Kagan 怎麼說」，邊看邊想和週日討論共用）、段落連結與 `utils/videoRef.ts`（`mmss`、`lecOf`、`refLabel`）。按鈕新增「揭曉按鈕」。「週日討論」改成立場題＋依影片分組的討論議題，移除 `<SundayDiscuss>`。文案規範加上討論答案的寫法 |
