/**
 * Script to repair metadata files in R2 storage that contain incorrect URLs
 * This fixes Issue #3 where metadata files may still have the wrong domain in audioUrl and coverUrl
 */
import { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, CDN_BASE_URL } from './r2Config';
import { uploadJsonToR2 } from './r2Uploader';

// The incorrect domain that needs to be replaced
const INCORRECT_DOMAIN = 'https://pub-c059baad842f47laaa2labb935e98d.r2.dev';

// The correct domain to use
const CORRECT_DOMAIN = CDN_BASE_URL; // Should be https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev

/**
 * List all JSON metadata files in the metadata/ prefix of the R2 bucket
 */
async function listMetadataFiles(): Promise<string[]> {
  try {
    console.log('🔍 Listing all json files in metadata/ prefix...');
    
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
        console.log(`📁 Found ${jsonFiles.length} json files in this batch.`);
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
    const metadata = JSON.parse(metadataString);
    let needsUpdate = false;
    
    // Check and fix audioUrl
    if (metadata.audioUrl && metadata.audioUrl.includes(INCORRECT_DOMAIN)) {
      console.log(`🔧 Fixing audioUrl in ${fileKey}`);
      metadata.audioUrl = metadata.audioUrl.replace(INCORRECT_DOMAIN, CORRECT_DOMAIN);
      needsUpdate = true;
    }
    
    // Check and fix coverUrl
    if (metadata.coverUrl && metadata.coverUrl.includes(INCORRECT_DOMAIN)) {
      console.log(`🔧 Fixing coverUrl in ${fileKey}`);
      metadata.coverUrl = metadata.coverUrl.replace(INCORRECT_DOMAIN, CORRECT_DOMAIN);
      needsUpdate = true;
    }
    
    // Update the file if changes were made
    if (needsUpdate) {
      await uploadJsonToR2(metadata, fileKey);
      console.log(`✅ Updated metadata file: ${fileKey}`);
      return true;
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
export async function repairMetadataUrls(): Promise<{ total: number; updated: number; failed: number }> {
  try {
    console.log('🔧 Starting metadata URL repair...');
    console.log(`🔄 Replacing incorrect domain "${INCORRECT_DOMAIN}" with correct domain "${CORRECT_DOMAIN}"`);
    
    // Get all metadata files
    const metadataFiles = await listMetadataFiles();
    
    let updated = 0;
    let failed = 0;
    
    // Process each file
    for (const fileKey of metadataFiles) {
      try {
        const wasUpdated = await repairMetadataFile(fileKey);
        if (wasUpdated) {
          updated++;
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
    console.log(`No changes needed: ${metadataFiles.length - updated - failed}`);
    
    return {
      total: metadataFiles.length,
      updated,
      failed
    };
  } catch (error) {
    console.error('❌ Failed to repair metadata URLs:', error);
    return {
      total: 0,
      updated: 0,
      failed: 1
    };
  }
}

// If this script is run directly
if (require.main === module) {
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