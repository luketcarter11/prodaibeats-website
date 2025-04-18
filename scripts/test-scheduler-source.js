#!/usr/bin/env node
// Script to test the scheduler source API endpoint

require('dotenv').config({ path: '.env.local' });
const https = require('https');

// Get the base URL from environment or use localhost
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('=== SCHEDULER SOURCE API TEST ===');
console.log('Base URL:', baseUrl);

// Test YouTube source to add
const testSource = {
  source: 'https://www.youtube.com/channel/UCf8GBn4oMPCCZKLhFazgYlA',
  type: 'channel'
};

console.log('\nTesting source:', testSource);

// Function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    
    // For testing localhost
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    console.log(`\n${method} ${url.toString()}`);
    
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : require('http');
    
    const req = httpModule.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status code: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        let parsedData;
        try {
          parsedData = responseData ? JSON.parse(responseData) : {};
        } catch (e) {
          console.log('Response is not JSON:', responseData.substring(0, 200));
          parsedData = { raw: responseData };
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });
    
    if (data) {
      const jsonData = JSON.stringify(data);
      console.log('Request body:', jsonData);
      req.write(jsonData);
    }
    
    req.end();
  });
}

// Test adding a source
async function testAddSource() {
  try {
    console.log('\n1. Testing POST /api/tracks/scheduler/sources');
    
    const response = await makeRequest('POST', '/api/tracks/scheduler/sources', testSource);
    
    if (response.statusCode === 200) {
      console.log('\n✅ Successfully added source!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('\n❌ Failed to add source');
      console.log('Error response:', JSON.stringify(response.data, null, 2));
      
      if (response.statusCode === 405) {
        console.log('\nThe 405 Method Not Allowed error suggests one of these issues:');
        console.log('1. The route handler for POST is not exported correctly');
        console.log('2. There might be a middleware blocking the request');
        console.log('3. The Next.js route configuration might be incorrect');
      }
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

// Main function
async function runTests() {
  try {
    await testAddSource();
    
    console.log('\n=== TEST COMPLETED ===');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
  }
}

runTests(); 