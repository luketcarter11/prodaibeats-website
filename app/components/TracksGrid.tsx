'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Track } from '@/types/track';
import { PlayIcon, PauseIcon } from '@radix-ui/react-icons';

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

export default function TracksGrid() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        console.log('🔄 TracksGrid: Fetching tracks from API');
        setLoading(true);
        const response = await fetch('/api/tracks');
        
        if (!response.ok) {
          console.error(`❌ TracksGrid: API error: ${response.status}`);
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 TracksGrid: Received data from API:', data);
        
        if (Array.isArray(data)) {
          console.log(`✅ TracksGrid: Setting ${data.length} tracks in state`);
          setTracks(data);
          setError(null);
        } else {
          console.error('❌ TracksGrid: Invalid response format:', data);
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('❌ TracksGrid: Error fetching tracks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, []);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handlePlayPause = (track: Track) => {
    if (currentlyPlaying === track.id) {
      if (audioElement) {
        audioElement.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      
      // Ensure the audioUrl is constructed properly
      const audioUrl = track.audioUrl && track.audioUrl.includes('://') 
        ? track.audioUrl  // Use existing URL if it already includes protocol
        : `${CDN}/tracks/${track.id}.mp3`;  // Construct URL with CDN

      const newAudio = new Audio(audioUrl);
      newAudio.play();
      setAudioElement(newAudio);
      setCurrentlyPlaying(track.id);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[200px]">Loading tracks...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (tracks.length === 0) {
    return <div className="text-center text-gray-500">No tracks found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tracks.map((track) => (
        <div key={track.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
          <div className="relative aspect-square">
            <Image
              src={track.coverUrl}
              alt={track.title ?? 'Untitled Track'}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <h3 className="text-white text-lg font-medium text-center px-4">{track.title ?? 'Untitled Track'}</h3>
            </div>
            <button
              onClick={() => handlePlayPause(track)}
              className="absolute bottom-4 right-4 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-colors"
              aria-label={currentlyPlaying === track.id ? 'Pause' : 'Play'}
            >
              {currentlyPlaying === track.id ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg">{track.title}</h3>
            <p className="text-gray-600">{track.artist}</p>
            {track.bpm && <p className="text-sm text-gray-500">BPM: {track.bpm}</p>}
            {track.key && <p className="text-sm text-gray-500">Key: {track.key}</p>}
          </div>
        </div>
      ))}
    </div>
  );
} 