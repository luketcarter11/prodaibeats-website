#!/usr/bin/env node
// Script to verify if a Supabase project exists and is active

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const dns = require('dns').promises;

// Get the Supabase URL from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not defined in .env.local');
  process.exit(1);
}

// Extract the hostname from the URL
let hostname;
try {
  hostname = new URL(supabaseUrl).hostname;
  console.log('🔍 Checking Supabase project:', hostname);
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  console.error('   Error:', error.message);
  process.exit(1);
}

// Function to perform DNS lookup
async function checkDns(hostname) {
  try {
    console.log('\n1. Checking DNS resolution...');
    const addresses = await dns.resolve4(hostname);
    console.log('   ✅ DNS resolution successful');
    console.log('   IP addresses:', addresses.join(', '));
    return true;
  } catch (error) {
    console.error('   ❌ DNS resolution failed:', error.message);
    console.log('   This suggests the Supabase project does not exist or has been deleted.');
    return false;
  }
}

// Function to check if the server responds
function checkHttps(url) {
  return new Promise((resolve, reject) => {
    console.log('\n2. Testing HTTPS connection...');
    const req = https.get(url, (res) => {
      console.log('   Status code:', res.statusCode);
      console.log('   Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 500) {
          console.log('   ✅ Server is responding');
          resolve(true);
        } else {
          console.log('   ⚠️ Server responded with error status');
          console.log('   Response:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('   ❌ Connection error:', error.message);
      console.log('   This suggests the Supabase project is not active.');
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error('   ❌ Connection timed out');
      console.log('   This suggests the Supabase project is not responding.');
      reject(new Error('Request timed out'));
    });
    
    req.end();
  });
}

// Function to check the public API endpoints
function checkApiEndpoint(url) {
  return new Promise((resolve) => {
    console.log('\n3. Testing REST API endpoint...');
    const req = https.get(`${url}/rest/v1/`, (res) => {
      console.log('   Status code:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          console.log('   ✅ REST API is available');
          resolve(true);
        } else {
          console.log('   ⚠️ REST API returned unexpected status');
          console.log('   Response:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('   ❌ API connection error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error('   ❌ API connection timed out');
      resolve(false);
    });
    
    req.end();
  });
}

// Main function
async function verifyProject() {
  try {
    // Step 1: Check if domain resolves
    const dnsOk = await checkDns(hostname);
    if (!dnsOk) {
      console.log('\n❌ DNS check failed. The Supabase project domain cannot be resolved.');
      console.log('This strongly suggests the project does not exist or has been deleted.');
      console.log('\nPossible solutions:');
      console.log('1. Verify you are using the correct project URL');
      console.log('2. Create a new Supabase project if this one was deleted');
      console.log('3. Check if you can access the project in the Supabase dashboard');
      return;
    }
    
    // Step 2: Check if server responds
    try {
      const serverOk = await checkHttps(supabaseUrl);
      if (!serverOk) {
        console.log('\n⚠️ Server responded but may have issues.');
      }
    } catch (error) {
      console.log('\n❌ Server check failed. The Supabase project is not responding.');
      console.log('This strongly suggests the project is not active or has been paused.');
      console.log('\nPossible solutions:');
      console.log('1. Log in to the Supabase dashboard and check if the project is paused');
      console.log('2. If paused, unpause the project');
      console.log('3. If the project was deleted, create a new one and update your .env.local');
      return;
    }
    
    // Step 3: Check the API endpoint
    const apiOk = await checkApiEndpoint(supabaseUrl);
    if (!apiOk) {
      console.log('\n⚠️ API check had issues. The Supabase REST API is not responding correctly.');
      console.log('This suggests there may be configuration issues with the project.');
    }
    
    // Summary
    console.log('\n=== PROJECT VERIFICATION SUMMARY ===');
    if (dnsOk) {
      console.log('✅ The Supabase project domain exists');
      console.log('The domain can be resolved to an IP address, which means the project exists.');
      
      console.log('\nNext Steps:');
      console.log('1. Run the direct connection test:');
      console.log('   node scripts/direct-supabase-test.js');
      console.log('2. Create the scheduler_state table:');
      console.log('   node scripts/fix-scheduler-table.js');
    } else {
      console.log('❌ Project verification failed');
      console.log('Please review the errors above and fix the issues with your Supabase project.');
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during verification:', error);
  }
}

// Run the verification
verifyProject(); 