-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- This migration creates RLS policies for all main tables
-- ensuring data isolation between users.

-- ============================================
-- 1. PROFILES Table Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. EXERCISES Table Policies
-- ============================================

-- Users can view their own exercises
CREATE POLICY "Users can view own exercises"
ON exercises FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own exercises
CREATE POLICY "Users can insert own exercises"
ON exercises FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises"
ON exercises FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises"
ON exercises FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. WORKOUTS Table Policies
-- ============================================

-- Users can view their own workouts
CREATE POLICY "Users can view own workouts"
ON workouts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own workouts
CREATE POLICY "Users can insert own workouts"
ON workouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update own workouts"
ON workouts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete own workouts"
ON workouts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 4. WORKOUT_ENTRIES Table Policies
-- ============================================
-- Note: These policies check ownership through the workouts table

-- Users can view workout entries for their own workouts
CREATE POLICY "Users can view own workout entries"
ON workout_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_entries.workout_id
    AND workouts.user_id = auth.uid()
  )
);

-- Users can insert workout entries for their own workouts
CREATE POLICY "Users can insert own workout entries"
ON workout_entries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_entries.workout_id
    AND workouts.user_id = auth.uid()
  )
);

-- Users can update workout entries for their own workouts
CREATE POLICY "Users can update own workout entries"
ON workout_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_entries.workout_id
    AND workouts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_entries.workout_id
    AND workouts.user_id = auth.uid()
  )
);

-- Users can delete workout entries for their own workouts
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
-- Verification Query (for testing)
-- ============================================
-- Run this query to verify all policies are created:
-- 
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
