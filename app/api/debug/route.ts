import { NextRequest, NextResponse } from 'next/server';
import { getTracksData } from '@/lib/data';
import { r2Storage } from '@/lib/r2Storage';

// Mark the route as dynamic to ensure it doesn't get cached
export const dynamic = 'force-dynamic';
// Set the runtime to edge for better performance
export const runtime = 'edge' as const;

/**
 * Debug API route for examining raw tracks data
 */
export async function GET(request: NextRequest) {
  console.log('🔍 /api/debug API route hit');

  try {
    // Get raw tracks list
    const rawTracksList = await r2Storage.load('tracks/list.json', []);
    console.log('📋 Raw tracks list:', rawTracksList);
    
    // Get processed tracks
    const tracks = await getTracksData();
    console.log(`✅ Retrieved ${tracks.length} tracks from getTracksData()`);
    
    // Get info about the first track for detailed debugging
    let firstTrackDetails = null;
    if (tracks.length > 0) {
      const firstTrack = tracks[0];
      
      // Try to get the raw metadata for the first track
      const rawMetadata = await r2Storage.load(`metadata/${firstTrack.id}.json`, null);
      
      firstTrackDetails = {
        processedTrack: firstTrack,
        rawMetadata,
        audioUrlExists: firstTrack.audioUrl ? `${firstTrack.audioUrl} (exists, check in browser)` : "No audio URL",
        rawAudioUrl: firstTrack.audioUrl,
      };
    }
    
    // Return diagnostic information
    return NextResponse.json({
      message: "Debug information about tracks",
      tracksCount: tracks.length,
      firstTrackDetails,
      rawTracksListType: typeof rawTracksList,
      rawTracksListSample: typeof rawTracksList === 'string' 
        ? (rawTracksList as string).substring(0, 200) + '...' 
        : Array.isArray(rawTracksList) 
          ? rawTracksList.slice(0, 5)
          : rawTracksList,
      tracksWithUntitledCount: tracks.filter(t => t.title === 'Untitled Track').length,
      tracksWithUnknownArtistCount: tracks.filter(t => t.artist === 'Unknown Artist').length,
      tracksWithZeroDurationCount: tracks.filter(t => t.duration === '0:00').length,
    });
  } catch (error) {
    console.error('❌ Error in debug API route:', error);
    return NextResponse.json({ error: 'Debug failed', details: String(error) }, { status: 500 });
  }
} 