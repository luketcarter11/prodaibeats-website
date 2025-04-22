/**
 * DEVELOPMENT ONLY MOCK TRACKS
 * This file contains mock data for development and testing purposes.
 * It should never be imported in production code.
 */

import { Track } from '../types/track'

// CDN base URL for development
const DEV_CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://cdn.prodaibeats.com'

/**
 * Mock tracks for development and testing
 * ONLY USE IN DEVELOPMENT MODE
 */
export const mockTracks: Track[] = [
  {
    id: 'mock_1',
    title: 'Midnight Dreams',
    artist: 'ProDAI',
    coverUrl: `${DEV_CDN_BASE_URL}/covers/midnight-dreams.jpg`,
    price: 29.99,
    bpm: 140,
    key: 'Am',
    duration: '3:45',
    tags: ['Hip Hop', 'Trap', 'Dark'],
    audioUrl: `${DEV_CDN_BASE_URL}/audio/midnight-dreams.mp3`,
    createdAt: '2024-04-15T12:00:00Z',
    slug: 'midnight-dreams'
  },
  {
    id: 'mock_2',
    title: 'Summer Vibes',
    artist: 'ProDAI',
    coverUrl: `${DEV_CDN_BASE_URL}/covers/summer-vibes.jpg`,
    price: 24.99,
    bpm: 128,
    key: 'Cm',
    duration: '3:30',
    tags: ['Pop', 'Electronic', 'Happy'],
    audioUrl: `${DEV_CDN_BASE_URL}/audio/summer-vibes.mp3`,
    createdAt: '2024-04-14T15:30:00Z',
    slug: 'summer-vibes'
  },
  {
    id: 'mock_3',
    title: 'Urban Flow',
    artist: 'ProDAI',
    coverUrl: `${DEV_CDN_BASE_URL}/covers/urban-flow.jpg`,
    price: 27.99,
    bpm: 95,
    key: 'Fm',
    duration: '4:15',
    tags: ['R&B', 'Hip Hop', 'Smooth'],
    audioUrl: `${DEV_CDN_BASE_URL}/audio/urban-flow.mp3`,
    createdAt: '2024-04-13T09:15:00Z',
    slug: 'urban-flow'
  }
]

/**
 * Development-only function to get mock tracks
 * This should never be used in production code
 */
export const getMockTracks = (): Track[] => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Attempted to use mock tracks in production. This should never happen!');
    return [];
  }
  
  return mockTracks;
} 