-- Check existing policies on the transactions table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'transactions';

-- Check if RLS is enabled on the transactions table
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'transactions';

-- Check permissions granted to authenticated role
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'transactions' AND grantee = 'authenticated';

-- Get the current authenticated user's ID
SELECT auth.uid(); 