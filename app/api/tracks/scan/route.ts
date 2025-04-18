import { NextResponse } from 'next/server';
import { scanLocalTracks, updateTracksData, ensureDefaultCover } from '@/lib/scanTracks';

export async function GET() {
  try {
    // Ensure we have a default cover image
    ensureDefaultCover();
    
    // Scan tracks directory and get all tracks
    const tracks = await scanLocalTracks();
    
    // Update data.ts file with these tracks
    const success = await updateTracksData(tracks);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Successfully scanned and updated ${tracks.length} tracks`,
        tracksCount: tracks.length,
        tracks: tracks.map(t => ({ id: t.id, title: t.title, artist: t.artist }))
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update tracks data file'
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Error scanning tracks:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: `Error scanning tracks: ${error.message}` 
    }, { status: 500 });
  }
} 