'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Track } from '@/types/track';
import { PlayIcon, PauseIcon } from '@radix-ui/react-icons';

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Helper function to format duration to mm:ss
function formatDuration(seconds: number | string): string {
  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(totalSeconds)) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

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

  const handleDownload = (track: Track) => {
    try {
      // Get the correct audio URL
      const downloadUrl = track.audioUrl && track.audioUrl.includes('://') 
        ? track.audioUrl 
        : `${CDN}/tracks/${track.id}.mp3`;
      
      // Create an invisible anchor element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${track.title || 'track'}.mp3`; // Set filename
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Failed to start download:', error);
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
      {tracks.map((track) => {
        // Ensure proper cover URL with fallback to CDN
        const coverSrc = track.coverUrl && track.coverUrl.includes('://') 
          ? track.coverUrl 
          : `${CDN}/covers/${track.id}.jpg`;
          
        return (
          <div key={track.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
            <div className="relative aspect-square">
              <Image
                src={coverSrc}
                alt={track.title ?? 'Untitled Track'}
                fill
                unoptimized
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
              <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                <h3 className="font-semibold text-lg truncate whitespace-nowrap overflow-hidden max-w-[calc(100%-100px)]">{track.title}</h3>
                <div className="flex gap-2 text-xs shrink-0">
                  {track.bpm && (
                    <span className="bg-neutral-100 px-2 py-1 rounded-full">
                      {track.bpm} BPM
                    </span>
                  )}
                  {track.duration && (
                    <span className="bg-neutral-100 px-2 py-1 rounded-full">
                      {formatDuration(track.duration)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{track.artist}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(track)}
                    className="text-gray-500 hover:text-purple-600 transition-colors"
                    aria-label={`Download ${track.title}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 