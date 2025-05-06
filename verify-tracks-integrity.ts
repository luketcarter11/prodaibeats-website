/**
 * Verify and ensure tracks/list.json integrity
 * 
 * This script:
 * 1. Checks if tracks/list.json exists and is valid
 * 2. Verifies it contains only valid track IDs
 * 3. Checks if it matches actual MP3 files in the R2 bucket
 * 4. Optionally fixes any issues found
 */
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, hasR2Credentials } from './src/lib/r2Config';
import { repairTracksList } from './src/lib/repair-list-json';

// Parse command line arguments
const shouldFix = process.argv.includes('--fix');
const shouldForce = process.argv.includes('--force');
const isVerbose = process.argv.includes('--verbose');

console.log('🔍 Tracks List Integrity Verification Tool');
console.log('======================================');
console.log(`Mode: ${shouldFix ? 'Verify and Fix' : 'Verify Only'}`);

/**
 * Get the current tracks/list.json content
 */
async function getCurrentList(): Promise<{ data: string[]; isValid: boolean; errors: string[] }> {
  try {
    console.log('📋 Checking tracks/list.json...');
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: 'tracks/list.json',
    });
    
    try {
      const response = await r2Client.send(command);
      const jsonString = await response.Body?.transformToString();
      
      if (!jsonString) {
        return { 
          data: [], 
          isValid: false, 
          errors: ['Empty list.json file'] 
        };
      }
      
      // Try to parse the JSON
      try {
        const data = JSON.parse(jsonString);
        
        // Validate that it's an array of track IDs
        if (!Array.isArray(data)) {
          return { 
            data: [], 
            isValid: false, 
            errors: [`Not an array: got ${typeof data}`] 
          };
        }
        
        // Check if the array is empty
        if (data.length === 0) {
          return { 
            data: [], 
            isValid: false,
            errors: ['List is empty (which may be valid if there are no tracks)'] 
          };
        }
        
        // Check if all entries are strings starting with 'track_'
        const invalidEntries = data.filter(id => !(typeof id === 'string' && id.startsWith('track_')));
        
        if (invalidEntries.length > 0) {
          return { 
            data, 
            isValid: false,
            errors: [
              `Found ${invalidEntries.length} invalid entries (not starting with 'track_')`,
              `Example invalid entries: ${JSON.stringify(invalidEntries.slice(0, 5))}`
            ] 
          };
        }
        
        // Check for duplicate IDs
        const uniqueIds = new Set(data);
        if (uniqueIds.size !== data.length) {
          return { 
            data, 
            isValid: false,
            errors: [`Contains ${data.length - uniqueIds.size} duplicate track IDs`] 
          };
        }
        
        console.log(`✅ tracks/list.json contains ${data.length} valid track IDs`);
        return { data, isValid: true, errors: [] };
      } catch (parseError) {
        return { 
          data: [], 
          isValid: false,
          errors: [`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`] 
        };
      }
    } catch (error) {
      return { 
        data: [], 
        isValid: false,
        errors: ['tracks/list.json does not exist or cannot be accessed'] 
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { 
      data: [], 
      isValid: false,
      errors: [`Error checking tracks/list.json: ${errorMsg}`] 
    };
  }
}

/**
 * List all track MP3 files in the R2 bucket
 */
async function listActualTracks(): Promise<string[]> {
  try {
    console.log('📋 Listing actual MP3 files in R2...');
    
    const trackFiles: string[] = [];
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'tracks/',
      MaxKeys: 1000,
    });
    
    let hasMoreResults = true;
    let continuationToken: string | undefined = undefined;
    
    while (hasMoreResults) {
      if (continuationToken) {
        command.input.ContinuationToken = continuationToken;
      }
      
      const response = await r2Client.send(command);
      
      if (response.Contents) {
        const mp3Files = response.Contents
          .filter(item => item.Key && item.Key.endsWith('.mp3'))
          .map(item => item.Key as string);
        
        trackFiles.push(...mp3Files);
        
        if (isVerbose) {
          console.log(`Found ${mp3Files.length} MP3 files in this batch.`);
        }
      }
      
      if (response.IsTruncated) {
        continuationToken = response.NextContinuationToken;
      } else {
        hasMoreResults = false;
      }
    }
    
    console.log(`✅ Found ${trackFiles.length} MP3 files in R2`);
    return trackFiles;
  } catch (error) {
    console.error('❌ Error listing tracks:', error);
    return [];
  }
}

/**
 * Extract track IDs from file paths
 */
function extractTrackIds(filePaths: string[]): string[] {
  return filePaths
    .map(path => {
      // Extract just the filename without the path and extension
      const filename = path.split('/').pop()?.replace('.mp3', '');
      return filename || '';
    })
    .filter(id => id.startsWith('track_'));
}

/**
 * Compare the tracks/list.json with actual MP3 files
 */
async function compareTracksWithList(currentList: string[], actualTrackFiles: string[]): Promise<{
  missingFromList: string[];
  missingFiles: string[];
  isMatching: boolean;
}> {
  console.log('🔍 Comparing tracks/list.json with actual MP3 files...');
  
  // Extract track IDs from file paths
  const actualTrackIds = extractTrackIds(actualTrackFiles);
  
  // Find tracks in files but missing from list
  const missingFromList = actualTrackIds.filter(id => !currentList.includes(id));
  
  // Find tracks in list but missing from files
  const missingFiles = currentList.filter(id => !actualTrackIds.includes(id));
  
  // Check if list matches actual files
  const isMatching = missingFromList.length === 0 && missingFiles.length === 0;
  
  console.log(`${isMatching ? '✅' : '❌'} Comparison results:`);
  console.log(`- Tracks in R2 but missing from list: ${missingFromList.length}`);
  console.log(`- Tracks in list but missing files: ${missingFiles.length}`);
  
  if (isVerbose && missingFromList.length > 0) {
    console.log('\nTracks missing from list:');
    missingFromList.slice(0, 10).forEach(id => console.log(`- ${id}`));
    if (missingFromList.length > 10) {
      console.log(`  (and ${missingFromList.length - 10} more...)`);
    }
  }
  
  if (isVerbose && missingFiles.length > 0) {
    console.log('\nTracks in list but missing files:');
    missingFiles.slice(0, 10).forEach(id => console.log(`- ${id}`));
    if (missingFiles.length > 10) {
      console.log(`  (and ${missingFiles.length - 10} more...)`);
    }
  }
  
  return { missingFromList, missingFiles, isMatching };
}

/**
 * Run the verification process
 */
async function verifyTracksIntegrity(): Promise<boolean> {
  try {
    // First verify R2 credentials
    const credentialsOk = await hasR2Credentials();
    
    if (!credentialsOk) {
      console.error('❌ R2 credentials are not properly configured');
      console.log('\n💡 Set the following environment variables:');
      console.log('- R2_ACCESS_KEY_ID');
      console.log('- R2_SECRET_ACCESS_KEY');
      console.log('- R2_ENDPOINT');
      console.log('- R2_BUCKET');
      console.log('- NEXT_PUBLIC_STORAGE_BASE_URL');
      return false;
    }
    
    // 1. Check the current list.json
    const { data: currentList, isValid, errors } = await getCurrentList();
    
    if (!isValid) {
      console.error('❌ tracks/list.json is INVALID:');
      errors.forEach(error => console.error(`- ${error}`));
      
      if (shouldFix || shouldForce) {
        console.log('\n🔧 Attempting to repair tracks/list.json...');
        await repairTracksList();
        return true;
      } else {
        console.log('\n💡 Run with --fix to attempt repair');
        return false;
      }
    }
    
    // 2. Get actual track files from R2
    const actualTrackFiles = await listActualTracks();
    
    if (actualTrackFiles.length === 0) {
      console.warn('⚠️ No MP3 files found in R2');
      
      if (currentList.length > 0) {
        console.error('❌ List contains tracks but no actual MP3 files exist!');
        
        if (shouldFix) {
          console.log('\n🔧 Rebuilding empty tracks/list.json...');
          await repairTracksList();
        } else {
          console.log('\n💡 Run with --fix to rebuild empty list');
        }
        return false;
      } else {
        console.log('✅ Empty list matches empty tracks folder');
        return true;
      }
    }
    
    // 3. Compare list with actual files
    const { missingFromList, missingFiles, isMatching } = await compareTracksWithList(
      currentList, 
      actualTrackFiles
    );
    
    // 4. Fix if needed
    if (!isMatching) {
      if (shouldFix) {
        console.log('\n🔧 Repairing tracks/list.json...');
        await repairTracksList();
        console.log('✅ Repair completed');
        return true;
      } else {
        console.log('\n💡 Run with --fix to update list');
        return false;
      }
    }
    
    console.log('\n✅ Tracks list is valid and complete!');
    console.log(`Verified ${currentList.length} tracks match actual files`);
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Run the verification
verifyTracksIntegrity()
  .then(success => {
    console.log('\n📋 FINAL RESULT:');
    console.log('-------------');
    
    if (success) {
      console.log('✅ Verification passed or repairs were successful');
      process.exit(0);
    } else {
      console.log('❌ Verification failed - issues remain with tracks/list.json');
      console.log('Run with --fix to automatically repair the list');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }); 