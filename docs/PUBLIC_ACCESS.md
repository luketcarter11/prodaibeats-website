# YouTube Scheduler Public Access Configuration

This document explains the changes made to remove authentication restrictions and enable public access to the YouTube Scheduler functionality.

## Changes Made

### 1. SQL Schema Changes (`sql/create_scheduler_state_table.sql`)

- Removed role-based access controls that previously required authentication
- Replaced selective policies with a single public policy using `USING (true) WITH CHECK (true)`
- Changed function grants from `authenticated` role to `PUBLIC`
- Preserved Row Level Security (RLS) structure but effectively made it open access

**Before:**
```sql
CREATE POLICY scheduler_state_select_policy ON scheduler_state
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY scheduler_state_admin_policy ON scheduler_state
  FOR ALL USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.email() IN ('admin@prodaibeats.com')
    OR auth.email() LIKE '%@prodaibeats.com'
  ));
```

**After:**
```sql
CREATE POLICY scheduler_state_public_policy ON scheduler_state
  FOR ALL USING (true) WITH CHECK (true);
```

### 2. API Route Updates

- Fixed Supabase count query syntax in `app/api/tracks/scheduler/sources/route.ts`
- Updated from `.select('count(*)')` to `.select('*', { count: 'exact', head: true })`
- Fixed destructuring pattern from `{ data, error }` to `{ count, error }`

### 3. Test Script Updates (`scripts/test-scheduler-db.js`)

- Updated the test script to use the correct count syntax
- Removed references to role-based permission errors
- Updated documentation to reflect public access policy

## Why These Changes?

These changes were made to simplify the development and testing process by:

1. Removing authentication barriers that could impede functionality testing
2. Providing a more straightforward implementation that works without user accounts
3. Fixing query syntax issues that were causing errors

## Security Considerations

**Important:** The current configuration allows anyone with the API key to read and modify scheduler data.

- The Supabase API key is still required, providing a basic level of security
- For production use, you may want to reintroduce role-based access controls
- The cron scheduler endpoint still has its own security via `CRON_SECRET_KEY`

## How to Restore Authentication Restrictions

If you need to restore authentication restrictions in the future, follow these steps:

1. Create new role-based policies in the Supabase SQL editor:

```sql
-- Allow reads for authenticated users only
CREATE POLICY scheduler_state_select_policy ON scheduler_state
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow writes only for specific users
CREATE POLICY scheduler_state_admin_policy ON scheduler_state
  FOR ALL USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.email() IN ('admin@example.com')
    OR auth.email() LIKE '%@yourdomain.com'
  ));

-- Update function grants
REVOKE EXECUTE ON FUNCTION check_scheduler_state_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_scheduler_state_exists() TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION initialize_scheduler_source(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION initialize_scheduler_source(TEXT, TEXT) TO authenticated;
```

2. Update your application to handle authentication properly in the frontend

3. Add authentication checks to your API routes if needed 