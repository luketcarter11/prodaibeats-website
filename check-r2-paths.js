// Simple script to check different possible paths in the R2 bucket without using API credentials
import fetch from 'node-fetch';

// Correct public URL
const CDN_BASE_URL = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Common directory names for audio files
const possibleDirectories = [
  'tracks',
  'audio',
  'mp3',
  'music',
  'sounds',
  'sample',
  'samples',
  '' // Root directory
];

// Sample filename patterns (add more if needed)
const filePatterns = [
  // Track samples
  { name: 'Sample track: warm-mountain', path: 'warm-mountain-140-bpm-uk-drill-type-beat.mp3' },
  { name: 'Sample track: summer-vibe', path: 'summer-vibe-120-bpm-pop-type-beat.mp3' },
  { name: 'Sample track: hard-trap', path: 'hard-trap-808-beat-140-bpm.mp3' },
  
  // Test files
  { name: 'Test file', path: 'test.mp3' },
  { name: 'Another test file', path: 'audio-test.mp3' },
  
  // Common filenames
  { name: 'Common filename: audio', path: 'audio.mp3' },
  { name: 'Common filename: track', path: 'track.mp3' },
  { name: 'Common filename: music', path: 'music.mp3' },
  { name: 'Common filename: sample', path: 'sample.mp3' },
  
  // Sample URLs with directories
  { name: 'Sample with directory structure', path: 'audio/sample.mp3' },
  { name: 'Another with directory structure', path: 'tracks/audio.mp3' },
];

async function checkUrl(url) {
  try {
    console.log(`🔎 Testing URL: ${url}`);
    const response = await fetch(url, { method: 'HEAD' });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? `${Math.round(contentLength / 1024)} KB` : 'Unknown size';
      
      console.log(`✅ ACCESSIBLE: ${url}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Size: ${size}`);
      return true;
    } else {
      console.log(`❌ NOT ACCESSIBLE (${response.status}): ${url}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${url} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 R2 Path Checker');
  console.log('=================');
  console.log(`Using CDN URL: ${CDN_BASE_URL}`);
  console.log('');
  
  // First, check if the bucket itself is accessible
  await checkUrl(CDN_BASE_URL);
  
  console.log('\n🔍 Checking for common directories:');
  
  let accessibleFiles = [];
  
  // Check all combinations of directories and file patterns
  for (const dir of possibleDirectories) {
    for (const pattern of filePatterns) {
      const fullPath = dir ? `${dir}/${pattern.path}` : pattern.path;
      const url = `${CDN_BASE_URL}/${fullPath}`;
      
      console.log(`\n${pattern.name} in ${dir || 'root'} directory:`);
      const isAccessible = await checkUrl(url);
      
      if (isAccessible) {
        accessibleFiles.push({ path: fullPath, url });
      }
    }
  }
  
  // Print summary
  console.log('\n📊 SUMMARY:');
  console.log(`Total accessible files found: ${accessibleFiles.length}`);
  
  if (accessibleFiles.length > 0) {
    console.log('\n✅ Accessible files:');
    accessibleFiles.forEach(file => {
      console.log(`- ${file.url}`);
    });
    
    console.log('\n🔧 Recommendation:');
    console.log('Update your code to use these accessible paths with the correct public URL:');
    console.log(`${CDN_BASE_URL}/{path}`);
  } else {
    console.log('\n❌ No accessible files found.');
    console.log('Possible reasons:');
    console.log('1. The bucket is empty or has no files');
    console.log('2. The files have different names than expected');
    console.log('3. Public access is not enabled for this bucket');
    console.log('4. This is a new bucket with no content yet');
    
    console.log('\n🔧 Recommendation:');
    console.log('1. Check the bucket in Cloudflare dashboard to ensure it has contents');
    console.log('2. Upload some test files directly via the Cloudflare dashboard');
    console.log('3. Verify public access is enabled');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
}); 