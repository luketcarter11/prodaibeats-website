'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Track } from '@/types/track'
import BPMSlider from '@/components/BPMSlider'
import GenreDropdown from '@/components/GenreDropdown'
import MoodDropdown from '@/components/MoodDropdown'
import SortDropdown from '../../components/SortDropdown'
import TrackCard from '@/components/TrackCard'
import AudioPlayer from '@/components/AudioPlayer'

// Wrapper component that doesn't use useSearchParams
export default function BeatsPage() {
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Track | null>(null)

  const handleClosePlayer = () => {
    setCurrentPlayingTrack(null)
  }

  return (
    <main className="bg-black">
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Beats</h1>
          <p className="text-gray-400">Find the perfect beat for your next project</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 py-0">
        <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
          <BeatsContent onTrackPlay={setCurrentPlayingTrack} />
        </Suspense>
      </div>
      
      {/* Add padding at the bottom if player is active */}
      {currentPlayingTrack && <div className="h-24"></div>}
      
      {/* Audio Player */}
      <AudioPlayer
        currentTrack={currentPlayingTrack}
        onClose={handleClosePlayer}
      />
    </main>
  )
}

// Client component that can use useSearchParams safely inside Suspense
interface BeatsContentProps {
  onTrackPlay: (track: Track | null) => void
}

function BeatsContent({ onTrackPlay }: BeatsContentProps) {
  const searchParams = useSearchParams()
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMinBpm, setSelectedMinBpm] = useState<number>(0)
  const [selectedMaxBpm, setSelectedMaxBpm] = useState<number>(300)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [selectedSort, setSelectedSort] = useState<string>('newest')

  // ✅ Load tracks from API endpoint instead of calling getFeaturedTracks directly
  useEffect(() => {
    async function loadTracks() {
      setIsLoading(true)
      try {
        console.log('🔄 BeatsContent: Fetching tracks from API')
        const response = await fetch('/api/tracks')
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const fetchedTracks = await response.json()
        
        if (!Array.isArray(fetchedTracks)) {
          throw new Error('Invalid response format - expected array of tracks')
        }
        
        console.log(`✅ BeatsContent: Received ${fetchedTracks.length} tracks from API`)
        
        // Apply fallbacks for missing or malformed fields
        const safeTracks = fetchedTracks.map(track => ({
          ...track,
          bpm: typeof track.bpm === 'number' ? track.bpm : 120,
          duration: track.duration || '2:30',
          tags: Array.isArray(track.tags) ? track.tags : []
        }))
        
        setTracks(safeTracks)
        setError(null)
        console.log("✅ Loaded tracks:", safeTracks)
      } catch (error) {
        console.error('❌ Failed to fetch tracks:', error)
        setError('Failed to load tracks. Please try again later.')
        setTracks([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTracks()
  }, [])

  // ✅ Apply filters from URL on load
  useEffect(() => {
    const genreQuery = searchParams.get('genres')
    const sortQuery = searchParams.get('sort')

    if (genreQuery) {
      const genreArray = genreQuery
        .split(',')
        .map((g) => decodeURIComponent(g.trim()))
      setSelectedGenres(genreArray)
    }

    if (sortQuery) {
      setSelectedSort(sortQuery)
    }
  }, [searchParams])

  const handleBpmChange = (minBpm: number, maxBpm: number) => {
    setSelectedMinBpm(minBpm)
    setSelectedMaxBpm(maxBpm)
  }

  const handleSortChange = (sortBy: string) => {
    setSelectedSort(sortBy)
  }

  const filteredTracks = tracks.filter(track => {
    // Filter by BPM - add type check before comparison
    const bpmMatch = typeof track.bpm === 'number' && track.bpm >= selectedMinBpm && track.bpm <= selectedMaxBpm
    
    // Filter by genres (case-insensitive)
    const genreMatch = selectedGenres.length === 0 || 
      (Array.isArray(track.tags) && selectedGenres.some(genre => 
        track.tags.some((tag: string) => tag.toLowerCase() === genre.toLowerCase())
      ))
    
    // Filter by moods (case-insensitive)
    const moodMatch = selectedMoods.length === 0 || 
      (Array.isArray(track.tags) && selectedMoods.some(mood => 
        track.tags.some((tag: string) => tag.toLowerCase() === mood.toLowerCase())
      ))
    
    return bpmMatch && genreMatch && moodMatch
  })

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    switch (selectedSort) {
      case 'newest':
        // Safely handle potentially missing createdAt property
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
        return bDate - aDate
      case 'popular':
        // Safely handle potentially missing plays property
        return (b.plays || 0) - (a.plays || 0)
      case 'az':
        return (a.title || '').localeCompare(b.title || '')
      case 'za':
        return (b.title || '').localeCompare(a.title || '')
      case 'hidden':
        // Safely handle potentially missing plays property
        return (a.plays || 0) - (b.plays || 0)
      default:
        return 0
    }
  })

  const handleMoodChange = (moods: string[]) => {
    setSelectedMoods(moods)
  }

  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres)
  }

  const handlePlayTrack = (track: Track) => {
    onTrackPlay(track)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          <BPMSlider onBpmChange={handleBpmChange} />
          <MoodDropdown 
            onMoodSelect={handleMoodChange} 
            selectedMoods={selectedMoods}
          />
          <GenreDropdown 
            onGenreChange={handleGenreChange} 
            selectedGenres={selectedGenres}
          />
          <SortDropdown
            onSortChange={handleSortChange}
            selectedSort={selectedSort}
          />
        </div>
        <div className="relative flex items-center">
          <div className="absolute left-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="What type of track are you looking for?"
            className="w-full h-12 pl-12 pr-4 bg-white/5 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading tracks...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">{error}</div>
      ) : sortedTracks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No tracks found</div>
      ) : (
        <div className="space-y-4">
          {sortedTracks.map((track) => (
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
              onPlay={handlePlayTrack} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
