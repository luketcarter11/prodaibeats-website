#!/usr/bin/env node

/**
 * Check production API endpoints
 * This script tests if the deployed API endpoints are working correctly
 */

import fetch from 'node-fetch';

// Usage: node scripts/check-prod-api.js https://yoursite.com
const args = process.argv.slice(2);
const baseUrl = args[0] || 'https://prodaibeats.com';

console.log(`🔍 Testing API endpoints for: ${baseUrl}`);

async function checkEndpoint(path) {
  const url = new URL(path, baseUrl).toString();
  console.log(`Testing: ${url}`);
  
  try {
    const response = await fetch(url);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          console.log(`✅ Success: Received array with ${data.length} items`);
          if (data.length > 0) {
            console.log('First item sample:');
            console.log(JSON.stringify(data[0], null, 2).substring(0, 500) + '...');
          }
        } else {
          console.log(`✅ Success: Received JSON object`);
          console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
        }
      } else {
        const text = await response.text();
        console.log(`❌ Response is not JSON: ${text.substring(0, 500)}...`);
      }
    } else {
      console.log(`❌ Error response: ${response.status}`);
      try {
        const text = await response.text();
        console.log(`Error details: ${text.substring(0, 500)}...`);
      } catch (parseError) {
        console.log(`Could not parse error response: ${parseError.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Fetch error: ${error.message}`);
  }
  
  console.log('\n---\n');
}

async function main() {
  // Test the tracks endpoint
  await checkEndpoint('/api/tracks');
  
  // You can add more endpoints to check here
}

main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
}); 