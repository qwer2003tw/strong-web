-- ============================================
-- Strong Web 完整資料庫 Schema / Complete Database Schema
-- ============================================
-- 此檔案包含所有表格、索引、觸發器和 RLS 策略
-- This file contains all tables, indexes, triggers, and RLS policies

-- ============================================
-- 1. 表格定義 / Table Definitions
-- ============================================

-- Profiles Table (用戶個人資料 / User Profiles)
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

-- Exercises Table (練習動作 / Exercises)
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

-- Workouts Table (訓練計劃 / Workouts)
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

-- Workout Entries Table (訓練記錄 / Workout Entries)
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
-- 2. 索引 / Indexes
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
-- 3. 觸發器 / Triggers
-- ============================================

-- 自動更新 updated_at 欄位的函數 / Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 應用到所有表格 / Apply to all tables
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

-- 註冊時自動建立 Profile / Auto-create Profile on Sign Up
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

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================

-- 啟用 RLS / Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Exercises Policies
CREATE POLICY "Users can view own exercises"
  ON exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Workouts Policies
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Workout Entries Policies
CREATE POLICY "Users can view own workout entries"
  ON workout_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_entries.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout entries"
  ON workout_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_entries.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout entries"
  ON workout_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_entries.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout entries"
  ON workout_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_entries.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Analytics Helpers
-- ============================================

CREATE OR REPLACE FUNCTION public.get_one_rep_max(
  exercise_ids uuid[] DEFAULT NULL,
  from_date date DEFAULT NULL,
  to_date date DEFAULT NULL,
  method text DEFAULT 'epley'
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  performed_on date,
  estimated_1rm numeric,
  reps integer,
  weight numeric,
  unit text,
  source_entry_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  method_safe text := lower(coalesce(method, 'epley'));
BEGIN
  IF method_safe NOT IN ('epley', 'brzycki') THEN
    RAISE EXCEPTION USING MESSAGE = 'Unsupported 1RM method', ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH filtered_entries AS (
    SELECT
      we.id AS entry_id,
      we.exercise_id,
      e.name AS exercise_name,
      COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) AS performed_on,
      we.reps,
      we.weight,
      we.unit
    FROM workout_entries we
    JOIN workouts w ON w.id = we.workout_id
    JOIN exercises e ON e.id = we.exercise_id
    WHERE w.user_id = auth.uid()
      AND we.weight IS NOT NULL
      AND we.weight > 0
      AND we.reps IS NOT NULL
      AND we.reps > 0
      AND (method_safe <> 'brzycki' OR we.reps < 37)
      AND (exercise_ids IS NULL OR we.exercise_id = ANY(exercise_ids))
      AND (from_date IS NULL OR COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) >= from_date)
      AND (to_date IS NULL OR COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) <= to_date)
  ),
  ranked_entries AS (
    SELECT
      fe.entry_id,
      fe.exercise_id,
      fe.exercise_name,
      fe.performed_on,
      fe.reps,
      fe.weight,
      fe.unit,
      CASE
        WHEN method_safe = 'brzycki' THEN fe.weight * (36::numeric / (37 - fe.reps))
        ELSE fe.weight * (1 + fe.reps::numeric / 30)
      END AS estimated_1rm,
      ROW_NUMBER() OVER (
        PARTITION BY fe.exercise_id, fe.performed_on
        ORDER BY
          CASE
            WHEN method_safe = 'brzycki' THEN fe.weight * (36::numeric / (37 - fe.reps))
            ELSE fe.weight * (1 + fe.reps::numeric / 30)
          END DESC
      ) AS rank
    FROM filtered_entries fe
  )
  SELECT
    re.exercise_id,
    re.exercise_name,
    re.performed_on,
    re.estimated_1rm,
    re.reps,
    re.weight,
    re.unit,
    re.entry_id AS source_entry_id
  FROM ranked_entries re
  WHERE re.rank = 1
  ORDER BY performed_on ASC, exercise_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_one_rep_max(uuid[], date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_one_rep_max(uuid[], date, date, text) TO anon;
