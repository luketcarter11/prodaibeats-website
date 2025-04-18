# Supabase Connection Troubleshooting

This guide helps you troubleshoot and fix issues with the Supabase connection for the scheduler functionality.

## Step 1: Verify Environment Variables

First, make sure your `.env.local` file contains the correct Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://qrmpgkotkbmoddqiorje.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybXBna290a2Jtb2RkcWlvcmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTY0MDQsImV4cCI6MjA2MDMzMjQwNH0.HGnl-4zhndL9G5jlkZE_lC09H9szPtrzLC5d5rXGDCY
```

Important notes:
- No quotes around the values
- No extra spaces before or after the equals sign
- No trailing spaces

## Step 2: Test Basic Supabase Connection

Run the connection test script:

```bash
node scripts/check-supabase.js
```

This will check if the basic connection to Supabase is working. If there are connection issues, it will show detailed error messages.

## Step 3: Create the Database Table

The most common issue is that the `scheduler_state` table doesn't exist yet in your Supabase database. To create it:

### Option 1: Manual SQL Execution (Recommended)

1. Go to your [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. Copy the SQL from `sql/create_scheduler_state_table.sql`
3. Run the SQL in the editor

### Option 2: Use the Helper Script

Run the schema creation script:

```bash
node scripts/create-schema.js
```

This script will:
1. Try to create the table using RPC functions
2. If that's not possible, it will display the SQL you need to run manually

## Step 4: Verify Table Creation

After creating the table, run the test script again to verify it was created correctly:

```bash
node scripts/test-scheduler-db.js
```

## Step 5: Restart Your Development Server

Once everything is set up correctly, restart your development server:

```bash
npm run dev
```

## Common Issues and Solutions

### Empty Error Messages

If you see errors like `{ message: '' }`, it typically means one of these issues:

1. The Supabase project is not active or has been deleted
2. The API key has expired or been revoked
3. The URL is incorrect
4. IP restrictions are preventing access

### Table Does Not Exist

This is the most common issue and is fixed by running the SQL to create the table.

### Permission Errors

If you see errors with code `PGRST116`, these are usually permission-related:

1. Make sure the Row Level Security (RLS) policies in the SQL script are appropriate
2. Your API key might not have permission to access the table

### Connection Timeout

If the connection times out, check:

1. Your internet connection
2. Supabase status (https://status.supabase.com)
3. Any firewalls or proxies that might be blocking the connection 