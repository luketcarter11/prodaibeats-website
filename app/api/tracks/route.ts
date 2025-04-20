import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// For development: use public URLs if external storage is not yet set up
const usePublicFallback = true;
const storageBaseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://cdn.prodaibeats.com';

// Mock tracks data
const tracks = [
  {
    id: '1',
    title: 'Summer Vibes',
    artist: 'ProdAI',
    coverImage: usePublicFallback 
      ? '/images/tracks/summer-vibes.jpg' 
      : `${storageBaseUrl}/images/tracks/summer-vibes.jpg`,
    uploadDate: '2023-07-15',
    audioUrl: usePublicFallback 
      ? '/audio/summer-vibes.mp3' 
      : `${storageBaseUrl}/audio/summer-vibes.mp3`,
    bpm: 140,
    key: 'Am',
    duration: '2:45',
    tags: ['UK Drill', 'Beat']
  },
  {
    id: '2',
    title: 'Midnight Groove',
    artist: 'ProdAI',
    coverImage: usePublicFallback 
      ? '/images/tracks/midnight-groove.jpg' 
      : `${storageBaseUrl}/images/tracks/midnight-groove.jpg`,
    uploadDate: '2023-08-03',
    audioUrl: usePublicFallback 
      ? '/audio/midnight-groove.mp3' 
      : `${storageBaseUrl}/audio/midnight-groove.mp3`,
    bpm: 135,
    key: 'Gm',
    duration: '3:10',
    tags: ['UK Drill', 'Beat']
  },
  {
    id: '3',
    title: 'Urban Flow',
    artist: 'ProdAI',
    coverImage: usePublicFallback 
      ? '/images/tracks/urban-flow.jpg' 
      : `${storageBaseUrl}/images/tracks/urban-flow.jpg`,
    uploadDate: '2023-08-22',
    audioUrl: usePublicFallback 
      ? '/audio/urban-flow.mp3' 
      : `${storageBaseUrl}/audio/urban-flow.mp3`,
    bpm: 142,
    key: 'Cm',
    duration: '2:55',
    tags: ['UK Drill', 'Beat']
  },
  {
    id: '4',
    title: 'Chill Wave',
    artist: 'ProdAI',
    coverImage: usePublicFallback 
      ? '/images/tracks/chill-wave.jpg' 
      : `${storageBaseUrl}/images/tracks/chill-wave.jpg`,
    uploadDate: '2023-09-05',
    audioUrl: usePublicFallback 
      ? '/audio/chill-wave.mp3' 
      : `${storageBaseUrl}/audio/chill-wave.mp3`,
    bpm: 130,
    key: 'Em',
    duration: '3:25',
    tags: ['UK Drill', 'Beat']
  },
  {
    id: '5',
    title: 'Deep Dreams',
    artist: 'ProdAI',
    coverImage: usePublicFallback 
      ? '/images/tracks/deep-dreams.jpg' 
      : `${storageBaseUrl}/images/tracks/deep-dreams.jpg`,
    uploadDate: '2023-09-18',
    audioUrl: usePublicFallback 
      ? '/audio/deep-dreams.mp3' 
      : `${storageBaseUrl}/audio/deep-dreams.mp3`,
    bpm: 138,
    key: 'Bm',
    duration: '3:05',
    tags: ['UK Drill', 'Beat']
  },
  {
    id: '6',
    title: 'Future Beats',
    artist: 'ProdAI',
    coverImage: usePublicFallback 
      ? '/images/tracks/future-beats.jpg' 
      : `${storageBaseUrl}/images/tracks/future-beats.jpg`,
    uploadDate: '2023-10-02',
    audioUrl: usePublicFallback 
      ? '/audio/future-beats.mp3' 
      : `${storageBaseUrl}/audio/future-beats.mp3`,
    bpm: 145,
    key: 'Dm',
    duration: '2:50',
    tags: ['UK Drill', 'Beat']
  }
];

/**
 * API route for fetching all tracks
 */
export async function GET(request: NextRequest) {
  try {
    let tracksData = [];
    
    // In production, don't attempt local file operations
    if (process.env.NODE_ENV === 'production') {
      console.log('In production environment, using fallback data');
      return NextResponse.json(tracks);
    }
    
    // Only for development: try to read from local file
    try {
      // Path to the tracks JSON file
      const tracksFilePath = path.join(process.cwd(), 'tracklist.json');
      
      // Check if the tracks file exists
      if (fs.existsSync(tracksFilePath)) {
        // Read the tracks data
        const rawData = fs.readFileSync(tracksFilePath, 'utf8');
        tracksData = JSON.parse(rawData);
        
        // Log track count for debugging
        console.log(`Loaded ${tracksData.length} tracks from JSON file`);
      } else {
        console.log('Tracks file not found, using fallback data');
        tracksData = tracks;
      }
    } catch (fileError) {
      console.error('Error reading local tracks file:', fileError);
      // Fallback to hardcoded tracks
      tracksData = tracks;
    }
    
    // Return tracks data
    return NextResponse.json(tracksData);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch tracks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 