# Dashboard 模組執行規格

本文延伸《Strong Web 模組化功能拆解》的 Dashboard 模組章節，補充近一步的資料流程、互動細節與驗收標準，供工程與設計人員落地實作。

## 目標與指標
- 在單一儀表板頁面提供使用者最近的訓練概況，降低跨頁面查找的成本。
- 將重要指標視覺化：每週訓練次數、單動作 PR/1RM 趨勢、總訓練量趨勢。
- 支援離線檢視與快速回傳資料，確保弱網環境亦可使用。

### 成功指標
- 儀表板載入首屏指標 < 1 秒（快取後 < 500 ms）。
- 主要圖表的資料更新頻率 ≥ 每日一次；手動重新整理可即時取得最新資料。
- Mobile 與 Desktop 皆通過 Lighthouse Accessibility ≥ 95。

## 資料來源與同步
- 後端：以 Supabase Edge Function 或資料庫視圖提供聚合結果。
  - `v_weekly_workout_counts`：欄位 `user_id`, `week_start`, `workout_count`。
  - `v_exercise_pr_trends`：欄位 `user_id`, `exercise_id`, `performed_at`, `est_1rm`, `pr_flag`。
  - `v_training_volume_trends`：欄位 `user_id`, `performed_at`, `total_volume`, `muscle_group`。
- API：統一從 `/api/dashboard` 提供下列端點，支援 query 參數 `range=4w|12w`、`exerciseId`、`muscleGroup`。
  - `GET /api/dashboard/weekly-frequency`
  - `GET /api/dashboard/pr-trend`
  - `GET /api/dashboard/volume-trend`
- IndexedDB：新增 `dashboard_snapshots` store，以 `userId-range-key` 為主鍵保存最近 1 次回應，並紀錄 `fetchedAt` 供離線提示。
- 同步策略：
  - 首次進入先讀取 IndexedDB，若資料 24 小時內則立即渲染並背景刷新。
  - 背景刷新成功後更新 UI 與快取；失敗時顯示 warning 並保留舊資料。

## 前端資訊架構與互動
- 頁面路徑：`app/(dashboard)/overview/page.tsx`。
- 版面配置（Mobile → Desktop）：
  1. 頂部 KPI 區塊（本週訓練次數、總量、最近 PR）。
  2. `Weekly Training Frequency` 圖表（bar chart）。
  3. `Exercise PR / 1RM Trend` 圖表（line chart + dot highlight for PR）。
  4. `Training Volume Trend` 圖表（area chart，支援肌群篩選）。
- 篩選器：
  - 日期範圍：近 4 週（預設）、近 12 週。
  - 肌群選擇（Upper/Lower/Core/All）。
  - 動作選擇：autocomplete 查詢 `exercises` 表，預設顯示常用動作。
- 空狀態：
  - 沒有訓練資料 → 顯示插圖與 CTA（前往建立訓練）。
  - 篩選結果空 → 提示調整篩選條件並提供重設按鈕。
- 錯誤狀態：
  - API 失敗 → 顯示錯誤訊息 + 重試按鈕；保留快取資料並標註「上次更新時間」。

## 視覺與元件需求
- 圖表元件採 Recharts；為減少重複，可抽離 `DashboardChartContainer` 提供標題、loading/empty/error 狀態。
- 色彩與主題：遵循現有 Tailwind 設計系統，支援深色/淺色模式。
- 無障礙：
  - 為圖表提供可聚焦的資料點與 aria-label，顯示對應數值。
  - 篩選器與 CTA 按鈕支援鍵盤與螢幕閱讀器描述。

## 後端需求
- Edge Function 或 API Route 需驗證 Supabase Session，確保 RLS 規則生效。
- 針對每個端點加上 30 秒快取 header（`Cache-Control: private, max-age=30`）以降低壓力。
- 預先計算：
  - 建議於每日凌晨透過 Supabase `cron` 更新 materialized view，以減少即時計算成本。
  - 訓練量趨勢需將重量轉換為使用者偏好單位，接口需提供 `unit` 欄位。

## 測試計畫
- 單元測試：
  - 圖表容器在 `loading/empty/error/with data` 狀態下的渲染。
  - 篩選器操作觸發 API 呼叫與快取更新。
- E2E 測試（Playwright）：
  - 模擬登入後載入儀表板，驗證每個圖表是否顯示資料或空狀態。
  - 調整肌群/動作篩選觀察圖表變化。
- 效能檢測：
  - 使用 Lighthouse / WebPageTest 測量首次渲染時間與交互時間。
  - 針對離線模式驗證 IndexedDB 快取是否生效。

## 驗收清單
- [ ] 三張圖表在 Mobile / Desktop 尺寸皆無 layout 崩壞。
- [ ] IndexedDB 快取可在離線模式展示最後資料並顯示更新時間。
- [ ] API 回傳空資料時提供對應 UI 提示，並記錄在 QA 試算表。
- [ ] Accessibility：所有互動元件皆可鍵盤操作並通過 screen reader 測試。
- [ ] 與 `歷史與統計` 模組 API 不產生衝突，documented 的端點皆可在 `docs/api`（若有）查閱。

