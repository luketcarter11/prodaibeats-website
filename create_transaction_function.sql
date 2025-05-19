-- Create a function that can be used to insert transactions without RLS constraints
CREATE OR REPLACE FUNCTION create_crypto_transaction(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- Insert a new transaction
  INSERT INTO transactions (
    user_id,
    amount,
    currency,
    status,
    transaction_type,
    payment_method,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_currency,
    'pending',
    'payment',
    'crypto',
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  -- Get the transaction data
  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'amount', amount,
    'currency', currency,
    'status', status,
    'transaction_type', transaction_type,
    'payment_method', payment_method,
    'metadata', metadata,
    'created_at', created_at
  ) INTO v_result
  FROM transactions
  WHERE id = v_transaction_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 