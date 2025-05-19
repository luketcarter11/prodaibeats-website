-- First, let's clean up any existing functions and policies
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, JSONB, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, VARCHAR, NUMERIC, JSONB, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_crypto_transaction(UUID, NUMERIC, TEXT, NUMERIC, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_crypto_transaction(UUID, NUMERIC, TEXT, NUMERIC, JSONB, TEXT, TEXT, TEXT);
DROP POLICY IF EXISTS "Allow users to insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to update own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow users to select own transactions" ON transactions;

-- Temporarily disable RLS
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Create the function with exact parameter types
CREATE OR REPLACE FUNCTION public.create_crypto_transaction(
    p_user_id UUID,
    p_usd_amount NUMERIC,
    p_crypto_type TEXT,
    p_crypto_amount NUMERIC,
    p_metadata JSONB,
    p_customer_email TEXT,
    p_license_type TEXT,
    p_transaction_type TEXT DEFAULT 'crypto_purchase'
) RETURNS SETOF transactions
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_transaction transactions;
BEGIN
    -- Insert the transaction
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
        p_crypto_amount,
        p_crypto_type,
        'awaiting_payment',
        p_transaction_type,
        'crypto_' || lower(p_crypto_type),
        p_customer_email,
        p_license_type,
        jsonb_build_object(
            'items', p_metadata->'items',
            'payment_method', 'crypto',
            'original_usd_amount', p_usd_amount,
            'crypto', jsonb_build_object(
                'type', p_crypto_type,
                'expected_amount', p_crypto_amount,
                'selected_at', now()
            )
        )
    )
    RETURNING * INTO v_transaction;

    RETURN NEXT v_transaction;
    RETURN;
END;
$$;

-- Re-enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow users to insert own transactions"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND transaction_type = 'crypto_purchase'
    );

CREATE POLICY "Allow users to select own transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Allow users to update own transactions"
    ON transactions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        AND transaction_type = 'crypto_purchase'
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_crypto_transaction(
    UUID, NUMERIC, TEXT, NUMERIC, JSONB, TEXT, TEXT, TEXT
) TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 