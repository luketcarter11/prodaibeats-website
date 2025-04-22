import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc52388f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function checkTracksList() {
  try {
    console.log('🔍 Checking if tracks/list.json exists in R2...');
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Key: 'tracks/list.json',
    });
    
    const response = await r2Client.send(command);
    const jsonString = await response.Body.transformToString();
    
    // Log the raw JSON string for debugging
    console.log('Raw JSON string:', jsonString);
    
    // Parse the JSON string
    let data;
    try {
      data = JSON.parse(jsonString);
      console.log('✅ Successfully parsed JSON data');
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      return;
    }
    
    // Check if data is an array
    if (!Array.isArray(data)) {
      console.error('❌ Data is not an array:', data);
      return;
    }
    
    console.log(`📋 Found ${data.length} track IDs:`, data);
    
    // Check if metadata files exist for each track
    console.log('\n🔍 Checking metadata files for each track...');
    
    for (const trackId of data) {
      try {
        const metadataCommand = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
          Key: `metadata/${trackId}.json`,
        });
        
        const metadataResponse = await r2Client.send(metadataCommand);
        const metadataString = await metadataResponse.Body.transformToString();
        const metadata = JSON.parse(metadataString);
        
        console.log(`✅ Metadata exists for track: ${trackId}`);
        console.log(`   Title: ${metadata.title}`);
        console.log(`   Artist: ${metadata.artist}`);
      } catch (error) {
        console.error(`❌ No metadata found for track: ${trackId}`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking tracks/list.json:', error);
  }
}

checkTracksList(); 