import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

// Set to true during builds/server-side rendering
export const dynamic = 'force-dynamic';

// Hard-coded values for Edge compatibility (avoids dotenv dependency)
const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';
const R2_BUCKET_NAME = process.env.R2_BUCKET || 'prodai-beats-storage';
const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://1992471ec8cc52388f80797e15a0529.r2.cloudflarestorage.com';

// Skip R2 initialization if flag is set
const SKIP_R2_INIT = process.env.SKIP_R2_INIT === 'true';

// Interface for track metadata
interface TrackMetadata {
  title?: string;
  artist?: string;
  price?: number;
  bpm?: number;
  key?: string;
  duration?: string;
  tags?: string[];
  genre?: string;
  mood?: string;
  description?: string;
  licenseType?: 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro';
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  downloadDate?: string;
  slug?: string;
  videoId?: string;
  coverImage?: string;
}

/**
 * API route for fetching all tracks from R2 storage
 */
export async function GET(request: NextRequest) {
  console.log('🌐 /api/tracks API route hit');

  try {
    // If we're skipping R2 init, return mock data
    if (SKIP_R2_INIT) {
      console.log('⏩ SKIP_R2_INIT is true, using mock tracks data');
      return NextResponse.json([{
        id: 'mock_track_1',
        title: 'Mock Track',
        artist: 'Mock Artist',
        price: 9.99,
        bpm: 120,
        key: 'C',
        duration: '3:30',
        tags: ['Mock', 'Track'],
        licenseType: 'Non-Exclusive',
        audioUrl: `${CDN_BASE_URL}/tracks/mock_track_1.mp3`,
        coverUrl: `${CDN_BASE_URL}/covers/mock_track_1.jpg`,
        createdAt: new Date().toISOString()
      }], {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Create R2 client for Edge runtime
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    // Step 1: Get list of track IDs
    console.log('📋 Loading tracks list from R2');
    const trackIdsList = await fetchTracksList(r2Client);
    
    if (!trackIdsList || trackIdsList.length === 0) {
      console.warn('⚠️ No track IDs found in list.json');
      return NextResponse.json([], {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    console.log(`✅ Found ${trackIdsList.length} track IDs in list.json`);

    // Step 2: Fetch metadata for each track
    const tracks = await Promise.all(
      trackIdsList.map(async (trackId) => {
        try {
          // Get metadata for the track
          const metadata = await fetchTrackMetadata(r2Client, trackId);
          
          // Construct track object with URLs
          return {
            id: trackId,
            title: metadata?.title || 'Untitled Track',
            artist: metadata?.artist || 'Unknown Artist',
            price: metadata?.price || 12.99,
            bpm: metadata?.bpm || 0,
            key: metadata?.key || 'C',
            duration: metadata?.duration || '0:00',
            tags: metadata?.tags || [],
            licenseType: metadata?.licenseType || 'Non-Exclusive',
            audioUrl: `${CDN_BASE_URL}/tracks/${trackId}.mp3`,
            coverUrl: `${CDN_BASE_URL}/covers/${trackId}.jpg`,
            createdAt: metadata?.createdAt || metadata?.downloadDate || new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error loading metadata for track ${trackId}:`, error);
          // Return a placeholder track if metadata fetch fails
          return {
            id: trackId,
            title: 'Untitled Track',
            artist: 'Unknown Artist',
            price: 12.99,
            bpm: 0,
            key: 'C',
            duration: '0:00',
            tags: [],
            licenseType: 'Non-Exclusive',
            audioUrl: `${CDN_BASE_URL}/tracks/${trackId}.mp3`,
            coverUrl: `${CDN_BASE_URL}/covers/${trackId}.jpg`,
            createdAt: new Date().toISOString()
          };
        }
      })
    );

    console.log(`✅ Loaded ${tracks.length} tracks with metadata`);

    // Add CORS headers to allow browser access
    return NextResponse.json(tracks, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('❌ Error loading tracks in API route:', error);
    return NextResponse.json({ error: 'Failed to load tracks' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Helper function to fetch the tracks list
async function fetchTracksList(r2Client: S3Client): Promise<string[]> {
  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: 'tracks/list.json',
      })
    );
    
    const jsonString = await response.Body?.transformToString();
    if (!jsonString) {
      return [];
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
      if (Array.isArray(parsedData)) {
        return parsedData.filter(id => typeof id === 'string');
      }
    } catch (e) {
      console.error('Error parsing tracks list:', e);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching tracks list:', error);
    return [];
  }
}

// Helper function to fetch metadata for a track
async function fetchTrackMetadata(r2Client: S3Client, trackId: string): Promise<TrackMetadata | null> {
  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: `metadata/${trackId}.json`,
      })
    );
    
    const jsonString = await response.Body?.transformToString();
    if (!jsonString) {
      return null;
    }
    
    try {
      // Handle possible double-encoded JSON
      if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
        try {
          const unescaped = JSON.parse(jsonString);
          if (typeof unescaped === 'string') {
            return JSON.parse(unescaped);
          }
        } catch (e) {
          // Fall back to regular parsing
        }
      }
      
      return JSON.parse(jsonString);
    } catch (e) {
      console.error(`Error parsing metadata for track ${trackId}:`, e);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching metadata for track ${trackId}:`, error);
    return null;
  }
}

// Add OPTIONS method to support CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
} 