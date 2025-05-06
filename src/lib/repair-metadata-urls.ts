/**
 * Script to repair metadata files in R2 storage that contain incorrect URLs
 * This fixes Issue #3 where metadata files may still have the wrong domain in audioUrl and coverUrl
 */
import { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, CDN_BASE_URL } from './r2Config';
import { uploadJsonToR2 } from './r2Uploader';
import { fileURLToPath } from 'url';

// The incorrect domains that need to be replaced - add ALL variations we've seen
const INCORRECT_DOMAINS = [
  'https://pub-c059baad842f47laaa2labb935e98d.r2.dev',  // Common typo version
  'https://pub-c059baad842f471aaa2labb935e98d.r2.dev',  // Another possible variation
  'https://pub-c059baad842f47aaaa2labb935e98d.r2.dev',  // Another possible variation
  'https://pub-c059baad842f47laaa2a1bbb935e98d.r2.dev'  // Another possible variation
];

// The correct domain to use
const CORRECT_DOMAIN = CDN_BASE_URL; 

// Validate that our correct domain is properly formatted
if (!CORRECT_DOMAIN.match(/^https:\/\/pub-[a-z0-9]+\.r2\.dev$/)) {
  console.warn(`⚠️ Warning: CDN_BASE_URL "${CORRECT_DOMAIN}" doesn't match expected format.`);
  console.warn('Expected format: https://pub-[alphanumeric].r2.dev');
}

/**
 * List all JSON metadata files in the metadata/ prefix of the R2 bucket
 */
async function listMetadataFiles(): Promise<string[]> {
  try {
    console.log('🔍 Listing all JSON files in metadata/ prefix...');
    
    // Initialize an array to hold all file keys
    const metadataFiles: string[] = [];
    
    // Setup the list command with the metadata/ prefix
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'metadata/',
      MaxKeys: 1000,
    });
    
    // R2 list operation may return paginated results if there are many files
    let hasMoreResults = true;
    let continuationToken: string | undefined = undefined;
    
    // Loop through all paginated results
    while (hasMoreResults) {
      if (continuationToken) {
        command.input.ContinuationToken = continuationToken;
      }
      
      const response = await r2Client.send(command);
      
      // Process the files in the current page
      if (response.Contents) {
        const jsonFiles = response.Contents
          .filter(item => item.Key && item.Key.endsWith('.json'))
          .map(item => item.Key as string);
        
        metadataFiles.push(...jsonFiles);
        console.log(`📁 Found ${jsonFiles.length} JSON files in this batch.`);
      }
      
      // Check if there are more results to fetch
      if (response.IsTruncated) {
        continuationToken = response.NextContinuationToken;
      } else {
        hasMoreResults = false;
      }
    }
    
    console.log(`✅ Total metadata files found: ${metadataFiles.length}`);
    return metadataFiles;
  } catch (error) {
    console.error('❌ Error listing metadata files:', error);
    throw error;
  }
}

/**
 * Repair a single metadata file by updating its URLs
 */
async function repairMetadataFile(fileKey: string): Promise<boolean> {
  try {
    // Get the current metadata file content
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
    });
    
    const response = await r2Client.send(getCommand);
    if (!response.Body) {
      console.warn(`⚠️ Empty body for file: ${fileKey}`);
      return false;
    }
    
    // Parse the metadata JSON
    const metadataString = await response.Body.transformToString();
    let metadata;
    
    try {
      metadata = JSON.parse(metadataString);
    } catch (parseError) {
      console.error(`❌ Invalid JSON in metadata file: ${fileKey}`, parseError);
      return false;
    }
    
    // Validate required fields before making changes
    if (!metadata.id || typeof metadata.id !== 'string') {
      console.error(`❌ Invalid metadata file: ${fileKey} - missing or invalid id field`);
      return false;
    }
    
    let needsUpdate = false;
    
    // Check and fix audioUrl for all possible incorrect domains
    if (metadata.audioUrl && typeof metadata.audioUrl === 'string') {
      const originalAudioUrl = metadata.audioUrl;
      
      for (const incorrectDomain of INCORRECT_DOMAINS) {
        if (metadata.audioUrl.includes(incorrectDomain)) {
          metadata.audioUrl = metadata.audioUrl.replace(incorrectDomain, CORRECT_DOMAIN);
          needsUpdate = true;
          console.log(`🔧 Fixing audioUrl in ${fileKey}`);
          console.log(`   From: ${originalAudioUrl}`);
          console.log(`   To:   ${metadata.audioUrl}`);
          break;
        }
      }
    } else if (!metadata.audioUrl) {
      console.warn(`⚠️ Missing audioUrl in ${fileKey}`);
    }
    
    // Check and fix coverUrl for all possible incorrect domains
    if (metadata.coverUrl && typeof metadata.coverUrl === 'string') {
      const originalCoverUrl = metadata.coverUrl;
      
      for (const incorrectDomain of INCORRECT_DOMAINS) {
        if (metadata.coverUrl.includes(incorrectDomain)) {
          metadata.coverUrl = metadata.coverUrl.replace(incorrectDomain, CORRECT_DOMAIN);
          needsUpdate = true;
          console.log(`🔧 Fixing coverUrl in ${fileKey}`);
          console.log(`   From: ${originalCoverUrl}`);
          console.log(`   To:   ${metadata.coverUrl}`);
          break;
        }
      }
    } else if (!metadata.coverUrl) {
      console.warn(`⚠️ Missing coverUrl in ${fileKey}`);
    }
    
    // Update the file if changes were made
    if (needsUpdate) {
      // Validate URLs before uploading
      if (metadata.audioUrl && !metadata.audioUrl.startsWith(CORRECT_DOMAIN)) {
        console.error(`❌ Validation failed: Fixed audioUrl still doesn't use correct domain: ${metadata.audioUrl}`);
        return false;
      }
      
      if (metadata.coverUrl && !metadata.coverUrl.startsWith(CORRECT_DOMAIN)) {
        console.error(`❌ Validation failed: Fixed coverUrl still doesn't use correct domain: ${metadata.coverUrl}`);
        return false;
      }
      
      try {
        await uploadJsonToR2(metadata, fileKey);
        console.log(`✅ Updated metadata file: ${fileKey}`);
        return true;
      } catch (uploadError) {
        console.error(`❌ Failed to upload updated metadata: ${fileKey}`, uploadError);
        return false;
      }
    } else {
      console.log(`✓ No updates needed for: ${fileKey}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error repairing metadata file ${fileKey}:`, error);
    return false;
  }
}

/**
 * Repair all metadata files in R2 storage to use the correct domain
 */
export async function repairMetadataUrls(): Promise<{ total: number; updated: number; failed: number; skipped: number }> {
  try {
    console.log('🔧 Starting metadata URL repair...');
    console.log(`🔄 Replacing incorrect domains with correct domain "${CORRECT_DOMAIN}"`);
    console.log('Checking for the following incorrect domains:');
    INCORRECT_DOMAINS.forEach(domain => console.log(`- ${domain}`));
    
    // Get all metadata files
    const metadataFiles = await listMetadataFiles();
    
    if (metadataFiles.length === 0) {
      console.warn('⚠️ No metadata files found to repair');
      return {
        total: 0,
        updated: 0,
        failed: 0,
        skipped: 0
      };
    }
    
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    
    // Process each file
    for (const fileKey of metadataFiles) {
      try {
        const wasUpdated = await repairMetadataFile(fileKey);
        if (wasUpdated) {
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Failed to process ${fileKey}:`, error);
        failed++;
      }
    }
    
    console.log('\n📊 Metadata repair summary:');
    console.log(`Total files: ${metadataFiles.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`No changes needed: ${skipped}`);
    
    return {
      total: metadataFiles.length,
      updated,
      failed,
      skipped
    };
  } catch (error) {
    console.error('❌ Failed to repair metadata URLs:', error);
    return {
      total: 0,
      updated: 0,
      failed: 1,
      skipped: 0
    };
  }
}

// If this script is run directly from Node.js
// In ES modules, use import.meta.url instead of require.main === module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  repairMetadataUrls()
    .then(result => {
      if (result.failed === 0) {
        console.log('🎉 Repair completed successfully!');
        process.exit(0);
      } else {
        console.log(`❌ Repair completed with ${result.failed} failures.`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 