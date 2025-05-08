-- Drop existing tables if they exist
DROP TABLE IF EXISTS calorie_tracking;
DROP TABLE IF EXISTS water_tracking;

-- Create calorie_tracking table
CREATE TABLE calorie_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    consumed NUMERIC DEFAULT 0,
    goal NUMERIC DEFAULT 2000,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create water_tracking table
CREATE TABLE water_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    consumed NUMERIC DEFAULT 0,
    goal NUMERIC DEFAULT 2.0,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_calorie_tracking_user_date ON calorie_tracking(user_id, date);
CREATE INDEX idx_water_tracking_user_date ON water_tracking(user_id, date);

-- Add RLS (Row Level Security) policies
ALTER TABLE calorie_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for calorie_tracking
CREATE POLICY "Users can view their own calorie tracking"
    ON calorie_tracking
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calorie tracking"
    ON calorie_tracking
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calorie tracking"
    ON calorie_tracking
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for water_tracking
CREATE POLICY "Users can view their own water tracking"
    ON water_tracking
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water tracking"
    ON water_tracking
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water tracking"
    ON water_tracking
    FOR UPDATE
    USING (auth.uid() = user_id); 