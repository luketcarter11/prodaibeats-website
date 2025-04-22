'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Track } from '@/types/track';
import { PlayIcon, PauseIcon } from '@radix-ui/react-icons';

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
    return track.coverUrl || '/images/default-cover.jpg';
  }
  return track.coverImage || '/images/default-cover.jpg';
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
        console.log('🔄 TracksGrid: Fetching tracks from API');
        setLoading(true);
        const response = await fetch('/api/tracks');
        
        if (!response.ok) {
          console.error(`❌ TracksGrid: API error: ${response.status}`);
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 TracksGrid: Received data from API:', data);
        
        // Handle different API response formats
        let tracksList: AnyTrack[] = [];
        if (Array.isArray(data)) {
          console.log(`✅ TracksGrid: Data is an array with ${data.length} tracks`);
          tracksList = data;
        } else if (data.tracks && Array.isArray(data.tracks)) {
          console.log(`✅ TracksGrid: Data has tracks property with ${data.tracks.length} tracks`);
          tracksList = data.tracks;
        } else {
          console.error('❌ TracksGrid: Invalid response format:', data);
          throw new Error('Invalid response format');
        }
        
        console.log(`✅ TracksGrid: Setting ${tracksList.length} tracks in state`);
        setTracks(tracksList);
        setError(null);
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
      if (!audioElement) {
        const newAudio = new Audio();
        setAudioElement(newAudio);
        newAudio.addEventListener('ended', () => {
          setCurrentlyPlaying(null);
        });
      }

      // Get the audio URL
      const audioUrl = track.audioUrl;
      console.log(`▶️ TracksGrid: Playing track: ${track.title}, URL: ${audioUrl}`);

      // Set the source and play
      if (audioElement) {
        audioElement.src = audioUrl;
        audioElement.play()
          .then(() => {
            setCurrentlyPlaying(track.id);
          })
          .catch(err => {
            console.error(`❌ TracksGrid: Error playing audio: ${err.message}`);
            setCurrentlyPlaying(null);
          });
      }
    } catch (err) {
      console.error('❌ TracksGrid: Error in handlePlayPause:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('❌ TracksGrid: Error formatting date:', err);
      return dateString;
    }
  };

  const getDisplayDate = (track: AnyTrack): string | undefined => {
    if (track.downloadDate) return formatDate(track.downloadDate);
    if (track.uploadDate) return formatDate(track.uploadDate);
    if (track.createdAt) return formatDate(track.createdAt);
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (tracks.length === 0) {
    console.log('⚠️ TracksGrid: No tracks to display');
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn't find any tracks. Please check back later.
        </p>
      </div>
    );
  }

  console.log(`✅ TracksGrid: Rendering ${tracks.length} tracks`);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track) => (
        <div key={track.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="relative h-48 w-full">
            <Image
              src={getCoverImage(track)}
              alt={`${track.title} cover`}
              fill
              className="object-cover"
            />
            <button
              onClick={() => handlePlayPause(track)}
              className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              aria-label={currentlyPlaying === track.id ? 'Pause' : 'Play'}
            >
              {currentlyPlaying === track.id ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1">{track.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{track.artist}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {track.tags && track.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{track.bpm} BPM</span>
              <span>{track.key}</span>
              <span>{track.duration}</span>
            </div>
            {getDisplayDate(track) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Added: {getDisplayDate(track)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 