-- Create a function that gets a transaction by ID with security definer
CREATE OR REPLACE FUNCTION get_transaction_by_id(
  p_transaction_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_transaction transactions;
  v_result JSONB;
BEGIN
  -- Get the transaction for the specific user
  SELECT * INTO v_transaction 
  FROM transactions 
  WHERE id = p_transaction_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not owned by user';
  END IF;
  
  -- Build the result object
  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'amount', amount,
    'currency', currency,
    'status', status,
    'transaction_type', transaction_type,
    'payment_method', payment_method,
    'metadata', metadata,
    'created_at', created_at,
    'updated_at', updated_at,
    'customer_email', customer_email,
    'license_type', license_type,
    'stripe_session_id', stripe_session_id,
    'stripe_transaction_id', stripe_transaction_id
  ) INTO v_result
  FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 