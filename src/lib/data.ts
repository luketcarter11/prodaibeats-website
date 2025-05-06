import fs from 'fs';
import path from 'path';
import { Track } from '../types/track';
import { r2Storage } from './r2Storage'
import { getR2PublicUrl } from './r2Config';

export interface LicenseTier {
  name: string
  price: number
  streams: string
  royaltySplit: string
  distribution: string[]
  features: string[]
}

// CDN base URL
const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev'

interface R2Object {
  Key?: string
  LastModified?: Date
  ETag?: string
  Size?: number
}

// Server-side cache with expiration
let cachedTracks: Track[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 60000 // 1 minute cache

/**
 * Get tracks data - SERVER ONLY function
 * @returns Array of tracks from R2 storage
 */
export async function getTracksData(): Promise<Track[]> {
  // Server-side only check
  if (typeof window !== 'undefined') {
    console.error('❌ getTracksData() was called on the client! This function should only be used on the server.');
    return [];
  }
  
  console.log('🔍 getTracksData called (server-side)');
  
  // Check cache first
  const now = Date.now()
  if (cachedTracks && (now - lastFetchTime) < CACHE_DURATION) {
    console.log(`🔄 Using cached tracks (${cachedTracks.length} tracks)`);
    return cachedTracks
  }

  console.log('🔄 Fetching fresh tracks from R2');
  return fetchTracksFromR2()
}

/**
 * Internal function to fetch tracks from R2 storage
 */
async function fetchTracksFromR2(): Promise<Track[]> {
  try {
    console.log('📥 Loading tracks list from R2');
    // Load tracks list from R2
    const rawTracksList = await r2Storage.load<any>('tracks/list.json', [])
    console.log(`📋 Raw tracks list data:`, rawTracksList);
    
    // Fix for improper JSON format in R2 storage - handle the case where the data
    // is a string instead of a properly structured array
    let tracksList: string[] = [];
    
    if (Array.isArray(rawTracksList)) {
      // If it's already an array, just use it
      tracksList = rawTracksList.filter(id => typeof id === 'string' && id.length > 0);
    } else if (typeof rawTracksList === 'string') {
      try {
        // Try to parse the string as JSON - it might be a stringified array
        const parsed = JSON.parse(rawTracksList);
        if (Array.isArray(parsed)) {
          tracksList = parsed.filter(id => typeof id === 'string' && id.length > 0);
        } else {
          console.error('❌ Invalid list.json format: Expected array but got', typeof parsed);
          if (process.env.NODE_ENV === 'production') {
            throw new Error('Invalid list.json format in production. Please run the fix-tracks-list script.');
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse tracks list string:', parseError);
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Corrupted list.json in production. Please run the fix-tracks-list script.');
        }
      }
    } else {
      console.error('❌ Invalid list.json format: Expected array or string but got', typeof rawTracksList);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid list.json format in production. Please run the fix-tracks-list script.');
      }
    }
    
    console.log(`📋 Found ${tracksList.length} track IDs in list.json:`, tracksList);
    
    if (tracksList.length === 0) {
      console.error('❌ No track IDs found in list.json');
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No tracks found in R2 in production environment. This should be investigated.');
      }
      
      return [];
    }

    console.log('✅ Final parsed tracks list:', tracksList);
    
    // Construct track objects from the list
    console.log('🔄 Constructing track objects from metadata');
    const tracks = await Promise.all(
      tracksList.map(async trackId => {
        // Get track metadata from R2
        console.log(`📥 Loading metadata for track: ${trackId}`);
        
        // Define expected metadata structure (matches Track but all optional)
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
        
        let metadata = await r2Storage.load(`metadata/${trackId}.json`, null) as TrackMetadata | null;
        
        if (!metadata) {
          console.log(`⚠️ No metadata found for track: ${trackId}`);
          return null;
        }
        
        // Add detailed metadata debugging
        console.log(`🔍 Raw metadata for track ${trackId}:`, JSON.stringify(metadata, null, 2));
        
        // Check for common metadata issues
        if (!metadata.title) console.warn(`⚠️ Missing title for track: ${trackId}`);
        if (!metadata.artist) console.warn(`⚠️ Missing artist for track: ${trackId}`);
        if (!metadata.duration) console.warn(`⚠️ Missing duration for track: ${trackId}`);
        
        // Check if metadata is a string that needs parsing
        if (typeof metadata === 'string') {
          console.warn(`⚠️ Metadata is a string, attempting to parse: ${trackId}`);
          try {
            const parsedMetadata = JSON.parse(metadata) as TrackMetadata;
            console.log(`✅ Successfully parsed string metadata for track ${trackId}:`, parsedMetadata);
            metadata = parsedMetadata;
          } catch (parseError) {
            console.error(`❌ Failed to parse string metadata for track ${trackId}:`, parseError);
          }
        }
        
        // Construct track object with R2 URLs
        const audioUrl = `${CDN_BASE_URL}/tracks/${trackId}.mp3`;
        const coverUrl = `${CDN_BASE_URL}/covers/${trackId}.jpg`;
        
        console.log(`🔊 Constructed audio URL: ${audioUrl}`);
        console.log(`🖼️ Constructed cover URL: ${coverUrl}`);
        
        // Create track object with original metadata and URLs
        const track: Track = {
          id: trackId,
          ...metadata,
          audioUrl,
          coverUrl,
        };
        
        return track;
      })
    )
    
    // Filter out any null tracks and update cache
    const validTracks = tracks.filter((track): track is Track => track !== null);
    console.log(`✅ Returning ${validTracks.length} valid tracks`);
    
    // Update cache
    cachedTracks = validTracks;
    lastFetchTime = Date.now();
    
    return validTracks;
  } catch (error) {
    console.error('❌ Error fetching tracks from R2:', error);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('⛔ Production error fetching tracks from R2. This is a critical issue that must be resolved.');
      console.error('⛔ Details:', error);
    } else {
      console.warn('⚠️ Development mode: Returning empty array due to R2 error. Consider using mock data for testing.');
    }
    
    return [];
  }
}

/**
 * Export tracks as an empty array.
 * Any code accessing this directly should use getTracksData() instead
 * which will fetch the actual data from R2.
 */
export const tracks: Track[] = []

// Expose an async function to get tracks
export async function getTrackBySlug(slug: string): Promise<Track | null> {
  // Server-side only check
  if (typeof window !== 'undefined') {
    console.error('❌ getTrackBySlug() was called on the client! This function should only be used on the server.');
    return null;
  }
  
  const allTracks = await getTracksData()
  return allTracks.find((track) => 
    track.slug === slug || track.id === slug || track.videoId === slug
  ) || null
}

export async function getFeaturedTracks(): Promise<Track[]> {
  // Server-side only check
  if (typeof window !== 'undefined') {
    console.error('❌ getFeaturedTracks() was called on the client! This function should only be used on the server.');
    return [];
  }
  
  return getTracksData()
}

export async function getNewReleases(): Promise<Track[]> {
  // Server-side only check
  if (typeof window !== 'undefined') {
    console.error('❌ getNewReleases() was called on the client! This function should only be used on the server.');
    return [];
  }
  
  const allTracks = await getTracksData()
  
  // Sort by creation date if available
  return [...allTracks].sort((a, b) => {
    // Use downloadDate or fall back to random sorting
    const dateA = a.downloadDate ? new Date(a.downloadDate).getTime() : 0
    const dateB = b.downloadDate ? new Date(b.downloadDate).getTime() : 0
    return dateB - dateA
  })
}

export const licenseTiers: LicenseTier[] = [
  {
    name: 'Basic License',
    price: 29.99,
    streams: 'Up to 10,000',
    royaltySplit: '100% yours',
    distribution: [
      'Music streaming platforms',
      'YouTube monetization',
      'Non-profit live performances'
    ],
    features: [
      'MP3 file',
      'Instant delivery',
      'Basic mixing and mastering',
      'Commercial use rights'
    ]
  },
  {
    name: 'Premium License',
    price: 49.99,
    streams: 'Up to 100,000',
    royaltySplit: '100% yours',
    distribution: [
      'All streaming platforms',
      'YouTube monetization',
      'Live performances',
      'Music videos'
    ],
    features: [
      'WAV + MP3 files',
      'Instant delivery',
      'Professional mixing and mastering',
      'Commercial use rights',
      'Radio broadcasting'
    ]
  },
  {
    name: 'Exclusive License',
    price: 299.99,
    streams: 'Unlimited',
    royaltySplit: '100% yours',
    distribution: [
      'Unlimited distribution rights',
      'Full ownership transfer',
      'All platforms and media',
      'Worldwide rights'
    ],
    features: [
      'WAV + MP3 + Stem files',
      'Instant delivery',
      'Professional mixing and mastering',
      'Full commercial rights',
      'Broadcast rights',
      'Beat removed from store'
    ]
  }
]

// Add missing platforms export
export const platforms = [
  {
    name: 'Spotify',
    icon: '/images/platforms/spotify.svg',
    url: 'https://spotify.com'
  },
  {
    name: 'Apple Music',
    icon: '/images/platforms/apple-music.svg',
    url: 'https://music.apple.com'
  },
  {
    name: 'YouTube Music',
    icon: '/images/platforms/youtube-music.svg',
    url: 'https://music.youtube.com'
  },
  {
    name: 'SoundCloud',
    icon: '/images/platforms/soundcloud.svg',
    url: 'https://soundcloud.com'
  },
  {
    name: 'Beatport',
    icon: '/images/platforms/beatport.svg',
    url: 'https://beatport.com'
  }
] 