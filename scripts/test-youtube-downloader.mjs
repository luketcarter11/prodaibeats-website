import { YouTubeDownloader } from '../src/lib/YouTubeDownloader.js';

async function testYouTubeDownloader() {
    console.log('Starting YouTubeDownloader test...');
    
    try {
        console.log('Attempting to download track...');
        const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Never Gonna Give You Up
        const result = await YouTubeDownloader.downloadTrack(testUrl, 'video', 'test');
        
        if (result.success) {
            console.log('Download successful!');
            console.log('Track ID:', result.trackId);
            console.log('YouTube ID:', result.youtubeId);
            console.log('Track Data:', result.trackData);
        } else {
            console.error('Download failed:', result.message);
        }
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

// Run the test
testYouTubeDownloader().catch(console.error); 