// Script to check accessibility of audio files in Cloudflare R2
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';

// Setup ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Configure bucket and CDN
const R2_BUCKET = process.env.R2_BUCKET || 'prodai-beats-storage';
const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f47laaa2labb935e98d.r2.dev';

// Get R2 public URL
const getR2PublicUrl = (key) => {
  return `${CDN_BASE_URL}/${key}`;
};

// Function to check if tracks list exists
async function checkTracksList() {
  try {
    console.log('🔍 Checking if tracks/list.json exists in R2...');
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: 'tracks/list.json',
    });
    
    const response = await r2Client.send(command);
    const jsonString = await response.Body.transformToString();
    
    // Parse the JSON string
    let trackIds;
    try {
      trackIds = JSON.parse(jsonString);
      console.log('✅ Successfully parsed JSON data');
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      return [];
    }
    
    // Check if data is an array
    if (!Array.isArray(trackIds)) {
      console.error('❌ Data is not an array:', trackIds);
      return [];
    }
    
    console.log(`📋 Found ${trackIds.length} track IDs in list.json`);
    return trackIds;
    
  } catch (error) {
    console.error('❌ Error checking tracks/list.json:', error);
    return [];
  }
}

// Function to check accessibility of audio files
async function checkAudioUrls(trackIds) {
  console.log('\n🔍 Testing accessibility of audio files...');
  
  const results = {
    accessible: [],
    notAccessible: []
  };
  
  for (const trackId of trackIds) {
    // Generate the audio URL as it would be in the app
    const audioUrl = getR2PublicUrl(`tracks/${trackId}.mp3`);
    
    try {
      // Attempt to fetch the audio file headers (HEAD request)
      const response = await fetch(audioUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ Audio accessible: ${audioUrl}`);
        
        // Get content type and size
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        results.accessible.push({
          trackId,
          url: audioUrl,
          contentType,
          size: contentLength ? `${Math.round(contentLength / 1024)} KB` : 'Unknown'
        });
      } else {
        console.error(`❌ Audio NOT accessible (${response.status}): ${audioUrl}`);
        results.notAccessible.push({
          trackId,
          url: audioUrl,
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      console.error(`❌ Error fetching audio: ${audioUrl}`, error.message);
      results.notAccessible.push({
        trackId,
        url: audioUrl,
        error: error.message
      });
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log('🚀 Starting audio accessibility check...');
  console.log(`📊 Using R2 bucket: ${R2_BUCKET}`);
  console.log(`📊 Using CDN base URL: ${CDN_BASE_URL}`);
  
  // Get list of track IDs
  const trackIds = await checkTracksList();
  
  if (trackIds.length === 0) {
    console.log('❌ No track IDs found, cannot check audio files');
    return;
  }
  
  // Check audio accessibility
  const results = await checkAudioUrls(trackIds);
  
  // Output summary
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Accessible audio files: ${results.accessible.length}`);
  console.log(`❌ Inaccessible audio files: ${results.notAccessible.length}`);
  
  // Save results to a file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const outputPath = path.join(__dirname, `audio-check-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n💾 Results saved to ${outputPath}`);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 