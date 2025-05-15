-- Drop existing tables
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS mental_session_logs CASCADE;
DROP TABLE IF EXISTS betteru_streaks CASCADE;

-- Create workout_logs table
CREATE TABLE workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID,
    workout_name TEXT,
    exercises JSONB,
    completed_sets INTEGER,
    duration INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mental_session_logs table
CREATE TABLE mental_session_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    session_name TEXT,
    session_type TEXT,
    duration INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create betteru_streaks table
CREATE TABLE betteru_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT betteru_streaks_user_id_key UNIQUE (user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_completed_at ON workout_logs(completed_at);
CREATE INDEX idx_mental_session_logs_user_id ON mental_session_logs(user_id);
CREATE INDEX idx_mental_session_logs_completed_at ON mental_session_logs(completed_at);
CREATE INDEX idx_betteru_streaks_user_id ON betteru_streaks(user_id);

-- Enable Row Level Security
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE betteru_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own workout logs"
    ON workout_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
    ON workout_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
    ON workout_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own mental session logs"
    ON mental_session_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mental session logs"
    ON mental_session_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mental session logs"
    ON mental_session_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own streaks"
    ON betteru_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
    ON betteru_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
    ON betteru_streaks FOR UPDATE
    USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workout_logs_updated_at
    BEFORE UPDATE ON workout_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mental_session_logs_updated_at
    BEFORE UPDATE ON mental_session_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betteru_streaks_updated_at
    BEFORE UPDATE ON betteru_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 