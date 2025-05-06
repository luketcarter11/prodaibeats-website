'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Track } from '@/types/track'

// Use environment variable for CDN base URL
const CDN = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev'

interface AudioPlayerProps {
  currentTrack: Track | null
  onClose: () => void
}

const AudioPlayer = ({ currentTrack, onClose }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      // Reset states when a new track is loaded
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setIsLoading(true)
      setHasError(false)
      
      // Log audio URL for debugging
      console.log(`🔊 Attempting to play audio from: ${currentTrack.audioUrl}`);
      
      // Check if the audioUrl is valid
      if (!currentTrack.audioUrl || !currentTrack.audioUrl.includes('.mp3')) {
        console.error(`❌ Invalid audioUrl for track: ${currentTrack.id}, url: ${currentTrack.audioUrl}`);
        setIsLoading(false);
        setHasError(true);
        return;
      }
      
      // Try to load the audio file - add a small timeout to allow UI to update
      setTimeout(() => {
        // Try to play after a small delay to allow audio to load
        const playPromise = audioRef.current?.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`✅ Successfully playing: ${currentTrack.title}`);
              setIsPlaying(true)
              setIsLoading(false)
            })
            .catch(error => {
              console.error(`❌ Error playing audio for ${currentTrack.title}:`, error);
              console.error(`Audio URL was: ${currentTrack.audioUrl}`);
              setIsLoading(false)
              setHasError(true)
            })
        }
      }, 100);
    }
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      console.error('Audio error occurred')
      setIsLoading(false)
      setHasError(true)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  if (!currentTrack) return null

  const handlePlayPause = () => {
    if (hasError) {
      // Try loading the audio again
      if (audioRef.current) {
        setHasError(false)
        setIsLoading(true)
        audioRef.current.load()
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true)
            setIsLoading(false)
          })
          .catch(error => {
            console.error('Error playing audio:', error)
            setIsLoading(false)
            setHasError(true)
          })
      }
      return
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('Error playing audio:', error)
            setHasError(true)
          })
      }
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = parseFloat(e.target.value)
      audioRef.current.currentTime = seekTime
      setCurrentTime(seekTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-black border-t border-gray-800 px-4 py-3 z-50">
      <audio 
        ref={audioRef} 
        src={currentTrack.audioUrl} 
        className="hidden"
        preload="auto"
      />
      
      <div className="flex items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 w-1/4">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title ?? 'Untitled Track'}
              fill
              className="object-cover rounded-md"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-medium text-sm truncate">{currentTrack.title}</h3>
            <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
          </div>
        </div>
        
        <div className="flex-1 mx-4">
          <div className="flex items-center justify-center space-x-4">
            <button 
              className="p-2 text-white hover:text-purple-400 transition-colors relative"
              onClick={handlePlayPause}
              disabled={isLoading}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
              ) : hasError ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-500">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
              ) : isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-xs text-gray-400 w-8">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                disabled={isLoading || hasError}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${hasError ? 'bg-red-900' : 'bg-gray-700'} accent-purple-600`}
                aria-label="Seek slider"
              />
              <span className="text-xs text-gray-400 w-8">{formatTime(duration || 0)}</span>
            </div>
          </div>
          {hasError && (
            <p className="text-red-500 text-xs text-center mt-1">
              Error loading audio. {currentTrack.title} may not be available.
            </p>
          )}
        </div>
        
        <div className="flex items-center w-1/4 justify-end space-x-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
              <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              aria-label="Volume slider"
            />
          </div>
          
          <button 
            className="p-2 text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close player"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer 