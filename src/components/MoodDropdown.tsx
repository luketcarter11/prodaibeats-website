'use client'

import { useState, useEffect } from 'react'

interface MoodDropdownProps {
  onMoodSelect: (moods: string[]) => void
  selectedMoods?: string[]
}

const MOODS = [
  'Aggressive',
  'Atmospheric',
  'Calm',
  'Dark',
  'Dreamy',
  'Energetic',
  'Epic',
  'Happy',
  'Inspirational',
  'Melancholic',
  'Mysterious',
  'Peaceful',
  'Playful',
  'Romantic',
  'Sad',
  'Smooth',
  'Uplifting',
  'Vibey'
]

export default function MoodDropdown({ onMoodSelect, selectedMoods = [] }: MoodDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalSelectedMoods, setInternalSelectedMoods] = useState<string[]>(selectedMoods)

  // Update internal state when prop changes
  useEffect(() => {
    setInternalSelectedMoods(selectedMoods)
  }, [selectedMoods])

  const handleMoodToggle = (mood: string) => {
    const newSelectedMoods = internalSelectedMoods.includes(mood)
      ? internalSelectedMoods.filter(m => m !== mood)
      : [...internalSelectedMoods, mood]
    
    setInternalSelectedMoods(newSelectedMoods)
    onMoodSelect(newSelectedMoods)
  }

  const handleSelectAll = () => {
    setInternalSelectedMoods([])
    onMoodSelect([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[240px] px-6 py-2 bg-black text-white rounded-lg shadow-lg flex items-center justify-between border border-white/10 hover:bg-white/5 transition-colors"
        aria-label="Select moods"
      >
        <span>{internalSelectedMoods.length > 0 ? `${internalSelectedMoods.length} Moods Selected` : 'All Moods'}</span>
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
            <span className="text-sm text-white">{internalSelectedMoods.length} Selected</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={handleSelectAll}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-2 rounded"
            >
              <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center ${internalSelectedMoods.length === 0 ? 'bg-purple-600' : 'bg-white/5'}`}>
                {internalSelectedMoods.length === 0 && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span>All Moods</span>
            </button>
            {MOODS.map((mood) => (
              <button
                key={mood}
                onClick={() => handleMoodToggle(mood)}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-2 rounded"
              >
                <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center ${internalSelectedMoods.includes(mood) ? 'bg-purple-600' : 'bg-white/5'}`}>
                  {internalSelectedMoods.includes(mood) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{mood}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 