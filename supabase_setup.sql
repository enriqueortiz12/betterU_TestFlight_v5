-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in correct order (due to foreign key dependencies)
DROP TABLE IF EXISTS public.user_mental_logs;
DROP TABLE IF EXISTS public.mental_exercises;
DROP TABLE IF EXISTS public.user_workout_logs;
DROP TABLE IF EXISTS public.workout_exercises;
DROP TABLE IF EXISTS public.workouts;
DROP TABLE IF EXISTS public.exercises;
DROP TABLE IF EXISTS public.betteru_streaks;
DROP TABLE IF EXISTS public.user_stats;
DROP TABLE IF EXISTS public.subscriptions;
DROP TABLE IF EXISTS public.onboarding_data;
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table first since it's referenced by other tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    age INTEGER,
    gender TEXT,
    height NUMERIC,
    weight NUMERIC,
    fitness_goal TEXT,
    training_level TEXT DEFAULT 'beginner',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_streak_update TIMESTAMP WITH TIME ZONE,
    today_workout_completed BOOLEAN DEFAULT FALSE,
    today_mental_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create betteru_streaks table
CREATE TABLE IF NOT EXISTS public.betteru_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_streak_update TIMESTAMP WITH TIME ZONE,
    today_workout_completed BOOLEAN DEFAULT FALSE,
    today_mental_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    total_workouts INTEGER DEFAULT 0,
    total_mental_sessions INTEGER DEFAULT 0,
    total_workout_minutes INTEGER DEFAULT 0,
    total_mental_minutes INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    today_workout_completed BOOLEAN DEFAULT FALSE,
    today_mental_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'inactive',
    plan_type TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT,
    equipment_needed TEXT[],
    muscle_groups TEXT[],
    video_url TEXT,
    image_url TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create onboarding_data table
CREATE TABLE IF NOT EXISTS public.onboarding_data (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT,
    age INTEGER,
    gender TEXT,
    height NUMERIC,
    weight NUMERIC,
    fitness_goal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER,
    difficulty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id),
    exercise_id UUID REFERENCES public.exercises(id),
    exercise_name TEXT NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight NUMERIC,
    duration INTEGER,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_workout_logs table
CREATE TABLE IF NOT EXISTS public.user_workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    workout_id UUID NOT NULL REFERENCES public.workouts(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER,
    notes TEXT
);

-- Create mental_exercises table
CREATE TABLE IF NOT EXISTS public.mental_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER,
    type TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_mental_logs table
CREATE TABLE IF NOT EXISTS public.user_mental_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    mental_exercise_id UUID NOT NULL REFERENCES public.mental_exercises(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER,
    notes TEXT
);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create auth trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_profile_id UUID;
    full_name TEXT;
BEGIN
    -- Extract full_name from raw_user_meta_data, defaulting to email if not present
    full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (new.id, new.email, full_name)
    RETURNING id INTO new_profile_id;
    
    -- Create user stats
    INSERT INTO public.user_stats (profile_id)
    VALUES (new_profile_id);
    
    -- Create streak record
    INSERT INTO public.betteru_streaks (profile_id)
    VALUES (new_profile_id);
    
    -- Create subscription record
    INSERT INTO public.subscriptions (profile_id, status)
    VALUES (new_profile_id, 'inactive');
    
    -- Create onboarding data record
    INSERT INTO public.onboarding_data (id, email, full_name)
    VALUES (new.id, new.email, full_name);
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (you can check the Supabase logs)
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        -- Re-raise the error
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create RLS policies
ALTER TABLE public.betteru_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mental_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.betteru_streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.betteru_streaks;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can manage their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can delete their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can view their workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can manage their workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can view their own workout logs" ON public.user_workout_logs;
DROP POLICY IF EXISTS "Users can create their own workout logs" ON public.user_workout_logs;
DROP POLICY IF EXISTS "Users can view mental exercises" ON public.mental_exercises;
DROP POLICY IF EXISTS "Users can manage their own mental exercises" ON public.mental_exercises;
DROP POLICY IF EXISTS "Users can view their own mental logs" ON public.user_mental_logs;
DROP POLICY IF EXISTS "Users can create their own mental logs" ON public.user_mental_logs;

-- Streaks policies
CREATE POLICY "Users can view their own streaks"
    ON public.betteru_streaks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = betteru_streaks.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own streaks"
    ON public.betteru_streaks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = betteru_streaks.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- User stats policies
CREATE POLICY "Users can view their own stats"
    ON public.user_stats FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = user_stats.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own stats"
    ON public.user_stats FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = user_stats.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Subscription policies
CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = subscriptions.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own subscription"
    ON public.subscriptions FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = subscriptions.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Exercises policies
CREATE POLICY "Users can view exercises"
    ON public.exercises FOR SELECT
    USING (profile_id IS NULL OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = exercises.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own exercises"
    ON public.exercises FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = exercises.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Onboarding data policies
CREATE POLICY "Users can view their own onboarding data"
    ON public.onboarding_data FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own onboarding data"
    ON public.onboarding_data FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own onboarding data"
    ON public.onboarding_data FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own onboarding data"
    ON public.onboarding_data FOR DELETE
    USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can view their own workouts"
    ON public.workouts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = workouts.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own workouts"
    ON public.workouts FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = workouts.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own workouts"
    ON public.workouts FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = workouts.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Workout exercises policies
CREATE POLICY "Users can view their workout exercises"
    ON public.workout_exercises FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.workouts
        JOIN public.profiles ON profiles.id = workouts.profile_id
        WHERE workouts.id = workout_exercises.workout_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their workout exercises"
    ON public.workout_exercises FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.workouts
        JOIN public.profiles ON profiles.id = workouts.profile_id
        WHERE workouts.id = workout_exercises.workout_id
        AND profiles.user_id = auth.uid()
    ));

-- User workout logs policies
CREATE POLICY "Users can view their own workout logs"
    ON public.user_workout_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = user_workout_logs.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own workout logs"
    ON public.user_workout_logs FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = user_workout_logs.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Mental exercises policies
CREATE POLICY "Users can view mental exercises"
    ON public.mental_exercises FOR SELECT
    USING (profile_id IS NULL OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = mental_exercises.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own mental exercises"
    ON public.mental_exercises FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = mental_exercises.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- User mental logs policies
CREATE POLICY "Users can view their own mental logs"
    ON public.user_mental_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = user_mental_logs.profile_id
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own mental logs"
    ON public.user_mental_logs FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = user_mental_logs.profile_id
        AND profiles.user_id = auth.uid()
    ));

-- Drop existing triggers
DROP TRIGGER IF EXISTS set_updated_at_betteru_streaks ON public.betteru_streaks;
DROP TRIGGER IF EXISTS set_updated_at_user_stats ON public.user_stats;
DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
DROP TRIGGER IF EXISTS set_updated_at_exercises ON public.exercises;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_workouts ON public.workouts;
DROP TRIGGER IF EXISTS set_updated_at_workout_exercises ON public.workout_exercises;
DROP TRIGGER IF EXISTS set_updated_at_mental_exercises ON public.mental_exercises;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_betteru_streaks
    BEFORE UPDATE ON public.betteru_streaks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_stats
    BEFORE UPDATE ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_exercises
    BEFORE UPDATE ON public.exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_workouts
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_workout_exercises
    BEFORE UPDATE ON public.workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_mental_exercises
    BEFORE UPDATE ON public.mental_exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 