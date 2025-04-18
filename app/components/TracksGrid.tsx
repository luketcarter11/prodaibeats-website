'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  uploadDate: string;
}

export default function TracksGrid() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tracks');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tracks: ${response.status}`);
        }
        
        const data = await response.json();
        setTracks(data.tracks);
        setError(null);
      } catch (err) {
        setError('Failed to load tracks. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const handlePlayPause = (trackId: string, audioUrl: string) => {
    if (currentTrack === trackId) {
      // Pause current track
      audio?.pause();
      setCurrentTrack(null);
      setAudio(null);
    } else {
      // Stop previous audio if playing
      if (audio) {
        audio.pause();
      }
      
      // Play new track
      const newAudio = new Audio(audioUrl);
      newAudio.play().catch(e => console.error('Audio playback failed:', e));
      setCurrentTrack(trackId);
      setAudio(newAudio);
      
      // Set up ended event to reset state
      newAudio.onended = () => {
        setCurrentTrack(null);
        setAudio(null);
      };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-gray-500">
        <p>No tracks available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {tracks.map((track) => (
        <div 
          key={track.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="relative aspect-square">
            <Image
              src={track.coverUrl}
              alt={`${track.title} by ${track.artist}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <button
              onClick={() => handlePlayPause(track.id, track.audioUrl)}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300"
              aria-label={currentTrack === track.id ? `Pause ${track.title}` : `Play ${track.title}`}
              tabIndex={0}
            >
              {currentTrack === track.id ? (
                <PauseIcon className="h-16 w-16 text-white" />
              ) : (
                <PlayIcon className="h-16 w-16 text-white" />
              )}
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg truncate">{track.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 truncate">{track.artist}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {new Date(track.uploadDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 