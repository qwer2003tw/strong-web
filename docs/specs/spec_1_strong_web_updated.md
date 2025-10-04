## Requirements (Updated)

以下以 MoSCoW 分類列出 MVP 的產品與非功能需求：

### Must (一定要有)
- **Auth 與 OAuth**  
  Email/Password + Google/Apple/GitHub (+Facebook 作為補充)。
- **訓練紀錄 CRUD**  
  動作庫 + 自訂動作、重量/次數/組數、備註、RPE（可選欄位）。
- **歷史與統計**  
  - 按日期、動作、肌群查詢  
  - 近 7/30 天訓練量、1RM 估算趨勢  
  - **Dashboard 模組**：
    - 每週訓練次數 (bar chart)  
    - 單動作 1RM/PR 趨勢 (line chart)  
    - 訓練量 Volume 趨勢  
- **PWA 與離線**  
  - 查看/建立/編輯訓練（核心功能可離線）  
  - 回網自動同步  
  - 安裝到裝置  
- **設定**  
  - 單位：重量 (kg/lb)、距離 (km/mi)、尺寸 (cm/inch)  
  - 主題：暗色/自動暗色  
  - 第一週起始日 (Sunday/Monday)  
  - **Prevent screen sleep during workout**  
  - **休息計時器**：預設值/可調增量、自動啟動、音效/震動提醒  
- **安全/隱私**  
  - Row Level Security  
  - 最小權限控管  
  - 資料匯出 CSV/JSON（單向，不支援匯回）  
  - 帳號刪除（UI Danger Zone + 軟刪/硬刪策略）  
- **API**  
  REST API + Auth 保護，支援互通

---

### Should (應該要有)
- **GraphQL API**：一致型別介面（對內/對外）。
- **訓練模板 (Routine/Plan)**  
  - 快速建立、複製  
  - 快速套用上次訓練  
  - **不完整組處理**（略過/提示/保留）  
  - **完成組鎖定 (Lock completed sets)**  
- **同步衝突處理**（離線/多裝置合併策略）。
- **可用性**  
  - 鍵盤快捷  
  - 基本可達性 (WCAG 2.1 AA)

---

### Could (可以有)
- **第三方同步/匯入**  
  - Apple Health  
  - Google Fit  
  - **Health Connect (Android)**  
- **身體測量模組**  
  - 體重、體脂、飲食熱量  
  - 圍度（胸、腰、手臂、大腿、小腿等）  
  - 與健康平台資料同步  
- **分享功能**  
  - 個人成就  
  - 週報分享（公開頁面）  
- **多語系 i18n** (zh-TW, en)

---

### Won’t (此版本不做)
- 社群/追蹤、留言、按讚等社交功能  
- 教練/課程市集、支付與分潤