-- Migration to fix profile IDs and ensure they match auth.users
-- This script resolves login issues by ensuring profile IDs match auth.users IDs

-- 1. Backup existing profiles to a temporary table
CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT * FROM profiles;

-- 2. Create a function to fix profile IDs
CREATE OR REPLACE FUNCTION fix_profile_ids()
RETURNS TEXT AS $$
DECLARE
  mismatched_count INT := 0;
  fixed_count INT := 0;
  email_record RECORD;
  user_id UUID;
  result TEXT;
BEGIN
  -- Find profiles that might have incorrect IDs (matching by email)
  FOR email_record IN 
    SELECT p.id AS profile_id, p.email, u.id AS auth_id 
    FROM profiles p
    JOIN auth.users u ON LOWER(p.email) = LOWER(u.email)
    WHERE p.id != u.id
  LOOP
    mismatched_count := mismatched_count + 1;
    
    -- Get the correct UUID from auth.users
    user_id := email_record.auth_id;
    
    -- Check if a profile with the correct ID already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
      -- Create a new profile with the correct ID
      INSERT INTO profiles (
        id, email, full_name, display_name, billing_address, 
        country, phone, profile_picture_url, created_at, updated_at
      )
      SELECT 
        user_id, email_record.email, full_name, display_name, billing_address,
        country, phone, profile_picture_url, created_at, updated_at
      FROM profiles
      WHERE id = email_record.profile_id;
      
      -- Optionally delete the old profile
      -- DELETE FROM profiles WHERE id = email_record.profile_id;
      
      fixed_count := fixed_count + 1;
    END IF;
  END LOOP;
  
  -- Create profiles for any auth users that don't have profiles
  INSERT INTO profiles (id, email, created_at, updated_at)
  SELECT 
    u.id, u.email, u.created_at, CURRENT_TIMESTAMP
  FROM 
    auth.users u
  LEFT JOIN 
    profiles p ON u.id = p.id
  WHERE 
    p.id IS NULL;
  
  result := 'Found ' || mismatched_count || ' mismatched profiles. Fixed ' || fixed_count || ' profiles.';
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Run the function to fix profiles
SELECT fix_profile_ids();

-- 4. Drop the function (cleanup)
DROP FUNCTION fix_profile_ids();

-- 5. Update or recreate the trigger to ensure proper ID assignment for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure profile is created with correct auth.uid
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

-- 6. Ensure the create_profiles_table function is up-to-date
CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- Create the profiles table
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      display_name TEXT,
      billing_address TEXT,
      country TEXT,
      phone TEXT,
      profile_picture_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
    );

    -- Add RLS policies
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create a policy that allows users to view and update only their own profile
    CREATE POLICY "Users can view and update their own profile"
      ON public.profiles FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);

    -- Add admin policy
    CREATE POLICY "Allow admin access to all profiles" 
      ON public.profiles FOR ALL 
      USING (true);

    RETURN TRUE;
  ELSE
    -- Table already exists
    RETURN FALSE;
  END IF;
END;
$$; 