-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to update own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow service role full access to transactions" ON transactions;

-- Ensure RLS is enabled
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY "Allow users to read own transactions" ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert own transactions" ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update own transactions" ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow service role full access to transactions" ON transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 