-- Drop existing tables if they exist
DROP TABLE IF EXISTS trainer_messages;
DROP TABLE IF EXISTS daily_message_count;

-- Create trainer_messages table
CREATE TABLE trainer_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    message_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'trainer')),
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL
);

-- Create daily_message_count table
CREATE TABLE daily_message_count (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    count INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_trainer_messages_user_id ON trainer_messages(user_id);
CREATE INDEX idx_trainer_messages_date ON trainer_messages(date);
CREATE INDEX idx_trainer_messages_user_date ON trainer_messages(user_id, date);
CREATE INDEX idx_daily_message_count_user_date ON daily_message_count(user_id, date);

-- Add RLS (Row Level Security) policies
ALTER TABLE trainer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_message_count ENABLE ROW LEVEL SECURITY;

-- Create policies for trainer_messages
CREATE POLICY "Users can view their own messages"
    ON trainer_messages
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
    ON trainer_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
    ON trainer_messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for daily_message_count
CREATE POLICY "Users can view their own message count"
    ON daily_message_count
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own message count"
    ON daily_message_count
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message count"
    ON daily_message_count
    FOR UPDATE
    USING (auth.uid() = user_id); 