-- First, let's check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS betteru_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a temporary table with the latest streak data
CREATE TEMP TABLE latest_streaks AS
WITH ranked_streaks AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
    FROM betteru_streaks
)
SELECT * FROM ranked_streaks WHERE rn = 1;

-- Delete all existing streak data
DELETE FROM betteru_streaks;

-- Reinsert the latest streak data for each user
INSERT INTO betteru_streaks (
    id,
    user_id,
    current_streak,
    longest_streak,
    last_completed_date,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    current_streak,
    longest_streak,
    last_completed_date,
    created_at,
    updated_at
FROM latest_streaks;

-- Drop the temporary table
DROP TABLE latest_streaks;

-- Now add the unique constraint
ALTER TABLE betteru_streaks
    ADD CONSTRAINT betteru_streaks_user_id_key UNIQUE (user_id);

-- Enable RLS
ALTER TABLE betteru_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own streaks"
    ON betteru_streaks
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
    ON betteru_streaks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
    ON betteru_streaks
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks"
    ON betteru_streaks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_betteru_streaks_updated_at
    BEFORE UPDATE ON betteru_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 