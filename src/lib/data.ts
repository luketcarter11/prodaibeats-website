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
  // On client-side, we use a singleton promise to avoid multiple fetches
  if (typeof window !== 'undefined') {
    if (!clientTracksPromise) {
      clientTracksPromise = fetchTracksFromR2()
    }
    return clientTracksPromise
  }
  
  // On server-side, check cache first
  const now = Date.now()
  if (cachedTracks && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedTracks
  }

  return fetchTracksFromR2()
}

/**
 * Internal function to fetch tracks from R2 storage
 */
async function fetchTracksFromR2(): Promise<Track[]> {
  try {
    // Load tracks list from R2
    const tracksList = await r2Storage.load<string[]>('tracks/list.json', [])
    
    // Construct track objects from the list
    const tracks = await Promise.all(
      tracksList.map(async trackId => {
        // Get track metadata from R2
        const metadata = await r2Storage.load(`metadata/${trackId}.json`, null)
        const trackData = metadata ? JSON.parse(metadata) : null

        if (!trackData) return null

        return {
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
          plays: trackData.plays,
          slug: trackData.slug,
          videoId: trackData.videoId
        } as Track
      })
    )

    // Filter out null values and sort by download date
    const validTracks = tracks
      .filter((track): track is Track => track !== null)
      .sort((a, b) => new Date(b.downloadDate || '').getTime() - new Date(a.downloadDate || '').getTime())

    // Update cache
    cachedTracks = validTracks
    lastFetchTime = Date.now()
    
    return validTracks
  } catch (error) {
    console.error('Error fetching tracks from R2:', error)
    // Return cached data if available, otherwise empty array
    return cachedTracks || []
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