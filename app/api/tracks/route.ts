import { NextResponse } from 'next/server'

// Update mock data to use external URLs for audio files
const tracks = [
  {
    id: '1',
    title: 'Summer Vibes',
    artist: 'ProdAI',
    coverImage: 'https://storage.example.com/prodai-beats/images/tracks/summer-vibes.jpg',
    uploadDate: '2023-07-15',
    audioUrl: 'https://storage.example.com/prodai-beats/audio/summer-vibes.mp3'
  },
  {
    id: '2',
    title: 'Midnight Groove',
    artist: 'ProdAI',
    coverImage: 'https://storage.example.com/prodai-beats/images/tracks/midnight-groove.jpg',
    uploadDate: '2023-08-03',
    audioUrl: 'https://storage.example.com/prodai-beats/audio/midnight-groove.mp3'
  },
  {
    id: '3',
    title: 'Urban Flow',
    artist: 'ProdAI',
    coverImage: 'https://storage.example.com/prodai-beats/images/tracks/urban-flow.jpg',
    uploadDate: '2023-08-22',
    audioUrl: 'https://storage.example.com/prodai-beats/audio/urban-flow.mp3'
  },
  {
    id: '4',
    title: 'Chill Wave',
    artist: 'ProdAI',
    coverImage: 'https://storage.example.com/prodai-beats/images/tracks/chill-wave.jpg',
    uploadDate: '2023-09-05',
    audioUrl: 'https://storage.example.com/prodai-beats/audio/chill-wave.mp3'
  },
  {
    id: '5',
    title: 'Deep Dreams',
    artist: 'ProdAI',
    coverImage: 'https://storage.example.com/prodai-beats/images/tracks/deep-dreams.jpg',
    uploadDate: '2023-09-18',
    audioUrl: 'https://storage.example.com/prodai-beats/audio/deep-dreams.mp3'
  },
  {
    id: '6',
    title: 'Future Beats',
    artist: 'ProdAI',
    coverImage: 'https://storage.example.com/prodai-beats/images/tracks/future-beats.jpg',
    uploadDate: '2023-10-02',
    audioUrl: 'https://storage.example.com/prodai-beats/audio/future-beats.mp3'
  }
];

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({ tracks });
} 