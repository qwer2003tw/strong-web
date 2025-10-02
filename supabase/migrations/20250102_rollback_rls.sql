-- ============================================
-- Rollback RLS Policies and Settings
-- ============================================
-- This script removes all RLS policies and disables RLS
-- Use ONLY if you need to rollback the RLS implementation

-- ============================================
-- Drop all RLS policies
-- ============================================

-- Drop profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop exercises policies
DROP POLICY IF EXISTS "Users can view own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can insert own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;

-- Drop workouts policies
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;

-- Drop workout_entries policies
DROP POLICY IF EXISTS "Users can view own workout entries" ON workout_entries;
DROP POLICY IF EXISTS "Users can insert own workout entries" ON workout_entries;
DROP POLICY IF EXISTS "Users can update own workout entries" ON workout_entries;
DROP POLICY IF EXISTS "Users can delete own workout entries" ON workout_entries;

-- ============================================
-- Disable RLS on all tables
-- ============================================

ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_entries DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Verification
-- ============================================
-- Verify all policies are dropped:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
-- 
-- Should return no rows if rollback is successful
