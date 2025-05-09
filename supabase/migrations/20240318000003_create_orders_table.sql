-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  track_id VARCHAR NOT NULL,
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

-- Create updated_at trigger for orders table
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row-level security (RLS) policies
-- Allow users to read only their own orders
CREATE POLICY "Allow users to read own orders" ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role to access all orders
CREATE POLICY "Allow service role full access to orders" ON orders
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY; 