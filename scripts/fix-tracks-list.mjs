import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create R2 client with direct credentials
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Helper function to check if a string is a double-stringified JSON
function isDoubleStringified(str) {
  try {
    // If it starts and ends with quotes and contains escaped quotes inside
    return str.startsWith('"') && str.endsWith('"') && str.includes('\\"');
  } catch (e) {
    return false;
  }
}

async function fixTracksList() {
  try {
    console.log('🔍 Fixing tracks/list.json in R2...');
    
    // First, check the current state of the tracks/list.json file
    try {
      const checkCommand = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: 'tracks/list.json',
      });
      
      const checkResponse = await r2Client.send(checkCommand);
      const currentContent = await checkResponse.Body?.transformToString();
      
      console.log('📄 Current tracks/list.json content type:', typeof currentContent);
      console.log('📄 Content preview:', currentContent ? currentContent.substring(0, 200) + '...' : 'Empty');
      
      if (currentContent) {
        const isDoubleJSON = isDoubleStringified(currentContent);
        console.log(`🔍 Double-stringified JSON detected: ${isDoubleJSON}`);
      }
    } catch (checkError) {
      console.warn('⚠️ Could not check current tracks/list.json:', checkError.message);
    }
    
    // List all objects in the metadata directory
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
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
    
    if (trackIds.length === 0) {
      console.error('❌ No valid track IDs found in metadata files');
      return;
    }
    
    console.log(`📋 Found ${trackIds.length} track IDs from metadata files`);
    console.log(`📋 Sample of track IDs (first 5):`, trackIds.slice(0, 5));
    
    // Create a pure JSON array string - ensuring it's not double-stringified
    const jsonString = JSON.stringify(trackIds, null, 2);
    
    // Log a preview of what we're about to write
    console.log(`📝 Generated JSON string (preview): ${jsonString.substring(0, 100)}${jsonString.length > 100 ? '...' : ''}`);
    console.log(`📝 JSON string type: ${typeof jsonString}`);
    console.log(`📝 First character: ${jsonString[0]}, Last character: ${jsonString[jsonString.length - 1]}`);
    
    // Validate the JSON can be parsed back correctly
    try {
      const parseTest = JSON.parse(jsonString);
      const isArray = Array.isArray(parseTest);
      const hasCorrectItems = isArray && parseTest.length === trackIds.length;
      console.log(`✅ JSON validation: Is array: ${isArray}, Has correct item count: ${hasCorrectItems}`);
    } catch (parseError) {
      console.error(`❌ JSON validation failed: ${parseError.message}`);
      return;
    }
    
    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: 'tracks/list.json',
      Body: jsonString,
      ContentType: 'application/json',
    });
    
    await r2Client.send(putCommand);
    console.log('✅ Successfully uploaded fixed tracks/list.json to R2');
    
    // Verify the upload
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: 'tracks/list.json',
    });
    
    const verifyResponse = await r2Client.send(getCommand);
    const verifyString = await verifyResponse.Body?.transformToString();
    
    // Verify we can parse it back correctly
    try {
      const verifyData = JSON.parse(verifyString || '[]');
      const isValidArray = Array.isArray(verifyData);
      
      console.log(`✅ Verification results: Valid JSON array: ${isValidArray}, Track count: ${verifyData.length}`);
      
      if (verifyData.length !== trackIds.length) {
        console.warn(`⚠️ Warning: Verified track count (${verifyData.length}) doesn't match original count (${trackIds.length})`);
      } else {
        console.log('✅ Track count matches expected value');
      }
      
      console.log(`✅ First few tracks in the verified list:`, verifyData.slice(0, 5));
    } catch (verifyError) {
      console.error(`❌ Verification failed: ${verifyError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing tracks/list.json:', error);
  }
}

// Run the script
fixTracksList(); 