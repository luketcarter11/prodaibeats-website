# Setup Instructions for Crypto Payment System

To resolve the Row Level Security (RLS) issues and get the crypto payment system working, follow these steps:

## 1. Deploy SQL Functions in Supabase

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `create_transaction_function.sql`
5. Run the query
6. Create another new query
7. Copy and paste the contents of `update_crypto_function.sql`
8. Run the query
9. Create a third new query
10. Copy and paste the contents of `get_transaction_function.sql`
11. Run the query

These SQL functions use `SECURITY DEFINER` which means they run with the privileges of the creator (superuser/postgres), bypassing RLS policies completely.

## 2. Verify Functions Were Created

Run this SQL query to check that the functions were successfully created:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('create_crypto_transaction', 'update_transaction_crypto', 'get_transaction_by_id');
```

You should see all three functions listed.

## 3. Test the Functions

You can test the functions directly from the SQL Editor:

```sql
-- Test create_crypto_transaction
SELECT create_crypto_transaction(
  'your-user-id'::uuid, 
  9.99, 
  'USD', 
  '{"test": true}'::jsonb
);

-- Get the created transaction ID
SELECT id FROM transactions ORDER BY created_at DESC LIMIT 1;

-- Test get_transaction_by_id (use the ID from above)
SELECT get_transaction_by_id(
  'transaction-id-from-above'::uuid,
  'your-user-id'::uuid
);

-- Test update_transaction_crypto (use the ID from above)
SELECT update_transaction_crypto(
  'transaction-id-from-above'::uuid,
  'your-user-id'::uuid,
  'BTC',
  'test_address_123'
);
```

## 4. Restart Your Application

Make sure to restart your Next.js application to ensure it's using the updated code.

## Why This Approach Works

The approach uses database functions with `SECURITY DEFINER` which means they run with the privileges of the creator (usually postgres/superuser), bypassing RLS policies entirely. This is a common pattern for operations that need elevated privileges without exposing those privileges to the client.

Even though we still have RLS policies in place to protect data, these functions provide a secure way to perform specific operations that would otherwise be blocked by RLS.

## Troubleshooting

If you're still encountering issues:

1. Check the browser console for specific error messages
2. Verify that your Supabase connection is working correctly
3. Make sure your authentication tokens are being properly set and sent
4. Check that the user IDs used in the functions match the authenticated user's ID

If errors persist, try to:

1. Sign out and sign back in to get a fresh authentication token
2. Clear browser cache and cookies
3. Try a different browser to rule out any browser-specific issues
4. Check the Supabase logs for any backend errors 