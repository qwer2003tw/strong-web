# Supabase 資料庫設定指南 / Supabase Database Setup Guide

本文件說明如何從零開始設定 Strong Web 專案的 Supabase 資料庫。

This document explains how to set up the Supabase database for the Strong Web project from scratch.

## 目錄 / Table of Contents

1. [建立 Supabase 專案 / Create Supabase Project](#建立-supabase-專案--create-supabase-project)
2. [環境變數設定 / Environment Variables](#環境變數設定--environment-variables)
3. [資料庫表格結構 / Database Schema](#資料庫表格結構--database-schema)
4. [執行遷移 / Run Migrations](#執行遷移--run-migrations)
5. [設定 Row Level Security / Setup Row Level Security](#設定-row-level-security--setup-row-level-security)
6. [驗證設定 / Verify Setup](#驗證設定--verify-setup)

---

## 建立 Supabase 專案 / Create Supabase Project

### 步驟 1：註冊 Supabase 帳號 / Step 1: Sign up for Supabase

1. 前往 [supabase.com](https://supabase.com) / Go to [supabase.com](https://supabase.com)
2. 點擊 "Start your project" / Click "Start your project"
3. 使用 GitHub、Google 或 Email 註冊 / Sign up with GitHub, Google, or Email

### 步驟 2：建立新專案 / Step 2: Create a New Project

1. 點擊 "New Project" / Click "New Project"
2. 選擇組織（或建立新組織）/ Select an organization (or create a new one)
3. 填寫專案資訊 / Fill in project details:
   - **專案名稱 / Project Name**: `strong-web` (或自訂名稱 / or custom name)
   - **資料庫密碼 / Database Password**: 產生強密碼並**儲存好**！/ Generate a strong password and **save it**!
   - **區域 / Region**: 選擇最接近用戶的區域 / Choose the region closest to your users
   - **定價方案 / Pricing Plan**: 開發階段選擇 Free / Choose Free for development

4. 點擊 "Create new project" / Click "Create new project"
5. 等待專案初始化（約 1-2 分鐘）/ Wait for project initialization (about 1-2 minutes)

---

## 快速開始：使用自動化腳本 / Quick Start: Using Automated Script

**🚀 最簡單的方法！/ The Easiest Way!**

如果您已經：
1. ✅ 建立了 Supabase 專案
2. ✅ 設定了環境變數（`.env.local`）

那麼您可以直接執行以下命令來自動初始化資料庫：

If you have already:
1. ✅ Created a Supabase project
2. ✅ Set up environment variables (`.env.local`)

Then you can simply run the following command to automatically initialize the database:

```bash
pnpm run setup:db
```

這個腳本會自動：
- ✅ 檢查環境變數
- ✅ 測試 Supabase 連接
- ✅ 建立所有表格
- ✅ 設定索引和觸發器
- ✅ 啟用 Row Level Security
- ✅ 驗證設定

This script will automatically:
- ✅ Check environment variables
- ✅ Test Supabase connection
- ✅ Create all tables
- ✅ Set up indexes and triggers
- ✅ Enable Row Level Security
- ✅ Verify setup

**⚠️ 注意 / Note**: 由於 Supabase 的限制，腳本可能無法直接執行 SQL（需要 service_role key）。如果腳本提示無法執行 SQL，請按照下方的「手動方法」章節操作。

**⚠️ Note**: Due to Supabase limitations, the script may not be able to execute SQL directly (requires service_role key). If the script indicates it cannot execute SQL, please follow the "Manual Method" section below.

---

## 環境變數設定 / Environment Variables

### 步驟 1：取得 Supabase 金鑰 / Step 1: Get Supabase Keys

在 Supabase 專案儀表板中：

In your Supabase project dashboard:

1. 前往 **Settings** → **API**
2. 找到以下資訊 / Find the following information:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon / public key**: `eyJhbG...` (公開金鑰 / public key)
   - **service_role key**: `eyJhbG...` (服務金鑰，**僅用於伺服器端** / service key, **server-side only**)

### 步驟 2：建立環境變數檔案 / Step 2: Create Environment File

在專案根目錄建立 `.env.local` 檔案：

Create a `.env.local` file in the project root:

```bash
# Supabase 設定 / Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 可選：用於測試 / Optional: For testing
# NEXT_PUBLIC_USE_MOCK_SUPABASE=false
```

**⚠️ 重要 / Important**:
- `.env.local` 已在 `.gitignore` 中，不會被提交到 Git / `.env.local` is in `.gitignore` and won't be committed to Git
- **絕不**將真實的金鑰提交到版本控制 / **Never** commit real keys to version control
- 生產環境請在 Vercel 或其他部署平台設定環境變數 / For production, set environment variables in Vercel or your deployment platform

---

## 資料庫表格結構 / Database Schema

### 完整的 SQL Schema

在 Supabase 儀表板的 **SQL Editor** 中執行以下 SQL：

Execute the following SQL in the Supabase dashboard **SQL Editor**:

```sql
-- ============================================
-- Strong Web Database Schema
-- ============================================

-- 1. Profiles Table (用戶個人資料 / User Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'zh-TW',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  unit_preference TEXT DEFAULT 'metric' CHECK (unit_preference IN ('metric', 'imperial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Exercises Table (練習動作 / Exercises)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workouts Table (訓練計劃 / Workouts)
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workout Entries Table (訓練記錄 / Workout Entries)
CREATE TABLE IF NOT EXISTS workout_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 1,
  reps INTEGER,
  weight NUMERIC(10, 2),
  unit TEXT CHECK (unit IN ('metric', 'imperial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes (索引以提升查詢效能 / Indexes for Query Performance)
-- ============================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Exercises
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);

-- Workouts
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_status ON workouts(status);
CREATE INDEX IF NOT EXISTS idx_workouts_scheduled_for ON workouts(scheduled_for);

-- Workout Entries
CREATE INDEX IF NOT EXISTS idx_workout_entries_workout_id ON workout_entries(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_entries_exercise_id ON workout_entries(exercise_id);

-- ============================================
-- Triggers (自動更新 updated_at / Auto-update updated_at)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_entries_updated_at
  BEFORE UPDATE ON workout_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Create Profile on User Sign Up (註冊時自動建立 Profile / Auto-create Profile on Sign Up)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 表格說明 / Table Descriptions

#### 1. profiles (用戶個人資料)
- 儲存用戶的個人設定和偏好 / Stores user preferences and settings
- 與 `auth.users` 一對一關係 / One-to-one relationship with `auth.users`
- 在用戶註冊時自動建立 / Automatically created on user sign-up

#### 2. exercises (練習動作)
- 儲存用戶的自訂動作 / Stores user's custom exercises
- 包含動作名稱、肌群、器材等資訊 / Contains exercise name, muscle group, equipment, etc.

#### 3. workouts (訓練計劃)
- 儲存訓練計劃 / Stores workout plans
- 可以是草稿、已排程或已完成 / Can be draft, scheduled, or completed

#### 4. workout_entries (訓練記錄)
- 儲存具體的訓練內容 / Stores specific workout content
- 包含組數、次數、重量等 / Contains sets, reps, weight, etc.
- 與 workouts 和 exercises 關聯 / Related to workouts and exercises

---

## 執行遷移 / Run Migrations

專案已包含 RLS 相關的遷移檔案，位於 `supabase/migrations/` 目錄。

The project includes RLS-related migration files in the `supabase/migrations/` directory.

### 選項 1：使用 Supabase CLI（推薦 / Recommended）

```bash
# 1. 安裝 Supabase CLI / Install Supabase CLI
npm install -g supabase

# 2. 登入 Supabase / Login to Supabase
supabase login

# 3. 連結到您的專案 / Link to your project
supabase link --project-ref your-project-ref

# 4. 執行遷移 / Run migrations
supabase db push
```

### 選項 2：手動執行 SQL

在 Supabase 儀表板的 **SQL Editor** 中依序執行：

Execute in order in the Supabase dashboard **SQL Editor**:

1. `supabase/migrations/20250102_enable_rls.sql` - 啟用 RLS / Enable RLS
2. `supabase/migrations/20250102_rls_policies.sql` - 建立 RLS 策略 / Create RLS policies

---

## 設定 Row Level Security / Setup Row Level Security

### 為什麼需要 RLS？/ Why RLS?

Row Level Security 確保：
- 用戶只能訪問自己的數據 / Users can only access their own data
- 即使有 API 金鑰也無法訪問他人數據 / Even with API keys, users cannot access others' data
- 提供資料庫層級的安全保護 / Provides database-level security

### RLS 策略概覽 / RLS Policies Overview

所有表格都實施了以下 RLS 策略：

All tables have the following RLS policies:

| 表格 / Table | SELECT | INSERT | UPDATE | DELETE |
|-------------|--------|--------|--------|--------|
| profiles | ✅ 自己 / Own | ✅ 自己 / Own | ✅ 自己 / Own | ❌ |
| exercises | ✅ 自己 / Own | ✅ 自己 / Own | ✅ 自己 / Own | ✅ 自己 / Own |
| workouts | ✅ 自己 / Own | ✅ 自己 / Own | ✅ 自己 / Own | ✅ 自己 / Own |
| workout_entries | ✅ 通過 workout / Via workout | ✅ 通過 workout / Via workout | ✅ 通過 workout / Via workout | ✅ 通過 workout / Via workout |

詳細的策略內容請參考 `supabase/migrations/20250102_rls_policies.sql`。

For detailed policy content, see `supabase/migrations/20250102_rls_policies.sql`.

---

## 驗證設定 / Verify Setup

### 1. 檢查表格是否已建立 / Check if Tables are Created

在 **SQL Editor** 執行：/ Execute in **SQL Editor**:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

應該看到：/ You should see:
- exercises
- profiles
- workout_entries
- workouts

### 2. 檢查 RLS 是否啟用 / Check if RLS is Enabled

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

所有表格的 `rowsecurity` 應該都是 `true` / All tables should have `rowsecurity` as `true`.

### 3. 檢查 RLS 策略 / Check RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

應該看到每個表格都有對應的策略 / You should see policies for each table.

### 4. 測試資料庫連接 / Test Database Connection

在專案根目錄執行：/ Execute in project root:

```bash
node scripts/test-supabase-connection.js
```

如果成功連接，應該會看到 "✅ Successfully connected to Supabase!" / If successful, you should see "✅ Successfully connected to Supabase!"

---

## 常見問題 / FAQ

### Q1: 忘記資料庫密碼怎麼辦？/ What if I forget the database password?

**A**: 前往 Supabase 儀表板 → **Settings** → **Database** → **Reset database password**

**A**: Go to Supabase dashboard → **Settings** → **Database** → **Reset database password**

### Q2: 如何重設資料庫？/ How to reset the database?

**A**: 
1. 在 **SQL Editor** 執行 DROP TABLE 語句（小心！會刪除所有數據）
2. 重新執行建立表格的 SQL
3. 重新執行遷移

**A**: 
1. Execute DROP TABLE statements in **SQL Editor** (Careful! This will delete all data)
2. Re-run the table creation SQL
3. Re-run migrations

```sql
-- 刪除所有表格（謹慎使用！/ Use with caution!)
DROP TABLE IF EXISTS workout_entries CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

### Q3: 本地開發可以使用本地 Supabase 嗎？/ Can I use local Supabase for development?

**A**: 可以！使用 Supabase CLI 啟動本地實例：

**A**: Yes! Use Supabase CLI to start a local instance:

```bash
# 啟動本地 Supabase / Start local Supabase
supabase start

# 停止本地 Supabase / Stop local Supabase
supabase stop
```

然後更新 `.env.local` 指向本地 URL：

Then update `.env.local` to point to local URL:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

### Q4: 如何備份資料庫？/ How to backup the database?

**A**: 在 Supabase 儀表板：

**A**: In Supabase dashboard:

1. 前往 **Settings** → **Database**
2. 點擊 **Backup** 分頁
3. 點擊 **Download backup**

或使用 CLI：/ Or use CLI:

```bash
supabase db dump -f backup.sql
```

---

## 下一步 / Next Steps

1. ✅ 完成資料庫設定 / Complete database setup
2. ✅ 設定環境變數 / Set up environment variables
3. ✅ 執行遷移和 RLS 設定 / Run migrations and RLS setup
4. 🔜 開始開發應用程式 / Start developing the application
5. 🔜 部署到 Vercel / Deploy to Vercel

---

## 相關文件 / Related Documents

- [安全文件 / Security Documentation](./security.md)
- [測試指南 / Testing Guide](./testing-guide.md)
- [功能拆解 / Feature Breakdown](./feature-breakdown.md)

---

**最後更新 / Last Updated**: 2025-10-02
