#!/usr/bin/env node

/**
 * Test script to diagnose track loading issues
 * This script:
 * 1. Tests direct connection to R2
 * 2. Attempts to load tracks/list.json
 * 3. Checks metadata for a sample track
 */

// Use dynamic imports since we're in ESM mode but need to access TypeScript files
async function main() {
  try {
    console.log('🔍 Track Loading Diagnostic Tool');
    console.log('===============================');
    
    // Dynamically import the modules we need
    console.log('Importing modules...');
    const { hasR2Credentials, r2Client, R2_BUCKET_NAME } = await import('../src/lib/r2Config.js');
    const { GetObjectCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
    // 1. Check R2 credentials
    console.log('\n📋 R2 Credentials Check:');
    const r2Enabled = await hasR2Credentials();
    
    if (!r2Enabled) {
      console.error('❌ R2 credentials are not configured correctly!');
      console.log('Please check your .env file for R2_* environment variables.');
      return;
    }
    
    console.log('✅ R2 credentials verified successfully');
    
    // 2. Check if tracks/list.json exists
    console.log('\n📋 Checking for tracks/list.json:');
    try {
      const getListCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: 'tracks/list.json',
      });
      
      const response = await r2Client.send(getListCommand);
      const jsonString = await response.Body?.transformToString();
      
      if (!jsonString) {
        console.error('❌ tracks/list.json exists but is empty!');
        return;
      }
      
      // Try to parse the list
      let tracksList;
      try {
        tracksList = JSON.parse(jsonString);
        console.log(`✅ tracks/list.json found and parsed successfully`);
        console.log(`📊 Contains ${tracksList.length} track IDs`);
        
        // Show first few tracks
        if (tracksList.length > 0) {
          console.log('\nSample track IDs:');
          tracksList.slice(0, 5).forEach(id => console.log(`- ${id}`));
        }
      } catch (parseError) {
        console.error('❌ Failed to parse tracks/list.json:', parseError);
        console.log('Raw content:', jsonString);
        return;
      }
      
      // 3. Check metadata for a sample track
      if (tracksList && tracksList.length > 0) {
        const sampleTrackId = tracksList[0];
        console.log(`\n📋 Checking metadata for sample track: ${sampleTrackId}`);
        
        try {
          const getMetadataCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: `metadata/${sampleTrackId}.json`,
          });
          
          const metadataResponse = await r2Client.send(getMetadataCommand);
          const metadataString = await metadataResponse.Body?.transformToString();
          
          if (!metadataString) {
            console.error(`❌ Metadata exists for ${sampleTrackId} but is empty!`);
          } else {
            // Try to parse metadata
            try {
              const metadata = JSON.parse(metadataString);
              console.log('✅ Metadata parsed successfully:');
              console.log(metadata);
            } catch (metadataParseError) {
              console.error('❌ Failed to parse metadata:', metadataParseError);
              console.log('Raw metadata:', metadataString);
            }
          }
        } catch (metadataError) {
          console.error(`❌ Failed to fetch metadata for ${sampleTrackId}:`, metadataError);
        }
      }
      
      // 4. Test listing tracks directly
      console.log('\n📋 Listing tracks directly from R2:');
      const listTracksCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'tracks/',
        MaxKeys: 10,
      });
      
      const tracksResponse = await r2Client.send(listTracksCommand);
      
      if (tracksResponse.Contents && tracksResponse.Contents.length > 0) {
        console.log(`✅ Found ${tracksResponse.Contents.length} items with prefix 'tracks/'`);
        console.log('\nSample tracks:');
        tracksResponse.Contents.slice(0, 5).forEach(item => {
          console.log(`- ${item.Key} (${item.Size} bytes)`);
        });
      } else {
        console.error('❌ No tracks found in R2 with prefix "tracks/"!');
      }
      
    } catch (listError) {
      console.error('❌ Failed to fetch tracks/list.json:', listError);
    }
    
  } catch (error) {
    console.error('❌ Error running diagnostics:', error);
  }
}

main(); 