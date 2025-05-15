-- Add unique constraints to ensure one row per user per day
ALTER TABLE water_tracking
ADD CONSTRAINT water_tracking_user_date_unique UNIQUE (user_id, date);

ALTER TABLE calorie_tracking
ADD CONSTRAINT calorie_tracking_user_date_unique UNIQUE (user_id, date);

-- Create betteru_streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS betteru_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on betteru_streaks
ALTER TABLE betteru_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for betteru_streaks
CREATE POLICY "Users can view their own streak data"
    ON betteru_streaks
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak data"
    ON betteru_streaks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak data"
    ON betteru_streaks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_betteru_streaks_updated_at
    BEFORE UPDATE ON betteru_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create workout_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    duration INTEGER NOT NULL,
    exercises_completed INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create mental_session_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS mental_session_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    completed_at DATE NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, completed_at)
);

-- Enable RLS on new tables
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_session_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_logs
CREATE POLICY "Users can view their own workout logs"
    ON workout_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
    ON workout_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for mental_session_logs
CREATE POLICY "Users can view their own mental session logs"
    ON mental_session_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mental session logs"
    ON mental_session_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id); 