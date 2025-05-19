-- First check if RLS is already enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'transactions';

-- Enable Row Level Security on the transactions table if not already enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON transactions;

-- Create policy for all users to select their own transactions (includes anon and authenticated)
CREATE POLICY "Enable read access for all users" 
ON transactions 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (auth.role() = 'service_role')
);

-- Create policy for authenticated users to insert their own transactions
CREATE POLICY "Enable insert access for authenticated users" 
ON transactions 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id AND auth.role() IN ('authenticated', 'anon')) OR 
  (auth.role() = 'service_role')
);

-- Create policy for authenticated users to update their own transactions
CREATE POLICY "Enable update access for authenticated users" 
ON transactions 
FOR UPDATE 
USING (
  (auth.uid() = user_id AND auth.role() IN ('authenticated', 'anon')) OR 
  (auth.role() = 'service_role')
);

-- Grant permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON transactions TO anon;

-- Verify that the policies were created
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'transactions'; 