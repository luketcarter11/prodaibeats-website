'use client'

import { useState, useRef } from 'react'

export default function TestAudio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  
  const trackSlug = 'warm-mountain-140-bpm-uk-drill-type-beat'
  const directAudioPath = `/tracks/${trackSlug}/audio.mp3`
  
  const handlePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
          .then(() => console.log('Playing audio'))
          .catch(err => console.error('Error playing audio:', err))
      }
      setPlaying(!playing)
    }
  }
  
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Audio Test Page</h1>
      
      <div className="p-4 bg-gray-100 rounded-lg mb-8">
        <p className="mb-2"><strong>Track:</strong> {trackSlug}</p>
        <p className="mb-4"><strong>Audio path:</strong> {directAudioPath}</p>
        
        <button 
          onClick={handlePlay} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
      
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="mb-4"><strong>HTML Audio Element:</strong></p>
        <audio
          ref={audioRef}
          src={directAudioPath}
          controls
          className="w-full"
        />
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="mb-4"><strong>Direct audio player with iframe:</strong></p>
        <iframe 
          src={directAudioPath} 
          className="w-full h-20"
        ></iframe>
      </div>
    </div>
  )
} 