# Fixing Supabase Project Connection Issues

If you're encountering empty error messages or connection failures with your Supabase project, this guide will help you diagnose and fix the root causes.

## Diagnosing the Issue

First, run the project verification script:

```bash
node scripts/verify-supabase-project.js
```

This script will check:
1. If the Supabase domain can be resolved (DNS check)
2. If the server responds to HTTPS requests
3. If the REST API endpoint is available

## Common Issues and Fixes

### 1. Project Has Been Deleted or Never Existed

**Symptoms:**
- DNS check fails with "ENOTFOUND" error
- Empty error messages when trying to connect

**Solution:**
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Check if your project exists in the list
3. If not, create a new project:
   - Click "New project"
   - Set up your project with a name and password
   - Wait for it to be created (can take a few minutes)
4. Once created, get the new URL and anon key:
   - Go to Project Settings → API
   - Copy the Project URL and anon key
5. Update your `.env.local` file with the new values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
   ```

### 2. Project Is Paused

**Symptoms:**
- DNS resolves but connection times out
- Connection errors without details

**Solution:**
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Find your project in the list
3. If it shows as "Paused", click on it
4. Look for a "Resume Project" button and click it
5. Wait a few minutes for the project to resume
6. Try your application again

### 3. API Key Has Expired or Is Invalid

**Symptoms:**
- DNS resolves and server responds
- Authentication failures (401/403 errors)

**Solution:**
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Go to your project → Settings → API
3. Under "Project API keys", find the "anon public" key
4. Click "Reveal" to see the key and copy it
5. Update your `.env.local` file with the new key:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
   ```

### 4. Project URL Is Incorrect

**Symptoms:**
- DNS resolves to wrong server
- Server responds with unexpected errors

**Solution:**
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Go to your project → Settings → API
3. Copy the correct "Project URL"
4. Update your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-correct-project.supabase.co
   ```

## Creating a New Project and Setting It Up

If you need to create a new Supabase project:

1. Go to [Supabase Dashboard](https://app.supabase.com) and log in
2. Click "New Project"
3. Choose an organization, name, database password, region, and pricing plan
4. Click "Create new project" and wait for it to be created
5. Once created:
   - Go to Settings → API to get your URL and anon key
   - Update your `.env.local` file with these values
6. Run the SQL script to create the required tables:
   ```bash
   node scripts/fix-scheduler-table.js
   ```
   This will show you the SQL you need to run

7. In the Supabase dashboard:
   - Go to "SQL Editor"
   - Copy and paste the SQL from the previous step
   - Run the SQL

8. Verify it works:
   ```bash
   node scripts/test-scheduler-db.js
   ```

9. Restart your application:
   ```bash
   npm run dev
   ```

## Verifying the Fix

After making changes, run these scripts to verify everything is working:

1. Check project status:
   ```bash
   node scripts/verify-supabase-project.js
   ```

2. Check connection:
   ```bash
   node scripts/direct-supabase-test.js
   ```

3. Test database access:
   ```bash
   node scripts/test-scheduler-db.js
   ```

If all these tests pass, your Supabase connection should be working correctly! 