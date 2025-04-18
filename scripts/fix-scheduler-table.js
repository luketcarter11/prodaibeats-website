#!/usr/bin/env node
// Simple script to create the scheduler_state table directly

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Minimal SQL to create the table
const createTableSQL = `
-- Create the scheduler_state table if it doesn't exist
CREATE TABLE IF NOT EXISTS scheduler_state (
  id SERIAL PRIMARY KEY,
  json_state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// Insert initial data if needed
const insertInitialDataSQL = `
-- Insert initial state if table is empty
INSERT INTO scheduler_state (json_state)
SELECT '{"active": false, "nextRun": null, "sources": [], "logs": []}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM scheduler_state);
`;

async function checkTableExists() {
  try {
    // Use Supabase REST API to query the table
    console.log('🔍 Checking if scheduler_state table exists...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/scheduler_state?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ scheduler_state table exists!');
      return true;
    } else if (response.status === 404) {
      console.log('❌ scheduler_state table does not exist');
      return false;
    } else {
      // Log the error details
      const errorText = await response.text();
      console.error(`❌ Unexpected status code: ${response.status}`);
      console.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking if table exists:', error);
    return false;
  }
}

async function executeSQL(sql) {
  try {
    // Use Supabase REST API to execute SQL
    console.log('🔄 Executing SQL...');
    console.log(sql);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        sql_query: sql
      })
    });
    
    if (response.ok) {
      console.log('✅ SQL executed successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to execute SQL: ${response.status}`);
      console.error('Error details:', errorText);
      
      // If the function doesn't exist, we need to create it first
      if (errorText.includes('function') && errorText.includes('does not exist')) {
        console.log('\nYou need to create the exec_sql function first.');
        console.log('Please run this SQL in your Supabase dashboard:');
        console.log(`
-- Function to execute SQL - use with caution!
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`);
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    return false;
  }
}

async function createTableManually() {
  console.log('\n🔧 Creating scheduler_state table manually...');
  
  try {
    // 1. Create the table
    const createSuccess = await executeSQL(createTableSQL);
    if (!createSuccess) {
      console.log('\n🚫 Failed to create the table using the REST API.');
      console.log('Please create the table manually through the Supabase dashboard:');
      console.log('1. Go to https://app.supabase.com/project/_/sql');
      console.log('2. Copy and paste the SQL below:');
      console.log('\n------- SQL START -------');
      console.log(createTableSQL);
      console.log('------- SQL END ---------\n');
      return false;
    }
    
    // 2. Insert initial data
    const insertSuccess = await executeSQL(insertInitialDataSQL);
    if (!insertSuccess) {
      console.log('\n⚠️ Created the table but failed to insert initial data.');
      console.log('You can do this manually through the Supabase dashboard:');
      console.log('1. Go to https://app.supabase.com/project/_/sql');
      console.log('2. Copy and paste the SQL below:');
      console.log('\n------- SQL START -------');
      console.log(insertInitialDataSQL);
      console.log('------- SQL END ---------\n');
      return false;
    }
    
    console.log('\n✅ Successfully created the scheduler_state table and inserted initial data!');
    return true;
  } catch (error) {
    console.error('❌ Error creating table manually:', error);
    return false;
  }
}

async function tryDirectInsert() {
  try {
    console.log('\n🔍 Attempting direct insert to create scheduler_state table...');
    
    const { error } = await supabase
      .from('scheduler_state')
      .insert({
        json_state: {
          active: false,
          nextRun: null,
          sources: [],
          logs: [{
            timestamp: new Date().toISOString(),
            message: 'Initial state created by setup script',
            type: 'info'
          }]
        }
      });
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table does not exist. Need to create it first.');
        return false;
      } else {
        console.error('❌ Error inserting data:', error);
        return false;
      }
    } else {
      console.log('✅ Successfully inserted data. Table must exist!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error during direct insert:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 SCHEDULER TABLE SETUP UTILITY');
  console.log('===============================');
  
  // First check if the table exists
  const tableExists = await checkTableExists();
  
  if (tableExists) {
    console.log('\n✅ The scheduler_state table already exists in your database.');
    console.log('You can verify it by running:');
    console.log('node scripts/test-scheduler-db.js');
    return;
  }
  
  // Try a direct insert first (simplest method)
  const insertWorked = await tryDirectInsert();
  
  if (insertWorked) {
    console.log('\n✅ Successfully created the scheduler_state table via direct insert!');
    return;
  }
  
  // If that fails, try to create the table manually
  const createSuccess = await createTableManually();
  
  if (!createSuccess) {
    console.log('\n🚨 All attempts to create the table automatically have failed.');
    console.log('You will need to create it manually:');
    console.log('1. Go to https://app.supabase.com/project/_/sql');
    console.log('2. Run the SQL from the file: sql/create_scheduler_state_table.sql');
    
    // Show minimal SQL needed
    console.log('\nOr at minimum, run this simplified SQL:');
    console.log('\n------- SQL START -------');
    console.log(`${createTableSQL}\n${insertInitialDataSQL}`);
    console.log('------- SQL END ---------');
  }
}

main(); 