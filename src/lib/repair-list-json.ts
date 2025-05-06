/**
 * Script to repair the corrupted tracks/list.json in R2 storage
 * This fixes issue where the file contains a corrupted array structure.
 */
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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
 * Extract valid track IDs from the file paths - only including IDs that start with 'track_'
 */
function extractTrackIds(filePaths: string[]): string[] {
  console.log('🔍 Extracting track IDs from file paths...');
  
  const trackIds = filePaths
    .map(path => {
      // Extract just the filename without the path and extension
      const filename = path.split('/').pop()?.replace('.mp3', '');
      return filename || '';
    })
    // Only keep valid track IDs that start with 'track_'
    .filter(id => id.startsWith('track_'));
  
  console.log(`✅ Extracted ${trackIds.length} valid track IDs starting with 'track_'`);
  
  // Log any invalid IDs that were filtered out
  const totalPaths = filePaths.length;
  if (trackIds.length < totalPaths) {
    console.warn(`⚠️ Filtered out ${totalPaths - trackIds.length} invalid track IDs that didn't start with 'track_'`);
  }
  
  return trackIds;
}

/**
 * Strictly validate the list to ensure it only contains valid track IDs
 * This provides additional safety to prevent corruption
 */
function strictValidateTrackList(list: any): boolean {
  // First check if it's an array
  if (!Array.isArray(list)) {
    console.error('❌ CRITICAL ERROR: list is not an array!', typeof list);
    return false;
  }
  
  // Check if all entries are strings starting with 'track_'
  const allValid = list.every(id => typeof id === 'string' && id.startsWith('track_'));
  
  if (!allValid) {
    console.error('❌ CRITICAL ERROR: list contains invalid entries!');
    const invalidEntries = list.filter(id => !(typeof id === 'string' && id.startsWith('track_')));
    console.error(`Found ${invalidEntries.length} invalid entries. Examples:`, invalidEntries.slice(0, 5));
    return false;
  }
  
  // Check for duplicate IDs
  const uniqueIds = new Set(list);
  if (uniqueIds.size !== list.length) {
    console.warn(`⚠️ Warning: list contains ${list.length - uniqueIds.size} duplicate IDs, will be deduplicated`);
  }
  
  return true;
}

/**
 * Validate the list to ensure it only contains valid track IDs
 */
function validateTrackList(list: any): boolean {
  // Check if it's an array
  if (!Array.isArray(list)) {
    console.error('❌ Invalid format: Not an array');
    return false;
  }
  
  // Check if all entries are strings starting with 'track_'
  const isValid = list.every(id => typeof id === 'string' && id.startsWith('track_'));
  
  if (!isValid) {
    console.error('❌ Invalid format: Not all entries are strings starting with "track_"');
    
    // Log the invalid entries
    const invalidEntries = list.filter(id => !(typeof id === 'string' && id.startsWith('track_')));
    console.error(`❌ Found ${invalidEntries.length} invalid entries:`, invalidEntries.slice(0, 10));
    if (invalidEntries.length > 10) {
      console.error('❌ (showing only first 10 invalid entries)');
    }
  }
  
  return isValid;
}

/**
 * Check the current state of tracks/list.json to compare with our fixed version
 */
async function checkCurrentList(): Promise<{current: any; isValid: boolean}> {
  try {
    console.log('🔍 Checking current state of tracks/list.json...');
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: 'tracks/list.json',
    });
    
    try {
      const response = await r2Client.send(command);
      const jsonString = await response.Body?.transformToString();
      
      if (!jsonString) {
        console.warn('⚠️ Empty tracks/list.json file');
        return { current: [], isValid: false };
      }
      
      // Try to parse the JSON
      try {
        const data = JSON.parse(jsonString);
        const isValid = validateTrackList(data);
        
        if (isValid) {
          console.log(`✅ Current tracks/list.json is valid with ${data.length} track IDs`);
        } else {
          console.warn('⚠️ Current tracks/list.json is invalid');
        }
        
        return { current: data, isValid };
      } catch (parseError) {
        console.error('❌ Failed to parse tracks/list.json:', parseError);
        
        // Log a sample of the corrupted JSON
        console.error('❌ Sample of corrupted JSON:', jsonString.substring(0, 200));
        return { current: [], isValid: false };
      }
    } catch (error) {
      console.warn('⚠️ No existing tracks/list.json file found');
      return { current: [], isValid: false };
    }
  } catch (error) {
    console.error('❌ Error checking current tracks/list.json:', error);
    return { current: [], isValid: false };
  }
}

/**
 * Repair the tracks/list.json file by gathering all track files,
 * extracting their IDs, and uploading a fixed JSON array
 */
export async function repairTracksList(): Promise<boolean> {
  try {
    console.log('🔧 Starting tracks/list.json repair...');
    
    // Check current list.json state
    const { current, isValid: currentIsValid } = await checkCurrentList();
    
    // Get all track files
    const trackFiles = await listTrackFiles();
    
    // Extract valid track IDs (only those starting with 'track_')
    const trackIds = extractTrackIds(trackFiles);
    
    // Check if we found any valid tracks
    if (trackIds.length === 0) {
      console.error('❌ No valid track IDs found! Cannot create an empty list.');
      return false;
    }
    
    // Validate our new list
    if (!validateTrackList(trackIds)) {
      throw new Error('Failed to generate a valid track list');
    }
    
    // Create new valid JSON array
    console.log('📝 Creating valid JSON tracks list');
    
    // Sort track IDs for consistency
    trackIds.sort();
    
    // Deduplicate IDs just to be sure
    const uniqueTrackIds = [...new Set(trackIds)];
    if (uniqueTrackIds.length !== trackIds.length) {
      console.log(`ℹ️ Removed ${trackIds.length - uniqueTrackIds.length} duplicate IDs`);
    }
    
    // ✅ CRITICAL: Add strict validation before uploading
    if (!Array.isArray(uniqueTrackIds) || uniqueTrackIds.some(id => typeof id !== 'string' || !id.startsWith('track_'))) {
      throw new Error('Invalid list.json content – must be array of track_<id> strings only.');
    }
    
    // One final check - log the type of the list
    console.log(`🔍 Final validation - data type is: ${typeof uniqueTrackIds} (should be 'object' for array)`);
    console.log(`🔍 Is array: ${Array.isArray(uniqueTrackIds)}`);
    console.log(`🔍 First few items:`, uniqueTrackIds.slice(0, 3));
    
    // Upload the fixed array to R2
    console.log(`📤 Uploading repaired tracks/list.json with ${uniqueTrackIds.length} valid track IDs`);
    
    // ✅ DIRECT UPLOAD: Pass the array directly to uploadJsonToR2
    // DO NOT stringify the array - uploadJsonToR2 handles that internally
    await uploadJsonToR2(uniqueTrackIds, 'tracks/list.json');
    
    console.log('✅ Successfully repaired tracks/list.json in R2');
    
    // Log changes compared to the previous version
    if (currentIsValid && Array.isArray(current)) {
      const added = uniqueTrackIds.filter(id => !current.includes(id));
      const removed = current.filter(id => !uniqueTrackIds.includes(id));
      
      if (added.length > 0) {
        console.log(`✅ Added ${added.length} new track IDs to the list`);
      }
      
      if (removed.length > 0) {
        console.log(`✅ Removed ${removed.length} invalid track IDs from the list`);
      }
    }
    
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