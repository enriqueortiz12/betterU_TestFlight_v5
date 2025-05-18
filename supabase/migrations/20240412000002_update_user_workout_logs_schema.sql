-- Add missing columns to user_workout_logs to match app requirements
ALTER TABLE user_workout_logs
ADD COLUMN IF NOT EXISTS workout_name TEXT,
ADD COLUMN IF NOT EXISTS exercises JSONB,
ADD COLUMN IF NOT EXISTS completed_sets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exercise_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exercise_names TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_weight INTEGER DEFAULT 0,
ALTER COLUMN duration TYPE INTEGER USING duration::integer;

-- Ensure completed_at exists and is of correct type
ALTER TABLE user_workout_logs
ALTER COLUMN completed_at TYPE TIMESTAMP WITH TIME ZONE USING completed_at::timestamptz; 