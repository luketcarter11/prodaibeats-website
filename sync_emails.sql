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
