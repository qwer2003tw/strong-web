-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
-- This migration enables RLS on all main tables
-- to ensure users can only access their own data.

-- Enable RLS on profiles table
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on exercises table
ALTER TABLE IF EXISTS exercises ENABLE ROW LEVEL SECURITY;

-- Enable RLS on workouts table
ALTER TABLE IF EXISTS workouts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on workout_entries table
ALTER TABLE IF EXISTS workout_entries ENABLE ROW LEVEL SECURITY;

-- Note: Policies will be created in a separate migration file
-- to keep concerns separated and make rollback easier.
