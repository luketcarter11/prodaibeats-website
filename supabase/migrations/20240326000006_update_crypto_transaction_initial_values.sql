-- First drop all existing versions of the function
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, JSONB, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, NUMERIC, JSONB, VARCHAR, VARCHAR, VARCHAR);

-- Create updated function that handles crypto amount and currency
CREATE OR REPLACE FUNCTION create_crypto_transaction(
  p_user_id UUID,
  p_usd_amount NUMERIC,
  p_crypto_type VARCHAR,
  p_crypto_amount NUMERIC,
  p_metadata JSONB,
  p_customer_email VARCHAR,
  p_license_type VARCHAR,
  p_transaction_type VARCHAR DEFAULT 'crypto_purchase'
) RETURNS SETOF transactions AS $$
#variable_conflict use_column
DECLARE
  v_transaction transactions;
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
  DECLARE
    v_enhanced_metadata JSONB;
  BEGIN
    v_enhanced_metadata := p_metadata || jsonb_build_object(
      'original_usd_amount', p_usd_amount,
      'crypto', jsonb_build_object(
        'type', p_crypto_type,
        'expected_amount', p_crypto_amount,
        'selected_at', now()
      )
    );
  END;

  -- Insert the transaction with crypto values
  INSERT INTO transactions (
    user_id,
    amount,           -- This will be the crypto amount
    currency,         -- This will be the crypto currency
    status,
    transaction_type,
    payment_method,
    customer_email,
    license_type,
    metadata
  ) VALUES (
    p_user_id,
    p_crypto_amount,  -- Store crypto amount instead of USD
    p_crypto_type,    -- Store crypto currency (SOL/PROD) instead of USD
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

-- Drop any existing RLS policies for transactions
DROP POLICY IF EXISTS "Allow users to insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to update own transactions" ON transactions;

-- Create RLS policy for inserting transactions
CREATE POLICY "Allow users to insert own transactions" ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    transaction_type = 'crypto_purchase'
  );

-- Create RLS policy for updating transactions
CREATE POLICY "Allow users to update own transactions" ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    transaction_type = 'crypto_purchase'
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT EXECUTE ON FUNCTION create_crypto_transaction(
  UUID, NUMERIC, VARCHAR, NUMERIC, JSONB, VARCHAR, VARCHAR, VARCHAR
) TO authenticated;