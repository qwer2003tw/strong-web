# Strong Web 專案需求說明

## 背景與願景
Strong Web 是一個完全獨立可用的健身紀錄與分析平台，核心是跨平台 Web 體驗與 PWA 能力，確保桌機、筆電與行動裝置都能獲得一致、流暢、可離線的訓練紀錄流程。

## 產品價值主張
- **全端一致帳號體驗**：以 Supabase Auth 為基礎，提供 Email/Password 與 Google、Apple、GitHub 等社群登入。
- **完整訓練紀錄管理**：支援建立、編輯、刪除訓練，提供自訂動作、重量、次數、組數、備註與 RPE 輸入，資料儲存在 Supabase Postgres。
- **資料互通與擴展性**：提供 REST / GraphQL API 以利第三方或行動端整合，並預留與 Apple Health、Google Fit 同步的能力。
- **極簡暗色設計語言**：採用 Next.js (App Router)、TailwindCSS、Shadcn/UI，打造暗色優先且可主題化的介面，並以 Recharts 呈現分析圖表。
- **部署與維運效率**：前端部署於 Vercel，後端使用 Supabase（Auth、Database、Edge Functions），以低維護成本支援快速迭代。
- **PWA 能力**：支援安裝至桌面或主畫面、離線快取與背景同步，使 Web 端在弱網或無網狀態下仍可使用核心功能。

## MoSCoW 需求分類
> 📘 **模組化規劃**：詳細的功能拆解、資料模型與跨模組依賴，請參考《[Strong Web 模組化功能拆解](docs/feature-breakdown.md)》。下表整理了各模組的主要負責團隊與建議執行順序，供任務派發參考。

| 建議順序 | 模組 | 主要負責團隊 | 說明 |
| --- | --- | --- | --- |
| 1 | [Auth 模組](docs/feature-breakdown.md#auth-模組) | Identity Squad（後端 / 前端） | 完成核心登入、OAuth 與使用者初始化，為所有其他模組提供授權基礎。 |
| 2 | [部署 / DevOps 模組](docs/feature-breakdown.md#部署--devops-模組) | Platform Squad（DevOps / 後端） | 建立 Vercel、Supabase 環境與 CI/CD，確保後續功能可快速迭代。 |
| 3 | [監控與安全模組](docs/feature-breakdown.md#監控與安全模組) | SecOps Squad（後端 / 法遵） | 佈署 RLS、審計與監控底盤，保障資料安全與法遵需求。 |
| 4 | [Workout / Exercise CRUD 模組](docs/feature-breakdown.md#workout--exercise-crud-模組) | Training Experience Squad（前端 / 後端） | 實作訓練與動作管理，是歷史統計與 PWA 的資料來源。 |
| 5 | [PWA / 離線模組](docs/feature-breakdown.md#pwa--離線模組) | Experience Squad（前端） | 補強離線流程與安裝體驗，確保弱網環境的使用可靠度。 |
| 6 | [歷史與統計模組](docs/feature-breakdown.md#歷史與統計模組) | Insights Squad（前端 / 數據） | 提供 Recharts 圖表與統計視圖，支援訓練回顧與決策。 |
| 7 | [設定與偏好模組](docs/feature-breakdown.md#設定與偏好模組) | Personalization Squad（前端） | 讓使用者自訂單位、主題、多語系與個人資料。 |
| 8 | [外部 API / 整合模組](docs/feature-breakdown.md#外部-api--整合模組) | Integration Squad（後端 / 平台） | 對外提供 REST/GraphQL 介面與健康平台匯入能力。 |

### Must（一定要有）
- **Auth 與 OAuth**：Email/Password + Google/Apple/GitHub（Supabase Auth）。
- **訓練紀錄 CRUD**：動作庫、自訂動作、重量/次數/組數、備註、RPE（可選欄位）。
- **歷史與基本統計**：依日期、動作、肌群查詢；近 7/30 天訓練量與 1RM 估算趨勢（Recharts 視覺化）。
- **PWA 與離線支援**：核心流程離線可用（查看動作、建立/編輯訓練）；回網後自動同步；支援安裝至裝置。
- **設定頁**：切換單位（kg/lb）、主題（暗色優先）、個人資料編輯。
- **API**：公開 REST API 並透過 Auth 保護，確保 Strong App 與 Web 互通。
- **安全與隱私**：Row Level Security、最小權限控管、密碼與 Token 管理、資料匯出（CSV/JSON）。
- **部署**：前端 Vercel、後端 Supabase，具備基本監控與日誌。

### Should（應該要有）
- **GraphQL API**：提供一致的型別介面給內外部使用。
- **訓練模板**：Routine/Plan 建立與快速套用，支援複製上次訓練。
- **同步衝突處理**：離線或多裝置編輯時的合併策略與提示。
- **可用性強化**：鍵盤快捷、可達性（符合 WCAG 2.1 AA）。

### Could（可以有）
- **第三方匯入**：Apple Health、Google Fit 單向匯入。
- **分享功能**：個人成就或週報分享，公開可視頁。
- **多語系**：i18n（至少 zh-TW 與 en）。

### Won’t（此版本不做）
- **社群或追蹤功能**：例如朋友互動、留言或按讚。
- **教練或課程市集**：含支付或分潤機制。

## 技術架構總覽
- **前端**：Next.js 最新穩定版（目前 15.5.x，App Router）、TypeScript、TailwindCSS、Shadcn/UI、Recharts、next-intl。
- **身份與資料層**：Supabase Auth、Postgres、Row Level Security、Edge Functions、Scheduled Jobs。
- **離線策略**：Service Worker 管理 app shell 快取，IndexedDB（建議 idb 或 Dexie）儲存只讀快照，線上時以 ETag 驗證增量更新。
- **部署**：Vercel 負責前端與 Edge Runtime，Supabase 提供資料層服務。

## API 與資料模型方向
- 核心 REST 端點：`/api/me`、`/api/exercises`、`/api/workouts` 等，未來提供 GraphQL 端點。
- 資料模型：`user_profiles`、`exercises`、`workouts`、`workout_sets` 等表格，搭配 `v_user_training_volume` 視圖計算訓練量。
- 安全策略：對上述表格啟用 Row Level Security，確保使用者僅能存取自己的資料。

## PWA 與離線體驗
- **Manifest**：定義名稱、圖示與啟動畫面，支援安裝體驗。
- **Service Worker**：採 Cache First + Stale While Revalidate 策略，保護 app shell 與最新資料。
- **IndexedDB 快取**：儲存 exercises、workouts 與圖表資料的唯讀快照，離線時提供即時回應。
- **UX 提示**：離線時顯示唯讀提示並阻擋不支援的操作。

- **初始化步驟**：建立 Supabase 專案與資料表、設定 OAuth、以 `create-next-app` 初始化最新穩定版 Next.js 結構、安裝必要套件。
- **品質保證**：導入 Jest、Testing Library、Playwright，建立 CI 以執行 lint、型別檢查與測試。
- **監控與安全**：整合 Sentry、PostHog，設定 Rate Limit、CORS、密碼與 Token 管理政策。
- **部署流程**：使用 Vercel Preview 確認每次變更，Supabase 處理資料備份與日誌，確保帳號刪除與資料匯出流程符合法遵。
- 更詳細的技術堆疊、初始化流程、PWA 策略請參考 `docs/development-guide.md`。

## 里程碑建議
1. **M0**：需求凍結與資料模型定案。
2. **M1**：完成基礎架構與認證流程。
3. **M2**：實作訓練 CRUD、歷史與分析功能。
4. **M3**：強化 PWA、離線、可用性與多語系，補齊測試。
5. **M4**：上線前檢查、監控設定與文件整理。

## 成功指標
- **產品層面**：DAU、訓練建立頻率、回訪率、PWA 安裝率。
- **技術層面**：錯誤率、API 延遲（P50 < 300ms）、離線快取命中率、Lighthouse > 90。
- **法遵層面**：帳號刪除流程 < 31 天、資料匯出回應 < 24 小時。

以上需求說明為後續開發 Strong Web MVP 的參考依據。
