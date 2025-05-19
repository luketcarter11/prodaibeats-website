-- First disable RLS to clean up policies
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to update own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow service role full access to transactions" ON transactions;

-- Re-enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Grant basic table permissions
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated;
GRANT ALL ON transactions TO service_role;

-- Create comprehensive RLS policies
CREATE POLICY "Allow users to read own transactions" ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert own transactions" ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    transaction_type IN ('crypto_purchase') AND
    status IN ('pending', 'completed', 'failed')
  );

CREATE POLICY "Allow users to update own transactions" ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    transaction_type IN ('crypto_purchase') AND
    status IN ('pending', 'completed', 'failed')
  );

CREATE POLICY "Allow service role full access to transactions" ON transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 