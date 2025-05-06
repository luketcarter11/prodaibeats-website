/**
 * Script to find and fix all instances of incorrect CDN URLs in both:
 * 1. The R2 metadata files (using repair-metadata-urls.ts)
 * 2. The local codebase (.js, .ts, .jsx, .tsx files)
 */
import { repairMetadataUrls } from './src/lib/repair-metadata-urls';
import { hasR2Credentials } from './src/lib/r2Config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Define the incorrect and correct domains
const INCORRECT_DOMAINS = [
  'https://pub-c059baad842f47laaa2labb935e98d.r2.dev',  // Common typo version
  'https://pub-c059baad842f471aaa2labb935e98d.r2.dev',  // Another possible variation
  'https://pub-c059baad842f47aaaa2labb935e98d.r2.dev',  // Another possible variation
  'https://pub-c059baad842f47laaa2a1bbb935e98d.r2.dev'  // Another possible variation
];

// The correct domain from environment
const CORRECT_DOMAIN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

console.log('🔍 CDN URL Fixer');
console.log('===============');
console.log(`Correct CDN URL: ${CORRECT_DOMAIN}`);
console.log('');

/**
 * Find all instances of incorrect CDN URLs in the codebase
 */
async function findIncorrectUrlsInCodebase(): Promise<{file: string, lineNumber: number, domain: string}[]> {
  console.log('🔎 Scanning local codebase for incorrect CDN URLs...');
  
  const results: {file: string, lineNumber: number, domain: string}[] = [];
  
  // Check for each incorrect domain individually
  for (const incorrectDomain of INCORRECT_DOMAINS) {
    try {
      // Use grep to search for the current domain pattern
      const escapedDomain = incorrectDomain.replace(/\./g, '\\.').replace(/\//g, '\\/');
      const grepCmd = `grep -r -n "${escapedDomain}" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --exclude-dir="node_modules" --exclude-dir=".next" --exclude-dir=".git" .`;
      
      let grepOutput: string;
      try {
        grepOutput = execSync(grepCmd, { encoding: 'utf8' });
      } catch (error: any) {
        // grep returns exit code 1 if no matches found, which causes execSync to throw
        if (error.status === 1) {
          continue; // No matches for this domain, skip to next
        }
        grepOutput = error.stdout || '';
      }
      
      // Parse grep output (format: "filename:line_number:matching_line")
      const lines = grepOutput.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        const parts = line.split(':', 2);
        if (parts.length >= 2) {
          const file = parts[0];
          const lineNumber = parseInt(parts[1], 10);
          
          // Skip our own script files to avoid infinite fixes
          if (file === './fix-all-cdn-urls.ts' || file === './src/lib/repair-metadata-urls.ts') {
            continue;
          }
          
          results.push({
            file: file.startsWith('./') ? file.substring(2) : file,
            lineNumber,
            domain: incorrectDomain
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning for domain ${incorrectDomain}:`, error);
    }
  }
  
  return results;
}

/**
 * Fix incorrect CDN URLs in a single file
 */
function fixUrlsInFile(filePath: string, results: {file: string, lineNumber: number, domain: string}[]): boolean {
  try {
    console.log(`🔧 Fixing URLs in file: ${filePath}`);
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    let fixCount = 0;
    
    // Replace all incorrect domains with the correct one
    for (const incorrectDomain of INCORRECT_DOMAINS) {
      const originalContent = content;
      content = content.replace(new RegExp(incorrectDomain.replace(/\./g, '\\.'), 'g'), CORRECT_DOMAIN);
      
      // Count replacements
      if (originalContent !== content) {
        const replacementCount = (originalContent.match(new RegExp(incorrectDomain.replace(/\./g, '\\.'), 'g')) || []).length;
        fixCount += replacementCount;
        console.log(`  ✓ Replaced ${replacementCount} instances of ${incorrectDomain}`);
      }
    }
    
    // Only write to the file if changes were made
    if (fixCount > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${fixCount} URLs in ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ No URLs to fix in ${filePath} (possibly false positive)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing URLs in ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function to run all repair operations
 */
async function fixAllCdnUrls(): Promise<void> {
  let fixedFiles = 0;
  let r2Updated = 0;
  let r2Failed = 0;
  
  try {
    // Step 1: Find incorrect URLs in codebase
    const codebaseResults = await findIncorrectUrlsInCodebase();
    
    // Group results by file to handle each file only once
    const fileGroups = codebaseResults.reduce((acc, result) => {
      if (!acc[result.file]) {
        acc[result.file] = [];
      }
      acc[result.file].push(result);
      return acc;
    }, {} as Record<string, typeof codebaseResults>);
    
    console.log(`\n📋 Found ${codebaseResults.length} incorrect URLs in ${Object.keys(fileGroups).length} files`);
    
    // Step 2: Fix incorrect URLs in local codebase
    if (codebaseResults.length > 0) {
      console.log('\n📋 STEP 1: Fixing URLs in local codebase');
      console.log('----------------------------------');
      
      for (const [file, results] of Object.entries(fileGroups)) {
        const success = fixUrlsInFile(file, results);
        if (success) {
          fixedFiles++;
        }
      }
    } else {
      console.log('✅ No incorrect CDN URLs found in local codebase.');
    }
    
    // Step 3: Fix incorrect URLs in R2 metadata
    console.log('\n📋 STEP 2: Fixing URLs in R2 metadata');
    console.log('--------------------------------');
    
    // First verify R2 credentials
    const credentialsOk = await hasR2Credentials();
    
    if (!credentialsOk) {
      console.error('❌ R2 credentials are not properly configured');
      console.log('\n💡 Make sure to set the following environment variables:');
      console.log('- R2_ACCESS_KEY_ID');
      console.log('- R2_SECRET_ACCESS_KEY');
      console.log('- R2_ENDPOINT');
      console.log('- R2_BUCKET');
      console.log('- NEXT_PUBLIC_STORAGE_BASE_URL');
    } else {
      // Call the metadata repair function
      const result = await repairMetadataUrls();
      r2Updated = result.updated;
      r2Failed = result.failed;
    }
    
    // Print final summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log('---------------');
    console.log(`📁 Local files fixed: ${fixedFiles}/${Object.keys(fileGroups).length}`);
    console.log(`📁 R2 metadata files fixed: ${r2Updated}`);
    console.log(`📁 Failed repairs: ${r2Failed}`);
    
    if (fixedFiles > 0 || r2Updated > 0) {
      console.log('\n✅ Some URLs were fixed. Next steps:');
      console.log('1. Restart your development server');
      console.log('2. Update Vercel environment variables if needed');
      console.log('3. Verify audio playback works correctly');
    } else if (codebaseResults.length === 0 && r2Updated === 0 && r2Failed === 0) {
      console.log('\n🎉 No issues found! All URLs are correct.');
    }
  } catch (error) {
    console.error('❌ Error fixing CDN URLs:', error);
  }
}

// Run the fix process
fixAllCdnUrls()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 