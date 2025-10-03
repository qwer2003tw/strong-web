# 休息計時器執行規格

此文件補充《Strong Web 模組化功能拆解》中設定與偏好模組的「休息計時器」需求，說明功能範疇、介面互動、資料流程與測試標準。

## 目標
- 在訓練流程中提供可調整的休息計時器，提高用戶專注度與節奏感。
- 透過設定頁面讓使用者客製化計時器預設值、增量、自動啟動行為與提醒方式。
- 確保離線狀態仍能啟動計時器並記錄剩餘時間，回網後與雲端偏好同步。

## 功能範圍
1. **設定頁** (`app/(dashboard)/settings/page.tsx`)
   - 使用者可調整：
     - 預設休息時間（建議選單：30/60/90/120 秒，可輸入自訂值）。
     - 時間增量（每次調整 ±5 秒或 ±10 秒，提供切換選項）。
     - 自動啟動：完成一組動作後是否自動啟動計時器。
     - 提醒方式：音效、震動（支援行動裝置 Vibration API）、靜音。
   - 預覽區可立即試聽音效並測試震動。
   - 偏好儲存於 `profiles.rest_timer_settings` JSON 欄位，結構：
     ```json
     {
       "defaultSeconds": 90,
       "incrementSeconds": 10,
       "autoStart": true,
       "alertMode": "sound"
     }
     ```

2. **訓練詳情頁** (`components/features/workouts/workout-detail.tsx`)
   - 每組動作完成後顯示「開始計時」按鈕；若自動啟動開啟則自動倒數並顯示剩餘時間。
   - 提供快調按鈕（±增量秒數）與暫停/重設控制。
   - 計時完畢以 toast + 視覺閃爍提醒使用者下一組開始。
   - 裝置在計時期間觸發 Prevent Screen Sleep（透過 Screen Wake Lock API 或原生 fallback）。

3. **全域狀態管理**
   - 於 `components/features/settings/settings-context.tsx`（若無需新增）儲存偏好，並在訓練頁面透過 context 或 hook 使用。
   - 已進行中的計時器需存放於 `workoutRestTimer` store（Zustand 或 Context），包含欄位 `remainingMs`, `isRunning`, `lastUpdatedAt`，以利離線持續。

## API 與同步
- REST：
  - `GET /api/me/preferences`：回傳含 `rest_timer_settings` 的偏好。
  - `PUT /api/me/preferences`：更新偏好；伺服器驗證值域（0 < seconds ≤ 600）。
- IndexedDB：
  - Store `preferences` 已存在，需確保同步 `rest_timer_settings`。
  - 計時器狀態保存在 `workout_sessions` store（新增欄位 `restTimers`），以便離線維持計時。
- 同步策略：
  - 偏好更新成功後立即更新本地 context 與 IndexedDB。
  - 若離線調整設定，於回網後觸發補寫 API 並處理衝突（以最新時間戳為準）。

## 使用者流程
1. 使用者在設定頁設定預設 90 秒、增量 10 秒、自動啟動 ON、音效提醒。
2. 於訓練頁完成一組 → 自動啟動計時器倒數 90 秒。
3. 使用者覺得太久 → 點擊 −10 秒按鈕調整。
4. 倒數完畢 → 觸發音效 + 震動提醒，顯示「休息結束，開始下一組」。
5. 若使用者提前開始下一組，可按「重新開始」或手動停止計時器。

## 設計考量
- **響應式 UI**：Mobile 版採底部固定控制列，桌面版則放置於右側 panel。
- **音效與震動**：
  - 提供至少 2 種內建音效；檔案放於 `public/sounds/`。
  - 網頁震動僅支援行動裝置，需提供 fallback 提示。
- **無障礙**：
  - 計時器狀態提供 aria-live polite 區域，宣告剩餘時間變化與結束提醒。
  - 控制按鈕需支援鍵盤操作與清楚的 aria-label。
- **Prevent Screen Sleep**：
  - 使用 `navigator.wakeLock.request('screen')`，若不支援則提示用戶手動設定裝置。
  - 任務結束或頁面離開時釋放 wake lock。

## 邊界情境
- 使用者同時編輯多個訓練：每個訓練實例獨立持有計時器狀態。
- 離線情境：若離線期間計時器到期，恢復網路時只需同步偏好，不需回傳歷史計時資料。
- 多裝置登入：偏好以最後更新時間為準；計時器實際狀態不跨裝置同步。

## 測試計畫
- 單元測試：
  - 偏好更新 reducer/hook 正確儲存秒數、增量、自動啟動旗標。
  - 計時器 hook 計算剩餘時間與自動結束邏輯。
- 特性測試（React Testing Library）：
  - 設定頁使用者調整值後是否呼叫 API 和顯示成功訊息。
  - 訓練頁完成動作 → 自動啟動倒數並觸發提醒。
- E2E 測試：
  - Playwright 模擬流程：設定偏好 → 回到訓練頁 → 自動啟動計時器 → 到期顯示提醒。
  - 離線模式（`page.context().setOffline(true)`）下調整偏好並回網，確認同步成功。
- 裝置測試：於 iOS Safari、Android Chrome 驗證音效與震動行為、wake lock 兼容性。

## 驗收清單
- [ ] 設定頁能成功儲存預設秒數、增量、自動啟動與提醒方式。
- [ ] 訓練頁完成一組後自動啟動計時器並套用最新偏好。
- [ ] 音效/震動可分別切換，且靜音模式不觸發任何提醒。
- [ ] Prevent Screen Sleep 在支援的瀏覽器生效並於離開頁面釋放。
- [ ] IndexedDB 與 REST API 間的偏好同步正確處理離線/衝突情境。
- [ ] 所有互動元件通過鍵盤與螢幕閱讀器測試。

