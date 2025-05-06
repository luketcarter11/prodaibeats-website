// Script to update the R2 URL in src/lib/r2Config.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const r2ConfigPath = path.join(__dirname, 'src', 'lib', 'r2Config.ts');

// Function to update the CDN_BASE_URL in r2Config.ts
function updateR2Config() {
  console.log('🔧 Updating R2 configuration with correct URL...');
  
  try {
    // Read the current file content
    const fileContent = fs.readFileSync(r2ConfigPath, 'utf8');
    
    // Old incorrect URL
    const oldUrl = 'https://pub-c059baad842f47laaa2labb935e98d.r2.dev';
    
    // New correct URL
    const newUrl = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';
    
    // Check if old URL exists in the file
    if (!fileContent.includes(oldUrl)) {
      console.log('⚠️ Old URL pattern not found in the config file. Please check manually.');
      return false;
    }
    
    // Replace the old URL with the new URL
    const updatedContent = fileContent.replace(
      new RegExp(oldUrl.replace(/\./g, '\\.'), 'g'), 
      newUrl
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(r2ConfigPath, updatedContent, 'utf8');
    
    console.log('✅ Successfully updated R2 configuration!');
    console.log(`Changed URL from ${oldUrl} to ${newUrl}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating R2 configuration:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 R2 URL Update Tool');
  console.log('====================');
  
  // Update r2Config.ts
  const configUpdated = updateR2Config();
  
  if (configUpdated) {
    console.log('\n📝 Next steps:');
    console.log('1. If you\'re using .env or .env.local files, update NEXT_PUBLIC_STORAGE_BASE_URL in those files');
    console.log('2. If you\'re using Vercel, update the environment variable in the Vercel dashboard');
    console.log('3. Run the test script to verify the changes: node test-audio-url.js');
    console.log('\n⚠️ NOTE: You may need to restart your development server for changes to take effect');
  } else {
    console.log('\n❌ Failed to update configuration automatically.');
    console.log('Please update your NEXT_PUBLIC_STORAGE_BASE_URL manually in:');
    console.log('- .env.local file');
    console.log('- .env.production file');
    console.log('- Vercel environment variables (if deployed)');
    console.log('\nThe correct URL is: https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev');
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 