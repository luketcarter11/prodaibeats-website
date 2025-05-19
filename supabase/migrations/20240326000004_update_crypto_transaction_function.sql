-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, JSONB, VARCHAR, VARCHAR);

-- Create the function with correct parameters and handling
CREATE OR REPLACE FUNCTION create_crypto_transaction(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency VARCHAR,
  p_metadata JSONB,
  p_customer_email VARCHAR,
  p_license_type VARCHAR,
  p_transaction_type VARCHAR DEFAULT 'crypto_purchase'
) RETURNS transactions AS $$
#variable_conflict use_column
DECLARE
  v_transaction transactions;
BEGIN
  -- Validate transaction_type
  IF p_transaction_type != 'crypto_purchase' THEN
    RAISE EXCEPTION 'Invalid transaction_type. Must be crypto_purchase';
  END IF;

  -- Insert the transaction with explicit column names
  INSERT INTO transactions (
    user_id,
    amount,
    currency,
    status,
    transaction_type,
    payment_method,
    customer_email,
    license_type,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_currency,
    'awaiting_payment',
    p_transaction_type,
    'crypto',
    p_customer_email,
    p_license_type,
    p_metadata
  )
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_crypto_transaction(UUID, NUMERIC, VARCHAR, JSONB, VARCHAR, VARCHAR, VARCHAR) TO authenticated; 