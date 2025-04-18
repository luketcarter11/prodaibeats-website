'use client'

import { useState, useRef, useEffect } from 'react'

interface BPMSliderProps {
  onBpmChange: (minBpm: number, maxBpm: number) => void
}

const BPMSlider = ({ onBpmChange }: BPMSliderProps) => {
  const [minBpm, setMinBpm] = useState<number>(60)
  const [maxBpm, setMaxBpm] = useState<number>(240)
  const [tempMinBpm, setTempMinBpm] = useState<number>(60)
  const [tempMaxBpm, setTempMaxBpm] = useState<number>(240)
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
  
  const sliderRef = useRef<HTMLDivElement>(null)

  const calculateBpmFromPosition = (clientX: number): number => {
    if (!sliderRef.current) return 60
    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = (clientX - rect.left) / rect.width
    return Math.round(percentage * 180 + 60)
  }

  const handleMouseDown = (e: React.MouseEvent, thumb: 'min' | 'max') => {
    setIsDragging(thumb)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newBpm = calculateBpmFromPosition(e.clientX)
      
      if (isDragging === 'min') {
        const clampedBpm = Math.min(Math.max(60, newBpm), tempMaxBpm - 1)
        setTempMinBpm(clampedBpm)
      } else {
        const clampedBpm = Math.max(Math.min(240, newBpm), tempMinBpm + 1)
        setTempMaxBpm(clampedBpm)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, tempMinBpm, tempMaxBpm])

  const handleApply = () => {
    setMinBpm(tempMinBpm)
    setMaxBpm(tempMaxBpm)
    onBpmChange(tempMinBpm, tempMaxBpm)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setTempMinBpm(minBpm)
          setTempMaxBpm(maxBpm)
        }}
        className="w-[240px] px-6 py-2 bg-black text-white rounded-lg shadow-lg flex items-center justify-between border border-white/10 hover:bg-white/5 transition-colors"
      >
        <span>BPM: {minBpm}-{maxBpm}</span>
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
          <div className="relative pt-2 pb-6" ref={sliderRef}>
            <div className="absolute w-full h-0.5 bg-zinc-800 rounded-full top-1/2 transform -translate-y-1/2"></div>
            <div 
              className="absolute h-0.5 bg-purple-600 rounded-full top-1/2 transform -translate-y-1/2"
              style={{
                left: `${((tempMinBpm - 60) / 180) * 100}%`,
                width: `${((tempMaxBpm - tempMinBpm) / 180) * 100}%`
              }}
            ></div>
            <div 
              className="absolute w-4 h-4 rounded-full bg-white border-2 border-purple-600 cursor-pointer hover:border-purple-500 active:scale-110 transition-transform"
              style={{
                left: `${((tempMinBpm - 60) / 180) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: isDragging === 'min' ? 30 : 20
              }}
              onMouseDown={(e) => handleMouseDown(e, 'min')}
            />
            <div 
              className="absolute w-4 h-4 rounded-full bg-white border-2 border-purple-600 cursor-pointer hover:border-purple-500 active:scale-110 transition-transform"
              style={{
                left: `${((tempMaxBpm - 60) / 180) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: isDragging === 'max' ? 30 : 20
              }}
              onMouseDown={(e) => handleMouseDown(e, 'max')}
            />
          </div>

          <div className="text-xs text-zinc-500 text-center mb-3">
            Range: {tempMinBpm}-{tempMaxBpm} BPM
          </div>

          <button
            onClick={handleApply}
            className="w-full py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

export default BPMSlider 