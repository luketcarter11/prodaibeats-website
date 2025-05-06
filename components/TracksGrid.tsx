'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Track } from '@/types/track';
import { PlayIcon, PauseIcon } from '@radix-ui/react-icons';

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Define a type for tracks that might have different property names
type SrcTrack = {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  uploadDate: string;
  audioUrl: string;
  downloadDate?: string;
  createdAt?: string;
};

// Union type to handle both track formats
type AnyTrack = Track | SrcTrack;

// Type guard to check which type of track we're dealing with
function hasCoverUrl(track: AnyTrack): track is Track {
  return 'coverUrl' in track;
}

// Helper function to get cover image regardless of track type
function getCoverImage(track: AnyTrack): string {
  if (hasCoverUrl(track)) {
    const coverUrl = track.coverUrl;
    // Ensure proper cover URL with fallback to CDN
    return coverUrl && coverUrl.includes('://') 
      ? coverUrl 
      : `${CDN}/covers/${track.id}.jpg`;
  }
  
  const coverImage = track.coverImage;
  // Ensure proper cover URL with fallback to CDN for coverImage 
  return coverImage && coverImage.includes('://') 
    ? coverImage 
    : `${CDN}/covers/${track.id}.jpg`;
}

export default function TracksGrid() {
  const [tracks, setTracks] = useState<AnyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tracks');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle different API response formats
        let tracksList: AnyTrack[] = [];
        if (Array.isArray(data)) {
          tracksList = data;
        } else if (data.tracks && Array.isArray(data.tracks)) {
          tracksList = data.tracks;
        } else {
          throw new Error('Invalid response format');
        }
        
        console.log('Tracks loaded:', tracksList.length);
        setTracks(tracksList);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
        console.error('Error fetching tracks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup function
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handlePlayPause = (track: AnyTrack) => {
    if (currentlyPlaying === track.id) {
      // Pause current track
      if (audioElement) {
        audioElement.pause();
        setCurrentlyPlaying(null);
      }
      return;
    }

    try {
      // Create new audio element if one doesn't exist
      const audio = audioElement || new Audio();
      
      // Ensure audio URL is constructed properly
      const audioUrl = track.audioUrl && track.audioUrl.includes('://') 
        ? track.audioUrl  // Use existing URL if it already includes protocol
        : `${CDN}/tracks/${track.id}.mp3`;  // Construct URL with CDN
      
      // Set new audio source
      audio.src = audioUrl;
      
      // Play the audio
      audio.play()
        .then(() => {
          setCurrentlyPlaying(track.id);
          setAudioElement(audio);
        })
        .catch((err) => {
          console.error('Error playing audio:', err, 'URL was:', audioUrl);
          setError('Failed to play audio');
        });
      
      // When audio ends, reset the currently playing state
      audio.onended = () => {
        setCurrentlyPlaying(null);
      };
    } catch (err) {
      console.error('Error with audio playback:', err);
      setError('Failed to play audio');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Unknown date';
    }
  };

  // Helper to determine which date field to use
  const getDisplayDate = (track: AnyTrack): string | undefined => {
    if ('downloadDate' in track) return track.downloadDate;
    if ('createdAt' in track) return track.createdAt;
    if ('uploadDate' in track) return track.uploadDate;
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md">
        <p className="text-red-600">Error: {error}</p>
        <button 
          className="mt-2 text-sm underline text-blue-600"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No tracks found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track) => (
        <div 
          key={track.id} 
          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div className="relative aspect-square">
            <Image
              src={getCoverImage(track)}
              alt={`${track.title} cover art`}
              fill
              unoptimized
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
                  <PauseIcon className="h-6 w-6 text-purple-600" />
                ) : (
                  <PlayIcon className="h-6 w-6 text-purple-600" />
                )}
              </div>
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg line-clamp-1">{track.title}</h3>
            <p className="text-gray-600">{track.artist}</p>
            <p className="text-sm text-gray-500 mt-2">{formatDate(getDisplayDate(track))}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 