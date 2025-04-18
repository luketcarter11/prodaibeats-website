# Supabase Setup Guide

This guide explains how to set up Supabase for the YouTube Scheduler functionality.

## Pre-requisites

1. A Supabase account and project
2. Project API keys from your Supabase dashboard

## Configuration Steps

### 1. Environment Variables

Set up the following environment variables in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup

Create the required tables and functions by running the SQL script located at `sql/create_scheduler_state_table.sql` in the Supabase SQL Editor.

The script will:
- Create the `scheduler_state` table to store scheduler configuration
- Create helper functions for checking table existence and managing sources
- Set up Row Level Security (RLS) policies for public access
- Insert an initial state if the table is empty

### 3. Testing the Setup

Run the test script to verify that your database setup is working correctly:

```bash
node scripts/test-scheduler-db.js
```

This script will:
- Check if the Supabase connection is working
- Verify the `scheduler_state` table exists
- Try to query, insert, and update data in the table

## Public Access Policy

The scheduler uses an open access policy that allows all operations on the `scheduler_state` table. This means:

- Anyone with the API key can read, write, update, and delete records
- Row Level Security (RLS) is still enabled but uses the policy `USING (true) WITH CHECK (true)`
- No authentication is required to use any of the scheduler functions

## Troubleshooting

### Database Connection Issues

If you see errors like:

```
❌ Error querying scheduler_state: { code: 'PGRST116', details: 'Permission denied' }
```

Run the SQL script again to ensure the RLS policies are set up correctly.

### Table Not Found

If you see an error indicating the `scheduler_state` table doesn't exist:

```
❌ scheduler_state table does NOT exist
```

Run the SQL script from `sql/create_scheduler_state_table.sql` in the Supabase SQL editor.

### Invalid or Expired API Keys

If you see connection errors, verify your API keys in the Supabase dashboard and update your `.env.local` file.

## Resetting the Scheduler

To reset the scheduler to its default state:

```sql
TRUNCATE scheduler_state;
INSERT INTO scheduler_state (json_state)
VALUES ('{"active": false, "nextRun": null, "sources": [], "logs": []}');
```

Run this in the Supabase SQL Editor to reset all sources and logs. 