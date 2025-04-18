'use client'

import { useState, useEffect } from 'react'

interface GenreDropdownProps {
  onGenreChange: (genres: string[]) => void
  selectedGenres?: string[]
}

const GENRES = [
  'Hip Hop',
  'Trap',
  'R&B',
  'Pop',
  'Drill',
  'Afrobeats',
  'Club',
  'Rock',
  'Electronic',
  'Synthwave',
]

export default function GenreDropdown({ onGenreChange, selectedGenres = [] }: GenreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalSelectedGenres, setInternalSelectedGenres] = useState<string[]>(selectedGenres)

  // Update internal state when prop changes
  useEffect(() => {
    setInternalSelectedGenres(selectedGenres)
  }, [selectedGenres])

  const handleGenreToggle = (genre: string) => {
    const newSelectedGenres = internalSelectedGenres.includes(genre)
      ? internalSelectedGenres.filter(g => g !== genre)
      : [...internalSelectedGenres, genre]
    
    setInternalSelectedGenres(newSelectedGenres)
    onGenreChange(newSelectedGenres)
  }

  const handleSelectAll = () => {
    setInternalSelectedGenres([])
    onGenreChange([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[240px] px-6 py-2 bg-black text-white rounded-lg shadow-lg flex items-center justify-between border border-white/10 hover:bg-white/5 transition-colors"
        aria-label="Select genres"
      >
        <span>{internalSelectedGenres.length > 0 ? `${internalSelectedGenres.length} Genres Selected` : 'All Genres'}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-[240px] bg-black rounded-lg p-3 shadow-xl z-10 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <span className="text-sm text-white">{internalSelectedGenres.length} Selected</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={handleSelectAll}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-2 rounded"
            >
              <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center ${internalSelectedGenres.length === 0 ? 'bg-purple-600' : 'bg-white/5'}`}>
                {internalSelectedGenres.length === 0 && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span>All Genres</span>
            </button>
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-2 rounded"
              >
                <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center ${internalSelectedGenres.includes(genre) ? 'bg-purple-600' : 'bg-white/5'}`}>
                  {internalSelectedGenres.includes(genre) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{genre}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 