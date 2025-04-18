'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Track as BaseTrack } from '../types/track';
import { PlayIcon, PauseIcon } from '@radix-ui/react-icons';

// Extended Track type to handle both coverImage and coverUrl
interface Track extends BaseTrack {
  coverUrl?: string;
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
        const response = await fetch('/api/tracks');
        
        if (!response.ok) {
          throw new Error('Failed to fetch tracks');
        }
        
        const data = await response.json();
        setTracks(data.tracks);
      } catch (err) {
        setError('Failed to load tracks. Please try again later.');
        console.error('Error fetching tracks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  useEffect(() => {
    // Cleanup audio on component unmount
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handlePlayPause = (track: Track) => {
    if (currentlyPlaying === track.id) {
      // Pause current track
      if (audioElement) {
        audioElement.pause();
      }
      setCurrentlyPlaying(null);
    } else {
      // Play new track
      if (audioElement) {
        audioElement.pause();
      }
      
      const audio = new Audio(track.audioUrl);
      audio.play();
      audio.addEventListener('ended', () => setCurrentlyPlaying(null));
      
      setAudioElement(audio);
      setCurrentlyPlaying(track.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center p-4 bg-red-50 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track) => (
        <div 
          key={track.id} 
          className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div className="relative aspect-square">
            <Image
              src={track.coverImage || track.coverUrl || ''}
              alt={`${track.title} cover art`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={parseInt(track.id) <= 3}
            />
            <button
              onClick={() => handlePlayPause(track)}
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200"
              aria-label={currentlyPlaying === track.id ? `Pause ${track.title}` : `Play ${track.title}`}
            >
              <div className="bg-white/90 rounded-full p-4">
                {currentlyPlaying === track.id ? (
                  <PauseIcon className="h-6 w-6 text-primary" />
                ) : (
                  <PlayIcon className="h-6 w-6 text-primary" />
                )}
              </div>
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg line-clamp-1">{track.title}</h3>
            <p className="text-muted-foreground">{track.artist}</p>
            <p className="text-sm text-muted-foreground mt-2">{formatDate(track.uploadDate)}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 