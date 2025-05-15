-- Drop existing table
DROP TABLE IF EXISTS calorie_tracking CASCADE;

-- Recreate calorie_tracking table with all required columns
CREATE TABLE calorie_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    consumed INTEGER DEFAULT 0,
    goal INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create index for better query performance
CREATE INDEX idx_calorie_tracking_user_date ON calorie_tracking(user_id, date);

-- Enable RLS
ALTER TABLE calorie_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updated_at
CREATE TRIGGER update_calorie_tracking_updated_at
    BEFORE UPDATE ON calorie_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 