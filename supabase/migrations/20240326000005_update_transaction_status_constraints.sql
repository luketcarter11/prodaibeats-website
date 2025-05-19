-- Drop existing status constraint
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add updated status constraint with crypto statuses
ALTER TABLE transactions
ADD CONSTRAINT transactions_status_check 
CHECK (status IN (
  'pending',
  'completed',
  'failed',
  'awaiting_payment',
  'confirming',
  'confirmed',
  'expired'
));

-- Update RLS policies to allow these statuses
DROP POLICY IF EXISTS "Allow users to update own transactions" ON transactions;

CREATE POLICY "Allow users to update own transactions" ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    transaction_type IN ('crypto_purchase') AND
    status IN (
      'pending',
      'completed',
      'failed',
      'awaiting_payment',
      'confirming',
      'confirmed',
      'expired'
    )
  ); 