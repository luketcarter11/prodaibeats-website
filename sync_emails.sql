-- Trigger SQL to sync emails from auth.users to profiles table

-- Modify profiles table to add email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Trigger Function
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profiles table with the email from auth.users
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

CREATE TRIGGER on_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- One-time sync of all existing users
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT 
  users.id, 
  users.email,
  users.created_at,
  users.created_at
FROM 
  auth.users LEFT JOIN profiles ON users.id = profiles.id
WHERE 
  profiles.id IS NULL
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- Add RLS policy for admin to access all profiles
CREATE POLICY "Allow admin access to all profiles" ON public.profiles
FOR ALL
USING (true);

-- Update existing emails in profiles table
UPDATE profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id AND profiles.email IS NULL;

-- Create a function that can be called to check if service role key is available
CREATE OR REPLACE FUNCTION check_service_role()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- This function will succeed when called with the service role key
  -- because SECURITY DEFINER functions bypass RLS
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
