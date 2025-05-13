import { NextRequest, NextResponse } from 'next/server';
import { getTracksData } from '@/lib/data';

// Environment-based configuration
const usePublicFallback = process.env.NODE_ENV !== 'production';
const storageBaseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://cdn.prodaibeats.com';

// Mark the route as dynamic to ensure it doesn't get cached
export const dynamic = 'force-dynamic';
// Set the runtime to edge for better performance
export const runtime = 'edge';

/**
 * API route for fetching all tracks from R2 storage
 */
export async function GET(request: NextRequest) {
  console.log('🌐 /api/tracks API route hit');

  try {
    const tracks = await getTracksData();
    console.log(`✅ Retrieved ${tracks.length} tracks from R2`);

    if (tracks.length === 0) {
      console.warn('⚠️ No tracks retrieved from R2. Returning empty array. Investigate upstream.');
    }

    // Add detailed logging about what we're returning
    if (tracks.length > 0) {
      // Log first track as an example
      const sampleTrack = tracks[0];
      console.log('📊 Sample track being returned to client:', {
        id: sampleTrack.id,
        title: sampleTrack.title,
        artist: sampleTrack.artist,
        audioUrl: sampleTrack.audioUrl,
        duration: sampleTrack.duration,
        hasValidAudio: !!sampleTrack.audioUrl && sampleTrack.audioUrl.includes('.mp3'),
        hasValidCover: !!sampleTrack.coverUrl && sampleTrack.coverUrl.includes('.jpg'),
      });
      
      // Count problematic tracks
      const untitledTracks = tracks.filter(t => t.title === 'Untitled Track').length;
      const unknownArtistTracks = tracks.filter(t => t.artist === 'Unknown Artist').length;
      const zeroDurationTracks = tracks.filter(t => t.duration === '0:00').length;
      
      console.log(`📊 Quality check: ${untitledTracks} untitled, ${unknownArtistTracks} unknown artist, ${zeroDurationTracks} zero duration`);
    }

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('❌ Error loading tracks in API route:', error);
    return NextResponse.json({ error: 'Failed to load tracks' }, { status: 500 });
  }
} 