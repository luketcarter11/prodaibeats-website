// Script to directly test audio URLs
import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// The base URL from your environment variables
const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f47laaa2labb935e98d.r2.dev';

// Sample trackIds based on what was seen in your code
const sampleTrackIds = [
  'track_0cdc7bee6ac44f96',
  'track_1713a69d8baa4bd5',
  'track_179d27384dbf4c59'
];

// Function to test audio URLs
async function testAudioUrls() {
  console.log('🔊 Testing direct access to audio URLs...');
  console.log(`📊 Using CDN base URL: ${CDN_BASE_URL}`);
  
  const results = {
    accessible: [],
    notAccessible: []
  };
  
  // Test different path formats
  const pathFormats = [
    // Format seen in the AudioPlayer component
    trackId => `tracks/${trackId}.mp3`,
    // Alternative format
    trackId => `audio/${trackId}.mp3`,
    // Another possible format
    trackId => `audio/${trackId}/audio.mp3`
  ];
  
  for (const trackId of sampleTrackIds) {
    console.log(`\n🔍 Testing access for track ID: ${trackId}`);
    
    for (const formatFn of pathFormats) {
      const path = formatFn(trackId);
      const audioUrl = `${CDN_BASE_URL}/${path}`;
      
      try {
        console.log(`🔎 Trying URL: ${audioUrl}`);
        const response = await fetch(audioUrl, { method: 'HEAD' });
        
        if (response.ok) {
          console.log(`✅ Audio accessible at: ${audioUrl}`);
          
          // Get content type and size
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          
          results.accessible.push({
            trackId,
            url: audioUrl,
            path,
            contentType,
            size: contentLength ? `${Math.round(contentLength / 1024)} KB` : 'Unknown'
          });
        } else {
          console.error(`❌ Audio NOT accessible (${response.status}): ${audioUrl}`);
          results.notAccessible.push({
            trackId,
            url: audioUrl,
            path,
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        console.error(`❌ Error fetching audio: ${audioUrl}`, error.message);
        results.notAccessible.push({
          trackId,
          url: audioUrl,
          path,
          error: error.message
        });
      }
    }
  }
  
  // Output summary
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Accessible audio files: ${results.accessible.length}`);
  console.log(`❌ Inaccessible audio files: ${results.notAccessible.length}`);
  
  // Show detailed accessible results
  if (results.accessible.length > 0) {
    console.log('\n✅ Accessible files:');
    results.accessible.forEach(item => {
      console.log(`  - ${item.url} (${item.contentType}, ${item.size})`);
    });
  }
  
  return results;
}

// Run the test
testAudioUrls().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 