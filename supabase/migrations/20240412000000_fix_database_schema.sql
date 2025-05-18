-- Drop existing tables in correct order
DROP TABLE IF EXISTS public.onboarding_data;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table first since it's referenced by other tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    full_name TEXT,
    age INTEGER,
    gender TEXT,
    height NUMERIC,
    weight NUMERIC,
    fitness_goal TEXT,
    training_level TEXT DEFAULT 'beginner',
    onboarding_completed BOOLEAN DEFAULT FALSE,
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

-- Create personal_records table
CREATE TABLE IF NOT EXISTS public.personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL,
    weight_current NUMERIC NOT NULL,
    weight_target NUMERIC NOT NULL,
    weight_unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create RLS policies for onboarding_data
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

-- Create RLS policies for personal_records
CREATE POLICY "Users can view their own PRs" ON public.personal_records
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own PRs" ON public.personal_records
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own PRs" ON public.personal_records
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own PRs" ON public.personal_records
  FOR DELETE USING (auth.uid() = profile_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, user_id, email, full_name)
    VALUES (NEW.id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    
    -- Create onboarding data record
    INSERT INTO public.onboarding_data (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 