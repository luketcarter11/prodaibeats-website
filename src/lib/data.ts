import { Track } from '@/types/track'
import { r2Storage } from './r2Storage'

export interface LicenseTier {
  name: string
  price: number
  streams: string
  royaltySplit: string
  distribution: string[]
  features: string[]
}

// CDN base URL
const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://cdn.prodaibeats.com'

// Sample track as fallback
const sampleTrack: Track = {
  id: 'test_12345',
  title: 'Sample Track',
  artist: 'Test Artist',
  coverUrl: `${CDN_BASE_URL}/images/covers/sample_track.jpg`,
  price: 12.99,
  bpm: 100,
  key: 'Am',
  duration: '0:30',
  tags: ['Test', 'Sample'],
  audioUrl: `${CDN_BASE_URL}/audio/sample_track.mp3`,
  licenseType: 'Non-Exclusive'
}

interface R2Object {
  Key?: string
  LastModified?: Date
  ETag?: string
  Size?: number
}

// Cache tracks with expiration
let cachedTracks: Track[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 60000 // 1 minute cache

// Client-side promise cache
let clientTracksPromise: Promise<Track[]> | null = null

/**
 * Get tracks data - handles both client and server environments
 * @returns Array of tracks from R2 storage
 */
export async function getTracksData(): Promise<Track[]> {
  console.log('🔍 getTracksData called');
  
  // On client-side, we use a singleton promise to avoid multiple fetches
  if (typeof window !== 'undefined') {
    console.log('🌐 Client-side getTracksData');
    if (!clientTracksPromise) {
      clientTracksPromise = fetchTracksFromR2()
    }
    return clientTracksPromise
  }
  
  // On server-side, check cache first
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
    const tracksList = await r2Storage.load<string[]>('tracks/list.json', [])
    console.log(`📋 Found ${tracksList.length} track IDs in list.json:`, tracksList);
    
    if (tracksList.length === 0) {
      console.log('⚠️ No track IDs found in list.json, returning empty array');
      return [];
    }
    
    // Construct track objects from the list
    console.log('🔄 Constructing track objects from metadata');
    const tracks = await Promise.all(
      tracksList.map(async trackId => {
        // Get track metadata from R2
        console.log(`📥 Loading metadata for track: ${trackId}`);
        const metadata = await r2Storage.load(`metadata/${trackId}.json`, null)
        
        if (!metadata) {
          console.log(`⚠️ No metadata found for track: ${trackId}`);
          return null;
        }
        
        let trackData;
        try {
          trackData = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
          console.log(`✅ Parsed metadata for track: ${trackId}`, trackData);
        } catch (error) {
          console.error(`❌ Error parsing metadata for track: ${trackId}`, error);
          return null;
        }

        if (!trackData) {
          console.log(`⚠️ Empty metadata for track: ${trackId}`);
          return null;
        }

        // Construct the track object
        const track: Track = {
          id: trackId,
          title: trackData.title || 'Untitled',
          artist: trackData.artist || 'Unknown Artist',
          coverUrl: `${process.env.NEXT_PUBLIC_CDN_URL}/covers/${trackId}.jpg`,
          audioUrl: `${process.env.NEXT_PUBLIC_CDN_URL}/tracks/${trackId}.mp3`,
          price: trackData.price || 0,
          bpm: trackData.bpm || 0,
          key: trackData.key || 'Unknown',
          duration: trackData.duration || '0:00',
          tags: trackData.tags || [],
          description: trackData.description || '',
          downloadDate: trackData.uploadDate || new Date().toISOString(),
          waveform: trackData.waveform,
          licenseType: trackData.licenseType,
          createdAt: trackData.createdAt,
          // Add these fields to match the Track interface
          coverImage: `${process.env.NEXT_PUBLIC_CDN_URL}/covers/${trackId}.jpg`,
          uploadDate: trackData.uploadDate || new Date().toISOString(),
          musicalKey: trackData.key || 'Unknown',
          genre: trackData.genre || '',
          mood: trackData.mood || ''
        };
        
        console.log(`✅ Constructed track object: ${track.title} by ${track.artist}`);
        return track;
      })
    );
    
    // Filter out null tracks
    const validTracks = tracks.filter(track => track !== null) as Track[];
    console.log(`✅ Returning ${validTracks.length} valid tracks`);
    
    // Update cache
    cachedTracks = validTracks;
    lastFetchTime = Date.now();
    
    return validTracks;
  } catch (error) {
    console.error('❌ Error in fetchTracksFromR2:', error);
    return [];
  }
}

/**
 * Export tracks with a lazy promise to be resolved at runtime
 * This acts as a placeholder until the actual data is loaded
 */
export const tracks: Track[] = [sampleTrack]

// Expose an async function to get tracks
export async function getTrackBySlug(slug: string): Promise<Track | null> {
  const allTracks = await getTracksData()
  return allTracks.find((track) => 
    track.slug === slug || track.id === slug || track.videoId === slug
  ) || null
}

export async function getFeaturedTracks(): Promise<Track[]> {
  return getTracksData()
}

export async function getNewReleases(): Promise<Track[]> {
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