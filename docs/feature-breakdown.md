# Strong Web 模組化功能拆解

本文根據 README 中的 MoSCoW 需求清單，將 Strong Web MVP 的核心能力拆分為模組。每一模組皆描述了目標、細項需求、跨模組邊界、預期介面、資產需求與驗收指標，以利產品、工程與設計團隊協作與排程。

## 進度追蹤表

| 模組 | 狀態 | 已完成功能 | 主要缺口 |
| --- | --- | --- | --- |
| Auth 模組 | 進行中 | - 儀表板路由會檢查 Supabase session，未登入者轉導並提供登出控制。<br>- 登入/註冊表單支援 Email/Password 與 GitHub、Google OAuth。 【F:app/(dashboard)/layout.tsx†L1-L29】【F:components/features/navigation/sign-out-button.tsx†L1-L31】【F:components/features/auth/sign-in-form.tsx†L14-L119】【F:components/features/auth/sign-up-form.tsx†L14-L117】 | - OAuth provider 陣列僅含 GitHub、Google，缺少 Apple 登入與密碼重設流程；`(auth)` 路由僅有登入/註冊頁。 【F:components/features/auth/sign-in-form.tsx†L14-L118】【F:components/features/auth/sign-up-form.tsx†L14-L116】【34593f†L1-L1】 |
| Workout / Exercise CRUD 模組 | 進行中 | - 儀表板支援建立訓練、狀態統計圖與列表，並透過 IndexedDB 快取與 API 同步。<br>- 詳情頁可更新、刪除訓練並以 Supabase CRUD 動作項目。<br>- 動作庫提供表單與 `/api/exercises` 寫入。 【F:components/features/workouts/workouts-dashboard.tsx†L1-L236】【F:components/features/workouts/workout-detail.tsx†L1-L356】【F:components/features/exercises/exercise-library.tsx†L1-L152】【F:app/api/workouts/route.ts†L1-L68】【F:app/api/workouts/[id]/route.ts†L1-L115】【F:app/api/exercises/route.ts†L1-L62】【F:lib/idb.ts†L1-L52】 | - 訓練項目表單僅含 sets/reps/weight/unit/notes，缺少 RPE 與 Routine/Plan、自動套用等流程。 【F:components/features/workouts/workout-detail.tsx†L259-L349】 |
| 歷史與統計模組 | 尚未開始 | - 現階段僅在訓練儀表板顯示各狀態長條圖。 【F:components/features/workouts/workouts-dashboard.tsx†L185-L199】 | - 缺少專屬歷史頁面、API 與衝突處理；`app/(dashboard)` 目前僅含 workouts、exercises、settings 目錄，也查無 history/analytics 程式。 【97d6d9†L1-L1】【51cba9†L1-L1】 |
| PWA / 離線模組 | 進行中 | - 透過 next-pwa 註冊自訂 Service Worker 與 manifest。<br>- Offline Banner 與 IndexedDB 快取提供基本離線提示與資料暫存。 【F:next.config.js†L1-L25】【F:public/sw.js†L1-L46】【F:public/manifest.json†L1-L17】【F:components/features/offline/offline-banner.tsx†L1-L30】【F:lib/idb.ts†L1-L52】 | - Service Worker 目前僅快取 GET 請求，尚無背景同步、衝突解決或通知策略。 【F:public/sw.js†L24-L45】 |
| 設定與偏好模組 | 進行中 | - 設定頁可更新暱稱、語系、單位與主題並寫回 Supabase。<br>- 支援匯出 workouts、exercises JSON。 【F:components/features/settings/settings-panel.tsx†L24-L154】【F:app/api/export/route.ts†L1-L40】 | - 介面僅涵蓋姓名/語系/單位/主題與匯出，尚未包含通知偏好、快捷鍵或完整多語覆蓋。 【F:components/features/settings/settings-panel.tsx†L89-L150】 |
| 外部 API / 整合模組 | 尚未開始 | - 目前僅提供 workouts、exercises、export API route 供內部使用。 【F:app/api/workouts/route.ts†L1-L68】【F:app/api/exercises/route.ts†L1-L62】【F:app/api/export/route.ts†L1-L40】 | - `app/api` 目錄僅含上述三個端點，尚無公開 REST/GraphQL 或匯入 webhook。 【382240†L1-L1】 |
| 監控與安全模組 | 尚未開始 | - API 層僅透過 Supabase `getUser` 進行基本授權檢查。 【F:app/api/workouts/route.ts†L6-L27】【F:app/api/exercises/route.ts†L4-L25】【F:app/api/export/route.ts†L4-L13】 | - 未整合 RLS 策略、審計日誌或監控工具，程式碼查詢僅見需求描述。 【32b0a7†L1-L3】 |
| 部署 / DevOps 模組 | 進行中 | - 已配置 next-pwa 並在 package.json 提供 lint、type-check、test 等開發腳本。 【F:next.config.js†L1-L25】【F:package.json†L1-L46】 | - 專案缺少 CI/CD 或部署設定檔，儲存庫根目錄未見 `.github` 等自動化配置。 【8ee072†L1-L3】 |

## Auth 模組
### 目標與產出
- 透過 Supabase Auth 提供穩定的帳號註冊、登入、重設密碼與多家社群登入。
- 建立使用者個人資料初始化流程與必要的行為追蹤（登入成功、失敗）。

### 細項需求（對應 MoSCoW）
- Must：Email/Password、Google、Apple、GitHub OAuth 登入流程。
- Should：登入 / 註冊表單的可用性最佳化（鍵盤可達性、狀態提示）。
- Won't：社群或追蹤類功能不在此模組範疇。

### 跨模組相依與邊界
- 對 `Workout/Exercise CRUD`、`歷史與統計`、`設定與偏好` 提供使用者身份資訊與 Session 驗證。
- 與 `監控與安全` 協作以落實 Row Level Security 與審計需求。
- 與 `外部 API/整合` 共用 Token 與授權策略，維持 OAuth provider 設定一致。

### 預期 API / Schema 介面
- Supabase Auth 內建 `auth.users` 表維護基礎身份資料。
- `public.user_profiles` 表（`id`, `display_name`, `avatar_url`, `unit_preference`, `created_at`）。
- REST 端點：`POST /api/auth/sign-in`、`POST /api/auth/sign-up`、`POST /api/auth/reset`（封裝 Supabase Auth）。

### 前/後端資產
- 前端：登入/註冊頁、第三方登入按鈕、錯誤狀態提示、登入後導引。
- 後端：OAuth provider 設定、自訂 email 範本、Edge Function 觸發器同步 `user_profiles`。

### 驗收指標
- 主要身分流程成功率 > 99%。
- 完成 RLS 與最小權限設定，通過滲透測試檢查。
- 登入流程 Lighthouse 可用性分數 ≥ 90。

## Workout / Exercise CRUD 模組
### 目標與產出
- 支援使用者建立、編輯、刪除訓練與自訂動作，並正確儲存重量、次數、組數、備註與 RPE。
- 建立動作庫與模組化表單，供後續統計與模板模組使用。

### 細項需求（對應 MoSCoW）
- Must：訓練紀錄 CRUD、動作庫、自訂動作欄位與 RPE（可選）。
- Should：Routine/Plan 建立與快速套用、複製上次訓練。
- Could：第三方匯入（Apple Health、Google Fit）。

### 跨模組相依與邊界
- 依賴 `Auth` 提供使用者 ID 與授權。
- 為 `歷史與統計` 提供原始訓練資料與動作維度。
- 與 `PWA/離線` 共用 IndexedDB schema 與同步策略。

### 預期 API / Schema 介面
- 表格：`exercises`（`id`, `user_id`, `name`, `muscle_group`, `is_custom`, `created_at`）。
- 表格：`workouts`（`id`, `user_id`, `performed_at`, `notes`）。
- 表格：`workout_sets`（`id`, `workout_id`, `exercise_id`, `set_index`, `weight`, `reps`, `rpe`, `remarks`）。
- REST 端點：`GET/POST /api/exercises`、`GET/POST /api/workouts`、`PATCH/DELETE /api/workouts/:id`。

### 前/後端資產
- 前端：訓練行事曆、建立/編輯表單、動作搜尋、模板選單、錯誤與同步提示。
- 後端：Supabase 資料表、行為日誌、Edge Function 處理批次匯入與模板套用邏輯。

### 驗收指標
- CRUD API 於 P95 延遲 < 300 ms，錯誤率 < 1%。
- 表單完成率 ≥ 85%，並通過 Playwright E2E 測試。
- 離線建立後回網自動同步成功率 ≥ 98%。

## 歷史與統計模組
### 目標與產出
- 提供依日期、動作、肌群的歷史查詢與趨勢分析，支援 Recharts 視覺化。
- 建立進階指標（近 7/30 天訓練量、1RM 估算）與報表。

### 細項需求（對應 MoSCoW）
- Must：歷史清單、基本統計、圖表視覺化。
- Should：同步衝突提示與解決策略（顯示最新版本差異）。
- Could：個人成就分享、週報導出。

### 跨模組相依與邊界
- 依賴 `Workout/Exercise CRUD` 的資料完整性與同步結果。
- 與 `PWA/離線` 協調資料快取策略，確保離線時提供唯讀視圖。
- 與 `外部 API/整合` 協作以暴露歷史資料給第三方。

### 預期 API / Schema 介面
- 視圖：`v_user_training_volume`（`user_id`, `exercise_id`, `total_volume`, `period`）。
- REST 端點：`GET /api/history?range=7d|30d`、`GET /api/analytics/volume`、`GET /api/analytics/one-rep-max`。

### 前/後端資產
- 前端：歷史列表頁、圖表元件、篩選器、差異提示 UI。
- 後端：Supabase 視圖 / Materialized View、預計算作業（Scheduled Jobs）產出 7/30 天統計。

### 驗收指標
- 圖表渲染時間 < 1 秒（以行動裝置為基準）。
- 統計數據與原始資料比對誤差 < 1%。
- 離線時提供最近同步資料並顯示時間戳。

## PWA / 離線模組
### 目標與產出
- 提供可安裝的 PWA 體驗、離線可用的核心流程與背景同步機制。

### 細項需求（對應 MoSCoW）
- Must：Manifest、Service Worker、離線核心流程（查看動作、建立/編輯訓練）、回網自動同步。
- Should：衝突解決策略、背景同步通知。
- Could：多裝置同步偏好設定。

### 跨模組相依與邊界
- 與 `Workout/Exercise CRUD`、`歷史與統計` 合作定義離線資料模型與 IndexedDB schema。
- 與 `設定與偏好` 協作儲存裝置層偏好（如主題、單位）。
- 與 `部署/DevOps` 協調 Service Worker 版本與快取失效策略。

### 預期 API / Schema 介面
- Service Worker cache 名稱與版本策略（`app-shell-v{n}`）。
- IndexedDB store：`workouts`, `exercises`, `analytics_snapshots`, `preferences`。
- 背景同步任務：`sync-workouts`、`sync-preferences`。

### 前/後端資產
- 前端：PWA 安裝提示、離線模式提示、背景同步 UI、IndexedDB 操作封裝。
- 後端：Edge Function 支援增量同步（ETag/Last-Modified header）、Web Push 訂閱端點。

### 驗收指標
- Lighthouse PWA 分數 ≥ 90。
- 核心頁面離線模式均可讀取資料，並於回網後自動同步。
- 背景同步失敗率 < 3%，並具備重試機制。

## 設定與偏好模組
### 目標與產出
- 提供使用者管理單位、主題、個人資料與通知偏好等設定。

### 細項需求（對應 MoSCoW）
- Must：單位切換（kg/lb）、主題切換（暗色預設）、個人資料編輯。
- Should：可用性與可達性強化（WCAG 2.1 AA）、快捷鍵設定管理。
- Could：多語系（zh-TW/en）、個人化儀表板偏好。

### 跨模組相依與邊界
- 與 `Auth` 共用 `user_profiles` 資料表與驗證。
- 與 `PWA/離線` 共用本地偏好快取與同步策略。
- 向 `外部 API/整合` 暴露偏好讀取端點以利行動 App 對齊。

### 預期 API / Schema 介面
- 表格：`user_preferences`（`user_id`, `theme`, `unit`, `language`, `notifications`, `updated_at`）。
- REST 端點：`GET/PUT /api/me/preferences`、`PATCH /api/me/profile`。

### 前/後端資產
- 前端：設定頁、偏好表單、無障礙導覽與快捷鍵提示。
- 後端：Supabase function 驗證偏好變更、偏好同步 webhook。

### 驗收指標
- 偏好更新 API P95 < 200 ms，錯誤率 < 0.5%。
- 達成 WCAG 2.1 AA 導覽測試。
- 多語系字串覆蓋率 ≥ 95%（若啟用）。

## 外部 API / 整合模組
### 目標與產出
- 對第三方應用（如 Strong App、行動端、健康平台）提供安全的 REST/GraphQL 介面，並預備資料匯入與同步能力。

### 細項需求（對應 MoSCoW）
- Must：公開 REST API（受 Auth 保護）。
- Should：GraphQL 端點與一致型別系統。
- Could：Apple Health、Google Fit 匯入；週報分享公開頁。

### 跨模組相依與邊界
- 與 `Auth` 整合 Token 與權限，確保 RLS 規則一致。
- 消費 `Workout/Exercise CRUD`、`歷史與統計` 的資料結構。
- 與 `監控與安全` 協作以建立 Rate Limit、審計與 API 金鑰管理。

### 預期 API / Schema 介面
- REST：`GET /api/v1/workouts`, `POST /api/v1/import`, `GET /api/v1/analytics`。
- GraphQL schema：`type Workout`, `type Exercise`, `type TrainingVolume`, `query workouts`, `mutation syncWorkout`。
- Webhook：`POST /webhooks/health-sync` 處理第三方匯入。

### 前/後端資產
- 前端：API 文件頁（內部 Portal）、API 金鑰管理 UI。
- 後端：OpenAPI / GraphQL SDL、Edge Functions 處理匯入、Rate limiting middleware。

### 驗收指標
- API 99 百分位延遲 < 500 ms，錯誤率 < 1%。
- 完成 OpenAPI 3.1 與 GraphQL SDL 發佈，並提供 SDK/範例。
- 匯入流程具備重試與去重邏輯，資料重複率 < 0.5%。

## 監控與安全模組
### 目標與產出
- 確保系統安全性、可觀測性與法遵要求，建立事件與警報管道。

### 細項需求（對應 MoSCoW）
- Must：Row Level Security、最小權限控管、密碼與 Token 管理、資料匯出。
- Should：Sentry、PostHog 等監控與行為追蹤、Rate Limit、審計日誌。
- Could：自動化滲透測試、進階威脅偵測。

### 跨模組相依與邊界
- 支援所有模組的安全需求，特別是 `Auth`、`外部 API/整合`、`部署/DevOps`。
- 與 `Deployment/DevOps` 合作佈署監控 Agent 與日誌串流。

### 預期 API / Schema 介面
- 審計日誌表：`security_audit_logs`（`id`, `user_id`, `action`, `resource`, `timestamp`, `metadata`）。
- 匯出端點：`POST /api/me/export`（產生 CSV/JSON）。
- Rate limit 設定：`/api/_middleware` Edge 中介層。

### 前/後端資產
- 前端：安全設定 UI、匯出資料流程、異常提示。
- 後端：Supabase Policy、監控管線（Sentry、PostHog、Log Drain）、自動化警報設定。

### 驗收指標
- 通過安全稽核（RLS policy 覆蓋率 100%）。
- 事件偵測平均回應時間 < 15 分鐘。
- 資料匯出請求在 24 小時內完成。

## 部署 / DevOps 模組
### 目標與產出
- 建立自動化部署、版本管理、備份與回復流程，確保穩定上線。

### 細項需求（對應 MoSCoW）
- Must：Vercel 前端部署、Supabase 後端佈署、基本監控與日誌。
- Should：CI/CD（lint、型別檢查、測試）、預覽環境、備份與復原演練。
- Could：基礎架構即程式（Pulumi/Terraform）、藍綠部署。

### 跨模組相依與邊界
- 與所有模組協調版本發佈與環境配置。
- 與 `監控與安全` 共享日誌、告警設定與密鑰管理。

### 預期 API / Schema 介面
- Vercel、Supabase 環境變數管理（`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`）。
- CI 工作流程：`lint`, `type-check`, `test`, `deploy-preview`。

### 前/後端資產
- 前端：環境設定文件、版本資訊頁面。
- 後端：CI 設定檔、備份排程、日誌保留策略。

### 驗收指標
- 主幹分支自動化測試通過率 100%。
- 部署回滾時間 < 15 分鐘。
- 定期備份與復原演練每季至少 1 次並完成驗證。

## 附錄：模組協作建議
- 依模組建立跨職能小組（產品、前端、後端、設計、DevOps）。
- 以 M0-M4 里程碑作為排程基準，優先完成 Auth、部署、監控底盤，再推進 CRUD 與分析功能。
- 持續更新本文，於每次規劃週期檢視需求與依賴是否變更。
