# Strong Web Future Development Guide

## 0. Repository Status
- 目前儲存庫只有高層次需求文件，尚未初始化 Next.js 或 Supabase 專案。
- 新功能開發前必須先完成環境初始化與基本骨架建立。

## 1. Product Scope Recap
### MoSCoW 優先順序
- **Must**：
  - Supabase Auth 支援 Email/Password、Google、Apple、GitHub。
  - 訓練與動作 CRUD，含重量、次數、組數、RPE、備註等欄位。
  - 歷史與統計：依日期、動作、肌群的清單與 7/30 天訓練量、1RM 估算圖表。
  - PWA 離線體驗：核心功能離線可用、回網自動同步、可安裝。
  - 設定頁：單位、主題（暗色優先）、個人資料管理。
  - REST API（含 Auth 保護）、資料匯出、安全與隱私政策、RLS。
  - 部署於 Vercel + Supabase，具備監控與日誌。
- **Should**：GraphQL API、訓練模板、離線/多裝置衝突處理、鍵盤可用性。
- **Could**：Health 平台匯入、分享頁、多語系。
- **Won’t**：社群與教練市集。

## 2. 技術堆疊與版本策略
- **Next.js**：採用最新穩定版（目前為 15.5.x）App Router 與 React 18。初始化時使用 `npx create-next-app@latest`。
- **TypeScript**：對應 Next.js 的最新穩定相依版本。
- **TailwindCSS**：使用 3.4 以上最新穩定版，與 Shadcn/UI 組合。
- **Shadcn/UI**：以 `pnpm dlx shadcn@latest init` 或官方指引導入最新釋出版本。
- **Supabase**：`@supabase/supabase-js` 最新穩定版，Supabase CLI 以官方最新版本搭配。
- **PWA 工具**：`next-pwa` 或 `@ducanh2912/next-pwa` 最新穩定版，確保支援 Next.js 15。
- **IndexedDB**：優先考慮 `idb` 最新版（或 Dexie）。
- **國際化**：`next-intl` 最新穩定版。
- **圖表**：`recharts` 最新穩定版（目前 2.x 系列）。
- **測試**：Playwright 最新穩定版 + Jest 29/Testing Library 最新穩定版。
- **工具鏈**：ESLint 官方設定 + `@vercel/style-guide` 最新版、Prettier 3。
- 確保 `package.json` 版本範圍使用 caret（`^`）以追隨小版本更新，但重大升級需人工驗證。

## 3. 建議的初始化流程
1. **專案骨架**：在 repo 根目錄執行 `npx create-next-app@latest . --ts --tailwind --app`，初始化 Git commit。
2. **套件安裝**：整合上述必需套件，並在 `package.json` 內統一使用最新穩定版。
3. **環境變數與設定**：
   - 建立 `.env.local.example`，列出 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, OAuth client secrets 等。
   - 更新 `next.config.mjs` 或 `next.config.js` 支援 PWA、國際化、實驗設定。
   - Tailwind 設定暗色優先與 Shadcn 的 tokens。
4. **Supabase 整合**：
   - 在 Supabase 建立資料表、RLS 政策、視圖（見第 4 節）。
   - 於 `lib/supabaseClient.ts` 建立 browser/server client helper。
   - 設計 `lib/api/` 資料存取封裝、`lib/idb.ts` IndexedDB helper。
5. **Shadcn/UI 設定**：匯入 Button、Input、Dialog、Tabs、Table、Dropdown Menu 等常用元件。
6. **測試與品質**：
   - 建立 `tests/` 結構；Playwright E2E、Jest/RTL 單元測試。
   - `package.json` scripts：`lint`, `type-check`, `test`, `test:e2e`。
   - 設定 `ci.yml` workflow 執行安裝、lint、type-check、test。

## 4. 資料模型與安全策略
### Postgres Schema
```sql
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'zh-TW',
  unit_weight text not null default 'kg' check (unit_weight in ('kg','lb')),
  status text not null default 'active' check (status in ('active','pending_delete')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text,
  metadata jsonb default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_index int not null,
  weight numeric(6,2),
  reps int,
  rpe numeric(3,1),
  is_warmup boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workout_id, set_index)
);

create view public.v_user_training_volume with (security_invoker = true) as
select w.user_id,
       date_trunc('day', w.started_at) as day,
       sum(coalesce(ws.weight,0) * coalesce(ws.reps,0)) as volume
from public.workouts w
join public.workout_sets ws on ws.workout_id = w.id
group by 1,2;
```

### RLS 政策
```sql
alter table public.user_profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

create policy "Only active profiles visible" on public.user_profiles
  for select using (status = 'active' and auth.uid() = user_id);
create policy "Manage own active profile" on public.user_profiles
  for all using (status = 'active' and auth.uid() = user_id)
  with check (status in ('active','pending_delete') and auth.uid() = user_id);

create policy "Read public or own exercises" on public.exercises
  for select using (is_public or owner_id = auth.uid());
create policy "Manage own exercises" on public.exercises
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Read own workouts" on public.workouts
  for select using (user_id = auth.uid());
create policy "Manage own workouts" on public.workouts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Read own sets" on public.workout_sets
  for select using (
    exists(select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );
create policy "Manage own sets" on public.workout_sets
  for all using (
    exists(select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  )
  with check (
    exists(select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );
```

## 5. 前端架構與路由規劃
- `app/layout.tsx`：設定全域 Providers（Supabase session、Theme、Intl）。
- `app/(auth)/sign-in`、`app/(auth)/sign-up`：使用 Supabase Auth 元件。
- `app/(dashboard)/workouts`：主列表、建立訓練、快捷操作。
- `app/(dashboard)/workouts/[id]`：細節與 sets 編輯。
- `app/(dashboard)/exercises`：動作庫管理。
- `app/(dashboard)/settings`：個人資料、單位、主題設定。
- 共用元件放置於 `components/ui/` 與 `components/features/`。
- `app/api/*` 建立 REST handler，使用 `createRouteHandlerClient` 以 Supabase 驗證。

## 6. PWA 與離線策略
- `public/manifest.json`：設定名稱、icons、display、theme color。
- `public/sw.js`：
  - 預快取 app shell。
  - `Stale-While-Revalidate` 策略提供最新資料。
  - 離線 fallback 與背景同步（若瀏覽器支援）。
- `lib/idb.ts`：以 `idb` 建立 stores（`exercises`, `workouts_by_day`, `charts_cache`）。
- UI 顯示離線徽章與唯讀提示，提供重新整理/同步按鈕。

## 7. 品質保證與 DevOps
- **測試**：
  - Jest + Testing Library 覆蓋 hooks、服務模組。
  - Playwright 覆蓋登入、訓練 CRUD、離線模式（使用 service worker 模擬）。
- **CI/CD**：
  - GitHub Actions：Node 20 LTS、`pnpm install`, `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm test:e2e`。
  - Vercel Preview：每個 PR 建立預覽，並配置 Supabase 連線。
- **監控**：Sentry（前端）、PostHog（產品分析）、Supabase 內建日誌與資料庫備份。
- **安全**：Rate limit、CORS 白名單、密碼重設流程、刪除帳號排程（30 天寬限）。

## 8. 里程碑建議
- **M0**：需求凍結、資料模型與 RLS 定稿。
- **M1**：完成 Next.js/Supabase 骨架與登入流程。
- **M2**：Workout/Exercise CRUD + 基本分析與設定。
- **M3**：PWA、離線、可用性、多語系與測試完善。
- **M4**：部署、監控、文件與上線檢查。

## 9. 成功指標
- **產品**：DAU、每週訓練建立次數、PWA 安裝率、留存率。
- **技術**：API P50 < 300ms、錯誤率、離線快取命中率、Lighthouse >= 90。
- **法遵**：資料匯出回覆 < 24 小時、帳號刪除處理 < 31 天。

## 10. 文件維護建議
- 將此指南視為活文件，重大決策以 ADR 形式放於 `docs/adrs/`。
- 每個迭代更新 README 與此文件，反映版本升級與新策略。
- 維護 `docs/setup.md`（未來新增）說明本機開發、部署、疑難排解。
