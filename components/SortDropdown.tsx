'use client'

import { useState } from 'react'

interface SortDropdownProps {
  onSortChange: (sortBy: string) => void
  selectedSort?: string
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'New Releases' },
  { value: 'popular', label: 'Top Beats' },
  { value: 'az', label: 'Alphabetically A-Z' },
  { value: 'za', label: 'Alphabetically Z-A' },
  { value: 'hidden', label: 'Hidden Gems' },
]

export default function SortDropdown({ onSortChange, selectedSort = 'newest' }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSortChange = (value: string) => {
    onSortChange(value)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[240px] px-6 py-2 bg-black text-white rounded-lg shadow-lg flex items-center justify-between border border-white/10 hover:bg-white/5 transition-colors"
        aria-label="Sort beats"
      >
        <span>{SORT_OPTIONS.find(option => option.value === selectedSort)?.label || 'Sort by'}</span>
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
          <div className="space-y-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-2 rounded"
              >
                <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center ${selectedSort === option.value ? 'bg-purple-600' : 'bg-white/5'}`}>
                  {selectedSort === option.value && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 