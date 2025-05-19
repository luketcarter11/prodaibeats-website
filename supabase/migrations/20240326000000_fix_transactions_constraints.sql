-- Add new columns
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS customer_email VARCHAR,
ADD COLUMN IF NOT EXISTS license_type VARCHAR,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR;

-- Update transaction_type constraint
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type IN ('payment', 'refund', 'chargeback', 'crypto_purchase'));

-- Add RLS policy for inserting transactions
CREATE POLICY "Allow users to insert own transactions" ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add RLS policy for updating transactions
CREATE POLICY "Allow users to update own transactions" ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()); 