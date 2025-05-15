-- Create workout_history table
CREATE TABLE workout_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workout_id UUID REFERENCES workouts(id),
    workout_name TEXT NOT NULL,
    exercises JSONB NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX idx_workout_history_user_id ON workout_history(user_id);
CREATE INDEX idx_workout_history_completed_at ON workout_history(completed_at);

-- Enable RLS
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workout history"
    ON workout_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout history"
    ON workout_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout history"
    ON workout_history
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout history"
    ON workout_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_workout_history_updated_at
    BEFORE UPDATE ON workout_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 