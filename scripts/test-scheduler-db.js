#!/usr/bin/env node
// Script to test Supabase connection and scheduler_state table

require('dotenv').config({ path: '.env.local' });
console.log('🔑 Loaded ENV values:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Key loaded (hidden for security)' : '❌ Missing');

const { createClient } = require('@supabase/supabase-js');

// Create supabase client using env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🔍 Testing Supabase connection and scheduler_state table...');
  
  try {
    // Test 1: Basic connection
    console.log('\n🧪 Test 1: Checking Supabase connection...');
    const { count, error: connectionError } = await supabase
      .from('_pgsodium_key_encrypt_secret_id_idx')
      .select('*', { count: 'exact', head: true });
    
    if (connectionError) {
      if (connectionError.code === 'PGRST116') {
        console.log('✅ Supabase connection successful (permission error is expected for system tables)');
      } else {
        console.error('❌ Supabase connection failed:', connectionError);
        return;
      }
    } else {
      console.log('✅ Supabase connection successful');
    }
    
    // Test 2: Check if scheduler_state table exists using RPC
    console.log('\n🧪 Test 2: Checking if scheduler_state table exists...');
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('check_scheduler_state_exists');
    
    if (tableCheckError) {
      console.error('❌ Could not check if table exists:', tableCheckError);
      console.log('📋 Running SQL to create the table might be needed:');
      console.log('Run the SQL from sql/create_scheduler_state_table.sql in the Supabase SQL editor');
    } else if (tableExists) {
      console.log('✅ scheduler_state table exists');
    } else {
      console.log('❌ scheduler_state table does NOT exist');
      console.log('📋 Run the SQL from sql/create_scheduler_state_table.sql in the Supabase SQL editor');
      return;
    }

    // Test 3: Try to query the scheduler_state table
    console.log('\n🧪 Test 3: Querying scheduler_state table...');
    const { data, error } = await supabase
      .from('scheduler_state')
      .select('id, json_state, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error querying scheduler_state:', error);
      console.log('This might be an issue with the table or RLS policies.');
    } else if (data && data.length > 0) {
      console.log('✅ Successfully queried scheduler_state table');
      console.log('📊 Latest record:');
      console.log('  ID:', data[0].id);
      console.log('  Updated:', new Date(data[0].updated_at).toLocaleString());
      console.log('  JSON type:', typeof data[0].json_state);
      console.log('  Active:', data[0].json_state.active);
      console.log('  Sources count:', data[0].json_state.sources?.length || 0);
      console.log('  Logs count:', data[0].json_state.logs?.length || 0);
    } else {
      console.log('⚠️ No records in scheduler_state table');
      
      // Test 4: Try inserting a default record
      console.log('\n🧪 Test 4: Inserting default record...');
      const defaultState = {
        active: false,
        nextRun: null,
        sources: [],
        logs: [{
          timestamp: new Date().toISOString(),
          message: 'Initial state created by test script',
          type: 'info'
        }]
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('scheduler_state')
        .insert({ json_state: defaultState })
        .select();
        
      if (insertError) {
        console.error('❌ Error inserting default state:', insertError);
      } else {
        console.log('✅ Successfully inserted default state');
      }
    }
    
    // Test 5: Try RPC function to insert a source
    console.log('\n🧪 Test 5: Testing initialize_scheduler_source RPC...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('initialize_scheduler_source', {
        source_url: 'https://www.youtube.com/user/test-from-script',
        source_type: 'channel'
      });
      
    if (rpcError) {
      console.error('❌ Error using initialize_scheduler_source RPC:', rpcError);
    } else {
      console.log('✅ Successfully used RPC to add a source');
      console.log('📊 New source:', rpcData);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during tests:', error);
  }
  
  console.log('\n📋 Test Summary:');
  console.log('If you encountered any errors, make sure to:');
  console.log('1. Check your Supabase credentials in .env.local');
  console.log('2. Run the SQL from sql/create_scheduler_state_table.sql');
  console.log('3. All access restrictions have been removed - everything should work with anonymous access');
}

runTests(); 