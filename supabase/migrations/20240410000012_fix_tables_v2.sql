-- Drop existing tables
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS mental_session_logs CASCADE;
DROP TABLE IF EXISTS betteru_streaks CASCADE;

-- Recreate workout_logs table
CREATE TABLE workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workout_id UUID REFERENCES workouts(id),
    workout_name TEXT NOT NULL,
    exercises JSONB NOT NULL,
    completed_sets JSONB NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate mental_session_logs table
CREATE TABLE mental_session_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    session_id UUID REFERENCES mental_sessions(id),
    session_name TEXT NOT NULL,
    session_type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate betteru_streaks table
CREATE TABLE betteru_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT betteru_streaks_user_id_key UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_completed_at ON workout_logs(completed_at);
CREATE INDEX idx_mental_session_logs_user_id ON mental_session_logs(user_id);
CREATE INDEX idx_mental_session_logs_completed_at ON mental_session_logs(completed_at);
CREATE INDEX idx_betteru_streaks_user_id ON betteru_streaks(user_id);

-- Enable RLS
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE betteru_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_logs
CREATE POLICY "Users can view their own workout logs"
    ON workout_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
    ON workout_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
    ON workout_logs FOR UPDATE
    USING (auth.uid() = user_id);

-- Create RLS policies for mental_session_logs
CREATE POLICY "Users can view their own mental session logs"
    ON mental_session_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mental session logs"
    ON mental_session_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mental session logs"
    ON mental_session_logs FOR UPDATE
    USING (auth.uid() = user_id);

-- Create RLS policies for betteru_streaks
CREATE POLICY "Users can view their own streak data"
    ON betteru_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak data"
    ON betteru_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak data"
    ON betteru_streaks FOR UPDATE
    USING (auth.uid() = user_id);

-- Create triggers for updated_at
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