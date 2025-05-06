/**
 * Script to repair the corrupted tracks/list.json in R2 storage
 * This fixes Issue #1 where the file contains a corrupted array structure.
 */
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from './r2Config';
import { uploadJsonToR2 } from './r2Uploader';
import { fileURLToPath } from 'url';

/**
 * List all .mp3 files in the tracks/ prefix of the R2 bucket
 */
async function listTrackFiles(): Promise<string[]> {
  try {
    console.log('🔍 Listing all mp3 files in tracks/ prefix...');
    
    // Initialize an array to hold all file keys
    const trackFiles: string[] = [];
    
    // Setup the list command with the tracks/ prefix
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'tracks/',
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
        const mp3Files = response.Contents
          .filter(item => item.Key && item.Key.endsWith('.mp3'))
          .map(item => item.Key as string);
        
        trackFiles.push(...mp3Files);
        console.log(`📁 Found ${mp3Files.length} mp3 files in this batch.`);
      }
      
      // Check if there are more results to fetch
      if (response.IsTruncated) {
        continuationToken = response.NextContinuationToken;
      } else {
        hasMoreResults = false;
      }
    }
    
    console.log(`✅ Total mp3 files found: ${trackFiles.length}`);
    return trackFiles;
  } catch (error) {
    console.error('❌ Error listing track files:', error);
    throw error;
  }
}

/**
 * Extract track IDs from the file paths
 */
function extractTrackIds(filePaths: string[]): string[] {
  console.log('🔍 Extracting track IDs from file paths...');
  
  const trackIds = filePaths.map(path => {
    // Extract just the filename without the path and extension
    const filename = path.split('/').pop()?.replace('.mp3', '');
    return filename || '';
  }).filter(id => id.startsWith('track_') || id.length > 0);
  
  console.log(`✅ Extracted ${trackIds.length} valid track IDs`);
  return trackIds;
}

/**
 * Repair the tracks/list.json file by gathering all track files,
 * extracting their IDs, and uploading a fixed JSON array
 */
export async function repairTracksList(): Promise<boolean> {
  try {
    console.log('🔧 Starting tracks/list.json repair...');
    
    // Get all track files
    const trackFiles = await listTrackFiles();
    
    // Extract track IDs
    const trackIds = extractTrackIds(trackFiles);
    
    // Create new valid JSON array
    console.log('📝 Creating valid JSON tracks list');
    
    // Sort track IDs for consistency
    trackIds.sort();
    
    // Upload the fixed array to R2
    console.log(`📤 Uploading repaired tracks/list.json with ${trackIds.length} track IDs`);
    await uploadJsonToR2(trackIds, 'tracks/list.json');
    
    console.log('✅ Successfully repaired tracks/list.json in R2');
    return true;
  } catch (error) {
    console.error('❌ Failed to repair tracks/list.json:', error);
    return false;
  }
}

// If this script is run directly from Node.js
// In ES modules, use import.meta.url instead of require.main === module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  repairTracksList()
    .then(success => {
      if (success) {
        console.log('🎉 Repair completed successfully!');
        process.exit(0);
      } else {
        console.log('❌ Repair failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 