-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS weight DECIMAL,
ADD COLUMN IF NOT EXISTS height DECIMAL,
ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS training_level TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add RLS policies for the new columns
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- Add check constraints for data validation
ALTER TABLE profiles
ADD CONSTRAINT valid_age CHECK (age >= 13 AND age <= 120),
ADD CONSTRAINT valid_weight CHECK (weight >= 30 AND weight <= 500),
ADD CONSTRAINT valid_height CHECK (height >= 100 AND height <= 250);

-- Add comment to table
COMMENT ON TABLE profiles IS 'User profiles with personal and fitness information'; 