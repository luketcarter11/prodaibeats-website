import { NextRequest, NextResponse } from 'next/server';
import { getTracksData } from '@/lib/data';

// Environment-based configuration
const usePublicFallback = process.env.NODE_ENV !== 'production';
const storageBaseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://cdn.prodaibeats.com';

// Mark the route as dynamic to ensure it doesn't get cached
export const dynamic = 'force-dynamic';

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

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('❌ Error loading tracks in API route:', error);
    return NextResponse.json({ error: 'Failed to load tracks' }, { status: 500 });
  }
} 