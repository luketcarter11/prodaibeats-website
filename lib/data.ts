import fs from 'fs';
import path from 'path';

export interface Track {
  id: string
  title: string
  artist: string
  coverUrl: string
  price: number
  bpm: number
  key: string
  duration: string
  tags: string[]
  audioUrl: string
  createdAt?: string
  plays?: number
  slug?: string
  videoId?: string
}

// CDN base URL
const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://cdn.prodaibeats.com';

/**
 * Read tracks data from the local JSON file - only in development
 * @returns Array of tracks from data/tracks.json
 */
const readTracksData = (): Track[] => {
  // In production, don't attempt file operations
  if (process.env.NODE_ENV === 'production') {
    console.log('In production environment, skipping local file read');
    return [];
  }

  try {
    // Get the root directory
    const rootDir = process.cwd();
    
    // Path to data/tracks.json
    const tracksJsonPath = path.join(rootDir, 'data', 'tracks.json');
    
    // Check if the file exists
    if (!fs.existsSync(tracksJsonPath)) {
      console.warn('data/tracks.json not found, falling back to empty tracks array');
      return [];
    }
    
    // Read and parse the file
    const data = fs.readFileSync(tracksJsonPath, 'utf8');
    const tracks = JSON.parse(data);
    
    // Format tracks to match our Track interface
    return tracks.map((track: any) => ({
      id: track.videoId || track.id || track.slug,
      title: track.title,
      artist: track.artist || 'ProDAI',
      coverUrl: track.cover || `${CDN_BASE_URL}/images/tracks/${track.slug}/cover.jpg`,
      price: track.price || 29.99,
      bpm: track.bpm || 120,
      key: track.key || 'Unknown',
      duration: track.duration || '0:00',
      tags: track.tags || [],
      audioUrl: track.audio || `${CDN_BASE_URL}/audio/${track.slug}/${track.slug}.mp3`,
      createdAt: track.createdAt || track.downloadDate || new Date().toISOString(),
      plays: track.plays || 0,
      slug: track.slug,
      videoId: track.videoId
    }));
  } catch (error) {
    console.error('Error reading tracks data:', error);
    // Fallback to empty array if there's an error
    return [];
  }
};

// Fallback data in case the file doesn't exist
const fallbackTracks: Track[] = [
  {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'ProDAI',
    coverUrl: `${CDN_BASE_URL}/covers/midnight-dreams.jpg`,
    price: 29.99,
    bpm: 140,
    key: 'Am',
    duration: '3:45',
    tags: ['Hip Hop', 'Trap', 'Dark'],
    audioUrl: `${CDN_BASE_URL}/audio/midnight-dreams.mp3`,
    createdAt: '2024-04-15T12:00:00Z',
    plays: 1250
  },
  {
    id: '2',
    title: 'Summer Vibes',
    artist: 'ProDAI',
    coverUrl: `${CDN_BASE_URL}/covers/summer-vibes.jpg`,
    price: 24.99,
    bpm: 128,
    key: 'Cm',
    duration: '3:30',
    tags: ['Pop', 'Electronic', 'Happy'],
    audioUrl: `${CDN_BASE_URL}/audio/summer-vibes.mp3`,
    createdAt: '2024-04-14T15:30:00Z',
    plays: 850
  },
  {
    id: '3',
    title: 'Urban Flow',
    artist: 'ProDAI',
    coverUrl: `${CDN_BASE_URL}/covers/urban-flow.jpg`,
    price: 27.99,
    bpm: 95,
    key: 'Fm',
    duration: '4:15',
    tags: ['R&B', 'Hip Hop', 'Smooth'],
    audioUrl: `${CDN_BASE_URL}/audio/urban-flow.mp3`,
    createdAt: '2024-04-13T09:15:00Z',
    plays: 2100
  }
];

/**
 * Get all tracks from the local JSON file with fallback to hardcoded tracks
 * @returns Array of all tracks
 */
export const getTracks = (): Track[] => {
  const tracks = readTracksData();
  return tracks.length > 0 ? tracks : fallbackTracks;
};

/**
 * Get featured tracks from the local JSON file
 * @returns Array of featured tracks
 */
export const getFeaturedTracks = (): Track[] => {
  return getTracks();
};

/**
 * Get a track by its slug or ID
 * @param slug The slug or ID of the track
 * @returns The track if found, null otherwise
 */
export const getTrackBySlug = (slug: string): Track | null => {
  const tracks = getTracks();
  return tracks.find(track => 
    track.slug === slug || track.id === slug || track.videoId === slug
  ) || null;
};

/**
 * Get new releases (most recent tracks)
 * @param limit Number of tracks to return
 * @returns Array of the most recent tracks
 */
export const getNewReleases = (limit: number = 6): Track[] => {
  const tracks = getTracks();
  
  // Sort by creation date (newest first)
  return [...tracks]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
}; 