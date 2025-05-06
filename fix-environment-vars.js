// Script to help update environment variables with the correct URL
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Setup ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Old incorrect URL
const oldUrl = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// New correct URL
const newUrl = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Files to check
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
];

// Check and update environment files
function updateEnvFiles() {
  let filesUpdated = 0;
  
  envFiles.forEach(filename => {
    const filePath = path.join(process.cwd(), filename);
    
    if (fs.existsSync(filePath)) {
      console.log(`📝 Checking ${filename}...`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes(oldUrl)) {
        content = content.replace(new RegExp(oldUrl, 'g'), newUrl);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${filename} with correct URL`);
        filesUpdated++;
      } else {
        console.log(`ℹ️ No changes needed in ${filename}`);
      }
    } else {
      console.log(`ℹ️ File ${filename} does not exist, skipping`);
    }
  });
  
  return filesUpdated;
}

// Print additional instructions
function printInstructions() {
  console.log('\n📋 Instructions for deployment environments:');
  console.log('If you\'re using Vercel or another deployment platform, make sure to update');
  console.log('the NEXT_PUBLIC_STORAGE_BASE_URL environment variable to:');
  console.log(`${newUrl}`);
}

// Main function
function main() {
  console.log('🚀 Environment Variables URL Updater');
  console.log('===================================');
  console.log(`Replacing: ${oldUrl}`);
  console.log(`With: ${newUrl}`);
  console.log('');
  
  // Update env files
  const filesUpdated = updateEnvFiles();
  
  console.log(`\n📊 Updated ${filesUpdated} file(s)`);
  
  // Print instructions
  printInstructions();
  
  // Reminder to restart the server
  console.log('\n⚠️ Remember to restart your development server for changes to take effect!');
}

// Run the script
main(); 