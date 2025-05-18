-- =============================================
-- 20240315000000_create_personal_records.sql
-- =============================================
-- Create personal_records table
create table if not exists personal_records (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    exercise text not null,
    current_value numeric not null,
    target_value numeric not null,
    unit text not null check (unit in ('kg', 'lbs')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table personal_records enable row level security;

create policy "Users can view their own records"
    on personal_records for select
    using (auth.uid() = user_id);

create policy "Users can insert their own records"
    on personal_records for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own records"
    on personal_records for update
    using (auth.uid() = user_id);

create policy "Users can delete their own records"
    on personal_records for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_personal_records_updated_at
    before update on personal_records
    for each row
    execute function update_updated_at_column();

-- =============================================
-- 20240320000000_fix_mood_tracking.sql
-- =============================================
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

-- =============================================
-- 20240410000000_create_user_stats.sql
-- =============================================
-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    workouts INTEGER DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    mental_sessions INTEGER DEFAULT 0,
    prs_this_month INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    today_workout_completed BOOLEAN DEFAULT false,
    today_mental_completed BOOLEAN DEFAULT false,
    last_reset_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better performance
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 