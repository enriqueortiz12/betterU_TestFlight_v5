-- Drop existing table if it exists
DROP TABLE IF EXISTS mood_tracking;

-- Create new table with correct structure
CREATE TABLE mood_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    mood TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX mood_tracking_user_id_idx ON mood_tracking(user_id);
CREATE INDEX mood_tracking_date_idx ON mood_tracking(date);

-- Enable Row Level Security
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own mood entries"
    ON mood_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood entries"
    ON mood_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
    ON mood_tracking FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
    ON mood_tracking FOR DELETE
    USING (auth.uid() = user_id); 