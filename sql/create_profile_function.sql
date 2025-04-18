-- 1. Create or update the profile manually
CREATE OR REPLACE FUNCTION create_profile(
  user_id UUID,
  full_name TEXT DEFAULT NULL,
  display_name TEXT DEFAULT NULL,
  billing_address TEXT DEFAULT NULL,
  country TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL
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
    id, full_name, display_name, billing_address, country, phone, created_at, updated_at
  ) VALUES (
    user_id, full_name, display_name, billing_address, country, phone,
    timezone('utc', now()), timezone('utc', now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    billing_address = EXCLUDED.billing_address,
    country = EXCLUDED.country,
    phone = EXCLUDED.phone,
    updated_at = timezone('utc', now());

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'create_profile error: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Automatically create an empty profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger that connects to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

-- 4. Create a function that can be called via RPC to ensure profiles table exists
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
    -- Table already exists
    RETURN FALSE;
  END IF;
END;
$$;
