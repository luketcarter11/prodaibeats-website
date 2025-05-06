/**
 * Utility script to check and validate R2 URLs
 * This helps diagnose issues with the R2 configuration
 */
import { CDN_BASE_URL, R2_BUCKET_NAME, R2_ENDPOINT } from './r2Config';
import fetch from 'node-fetch';

// Check the presence of required environment variables
function checkEnvironmentVariables() {
  console.log('📋 Checking Environment Variables');
  console.log('--------------------------------');
  
  const requiredVars = [
    'NEXT_PUBLIC_STORAGE_BASE_URL',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_ENDPOINT',
    'R2_BUCKET'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const isPresent = !!value;
    console.log(`${isPresent ? '✅' : '❌'} ${varName}: ${isPresent ? 'Present' : 'Missing'}`);
    
    if (!isPresent) {
      allPresent = false;
    }
  }
  
  console.log(`\nOverall: ${allPresent ? '✅ All required variables are present' : '❌ Some variables are missing'}`);
  
  return allPresent;
}

// Validate the CDN_BASE_URL for correct format and accessibility
async function validateCdnBaseUrl() {
  console.log('\n📋 Validating CDN Base URL');
  console.log('-------------------------');
  console.log(`Current CDN_BASE_URL: ${CDN_BASE_URL}`);
  
  // Check for the correct format
  const correctFormat = CDN_BASE_URL === 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';
  console.log(`${correctFormat ? '✅' : '⚠️'} Format: ${correctFormat ? 'Correct' : 'May not match expected format'}`);
  
  if (!correctFormat) {
    console.log('Expected format: https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev');
  }
  
  // Check if the URL is accessible
  try {
    // Try to access the root URL - expect 403 Forbidden which is normal for R2 buckets
    const response = await fetch(CDN_BASE_URL);
    
    if (response.status === 403) {
      console.log('✅ Accessibility: URL is accessible (403 Forbidden is expected for bucket root)');
    } else {
      console.log(`⚠️ Accessibility: Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Accessibility: Unable to access URL: ${error}`);
    return false;
  }
  
  return true;
}

// Test access to a few common paths
async function testCommonPaths() {
  console.log('\n📋 Testing Common R2 Paths');
  console.log('------------------------');
  
  const pathsToTest = [
    'tracks/list.json',
    'tracks/track_00000000000000000000000.mp3', // Dummy track ID
    'defaults/default-cover.jpg'
  ];
  
  for (const path of pathsToTest) {
    const url = `${CDN_BASE_URL}/${path}`;
    console.log(`Testing: ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        console.log(`✅ URL is accessible (${response.status} ${response.statusText})`);
        
        // For JSON files, try to parse them
        if (path.endsWith('.json')) {
          try {
            const data = await response.json();
            console.log(`✅ Successfully parsed JSON, ${Array.isArray(data) ? `contains ${data.length} items` : 'contains data'}`);
          } catch (error) {
            console.log(`❌ Could not parse JSON: ${error}`);
          }
        }
      } else {
        console.log(`❌ URL is not accessible (${response.status} ${response.statusText})`);
      }
    } catch (error) {
      console.log(`❌ Error accessing URL: ${error}`);
    }
    
    console.log(''); // Add a blank line for readability
  }
}

// Print R2 configuration summary
function printConfigSummary() {
  console.log('\n📋 R2 Configuration Summary');
  console.log('-------------------------');
  console.log(`R2 Bucket Name: ${R2_BUCKET_NAME}`);
  console.log(`R2 Endpoint: ${R2_ENDPOINT}`);
  console.log(`CDN Base URL: ${CDN_BASE_URL}`);
  console.log(`Expected folder structure:`);
  console.log(`- ${CDN_BASE_URL}/tracks/track_<id>.mp3`);
  console.log(`- ${CDN_BASE_URL}/covers/track_<id>.jpg`);
  console.log(`- ${CDN_BASE_URL}/metadata/track_<id>.json`);
  console.log(`- ${CDN_BASE_URL}/tracks/list.json`);
}

// Main function to run all checks
async function main() {
  console.log('🚀 R2 URL Checker Tool');
  console.log('====================');
  
  const envVarsOk = checkEnvironmentVariables();
  const cdnUrlOk = await validateCdnBaseUrl();
  await testCommonPaths();
  printConfigSummary();
  
  console.log('\n📋 OVERALL ASSESSMENT');
  console.log('-------------------');
  
  if (envVarsOk && cdnUrlOk) {
    console.log('✅ R2 configuration appears to be correct');
    console.log(`✅ Base URL is correctly set to: ${CDN_BASE_URL}`);
    return true;
  } else {
    console.log('⚠️ There might be issues with your R2 configuration');
    console.log('Please check the logs above for details.');
    return false;
  }
}

// Run the script
main()
  .then(success => {
    console.log('\n💡 Next steps:');
    if (success) {
      console.log('- Run "npm run r2:repair" to fix any issues with tracks/list.json and metadata URLs');
    } else {
      console.log('- Double-check your environment variables');
      console.log('- Verify your Cloudflare R2 settings');
      console.log('- Run "npm run r2:repair" to fix any issues with tracks/list.json and metadata URLs');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 