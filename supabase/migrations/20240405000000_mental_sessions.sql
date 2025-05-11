-- Create mental_sessions table
CREATE TABLE IF NOT EXISTS mental_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mood_tracking table
CREATE TABLE IF NOT EXISTS mood_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mood VARCHAR NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to user_stats table
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS mental_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prs_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;

-- Create betteru_streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS betteru_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE mental_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE betteru_streaks ENABLE ROW LEVEL SECURITY;

-- Policy for mental_sessions
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own mental sessions" ON mental_sessions;
    DROP POLICY IF EXISTS "Users can insert their own mental sessions" ON mental_sessions;
    
    CREATE POLICY "Users can view their own mental sessions"
        ON mental_sessions
        FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own mental sessions"
        ON mental_sessions
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END
$$;

-- Policy for mood_tracking
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own mood entries" ON mood_tracking;
    DROP POLICY IF EXISTS "Users can insert their own mood entries" ON mood_tracking;
    
    CREATE POLICY "Users can view their own mood entries"
        ON mood_tracking
        FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own mood entries"
        ON mood_tracking
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END
$$;

-- Policy for betteru_streaks
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own streaks" ON betteru_streaks;
    DROP POLICY IF EXISTS "Users can update their own streaks" ON betteru_streaks;
    
    CREATE POLICY "Users can view their own streaks"
        ON betteru_streaks
        FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own streaks"
        ON betteru_streaks
        FOR ALL
        USING (auth.uid() = user_id);
END
$$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'mental_sessions_user_id_idx'
    ) THEN
        CREATE INDEX mental_sessions_user_id_idx ON mental_sessions(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'mental_sessions_completed_at_idx'
    ) THEN
        CREATE INDEX mental_sessions_completed_at_idx ON mental_sessions(completed_at);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'mood_tracking_user_id_idx'
    ) THEN
        CREATE INDEX mood_tracking_user_id_idx ON mood_tracking(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'mood_tracking_date_idx'
    ) THEN
        CREATE INDEX mood_tracking_date_idx ON mood_tracking(date);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'betteru_streaks_user_id_idx'
    ) THEN
        CREATE INDEX betteru_streaks_user_id_idx ON betteru_streaks(user_id);
    END IF;
END
$$; 