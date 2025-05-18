-- Drop the old workout_logs table if it exists
DROP TABLE IF EXISTS workout_logs;

-- Create the user_workout_logs table with the correct schema
CREATE TABLE IF NOT EXISTS user_workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id) NOT NULL,
    workout_name TEXT NOT NULL,
    exercises JSONB NOT NULL,
    completed_sets INTEGER NOT NULL DEFAULT 0,
    exercise_count INTEGER NOT NULL DEFAULT 0,
    exercise_names TEXT[] NOT NULL DEFAULT '{}',
    total_weight INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_workout_logs_profile_id ON user_workout_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_workout_logs_completed_at ON user_workout_logs(completed_at);

-- Enable RLS
ALTER TABLE user_workout_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own workout logs" ON user_workout_logs;
DROP POLICY IF EXISTS "Users can insert their own workout logs" ON user_workout_logs;
DROP POLICY IF EXISTS "Users can update their own workout logs" ON user_workout_logs;
DROP POLICY IF EXISTS "Users can delete their own workout logs" ON user_workout_logs;

-- Create policies
CREATE POLICY "Users can view their own workout logs"
    ON user_workout_logs
    FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own workout logs"
    ON user_workout_logs
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own workout logs"
    ON user_workout_logs
    FOR UPDATE
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own workout logs"
    ON user_workout_logs
    FOR DELETE
    USING (auth.uid() = profile_id); 