import { Track } from '@/types/track'

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

// Cache tracks with expiration
let cachedTracks: Track[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 60 * 1000 // 1 minute in milliseconds

/**
 * Fetch tracks from the API instead of importing them directly
 * @returns Array of tracks from API
 */
const fetchTracksData = async (): Promise<Track[]> => {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedTracks && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('Using cached tracks data')
      return cachedTracks
    }

    // Fetch fresh data from our API endpoint
    console.log('Fetching tracks from API endpoint')
    const response = await fetch('/api/tracks')
    
    if (!response.ok) {
      console.error('Error fetching tracks from API:', response.statusText)
      return [sampleTrack]
    }
    
    const tracksData = await response.json()
    
    // Format tracks to match our Track interface
    const formattedTracks = tracksData.map((track: any) => ({
      id: track.videoId || track.id || track.slug,
      title: track.title,
      artist: track.artist || 'ProDAI',
      coverUrl: track.coverImage || track.cover || `${CDN_BASE_URL}/images/tracks/${track.slug}/cover.jpg`,
      price: track.price || 29.99,
      bpm: track.bpm || 140,
      key: track.key || 'Am',
      duration: track.duration || '0:00',
      tags: track.tags || ['UK Drill', 'Beat'],
      audioUrl: track.audioUrl || track.audio || `${CDN_BASE_URL}/audio/${track.slug}/${track.slug}.mp3`,
      licenseType: track.licenseType || 'Non-Exclusive',
      slug: track.slug,
      videoId: track.videoId,
      downloadDate: track.downloadDate
    }))
    
    // Update cache
    cachedTracks = formattedTracks
    cacheTimestamp = now
    
    return formattedTracks
  } catch (error) {
    console.error('Error processing tracks data:', error)
    return [sampleTrack]
  }
}

// Client-side compatible track fetching
let clientTracksPromise: Promise<Track[]> | null = null

/**
 * Get tracks data - handles both client and server environments
 */
export const getTracksData = async (): Promise<Track[]> => {
  // On client-side, we use a singleton promise to avoid multiple fetches
  if (typeof window !== 'undefined') {
    if (!clientTracksPromise) {
      clientTracksPromise = fetchTracksData()
    }
    return clientTracksPromise
  }
  
  // On server-side, fetch fresh every time
  return fetchTracksData()
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