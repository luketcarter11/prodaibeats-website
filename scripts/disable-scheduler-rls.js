#!/usr/bin/env node
// Script to directly disable RLS for the scheduler_state table

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we have the required keys
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Set' : '❌ Missing');
  console.error('\nAdd the service role key to your .env.local file:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=eyJh...  (from Supabase dashboard)');
  process.exit(1);
}

// Create Supabase client with service role for admin privileges
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL to disable RLS
const disableRlsSql = `
-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "scheduler_state_select_policy" ON "public"."scheduler_state";
DROP POLICY IF EXISTS "scheduler_state_insert_policy" ON "public"."scheduler_state";
DROP POLICY IF EXISTS "scheduler_state_update_policy" ON "public"."scheduler_state";
DROP POLICY IF EXISTS "scheduler_state_delete_policy" ON "public"."scheduler_state";

-- Disable RLS on the scheduler_state table
ALTER TABLE "public"."scheduler_state" DISABLE ROW LEVEL SECURITY;

-- Grant privileges to anon and service_role
GRANT ALL PRIVILEGES ON TABLE "public"."scheduler_state" TO "anon";
GRANT ALL PRIVILEGES ON TABLE "public"."scheduler_state" TO "service_role";
`;

// Function to run the SQL
async function disableRls() {
  console.log('🛠️ Disabling Row Level Security for scheduler_state table...');
  
  try {
    const { error } = await supabase.rpc('pgcode', { code: disableRlsSql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      if (error.message.includes('permission denied') || error.message.includes('not found')) {
        console.log('\n⚠️ Unable to execute SQL using rpc. You need to run the SQL manually in the Supabase SQL Editor.');
        console.log('\n📋 SQL to run manually in Supabase SQL Editor:');
        console.log(disableRlsSql);
      }
      
      return false;
    }
    
    console.log('✅ Successfully disabled RLS on scheduler_state table!');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n📋 SQL to run manually in Supabase SQL Editor:');
    console.log(disableRlsSql);
    return false;
  }
}

// Function to test the connection after disabling RLS
async function testAccess() {
  console.log('\n🧪 Testing access to scheduler_state table...');
  
  // Create a client with the anon key
  const anonClient = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { count, error } = await anonClient
      .from('scheduler_state')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ Error accessing the table:', error);
      return false;
    }
    
    console.log('✅ Successfully accessed scheduler_state table!');
    console.log(`📊 Table has ${count} row(s)`);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing access:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Scheduler RLS Disabler ===');
  
  const rlsDisabled = await disableRls();
  
  if (rlsDisabled) {
    await testAccess();
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Make sure to set SUPABASE_SERVICE_ROLE_KEY in your production environment');
  console.log('2. Test the scheduler functionality in your app');
  console.log('3. If issues persist, run this SQL in the Supabase SQL Editor:');
  console.log(disableRlsSql);
}

main(); 