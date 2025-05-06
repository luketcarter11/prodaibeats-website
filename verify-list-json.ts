/**
 * Command-line script to verify the integrity of tracks/list.json in R2 storage
 * This script checks if the file contains a valid array of track IDs
 */
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, hasR2Credentials } from './src/lib/r2Config';

console.log('🔍 R2 Tracks List Verification Tool');
console.log('=================================');

/**
 * Validate the list to ensure it only contains valid track IDs
 */
function validateTrackList(list: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if it's an array
  if (!Array.isArray(list)) {
    errors.push(`Not an array: got ${typeof list} instead`);
    return { isValid: false, errors };
  }
  
  // Check if it's empty
  if (list.length === 0) {
    errors.push('Array is empty');
    return { isValid: false, errors };
  }

  // Check if all entries are strings starting with 'track_'
  const invalidEntries = list.filter(id => !(typeof id === 'string' && id.startsWith('track_')));

  if (invalidEntries.length > 0) {
    errors.push(`Found ${invalidEntries.length} invalid entries that don't start with "track_"`);
    
    // Log some examples of invalid entries
    const examples = invalidEntries.slice(0, 5);
    examples.forEach((entry, i) => {
      errors.push(`Invalid entry ${i + 1}: ${JSON.stringify(entry)} (type: ${typeof entry})`);
    });
    
    if (invalidEntries.length > 5) {
      errors.push(`(${invalidEntries.length - 5} more invalid entries not shown)`);
    }
    
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Verify the tracks/list.json file in R2 storage
 */
async function verifyListJson(): Promise<{ success: boolean; errors: string[] }> {
  try {
    // First verify R2 credentials
    const credentialsOk = await hasR2Credentials();
    
    if (!credentialsOk) {
      return { 
        success: false, 
        errors: ['R2 credentials are not properly configured'] 
      };
    }

    console.log('🔍 Fetching tracks/list.json from R2...');
    
    // Get the tracks/list.json file
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: 'tracks/list.json',
    });
    
    try {
      const response = await r2Client.send(command);
      const body = await response.Body?.transformToString();
      
      if (!body) {
        return {
          success: false,
          errors: ['tracks/list.json exists but is empty']
        };
      }
      
      console.log('📄 Parsing JSON...');
      
      try {
        const trackList = JSON.parse(body);
        const { isValid, errors } = validateTrackList(trackList);
        
        if (isValid) {
          console.log(`✅ Validation passed: tracks/list.json contains ${trackList.length} valid track IDs`);
          return { success: true, errors: [] };
        } else {
          console.error(`❌ Validation failed: ${errors.join(', ')}`);
          return { success: false, errors };
        }
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        console.error(`❌ Failed to parse tracks/list.json: ${errorMsg}`);
        
        // Try to log a sample of the raw JSON to help diagnose the issue
        const sample = body.length > 100 ? body.substring(0, 100) + '...' : body;
        console.error(`📄 Raw JSON (sample): ${sample}`);
        
        return {
          success: false,
          errors: [`Not valid JSON: ${errorMsg}`]
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error fetching tracks/list.json: ${errorMsg}`);
      
      return {
        success: false,
        errors: [`Failed to fetch file: ${errorMsg}`]
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Verification process failed: ${errorMsg}`);
    
    return {
      success: false,
      errors: [`Process failed: ${errorMsg}`]
    };
  }
}

// Run the verification
verifyListJson()
  .then(result => {
    console.log('\n📋 VERIFICATION RESULT');
    console.log('--------------------');
    
    if (result.success) {
      console.log('✅ tracks/list.json is valid');
      process.exit(0);
    } else {
      console.log('❌ tracks/list.json is NOT valid');
      console.log('\nErrors found:');
      result.errors.forEach(error => console.log(`- ${error}`));
      
      console.log('\n💡 To fix the issues, run:');
      console.log('npm run r2:repair-list');
      
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }); 