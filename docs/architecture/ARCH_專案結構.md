# Strong Web 專案結構說明

本文檔說明 Strong Web 專案的目錄結構和檔案組織方式。

## 📁 根目錄結構

```
strong-web/
├── app/                  # Next.js App Router 應用程式
├── components/          # React 元件
├── lib/                 # 函式庫和工具
├── types/              # TypeScript 型別定義
├── tests/              # 測試檔案
├── docs/               # 專案文檔
├── supabase/           # 資料庫相關
├── scripts/            # 工具腳本
└── public/             # 靜態資源
```

## 📂 主要目錄說明

### `app/` - 應用程式路由
```
app/
├── (auth)/             # 認證相關頁面
│   ├── sign-in/
│   ├── sign-up/
│   ├── forgot-password/
│   └── reset-password/
├── (dashboard)/        # 儀表板頁面（需要登入）
│   ├── workouts/       # 訓練管理
│   ├── exercises/      # 動作庫
│   ├── history/        # 歷史記錄
│   └── settings/       # 設定頁面
└── api/                # API 路由
    ├── workouts/
    ├── exercises/
    ├── history/
    ├── analytics/
    └── export/
```

### `components/` - React 元件
```
components/
├── features/           # 功能模組元件
│   ├── auth/          # 認證相關元件
│   ├── workouts/      # 訓練相關元件
│   ├── exercises/     # 動作庫元件
│   ├── history/       # 歷史記錄元件
│   ├── settings/      # 設定元件
│   ├── navigation/    # 導航元件
│   ├── offline/       # 離線功能元件
│   └── providers/     # Context Providers
└── ui/                # 基礎 UI 元件
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    └── ...
```

### `lib/` - 函式庫
```
lib/
├── api/               # API 客戶端
│   ├── authApi.ts
│   ├── workoutApi.ts
│   ├── exerciseApi.ts
│   ├── historyApi.ts
│   └── analyticsApi.ts
├── services/          # 業務邏輯服務
│   ├── authService.ts
│   ├── workoutService.ts
│   ├── exerciseService.ts
│   ├── historyService.ts
│   └── analyticsService.ts
├── analytics/         # 分析相關
│   └── oneRepMax.ts
├── i18n/             # 國際化
│   └── config.ts
├── utils/            # 工具函式整合
│   └── index.ts      # 統一匯出
├── testing/          # 測試工具
│   └── mockSupabase.ts
├── supabaseClient.ts # Supabase 客戶端
├── supabaseServer.ts # Supabase 伺服器端
├── idb.ts            # IndexedDB 封裝
├── offline-db.ts     # 離線資料庫
├── history.ts        # 歷史記錄工具
├── utils.ts          # 通用工具
├── validation.ts     # 表單驗證
└── env.ts            # 環境變數
```

### `types/` - TypeScript 型別
```
types/
├── index.ts          # 統一匯出入口
├── api.ts            # API 相關型別
├── db.ts             # 資料庫型別
└── view.ts           # 視圖型別
```

### `tests/` - 測試檔案
```
tests/
├── unit/             # 單元測試 (13個)
│   ├── *Dashboard.test.tsx
│   ├── *Form.test.tsx
│   └── *Api.test.ts
└── e2e/              # E2E 測試 (6個)
    ├── auth.spec.ts
    ├── workouts.spec.ts
    ├── exercises.spec.ts
    ├── history.spec.ts
    ├── settings.spec.ts
    └── password-reset.spec.ts
```

### `docs/` - 專案文檔
```
docs/
├── README.md                    # 文檔導覽
├── architecture/                # 架構說明
│   ├── feature-breakdown.md    # 功能模組拆解
│   ├── security.md             # 安全架構
│   └── PROJECT_STRUCTURE.md    # 專案結構（本檔案）
├── specs/                       # 規格文檔
│   ├── spec_1_strong_web_updated.md
│   ├── dashboard-spec.md
│   └── rest-timer-spec.md
├── setup/                       # 設定指南
│   └── supabase-setup.md
├── development/                 # 開發指南
│   └── testing-guide.md
└── reports/                     # 測試報告
    ├── TEST_REPORT.md
    └── CONFLICT_CHECK.md
```

### `supabase/` - 資料庫相關
```
supabase/
├── schema.sql          # 資料庫 Schema
└── migrations/         # 資料庫遷移
    ├── 20250102_enable_rls.sql
    ├── 20250102_rls_policies.sql
    ├── 20250102_rollback_rls.sql
    └── 20250115_add_one_rep_max_function.sql
```

### `scripts/` - 工具腳本
```
scripts/
├── setup-database.js              # 資料庫初始化
├── create-test-user.js            # 建立測試用戶
├── check-and-confirm-user.js      # 用戶驗證
├── test-supabase-connection.js    # 連線測試
├── test-rpc-function.js           # RPC 函式測試
└── deploy-one-rep-max-function.js # 部署函式
```

## 🎯 命名規範

### 檔案命名
- **元件檔案**: `kebab-case.tsx` (如 `workout-detail.tsx`)
- **型別檔案**: `camelCase.ts` (如 `api.ts`, `db.ts`)
- **工具函式**: `camelCase.ts` (如 `validation.ts`, `utils.ts`)
- **測試檔案**: `*.test.tsx` 或 `*.spec.ts`

### 程式碼命名
- **元件**: `PascalCase` (如 `WorkoutDetail`)
- **函式**: `camelCase` (如 `getWorkouts`, `validateEmail`)
- **常數**: `UPPER_SNAKE_CASE` (如 `API_BASE_URL`)
- **型別/介面**: `PascalCase` (如 `WorkoutRow`, `ApiResponse`)

## 📦 模組組織原則

### 功能模組化
- 每個功能模組包含相關的元件、API、服務和型別
- 元件按功能分類在 `components/features/`
- API 和服務分別在 `lib/api/` 和 `lib/services/`

### 關注點分離
- **UI 元件** (`components/ui/`): 純展示元件，可重用
- **功能元件** (`components/features/`): 包含業務邏輯的特定功能元件
- **API 層** (`lib/api/`): 處理資料請求
- **服務層** (`lib/services/`): 業務邏輯處理
- **型別** (`types/`): 統一管理型別定義

### 測試組織
- 單元測試與被測試檔案同名
- E2E 測試按功能流程組織
- 測試工具和 Mock 集中在 `lib/testing/`

## 🔧 配置檔案

根目錄的配置檔案：
- `next.config.js` - Next.js 配置
- `tsconfig.json` - TypeScript 配置
- `tailwind.config.ts` - Tailwind CSS 配置
- `jest.config.cjs` - Jest 測試配置
- `playwright.config.ts` - Playwright E2E 配置
- `eslint.config.mjs` - ESLint 配置
- `package.json` - 專案依賴和腳本

## 📖 使用指南

### 新增功能模組

1. 在 `components/features/` 建立新目錄
2. 在 `lib/api/` 和 `lib/services/` 建立對應的 API 和服務
3. 在 `types/` 定義相關型別
4. 在 `tests/unit/` 和 `tests/e2e/` 新增測試
5. 更新 `docs/architecture/feature-breakdown.md`

### 新增 API 路由

1. 在 `app/api/` 建立路由檔案
2. 在 `lib/api/` 建立客戶端函式
3. 在 `types/api.ts` 定義請求/回應型別
4. 新增相應的單元測試

### 新增文檔

1. 根據內容類型選擇對應的 docs 子目錄
2. 使用 Markdown 格式
3. 更新 `docs/README.md` 的連結

## 🔄 持續改進

這個結構會隨著專案成長持續優化。請確保：
- 新增功能遵循現有的組織模式
- 保持文檔與程式碼同步
- 定期審查和重構以維持程式碼品質
