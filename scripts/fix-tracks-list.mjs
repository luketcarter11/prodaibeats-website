import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Create R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc52388f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function fixTracksList() {
  try {
    console.log('🔍 Fixing tracks/list.json in R2...');
    
    // List all objects in the metadata directory
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Prefix: 'metadata/',
    });
    
    const response = await r2Client.send(listCommand);
    
    if (!response.Contents) {
      console.error('❌ No metadata files found in R2');
      return;
    }
    
    // Extract track IDs from metadata filenames
    const trackIds = response.Contents
      .map(obj => obj.Key)
      .filter(key => key && key.endsWith('.json'))
      .map(key => key.replace('metadata/', '').replace('.json', ''))
      .filter(id => id.length > 0);
    
    console.log(`📋 Found ${trackIds.length} track IDs from metadata files:`, trackIds);
    
    // Create valid JSON array - using plain string instead of Buffer
    const jsonString = JSON.stringify(trackIds, null, 2);
    console.log('📝 Generated JSON string:', jsonString.substring(0, 100) + '...');
    
    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Key: 'tracks/list.json',
      Body: jsonString,
      ContentType: 'application/json',
    });
    
    await r2Client.send(putCommand);
    console.log('✅ Successfully fixed tracks/list.json');
    
    // Verify the upload
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Key: 'tracks/list.json',
    });
    
    const verifyResponse = await r2Client.send(getCommand);
    const verifyString = await verifyResponse.Body?.transformToString();
    const verifyData = JSON.parse(verifyString || '[]');
    
    console.log('✅ Verification successful. Current list.json contents:', verifyData);
    
  } catch (error) {
    console.error('❌ Error fixing tracks/list.json:', error);
  }
}

// Run the script
fixTracksList(); 