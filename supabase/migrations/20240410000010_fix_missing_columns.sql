-- Drop existing tables
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS mental_session_logs CASCADE;
DROP TABLE IF EXISTS calorie_tracking CASCADE;

-- Recreate workout_logs with correct columns
CREATE TABLE workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workout_id UUID REFERENCES workouts(id),
    workout_name TEXT NOT NULL,
    exercises JSONB NOT NULL,
    completed_sets INTEGER NOT NULL,
    exercise_count INTEGER NOT NULL,
    exercise_names TEXT[] NOT NULL,
    total_weight INTEGER DEFAULT 0,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate mental_session_logs with correct columns
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

-- Recreate calorie_tracking with consumed column
CREATE TABLE calorie_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    consumed INTEGER DEFAULT 0,
    calories INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_completed_at ON workout_logs(completed_at);
CREATE INDEX idx_mental_session_logs_user_id ON mental_session_logs(user_id);
CREATE INDEX idx_mental_session_logs_completed_at ON mental_session_logs(completed_at);
CREATE INDEX idx_calorie_tracking_user_date ON calorie_tracking(user_id, date);

-- Enable RLS
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_tracking ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can delete their own workout logs"
    ON workout_logs FOR DELETE
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

CREATE POLICY "Users can delete their own mental session logs"
    ON mental_session_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for calorie_tracking
CREATE POLICY "Users can view their own calorie tracking"
    ON calorie_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calorie tracking"
    ON calorie_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calorie tracking"
    ON calorie_tracking FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calorie tracking"
    ON calorie_tracking FOR DELETE
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

CREATE TRIGGER update_calorie_tracking_updated_at
    BEFORE UPDATE ON calorie_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 