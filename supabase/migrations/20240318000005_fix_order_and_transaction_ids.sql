-- Create a more robust UUID conversion function
CREATE OR REPLACE FUNCTION try_cast_uuid(input TEXT) 
RETURNS UUID AS $$
DECLARE
  zero_uuid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Return a zero UUID for NULL or empty input
  IF input IS NULL OR input = '' THEN
    RETURN zero_uuid;
  END IF;
  
  -- Check if input is already a valid UUID
  IF input ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN input::UUID;
  END IF;
  
  -- For non-UUID strings, generate a deterministic UUID based on the input
  -- This ensures the same input always generates the same UUID
  RETURN encode(digest(input, 'sha256'), 'hex')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    -- Return zero UUID on any error
    RETURN zero_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create temporary table with UUID fields
CREATE TABLE IF NOT EXISTS orders_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id UUID NOT NULL,
  track_name VARCHAR NOT NULL,
  license VARCHAR NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  discount NUMERIC CHECK (discount >= 0),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_session_id VARCHAR,
  customer_email VARCHAR,
  currency VARCHAR,
  license_file VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Copy data from orders to orders_temp with UUID conversion
INSERT INTO orders_temp (
  id,
  user_id,
  track_id,
  track_name,
  license,
  total_amount,
  discount,
  order_date,
  status,
  stripe_session_id,
  customer_email,
  currency,
  license_file,
  created_at,
  updated_at
)
SELECT
  COALESCE(try_cast_uuid(id::TEXT), gen_random_uuid()),
  COALESCE(try_cast_uuid(user_id::TEXT), try_cast_uuid('00000000-0000-0000-0000-000000000000')),
  COALESCE(try_cast_uuid(track_id::TEXT), try_cast_uuid('00000000-0000-0000-0000-000000000000')),
  track_name,
  license,
  total_amount,
  COALESCE(discount, 0),
  order_date,
  status,
  stripe_session_id,
  customer_email,
  COALESCE(currency, 'USD'),
  license_file,
  COALESCE(created_at, now()),
  COALESCE(updated_at, now())
FROM orders;

-- Drop the UUID conversion function as it's no longer needed
DROP FUNCTION try_cast_uuid(TEXT);

-- Drop the original orders table
DROP TABLE IF EXISTS orders CASCADE;

-- Rename orders_temp to orders
ALTER TABLE orders_temp RENAME TO orders;

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_track_id ON orders(track_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Create the transactions table with proper UUID references
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
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

-- Create indexes for transactions
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Create updated_at trigger for transactions table
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for orders table
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
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

-- Re-create orders table RLS policies
CREATE POLICY "Allow users to read own orders" ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow service role full access to orders" ON orders
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY; 