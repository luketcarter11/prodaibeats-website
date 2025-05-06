/**
 * Command-line script to update tracks/list.json from the MP3 files in the tracks/ folder
 * This is a safe wrapper around repair-list-json.ts that can be run after every track upload
 */
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, hasR2Credentials } from './src/lib/r2Config';
import { repairTracksList } from './src/lib/repair-list-json';

console.log('🔄 Update Tracks List from R2 Files');
console.log('=================================');

/**
 * Count the number of valid track files in the R2 bucket
 */
async function countTrackFiles(): Promise<number> {
  try {
    console.log('🔍 Counting MP3 files in tracks/ prefix...');
    
    // Initialize a counter for track files
    let trackCount = 0;
    
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
        const mp3Count = response.Contents.filter(item => 
          item.Key && 
          item.Key.endsWith('.mp3') && 
          item.Key.includes('track_')
        ).length;
        
        trackCount += mp3Count;
      }
      
      // Check if there are more results to fetch
      if (response.IsTruncated) {
        continuationToken = response.NextContinuationToken;
      } else {
        hasMoreResults = false;
      }
    }
    
    return trackCount;
  } catch (error) {
    console.error('❌ Error counting track files:', error);
    throw error;
  }
}

/**
 * Update the tracks/list.json file by calling repairTracksList
 */
async function updateTracksList(): Promise<boolean> {
  try {
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
      
      return false;
    }
    
    // Count the track files first to determine if we should proceed
    const trackCount = await countTrackFiles();
    
    if (trackCount === 0) {
      console.warn('⚠️ No valid track files found in R2');
      console.log('⚠️ Skipped update: No valid tracks found');
      return false;
    }
    
    console.log(`📁 Found ${trackCount} valid track files in R2`);
    console.log('📝 Proceeding with tracks/list.json update...');
    
    // Call the repair function which will rebuild the list.json
    const success = await repairTracksList();
    
    if (success) {
      console.log(`✅ list.json updated with ${trackCount} tracks`);
      return true;
    } else {
      console.error('❌ Failed to update tracks/list.json');
      return false;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Update process failed: ${errorMsg}`);
    return false;
  }
}

// Run the update process
updateTracksList()
  .then(success => {
    if (success) {
      console.log('🎉 Update completed successfully!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 