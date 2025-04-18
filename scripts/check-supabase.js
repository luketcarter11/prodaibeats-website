#!/usr/bin/env node
// Simple script to check Supabase environment variables and connection

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 CHECKING SUPABASE ENVIRONMENT VARIABLES');
console.log('======================================');

console.log('✓ NEXT_PUBLIC_SUPABASE_URL:', url ? url : '❌ MISSING');
console.log('✓ NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? '✅ Present (hidden)' : '❌ MISSING');

// Exit early if any variables are missing
if (!url || !key) {
  console.error('\n❌ ERROR: Missing environment variables!');
  console.log('\nPlease check your .env.local file and ensure it has the correct Supabase credentials:');
  console.log('1. No spaces around the = sign');
  console.log('2. No quotes around values');
  console.log('3. No trailing spaces');
  process.exit(1);
}

console.log('\n🔍 TESTING SUPABASE CONNECTION');
console.log('======================================');

async function testConnection() {
  try {
    // Create client
    console.log('1. Creating Supabase client...');
    const supabase = createClient(url, key);
    console.log('   ✅ Client created');
    
    // First, try a healthcheck request that doesn't require authentication
    console.log('2. Testing basic API access (healthcheck)...');
    try {
      const healthResponse = await fetch(`${url}/rest/v1/`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': key
        }
      });
      
      console.log(`   Response status: ${healthResponse.status} ${healthResponse.statusText}`);
      
      if (!healthResponse.ok) {
        console.error('   ❌ Health check failed - API might be down or unreachable');
        console.log('   Response:', await healthResponse.text());
      } else {
        console.log('   ✅ Health check passed - API is accessible');
      }
    } catch (fetchError) {
      console.error('   ❌ Fetch error during health check:', fetchError);
    }
    
    // Test connection by making a simple query
    console.log('3. Testing connection with simple query...');
    const start = Date.now();
    
    // First try a simple database query that doesn't require the scheduler_state table
    try {
      console.log('   Querying Supabase information schema...');
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        console.error('   ❌ Schema query error:', schemaError);
      } else {
        console.log('   ✅ Schema query succeeded, response:', schemaData);
      }
    } catch (queryError) {
      console.error('   ❌ Error querying information schema:', queryError);
      console.log('   This is okay if querying information_schema is restricted.');
    }
    
    // Try a direct SQL query using RPC
    try {
      console.log('   Attempting direct SQL check via RPC...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('check_table_exists', { 
        table_name: 'scheduler_state'
      });
      
      if (rpcError) {
        console.error('   ❌ RPC query error:', rpcError);
        console.log('   This might indicate the RPC function does not exist.');
      } else {
        console.log('   ✅ RPC query succeeded, table exists:', rpcData);
      }
    } catch (rpcQueryError) {
      console.error('   ❌ Error with RPC query:', rpcQueryError);
    }
    
    // Now try the original query to scheduler_state
    console.log('   Querying scheduler_state table...');
    const { data, error, status } = await supabase
      .from('scheduler_state')
      .select('count(*)', { count: 'exact', head: true });
    
    const duration = Date.now() - start;
    
    if (error) {
      console.log('   Error details:', {
        message: error.message || 'No message',
        code: error.code || 'No code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint'
      });
      
      if (error.code === 'PGRST116') {
        console.log(`   ✅ Connection successful (${duration}ms) - Permission error expected`);
        console.log('   Response status:', status);
      } else if (error.code === '42P01') {
        console.log(`   ❌ Table does not exist - You need to run the SQL script to create it`);
      } else {
        console.error('   ❌ Connection error:', error);
        throw error;
      }
    } else {
      console.log(`   ✅ Connection successful (${duration}ms)`);
      console.log('   Data received:', data);
    }
    
    console.log('\n✅ SUPABASE CONNECTION TEST COMPLETED');
    console.log('If there were any errors above, please fix them before proceeding.');
    
    if (error) {
      console.log('\nThe connection to Supabase is working, but there are issues with the database:');
      console.log('1. The scheduler_state table likely does not exist yet');
      console.log('2. Run the SQL script to create the necessary tables:');
      console.log('   - Go to your Supabase dashboard: https://app.supabase.com/project/_/sql');
      console.log('   - Run the SQL from sql/create_scheduler_state_table.sql');
      console.log('   - Then try this test again');
      
      // Add a function to create the schema directly
      console.log('\nWould you like to attempt to create the schema now? [y/N]');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ CONNECTION TEST FAILED!', error);
    console.log('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    console.log('\nPossible solutions:');
    console.log('1. Double-check your Supabase URL and key in .env.local');
    console.log('2. Ensure your Supabase project is active and not paused');
    console.log('3. Check if your IP is allowed in Supabase settings (if using IP restrictions)');
    console.log('4. Make sure the scheduler_state table exists (run the SQL script)');
    console.log('5. Check if your auth token has expired or been revoked');
    process.exit(1);
  }
}

testConnection(); 