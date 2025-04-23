'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import TrackCard from '@/components/TrackCard'
import GenreDropdown from '@/components/GenreDropdown'
import MoodDropdown from '@/components/MoodDropdown'
import BPMSlider from '@/components/BPMSlider'
import { Track } from '@/types/track'

export default function BeatsPage() {
  const searchParams = useSearchParams()
  const genreQuery = searchParams.get('genres')
  
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedMinBpm, setSelectedMinBpm] = useState(0)
  const [selectedMaxBpm, setSelectedMaxBpm] = useState(300)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [selectedSort, setSelectedSort] = useState('newest')
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Track | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle initial load and URL genre parameter - using API endpoint instead of getFeaturedTracks
  useEffect(() => {
    const loadTracks = async () => {
      try {
        console.log('🔄 Fetching tracks from API')
        const response = await fetch('/api/tracks')
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const fetchedTracks = await response.json()
        
        if (!Array.isArray(fetchedTracks)) {
          throw new Error('Invalid response format - expected array of tracks')
        }
        
        console.log(`✅ Received ${fetchedTracks.length} tracks from API`)
        setTracks(fetchedTracks)
        
        // Set genres from URL parameter
        if (genreQuery) {
          const genres = decodeURIComponent(genreQuery).split(',').map(g => g.trim())
          setSelectedGenres(genres)
        } else {
          setSelectedGenres([])
        }
        
        setError(null)
      } catch (error) {
        console.error('❌ Failed to fetch tracks:', error)
        setError('Failed to load tracks.')
        setTracks([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTracks()
  }, [genreQuery]) // Re-run when genre query changes

  const handlePlayTrack = (track: Track) => {
    setCurrentPlayingTrack(track)
  }

  // Filter tracks by selected criteria
  const filteredTracks = tracks.filter(track => {
    // Check if track has any of the selected genres
    const hasSelectedGenre = selectedGenres.some(genre => 
      (track.tags ?? []).some(tag => tag.toLowerCase() === genre.toLowerCase())
    )
    if (!hasSelectedGenre) {
      return false
    }

    // Check if track has any of the selected moods
    const hasSelectedMood = selectedMoods.some(mood => 
      (track.tags ?? []).some(tag => tag.toLowerCase() === mood.toLowerCase())
    )
    if (!hasSelectedMood) {
      return false
    }

    // Check if track BPM is within range
    const bpm = track.bpm ?? 0
    if (bpm < selectedMinBpm || bpm > selectedMaxBpm) {
      return false
    }

    return true
  })

  // Sort tracks by selected criteria
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    switch (selectedSort) {
      case 'newest':
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      case 'oldest':
        return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      case 'price-high':
        return (b.price ?? 0) - (a.price ?? 0)
      case 'price-low':
        return (a.price ?? 0) - (b.price ?? 0)
      case 'bpm-high':
        return (b.bpm ?? 0) - (a.bpm ?? 0)
      case 'bpm-low':
        return (a.bpm ?? 0) - (b.bpm ?? 0)
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Beats</h1>
        
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <GenreDropdown
            onGenreChange={setSelectedGenres}
          />
          <MoodDropdown
            onMoodSelect={setSelectedMoods}
          />
          <BPMSlider
            onBpmChange={(min, max) => {
              setSelectedMinBpm(min)
              setSelectedMaxBpm(max)
            }}
          />
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedTracks.map((track) => (
            <TrackCard
              key={track.id}
              id={track.id}
              title={track.title ?? 'Untitled Track'}
              artist={track.artist ?? 'Unknown Artist'}
              coverUrl={track.coverUrl}
              price={track.price ?? 0}
              bpm={track.bpm ?? 0}
              musicalKey={track.key ?? 'C'}
              duration={track.duration ?? '0:00'}
              tags={track.tags ?? []}
              audioUrl={track.audioUrl}
              onPlay={() => handlePlayTrack(track)}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredTracks.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No tracks found matching your filters.
          </div>
        )}
      </div>
    </main>
  )
} 