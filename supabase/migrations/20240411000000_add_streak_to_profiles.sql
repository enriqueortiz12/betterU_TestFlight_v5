-- Add streak columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_update DATE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON profiles(streak);
CREATE INDEX IF NOT EXISTS idx_profiles_last_streak_update ON profiles(last_streak_update); 