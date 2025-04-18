#!/usr/bin/env node
// Script to create the scheduler_state table in Supabase

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSchema() {
  console.log('🔍 Creating scheduler_state table in Supabase...');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'create_scheduler_state_table.sql');
    let sqlContent;
    
    try {
      sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log('✅ SQL file read successfully');
    } catch (readError) {
      console.error('❌ Could not read SQL file:', readError);
      console.log('Creating minimal schema instead...');
      
      // Minimal SQL to create the table
      sqlContent = `
        -- Create the scheduler_state table if it doesn't exist
        CREATE TABLE IF NOT EXISTS scheduler_state (
          id SERIAL PRIMARY KEY,
          json_state JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert initial state if table is empty
        INSERT INTO scheduler_state (json_state)
        SELECT '{"active": false, "nextRun": null, "sources": [], "logs": []}'::JSONB
        WHERE NOT EXISTS (SELECT 1 FROM scheduler_state);
      `;
    }
    
    // Since we can't execute multiple statements directly with the Supabase client,
    // we need to split the SQL into separate statements and execute them one by one
    
    // First, let's check if we can execute a simple query
    console.log('Testing connection...');
    const { error: testError } = await supabase.from('_dummy_check').select('*').limit(1);
    
    if (testError && testError.code !== 'PGRST116') {
      console.error('❌ Error connecting to Supabase:', testError);
      console.log('\nIt seems the regular Supabase client cannot execute raw SQL.');
      console.log('Please run the SQL file manually through the Supabase dashboard:');
      console.log('1. Go to https://app.supabase.com/project/_/sql');
      console.log('2. Copy and paste the SQL from sql/create_scheduler_state_table.sql');
      console.log('3. Run the SQL');
      process.exit(1);
    }
    
    // For development/demo purposes, we'll execute a simplified version through RPC if possible
    console.log('Testing RPC capabilities...');
    try {
      const { error: rpcError } = await supabase.rpc('create_scheduler_state_table');
      
      if (rpcError) {
        if (rpcError.message && rpcError.message.includes('function does not exist')) {
          console.log('RPC function does not exist yet, which is expected.');
        } else {
          console.error('❌ Error calling RPC:', rpcError);
        }
      } else {
        console.log('✅ Table created via RPC');
        return true;
      }
    } catch (rpcError) {
      console.error('❌ Error calling RPC:', rpcError);
    }
    
    console.log('\n🚫 Direct SQL execution through the client is not possible.');
    console.log('Please run the SQL file manually through the Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com/project/_/sql');
    console.log('2. Copy and paste the SQL below:');
    console.log('\n------- SQL START -------');
    console.log(sqlContent);
    console.log('------- SQL END ---------\n');
    
    return false;
  } catch (error) {
    console.error('❌ Error creating schema:', error);
    return false;
  }
}

createSchema().then(success => {
  if (success) {
    console.log('\n✅ Schema created successfully!');
    console.log('You can now run the test script again:');
    console.log('node scripts/test-scheduler-db.js');
  }
}); 