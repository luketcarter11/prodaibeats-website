/**
 * Test file for CDN URL Fix
 */

// Deliberately using the wrong URL to test the fix script
const INCORRECT_URL = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

function testAudioUrls() {
  const audioUrl = `${INCORRECT_URL}/tracks/track_12345.mp3`;
  const coverUrl = `${INCORRECT_URL}/covers/track_12345.jpg`;
  
  console.log('Audio URL:', audioUrl);
  console.log('Cover URL:', coverUrl);
  
  return {
    audio: audioUrl,
    cover: coverUrl
  };
}

export default testAudioUrls; 