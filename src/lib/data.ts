import { Track } from '@/types/track'

export interface LicenseTier {
  name: string
  price: number
  streams: string
  royaltySplit: string
  distribution: string[]
  features: string[]
}

// Manually import JSON data instead of using fs
// This is imported statically at build time in Next.js
import tracksData from '../../data/tracks.json'

/**
 * Get tracks data from the statically imported JSON
 * @returns Array of tracks from imported data
 */
const getTracksData = (): Track[] => {
  try {
    // Format tracks to match our Track interface
    return tracksData.map((track: any) => ({
      id: track.videoId || track.id || track.slug,
      title: track.title,
      artist: track.artist || 'ProDAI',
      coverUrl: track.cover || `/tracks/${track.slug}/cover.jpg`,
      price: track.price || 29.99,
      bpm: track.bpm || 140,
      key: track.key || 'Am',
      duration: track.duration || '0:00',
      tags: track.tags || ['UK Drill', 'Beat'],
      audioUrl: track.audio || `/tracks/${track.slug}/${track.slug}.mp3`,
      licenseType: track.licenseType || 'Non-Exclusive',
      slug: track.slug,
      videoId: track.videoId,
      downloadDate: track.downloadDate
    }));
  } catch (error) {
    console.error('Error processing tracks data:', error);
    // Fallback to sample track if there's an error
    return [sampleTrack];
  }
};

// Sample track as fallback
const sampleTrack: Track = {
  id: 'test_12345',
  title: 'Sample Track',
  artist: 'Test Artist',
  coverUrl: '/images/covers/sample_track.jpg',
  price: 12.99,
  bpm: 100,
  key: 'Am',
  duration: '0:30',
  tags: ['Test', 'Sample'],
  audioUrl: '/audio/sample_track.mp3',
  licenseType: 'Non-Exclusive'
}

// Export tracks array
export const tracks = getTracksData();

export function getTrackBySlug(slug: string): Track | null {
  const allTracks = getTracksData();
  return allTracks.find((track) => 
    track.slug === slug || track.id === slug || track.videoId === slug
  ) || null;
}

export function getFeaturedTracks(): Track[] {
  // Ensure we always return an array from the imported data
  return getTracksData();
}

// Add missing getNewReleases function
export function getNewReleases(): Track[] {
  // Return the tracks sorted by most recent
  const allTracks = getTracksData();
  
  // Sort by creation date if available
  return [...allTracks].sort((a, b) => {
    // Use downloadDate or fall back to random sorting
    const dateA = a.downloadDate ? new Date(a.downloadDate).getTime() : 0;
    const dateB = b.downloadDate ? new Date(b.downloadDate).getTime() : 0;
    return dateB - dateA;
  });
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