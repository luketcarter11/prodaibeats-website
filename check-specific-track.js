// Script to check if a specific track file is accessible
import fetch from 'node-fetch';

// Correct public URL from Cloudflare
const CDN_BASE_URL = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// The specific track path we know exists
const trackPath = 'tracks/track_03553012877f4406.mp3';
const trackUrl = `${CDN_BASE_URL}/${trackPath}`;

async function checkTrackAccessibility() {
  console.log('🔍 Checking accessibility of known track file:');
  console.log(`URL: ${trackUrl}`);
  
  try {
    const response = await fetch(trackUrl, { method: 'HEAD' });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? `${Math.round(contentLength / 1024)} KB` : 'Unknown size';
      
      console.log('✅ SUCCESS! Track is accessible');
      console.log(`Content-Type: ${contentType}`);
      console.log(`Size: ${size}`);
      
      console.log('\n👉 This confirms the URL format is correct and public access is working.');
      console.log('The issue was indeed the typo in the URL in your code, which has been fixed.');
      return true;
    } else {
      console.log(`❌ ERROR: Track is NOT accessible (Status: ${response.status})`);
      console.log('\n👉 This suggests there might still be issues with:');
      console.log('1. Public access settings in Cloudflare R2');
      console.log('2. The file path may be different than expected');
      
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

// Run the check
checkTrackAccessibility(); 