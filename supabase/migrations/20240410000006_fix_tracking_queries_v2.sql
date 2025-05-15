-- Fix calorie_tracking table
ALTER TABLE calorie_tracking
    DROP CONSTRAINT IF EXISTS calorie_tracking_user_date_key,
    ADD CONSTRAINT calorie_tracking_user_date_key UNIQUE (user_id, date);

-- Fix water_tracking table
ALTER TABLE water_tracking
    DROP CONSTRAINT IF EXISTS water_tracking_user_date_key,
    ADD CONSTRAINT water_tracking_user_date_key UNIQUE (user_id, date);

-- Fix betteru_streaks table
ALTER TABLE betteru_streaks
    DROP CONSTRAINT IF EXISTS betteru_streaks_user_id_key,
    ADD CONSTRAINT betteru_streaks_user_id_key UNIQUE (user_id);

-- Fix workout_logs table
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workout_id UUID REFERENCES workouts(id),
    workout_name TEXT NOT NULL,
    exercises JSONB NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_at ON workout_logs(completed_at);

-- Enable RLS
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workout logs"
    ON workout_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
    ON workout_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
    ON workout_logs
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
    ON workout_logs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_workout_logs_updated_at
    BEFORE UPDATE ON workout_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix mental_session_logs table
CREATE TABLE IF NOT EXISTS mental_session_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    session_type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_mental_session_logs_user_id ON mental_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mental_session_logs_completed_at ON mental_session_logs(completed_at);

-- Enable RLS
ALTER TABLE mental_session_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own mental session logs"
    ON mental_session_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mental session logs"
    ON mental_session_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mental session logs"
    ON mental_session_logs
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mental session logs"
    ON mental_session_logs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_mental_session_logs_updated_at
    BEFORE UPDATE ON mental_session_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 