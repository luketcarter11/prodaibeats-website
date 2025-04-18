'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getFeaturedTracks } from '@/lib/data'
import TrackCard from '@/components/TrackCard'
import GenreDropdown from '@/components/GenreDropdown'
import MoodDropdown from '@/components/MoodDropdown'
import BPMSlider from '@/components/BPMSlider'
import { Track } from '@/types/track'

export default function BeatsPage() {
  const searchParams = useSearchParams()
  const genreQuery = searchParams.get('genres')
  
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle initial load and URL genre parameter
  useEffect(() => {
    const loadTracks = () => {
      try {
        const fetchedTracks = getFeaturedTracks()
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
        setError('Failed to load tracks.')
        setTracks([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTracks()
  }, [genreQuery]) // Re-run when genre query changes

  const filteredTracks = tracks.filter(track => {
    // If no genres selected, show all tracks
    if (selectedGenres.length === 0) {
      return true
    }

    // Check if track has any of the selected genres
    const hasSelectedGenre = selectedGenres.some(genre => 
      track.tags.some(tag => tag.toLowerCase() === genre.toLowerCase())
    )
    if (!hasSelectedGenre) {
      return false
    }

    // Filter by moods if any selected
    if (selectedMoods.length > 0 && !selectedMoods.some(mood => 
      track.tags.some(tag => tag.toLowerCase() === mood.toLowerCase())
    )) {
      return false
    }

    // Filter by BPM range
    if (track.bpm < bpmRange[0] || track.bpm > bpmRange[1]) {
      return false
    }

    return true
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

  const handleBpmChange = (min: number, max: number) => {
    setBpmRange([min, max])
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
            onBpmChange={handleBpmChange}
          />
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTracks.map((track) => (
            <TrackCard
              key={track.id}
              id={track.id}
              title={track.title}
              artist={track.artist}
              coverUrl={track.coverUrl}
              price={track.price}
              bpm={track.bpm}
              musicalKey={track.key}
              duration={track.duration}
              tags={track.tags}
              audioUrl={track.audioUrl}
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