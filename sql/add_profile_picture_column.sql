-- Add profile_picture_url column to the profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Update the create_profiles_table function to include the new column
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
      id UUID PRIMARY KEY,
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

    -- We don't need to recreate the trigger function here - it's already defined above
    -- Just make sure the trigger is set up
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

    RETURN TRUE;
  ELSE
    -- Table already exists, so just add the column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'profile_picture_url'
    ) THEN
      ALTER TABLE public.profiles 
      ADD COLUMN profile_picture_url TEXT;
    END IF;
    
    RETURN FALSE;
  END IF;
END;
$$;

-- Update the create_profile function to include the new column
CREATE OR REPLACE FUNCTION create_profile(
  user_id UUID,
  full_name TEXT DEFAULT NULL,
  display_name TEXT DEFAULT NULL,
  billing_address TEXT DEFAULT NULL,
  country TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  profile_picture_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY,
      full_name TEXT,
      display_name TEXT,
      billing_address TEXT,
      country TEXT,
      phone TEXT,
      profile_picture_url TEXT,
      created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
    );

    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view and update their own profile"
      ON profiles FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Upsert (insert or update)
  INSERT INTO profiles (
    id, full_name, display_name, billing_address, country, phone, profile_picture_url, created_at, updated_at
  ) VALUES (
    user_id, full_name, display_name, billing_address, country, phone, profile_picture_url,
    timezone('utc', now()), timezone('utc', now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    billing_address = EXCLUDED.billing_address,
    country = EXCLUDED.country,
    phone = EXCLUDED.phone,
    profile_picture_url = EXCLUDED.profile_picture_url,
    updated_at = timezone('utc', now());

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'create_profile error: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 