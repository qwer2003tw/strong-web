# Strong Web 模組化功能拆解

本文根據 README 中的 MoSCoW 需求清單，將 Strong Web MVP 的核心能力拆分為模組。每一模組皆描述了目標、細項需求、跨模組邊界、預期介面、資產需求與驗收指標，以利產品、工程與設計團隊協作與排程。

## 進度追蹤表

| 模組 | 狀態 | 已完成項目 | 待辦項目 |
| --- | :---: | --- | --- |
| 🔐 Auth 模組 | 🚧 | ✅ Email/Password 登入<br>✅ OAuth (GitHub, Google)<br>✅ 密碼重設流程（含雙語介面）<br>✅ Session 管理與頁面保護 | ⏳ Apple OAuth<br>⏳ Facebook OAuth（補充） |
| 💪 Workout / Exercise CRUD | 🚧 | ✅ 訓練列表與 CRUD<br>✅ 動作庫管理<br>✅ 詳情頁編輯<br>✅ IndexedDB 快取<br>✅ API routes 整合 | ⏳ Routine/Plan 功能<br>⏳ 自動套用模板<br>⏳ 不完整組處理<br>⏳ 完成組鎖定<br>⏳ 第三方匯入 |
| 📊 Dashboard 模組 | ❌ | - | ⏳ 每週訓練次數圖表<br>⏳ 單動作 1RM/PR 趨勢<br>⏳ 訓練量 Volume 趨勢<br>⏳ 整合 Recharts |
| 📈 歷史與統計模組 | 🚧 | ✅ 歷史列表<br>✅ 7/30 日訓練趨勢<br>✅ Recharts 圖表<br>✅ 範圍切換<br>✅ IndexedDB 快取 | ⏳ 離線衝突解決<br>⏳ 1RM 估算<br>⏳ 進階分析 API<br>⏳ 報表匯出 |
| 📱 PWA / 離線模組 | 🚧 | ✅ PWA 配置 (next-pwa)<br>✅ Manifest<br>✅ 離線橫幅<br>✅ IndexedDB 快取 | ⏳ 自訂 Service Worker（建立 `public/sw.js` 或調整 next-pwa 產出）<br>⏳ 背景同步<br>⏳ 離線衝突處理<br>⏳ 通知策略<br>⏳ 安裝到裝置 |
| ⚙️ 設定與偏好模組 | 🚧 | ✅ 單位切換 (kg/lb)<br>✅ 主題切換<br>✅ 個人資料編輯<br>✅ 多語系 (zh-TW/en)<br>✅ 訓練資料匯出 | ⏳ 距離單位切換 (km/mi)<br>⏳ 尺寸單位切換 (cm/inch)<br>⏳ 自動/系統主題模式<br>⏳ 休息計時器（預設值、增量、自動啟動、音效/震動）<br>⏳ 螢幕常亮設定<br>⏳ 第一週起始日<br>⏳ 通知偏好<br>⏳ 可及性最佳化 (WCAG 2.1 AA) |
| 📏 身體測量模組 | ❌ | - | ⏳ 體重/體脂追蹤<br>⏳ 飲食熱量記錄<br>⏳ 身體圍度測量<br>⏳ 健康平台同步 |
| � 外部 API / 整合模組 | ❌ | ✅ 內部 API routes (基礎) | ⏳ 公開 REST API<br>⏳ GraphQL 端點<br>⏳ Apple Health 整合<br>⏳ Google Fit 整合<br>⏳ Health Connect (Android)<br>⏳ 匯入 webhook |
| 🔒 監控與安全模組 | 🚧 | ✅ Supabase 身分驗證<br>✅ Row Level Security (RLS)<br>✅ 16 個安全策略<br>✅ SQL 遷移腳本 | ⏳ 審計日誌<br>⏳ Rate Limit<br>⏳ 進階監控 (Sentry/PostHog)<br>⏳ 資料匯出單向限制（CSV/JSON）<br>⏳ 帳號刪除流程（Danger Zone + 軟刪/硬刪） |
| �🚀 部署 / DevOps 模組 | 🚧 | ✅ next-pwa 配置<br>✅ 基本腳本 (lint/test/type-check)<br>✅ Jest 單元測試 (13 個)<br>✅ Playwright E2E (6 個) | ⏳ CI/CD 流程<br>⏳ 自動化備份<br>⏳ 回復演練 |

**圖示說明：**
- 🚧 進行中
- ❌ 尚未開始
- ✅ 已完成
- ⏳ 待辦

### 📁 相關檔案引用

#### 🔐 Auth 模組
- **密碼重設表單：** `components/features/auth/forgot-password-form.tsx`
- **重設密碼表單：** `components/features/auth/reset-password-form.tsx`
- **登入表單：** `components/features/auth/sign-in-form.tsx`
- **註冊表單：** `components/features/auth/sign-up-form.tsx`
- **忘記密碼頁面：** `app/(auth)/forgot-password/page.tsx`
- **重設密碼頁面：** `app/(auth)/reset-password/page.tsx`
- **單元測試：** `tests/unit/forgotPasswordForm.test.tsx`
- **E2E 測試：** `tests/e2e/password-reset.spec.ts`, `tests/e2e/auth.spec.ts`

#### 💪 Workout / Exercise CRUD 模組
- **訓練儀表板：** `components/features/workouts/workouts-dashboard.tsx`
- **訓練詳情：** `components/features/workouts/workout-detail.tsx`
- **動作庫：** `components/features/exercises/exercise-library.tsx`
- **API Routes：** `app/api/workouts/route.ts`, `app/api/workouts/[id]/route.ts`, `app/api/exercises/route.ts`
- **IndexedDB：** `lib/idb.ts`
- **單元測試：** `tests/unit/workoutsDashboard.test.tsx`, `tests/unit/workoutDetail.test.tsx`, `tests/unit/workoutsApi.test.ts`, `tests/unit/exerciseLibrary.test.tsx`, `tests/unit/exercisesRoute.test.ts`
- **E2E 測試：** `tests/e2e/workouts.spec.ts`, `tests/e2e/exercises.spec.ts`

#### 📊 Dashboard 模組
- **待建置元件：** `components/features/dashboard/weekly-volume-chart.tsx`、`components/features/dashboard/pr-trend-chart.tsx`、`components/features/dashboard/volume-trend-chart.tsx`
- **預計頁面：** `app/(dashboard)/overview/page.tsx`
- **資料來源：** `lib/analytics/dashboardQueries.ts`（待建置）

#### <a id="history-stats-module"></a>📊 歷史與統計模組
- **進度現況：** 已完成 7/30 日訓練量趨勢圖表與快取；1RM 估算與相關分析 API 仍為待辦。
- **歷史儀表板：** `components/features/history/history-dashboard.tsx`
- **歷史列表：** `components/features/history/history-list.tsx`
- **歷史篩選器：** `components/features/history/history-filters.tsx`
- **趨勢圖表：** `components/features/history/history-trend-chart.tsx`
- **歷史頁面：** `app/(dashboard)/history/page.tsx`
- **歷史工具函式：** `lib/history.ts`
- **API Routes：** `app/api/history/route.ts`
- **TODO：進階統計端點：** `app/api/analytics/volume/route.ts`（預計改寫為 `/api/history` 子路由提供 volume/1RM 相關資料）
- **單元測試：** `tests/unit/historyDashboard.test.tsx`, `tests/unit/historyAnalytics.test.ts`, `tests/unit/historyRouteHandlers.test.ts`
- **E2E 測試：** `tests/e2e/history.spec.ts`

#### 📱 PWA / 離線模組
- **PWA 配置：** `next.config.js`
- **Service Worker：** `public/sw.js`（尚未建立，需依下方指引新增）
- **Manifest：** `public/manifest.json`
- **離線橫幅：** `components/features/offline/offline-banner.tsx`
- **IndexedDB：** `lib/idb.ts`

#### ⚙️ 設定與偏好模組
- **設定頁面：** `app/(dashboard)/settings/page.tsx`
- **設定面板：** `components/features/settings/settings-panel.tsx`
- **多語系配置：** `lib/i18n/config.ts`
- **匯出 API：** `app/api/export/route.ts`
- **單元測試：** `tests/unit/settingsPanel.test.tsx`, `tests/unit/exportRoute.test.ts`
- **E2E 測試：** `tests/e2e/settings.spec.ts`

#### 🔌 外部 API / 整合模組
- **內部 API Routes：** `app/api/workouts/route.ts`, `app/api/exercises/route.ts`, `app/api/export/route.ts`

#### 🔒 監控與安全模組
- **RLS 啟用遷移：** `supabase/migrations/20250102_enable_rls.sql`
- **RLS 策略遷移：** `supabase/migrations/20250102_rls_policies.sql`
- **RLS 回滾腳本：** `supabase/migrations/20250102_rollback_rls.sql`
- **安全文件：** `docs/security.md`
- **環境變數測試：** `tests/unit/supabaseEnv.test.ts`

#### 🚀 部署 / DevOps 模組
- **專案配置：** `next.config.js`, `package.json`
- **測試配置：** `jest.config.cjs`, `playwright.config.ts`
- **測試設定：** `tests/setupTests.ts`
- **單元測試：** `tests/unit/` (13 個測試檔)
- **E2E 測試：** `tests/e2e/` (6 個測試檔)
- **其他配置：** `eslint.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`

## Auth 模組
### 目標與產出
- 透過 Supabase Auth 提供穩定的帳號註冊、登入、重設密碼與多家社群登入。
- 建立使用者個人資料初始化流程與必要的行為追蹤（登入成功、失敗）。

### 細項需求（對應 MoSCoW）
- Must：Email/Password、Google、Apple、GitHub OAuth 登入流程；Facebook 作為補充登入方案並須提供同等安全驗證。
- Should：登入 / 註冊表單的可用性最佳化（鍵盤可達性、狀態提示）。
- Won't：社群或追蹤類功能不在此模組範疇。

### 跨模組相依與邊界
- 對 `Workout/Exercise CRUD`、`歷史與統計`、`設定與偏好` 提供使用者身份資訊與 Session 驗證。
- 與 `監控與安全` 協作以落實 Row Level Security 與審計需求。
- 與 `外部 API/整合` 共用 Token 與授權策略，維持 OAuth provider 設定一致。

### 預期 API / Schema 介面
- Supabase Auth 內建 `auth.users` 表維護基礎身份資料。
- `public.profiles` 表（`id`, `email`, `full_name`, `avatar_url`, `locale`, `theme`, `unit_preference`, `created_at`, `updated_at`）。
- REST 端點：`POST /api/auth/sign-in`、`POST /api/auth/sign-up`、`POST /api/auth/reset`（封裝 Supabase Auth）。

### 前/後端資產
- 前端：登入/註冊頁、第三方登入按鈕（Google/GitHub/Apple/Facebook）、錯誤狀態提示、登入後導引。
- 後端：OAuth provider 設定（含 Apple Sign In 與 Facebook App 設定）、自訂 email 範本、Edge Function 觸發器同步 `profiles`。

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
- Should：Routine/Plan 建立與快速套用、複製上次訓練、不完整組處理（略過/提示/保留）、完成組鎖定（避免誤編輯）。
- Could：第三方匯入（Apple Health、Google Fit）。

### 跨模組相依與邊界
- 依賴 `Auth` 提供使用者 ID 與授權。
- 為 `歷史與統計` 提供原始訓練資料與動作維度。
- 與 `PWA/離線` 共用 IndexedDB schema 與同步策略。

### 預期 API / Schema 介面
- 表格：`exercises`（`id`, `user_id`, `name`, `muscle_group`, `is_custom`, `created_at`）。
- 表格：`workouts`（`id`, `user_id`, `performed_at`, `notes`）。
- 表格：`workout_entries`（`id`, `workout_id`, `exercise_id`, `position`, `sets`, `reps`, `weight`, `unit`, `notes`, `created_at`, `updated_at`）。
- REST 端點：`GET/POST /api/exercises`、`GET/POST /api/workouts`、`PATCH/DELETE /api/workouts/:id`。

### 前/後端資產
- 前端：訓練行事曆、建立/編輯表單、動作搜尋、模板選單、錯誤與同步提示。
- 後端：Supabase 資料表、行為日誌、Edge Function 處理批次匯入與模板套用邏輯。

### 驗收指標
- CRUD API 於 P95 延遲 < 300 ms，錯誤率 < 1%。
- 表單完成率 ≥ 85%，並通過 Playwright E2E 測試。
- 離線建立後回網自動同步成功率 ≥ 98%。

## Dashboard 模組
> 詳細執行規格請參考《[Dashboard 模組執行規格](dashboard-spec.md)》
### 目標與產出
- 提供訓練概覽儀表板，快速掌握近期期次量與表現趨勢。
- 建立週訓練次數、單動作 PR 與訓練量視覺化，支援教練與使用者決策。

### 細項需求（對應 MoSCoW）
- Must：每週訓練次數柱狀圖、單動作 1RM/PR 趨勢折線圖、訓練量（Volume）趨勢圖。
- Should：圖表篩選（肌群、動作）、自訂期間、錯誤與空資料狀態提示。
- Could：分享截圖/報告、儀表板小工具拖拉排序。

### 跨模組相依與邊界
- 依賴 `Workout/Exercise CRUD` 提供結構化訓練資料與 RPE。
- 與 `歷史與統計` 共用分析 API 與快取策略，避免重複計算。
- 與 `設定與偏好` 對接單位偏好與主題，以確保視覺一致性。

### 預期 API / Schema 介面
- REST：`GET /api/dashboard/weekly-frequency`、`GET /api/dashboard/pr-trend`、`GET /api/dashboard/volume-trend`（可由 `/api/history` 派生）。
- 視圖：`v_weekly_workout_counts`、`v_exercise_pr_trends`、`v_training_volume_trends`（待設計）。
- IndexedDB：`dashboard_snapshots` store 快取最近一週資料供離線使用。

### 前/後端資產
- 前端：週頻率柱狀圖元件、PR 趨勢折線圖、Volume 面積圖、儀表板篩選器與空狀態。
- 後端：聚合查詢、預先計算排程、Reports Edge Function（用於生成分享連結）。

### 驗收指標
- 儀表板主要圖表載入時間 < 1 秒（快取後 < 500 ms）。
- PR 趨勢計算誤差 < 1%，資料更新頻率至少每日一次。
- 圖表具備 Keyboard/Screen Reader 支援並通過無障礙檢測。

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
- REST 端點：`GET /api/history?range=7d|30d`（已提供歷史趨勢與總量資料）。
- TODO：`GET /api/analytics/volume`、`GET /api/analytics/one-rep-max`（預計獨立為 `/api/history/volume`、`/api/history/one-rep-max` 以提供進階分析）。

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

> **目前狀態：** 尚未提交 `public/sw.js`，需依 `next-pwa` 設定補上自訂 Service Worker 或調整建置流程。

### 細項需求（對應 MoSCoW）
- Must：Manifest、Service Worker、離線核心流程（查看動作、建立/編輯訓練）、回網自動同步、可安裝到裝置（Add to Home Screen / Desktop）。
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

### Service Worker 建置指引
- 目前專案尚未提供 `public/sw.js`，`next-pwa` 會在建置時依 `workboxOptions.swSrc` 引入自訂 Service Worker。
- 若要啟用自訂 Service Worker，可依以下流程：
  1. 在 `public/sw.js` 建立 Workbox 腳本，並於檔案開頭匯入 `next-pwa` 產生的預設快取宣告，例如：
     ```js
     import { precacheAndRoute } from "workbox-precaching";
     precacheAndRoute(self.__WB_MANIFEST);
     ```
  2. 於 `sw.js` 中追加離線快取、背景同步或推播邏輯，再視需求註冊對應的事件監聽器。
  3. 參考 [`next-pwa` 官方文件](https://github.com/shadowwalker/next-pwa#custom-service-worker) 驗證建置流程，並透過 `pnpm build` 確認 Service Worker 產出於 `.next/static` 與發佈的 `public/sw.js`。

### 驗收指標
- Lighthouse PWA 分數 ≥ 90。
- 核心頁面離線模式均可讀取資料，並於回網後自動同步。
- 背景同步失敗率 < 3%，並具備重試機制。

## 設定與偏好模組
> 休息計時器詳細規格請參考《[休息計時器執行規格](rest-timer-spec.md)》
### 目標與產出
- 提供使用者管理單位、主題、個人資料與通知偏好等設定。

### 細項需求（對應 MoSCoW）
- Must：單位切換（重量 kg/lb、距離 km/mi、尺寸 cm/inch）、主題切換（暗色/自動暗色）、第一週起始日設定（Sunday/Monday）、Prevent Screen Sleep、休息計時器（預設值、可調增量、自動啟動、音效/震動提醒）、個人資料編輯。
- Should：可用性與可達性強化（WCAG 2.1 AA）、快捷鍵設定管理。
- Could：多語系（zh-TW/en）、個人化儀表板偏好。

### 跨模組相依與邊界
- 與 `Auth` 共用 `profiles` 資料表與驗證，偏好設定欄位（如 `theme`, `unit_preference`, `locale`）直接儲存在此表。
- 與 `PWA/離線` 共用本地偏好快取與同步策略。
- 向 `外部 API/整合` 暴露偏好讀取端點以利行動 App 對齊。

### 預期 API / Schema 介面
- 表格：`profiles`（`id`, `email`, `full_name`, `avatar_url`, `locale`, `theme`, `unit_preference`, `created_at`, `updated_at`）。
- REST 端點：`GET/PUT /api/me/preferences`、`PATCH /api/me/profile`。

### 前/後端資產
- 前端：設定頁、偏好表單、單位/主題/週起始日控制、休息計時器與螢幕常亮設定 UI、無障礙導覽與快捷鍵提示。
- 後端：Supabase function 驗證偏好變更、偏好同步 webhook、裝置層 Prevent Sleep 設定同步 API。

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
- Could：Apple Health、Google Fit、Health Connect (Android) 匯入；週報分享公開頁。

### 跨模組相依與邊界
- 與 `Auth` 整合 Token 與權限，確保 RLS 規則一致。
- 消費 `Workout/Exercise CRUD`、`歷史與統計` 的資料結構。
- 與 `監控與安全` 協作以建立 Rate Limit、審計與 API 金鑰管理。

- REST：`GET /api/v1/workouts`, `POST /api/v1/import`, `GET /api/v1/history`。
- TODO：`GET /api/v1/analytics`（待 `進階分析 API` 完成後改綁 `/api/history` 擴充版端點）。
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
- Must：Row Level Security、最小權限控管、密碼與 Token 管理、資料匯出（CSV/JSON 單向下載）、帳號刪除流程（Danger Zone + 軟刪/硬刪策略）。
- Should：Sentry、PostHog 等監控與行為追蹤、Rate Limit、審計日誌。
- Could：自動化滲透測試、進階威脅偵測。

### 跨模組相依與邊界
- 支援所有模組的安全需求，特別是 `Auth`、`外部 API/整合`、`部署/DevOps`。
- 與 `Deployment/DevOps` 合作佈署監控 Agent 與日誌串流。

### 預期 API / Schema 介面
- 審計日誌表：`security_audit_logs`（`id`, `user_id`, `action`, `resource`, `timestamp`, `metadata`）。
- 匯出端點：`POST /api/me/export`（產生 CSV/JSON，僅供下載不支援匯入）。
- Danger Zone：`DELETE /api/me`（軟刪排程）與 `POST /api/me/purge`（管理者硬刪）。
- Rate limit 設定：`/api/_middleware` Edge 中介層。

### 前/後端資產
- 前端：安全設定 UI、資料匯出流程、帳號刪除 Danger Zone（雙重確認、後撤提示）、異常提示。
- 後端：Supabase Policy、監控管線（Sentry、PostHog、Log Drain）、自動化警報設定、帳號軟刪排程與硬刪批次任務。

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
