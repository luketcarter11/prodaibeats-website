-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, JSONB, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, NUMERIC, JSONB, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, TEXT, JSONB);

-- Create the updated function with proper parameter handling and return type
CREATE OR REPLACE FUNCTION create_crypto_transaction(
  p_user_id UUID,
  p_usd_amount NUMERIC,
  p_crypto_type TEXT,
  p_crypto_amount NUMERIC,
  p_metadata JSONB DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_license_type TEXT DEFAULT NULL,
  p_transaction_type TEXT DEFAULT 'crypto_purchase'
) RETURNS SETOF transactions AS $$
#variable_conflict use_column
DECLARE
  v_transaction transactions;
  v_enhanced_metadata JSONB;
BEGIN
  -- Validate transaction_type
  IF p_transaction_type != 'crypto_purchase' THEN
    RAISE EXCEPTION 'Invalid transaction_type. Must be crypto_purchase';
  END IF;

  -- Validate crypto_type
  IF p_crypto_type NOT IN ('SOL', 'PROD') THEN
    RAISE EXCEPTION 'Invalid crypto_type. Must be SOL or PROD';
  END IF;

  -- Create enhanced metadata with both USD and crypto amounts
  v_enhanced_metadata := COALESCE(p_metadata, '{}'::JSONB) || jsonb_build_object(
    'original_usd_amount', p_usd_amount,
    'crypto', jsonb_build_object(
      'type', p_crypto_type,
      'expected_amount', p_crypto_amount,
      'selected_at', now()
    )
  );

  -- Insert the transaction with crypto values
  INSERT INTO transactions (
    user_id,
    amount,           -- Store crypto amount
    currency,         -- Store crypto currency
    status,
    transaction_type,
    payment_method,
    customer_email,
    license_type,
    metadata
  ) VALUES (
    p_user_id,
    p_crypto_amount,  -- Store actual crypto amount
    p_crypto_type,    -- Store crypto currency (SOL/PROD)
    'awaiting_payment',
    p_transaction_type,
    'crypto_' || lower(p_crypto_type),
    p_customer_email,
    p_license_type,
    v_enhanced_metadata
  )
  RETURNING * INTO v_transaction;

  RETURN NEXT v_transaction;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow users to read own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to update own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow service role full access to transactions" ON transactions;

-- Create updated RLS policies
CREATE POLICY "Allow users to read own transactions" ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert own transactions" ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    transaction_type = 'crypto_purchase'
  );

CREATE POLICY "Allow users to update own transactions" ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    transaction_type = 'crypto_purchase' AND
    status IN (
      'pending',
      'awaiting_payment',
      'confirming',
      'confirmed',
      'completed',
      'failed',
      'expired'
    )
  );

CREATE POLICY "Allow service role full access to transactions" ON transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT EXECUTE ON FUNCTION create_crypto_transaction(
  UUID, NUMERIC, TEXT, NUMERIC, JSONB, TEXT, TEXT, TEXT
) TO authenticated;

-- Notify about schema reload requirement
NOTIFY pgrst, 'reload schema'; 