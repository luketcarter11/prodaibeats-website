-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR REFERENCES orders(id),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency VARCHAR NOT NULL DEFAULT 'USD',
  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'chargeback')),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_transaction_id VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create updated_at trigger for transactions table
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row-level security (RLS) policies
-- Allow users to read only their own transactions
CREATE POLICY "Allow users to read own transactions" ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role to access all transactions
CREATE POLICY "Allow service role full access to transactions" ON transactions
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY; 