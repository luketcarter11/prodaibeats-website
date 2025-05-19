-- Create a function that can be used to update transaction crypto details
CREATE OR REPLACE FUNCTION update_transaction_crypto(
  p_transaction_id UUID,
  p_user_id UUID,
  p_crypto_type TEXT,
  p_crypto_address TEXT
) RETURNS JSONB AS $$
DECLARE
  v_transaction transactions;
  v_metadata JSONB;
  v_result JSONB;
BEGIN
  -- Get the current transaction
  SELECT * INTO v_transaction 
  FROM transactions 
  WHERE id = p_transaction_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not owned by user';
  END IF;
  
  -- Prepare the updated metadata
  IF v_transaction.metadata IS NULL THEN
    v_metadata := jsonb_build_object('crypto', jsonb_build_object(
      'type', p_crypto_type,
      'address', p_crypto_address,
      'selected_at', now()
    ));
  ELSE
    v_metadata := v_transaction.metadata || jsonb_build_object('crypto', jsonb_build_object(
      'type', p_crypto_type,
      'address', p_crypto_address,
      'selected_at', now()
    ));
  END IF;
  
  -- Update the transaction
  UPDATE transactions
  SET 
    payment_method = 'crypto_' || lower(p_crypto_type),
    metadata = v_metadata,
    updated_at = now()
  WHERE id = p_transaction_id AND user_id = p_user_id
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'amount', amount,
    'currency', currency,
    'status', status,
    'transaction_type', transaction_type,
    'payment_method', payment_method,
    'metadata', metadata,
    'updated_at', updated_at
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 