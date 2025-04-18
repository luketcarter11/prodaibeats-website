#!/usr/bin/env node
// Minimal script to test Supabase connection with detailed error reporting

require('dotenv').config({ path: '.env.local' });
const https = require('https');

// Extract credentials
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== SUPABASE CONNECTION TEST ===');
console.log('URL:', url);
console.log('Key present:', key ? 'Yes' : 'No');

// Verify URL format
if (url) {
  try {
    const urlObj = new URL(url);
    console.log('URL protocol:', urlObj.protocol);
    console.log('URL hostname:', urlObj.hostname); 
    console.log('URL is valid format:', true);
  } catch (e) {
    console.log('URL is not valid format:', e.message);
  }
}

// Low-level connection test using HTTPS
console.log('\nTesting direct HTTP connection to Supabase...');

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    req.end();
  });
}

// Test functions
async function testBasicConnection() {
  try {
    console.log('1. Testing basic HTTPS connection to Supabase...');
    const response = await httpGet(`${url}/rest/v1/`);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Server: ${response.headers.server || 'Unknown'}`);
    console.log(`   API version: ${response.headers['x-kong-version'] || 'Unknown'}`);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('   ✅ Basic connection successful!');
    } else {
      console.log('   ❌ Unexpected status code');
      console.log('   Response data:', response.data);
    }
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('   This usually means the domain cannot be resolved.');
      console.log('   Possible causes:');
      console.log('   - Supabase URL is incorrect');
      console.log('   - DNS issues');
      console.log('   - Network connectivity problems');
    }
  }
}

async function testAuthenticatedConnection() {
  try {
    console.log('\n2. Testing authenticated connection...');
    const response = await httpGet(`${url}/rest/v1/scheduler_state?limit=1`, {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    });
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Authentication successful!');
      console.log('   Response data:', response.data);
    } else if (response.statusCode === 404) {
      console.log('   ⚠️ Authentication successful, but table not found.');
      console.log('   This is expected if you haven\'t created the scheduler_state table yet.');
      console.log('   Good news: Your connection and authentication are working!');
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      console.log('   ❌ Authentication failed');
      console.log('   This suggests your API key is invalid or expired.');
    } else {
      console.log('   ❌ Unexpected status code');
      console.log('   Response data:', response.data);
    }
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
  }
}

async function runTests() {
  try {
    await testBasicConnection();
    await testAuthenticatedConnection();
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('If the basic connection succeeded but the authenticated connection failed,');
    console.log('this suggests your API key is incorrect or has expired.');
    console.log('\nNext steps:');
    console.log('1. Verify your credentials in the .env.local file');
    console.log('2. Check that your Supabase project is active');
    console.log('3. Try generating a new API key in the Supabase dashboard');
  } catch (error) {
    console.log('\n❌ Fatal error running tests:', error);
  }
}

runTests(); 