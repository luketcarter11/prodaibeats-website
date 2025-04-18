# Fixing API Errors in the YouTube Scheduler

This guide will help you diagnose and fix errors in the YouTube scheduler functionality, particularly issues with the API endpoints and Supabase queries.

## Diagnosis

The symptom is an error when trying to add a YouTube source to the scheduler. This appears in the browser console as:

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Error adding source: Error: Failed to add source
```

## Root Cause Found: Incorrect Supabase Count Query

The main issue has been identified as an incorrect Supabase query format when counting records:

```javascript
// INCORRECT WAY - Causes PGRST100 error
const { data, error } = await supabase.from('scheduler_state').select('count(*)');

// CORRECT WAY - Uses Supabase's count API
const { count, error } = await supabase.from('scheduler_state').select('*', { count: 'exact', head: true });
```

This error appears in the server logs as:
```
"error": "Database connection error",
"details": {
  "code": "PGRST100",
  "details": "unexpected '(' expecting letter, digit, \"-\"...",
  "message": "\"failed to parse select parameter (count(*))\" (line 1, column 6)"
}
```

## Diagnostic Tools

We've created several diagnostic scripts to help identify issues:

1. **Test the Scheduler Source API endpoint**:
   ```bash
   node scripts/test-scheduler-source.js
   ```
   This performs a direct test of the API endpoint from Node.js.

2. **Verify the API route configuration**:
   ```bash
   node scripts/fix-api-routes.js
   ```
   This checks all your Next.js API routes for proper export syntax and configuration.

3. **Test with curl**:
   ```bash
   ./scripts/test-api-curl.sh
   ```
   This uses curl to directly test the API endpoint with verbose output.

## How to Fix the Issues

### 1. Fix Supabase Count Queries

We've created a script that automatically fixes incorrect Supabase count queries across the codebase:

```bash
node scripts/fix-supabase-count.js
```

This script will:
1. Find all instances of `.select('count(*)')` in your code
2. Replace them with the correct syntax: `.select('*', { count: 'exact', head: true })`
3. Update the destructuring pattern from `{ data, error }` to `{ count, error }`
4. Create backups of all modified files

### 2. Apply the Fixed API Route

We've also created a fixed version of the API route with correct error handling and Supabase query syntax:

```bash
./scripts/apply-route-fix.sh
```

This will backup the original route file and replace it with our fixed version.

### 3. Restart Your Server

After applying the fixes, restart your Next.js development server:

```bash
npm run dev
```

## How to Revert Changes

If needed, you can revert to the original files:

```bash
# For the API route
cp app/api/tracks/scheduler/sources/route.ts.backup app/api/tracks/scheduler/sources/route.ts

# For any other fixed files
cp file.ts.backup file.ts
```

## Next Steps

If you encounter other issues:

1. Check if your browser is caching old responses (try incognito mode)
2. Examine the server logs for any new errors
3. Run the test scripts to get detailed error information
4. Verify that the Supabase connection is working with the correct credentials

If you need to completely rebuild your Next.js application:

```bash
npm run build
npm run start
``` 