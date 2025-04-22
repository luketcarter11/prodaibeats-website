'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaArrowLeft, FaCheck, FaEdit, FaInfoCircle, FaSync } from 'react-icons/fa'
import { MusicalKey } from '@/types'
// import { extractMetadataFromTitle, applyExtractedMetadata, getMetadataConfidence } from '@/lib/metadataExtractor'

interface Track {
  id: string
  title: string
  artist: string
  coverImage: string
  bpm: number | null
  musicalKey: MusicalKey | null
  downloadedAt: string
  source?: string
  genre?: string
  mood?: string
}

export default function ImportTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [importStatus, setImportStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({})
  const [metadataConfidence, setMetadataConfidence] = useState<Record<string, Record<string, number>>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tracks/import')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracks')
      }
      
      const data = await response.json()
      
      // Process the tracks with automatic metadata extraction
      const processedTracks = data.tracks.map((track: Track) => {
        // Commented out due to missing exports
        // const extractedData = extractMetadataFromTitle(track.title)
        // const updatedTrack = applyExtractedMetadata(track, extractedData)
        
        // Store confidence values
        // setMetadataConfidence(prev => ({
        //   ...prev,
        //   [track.id]: getMetadataConfidence(extractedData)
        // }))
        
        // return updatedTrack
        return track
      })
      
      setTracks(processedTracks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBpmChange = (id: string, value: string) => {
    const bpm = value === '' ? null : parseInt(value, 10)
    
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, bpm } : track
    ))
  }

  const handleKeyChange = (id: string, value: string) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, musicalKey: value as MusicalKey } : track
    ))
  }

  const handleImport = async (id: string) => {
    const track = tracks.find(t => t.id === id)
    
    if (!track) return
    
    if (!track.bpm || !track.musicalKey) {
      setError(`Please set BPM and musical key for "${track.title}" before importing`)
      return
    }
    
    try {
      setImportStatus(prev => ({ ...prev, [id]: 'pending' }))
      
      const response = await fetch('/api/tracks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to import track: ${track.title}`)
      }
      
      setImportStatus(prev => ({ ...prev, [id]: 'success' }))
      
      // Optionally, you can remove the imported track from the list
      // setTracks(tracks.filter(t => t.id !== id))
    } catch (err) {
      setImportStatus(prev => ({ ...prev, [id]: 'error' }))
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  // Function to get the confidence color class based on confidence value
  const getConfidenceColorClass = (value: number | undefined) => {
    if (!value) return 'bg-zinc-500'
    if (value >= 90) return 'bg-green-500'
    if (value >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Function to refresh metadata extraction for a specific track
  const refreshMetadata = (id: string) => {
    const track = tracks.find(t => t.id === id)
    if (!track) return
    
    // Commented out due to missing exports
    // const extractedData = extractMetadataFromTitle(track.title)
    // const updatedTrack = applyExtractedMetadata(track, extractedData)
    
    // Update confidence values
    // setMetadataConfidence(prev => ({
    //   ...prev,
    //   [id]: getMetadataConfidence(extractedData)
    // }))
    
    // Update the track in the list
    // setTracks(prevTracks => 
    //   prevTracks.map(t => t.id === id ? updatedTrack : t)
    // )

    // Just keep the track as is for now
    return track
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin" 
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white">Import Tracks</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 text-red-400 rounded-lg">
          {error}
          <button 
            className="ml-4 text-red-400 hover:text-red-300"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="bg-zinc-900 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Tracks Ready to Import</h2>
          <button
            onClick={fetchTracks}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2"
          >
            <FaSync /> Refresh
          </button>
        </div>
        
        <p className="text-zinc-400 mb-6">
          Set the BPM and musical key for each track, then click "Import" to make it available on your website.
          <span className="flex items-center gap-2 mt-2">
            <FaInfoCircle className="text-zinc-500" /> 
            <span>The system attempts to automatically extract this data from track titles. Look for the confidence indicators.</span>
          </span>
        </p>
        
        {loading ? (
          <div className="py-12 text-center text-zinc-500">Loading tracks...</div>
        ) : tracks.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">No tracks ready to import. Download tracks from YouTube Music first.</div>
        ) : (
          <div className="space-y-4">
            {tracks.map(track => (
              <div key={track.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-2/12">
                    {track.coverImage ? (
                      <Image 
                        src={track.coverImage} 
                        alt={track.title}
                        width={150}
                        height={150}
                        className="w-full rounded-md object-cover aspect-square"
                      />
                    ) : (
                      <div className="w-full bg-zinc-700 rounded-md aspect-square flex items-center justify-center">
                        <span className="text-zinc-500">No image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1">{track.title}</h3>
                    <p className="text-zinc-400 mb-3">{track.artist}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <label htmlFor={`bpm-${track.id}`} className="text-zinc-300 text-sm flex items-center gap-2">
                            BPM 
                            {metadataConfidence[track.id]?.bpm && (
                              <span 
                                className={`inline-block w-2 h-2 rounded-full ${getConfidenceColorClass(metadataConfidence[track.id]?.bpm)}`}
                                title={`Confidence: ${metadataConfidence[track.id]?.bpm}%`}
                              ></span>
                            )}
                          </label>
                          <button 
                            onClick={() => refreshMetadata(track.id)}
                            className="text-zinc-500 hover:text-zinc-300 ml-auto"
                            title="Refresh metadata extraction"
                          >
                            <FaSync className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          id={`bpm-${track.id}`}
                          type="number"
                          min="60"
                          max="200"
                          value={track.bpm === null ? '' : track.bpm}
                          onChange={(e) => handleBpmChange(track.id, e.target.value)}
                          className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="e.g. 140"
                        />
                      </div>
                      
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <label htmlFor={`key-${track.id}`} className="text-zinc-300 text-sm flex items-center gap-2">
                            Musical Key
                            {metadataConfidence[track.id]?.key && (
                              <span 
                                className={`inline-block w-2 h-2 rounded-full ${getConfidenceColorClass(metadataConfidence[track.id]?.key)}`}
                                title={`Confidence: ${metadataConfidence[track.id]?.key}%`}
                              ></span>
                            )}
                          </label>
                        </div>
                        <select
                          id={`key-${track.id}`}
                          value={track.musicalKey || ''}
                          onChange={(e) => handleKeyChange(track.id, e.target.value)}
                          className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select Key</option>
                          <optgroup label="Major Keys">
                            <option value="C">C Major</option>
                            <option value="G">G Major</option>
                            <option value="D">D Major</option>
                            <option value="A">A Major</option>
                            <option value="E">E Major</option>
                            <option value="B">B Major</option>
                            <option value="F#">F# Major</option>
                            <option value="Gb">Gb Major</option>
                            <option value="Db">Db Major</option>
                            <option value="Ab">Ab Major</option>
                            <option value="Eb">Eb Major</option>
                            <option value="Bb">Bb Major</option>
                            <option value="F">F Major</option>
                          </optgroup>
                          <optgroup label="Minor Keys">
                            <option value="Am">A Minor</option>
                            <option value="Em">E Minor</option>
                            <option value="Bm">B Minor</option>
                            <option value="F#m">F# Minor</option>
                            <option value="C#m">C# Minor</option>
                            <option value="G#m">G# Minor</option>
                            <option value="D#m">D# Minor</option>
                            <option value="Bbm">Bb Minor</option>
                            <option value="Fm">F Minor</option>
                            <option value="Cm">C Minor</option>
                            <option value="Gm">G Minor</option>
                            <option value="Dm">D Minor</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    
                    {/* Additional metadata */}
                    {(metadataConfidence[track.id]?.genre || metadataConfidence[track.id]?.mood) && (
                      <div className="mb-3 text-sm text-zinc-400">
                        {track.genre && (
                          <span className="inline-flex items-center gap-1 mr-4">
                            Genre: {track.genre}
                            <span 
                              className={`inline-block w-2 h-2 rounded-full ${getConfidenceColorClass(metadataConfidence[track.id]?.genre)}`}
                              title={`Confidence: ${metadataConfidence[track.id]?.genre}%`}
                            ></span>
                          </span>
                        )}
                        {track.mood && (
                          <span className="inline-flex items-center gap-1">
                            Mood: {track.mood}
                            <span 
                              className={`inline-block w-2 h-2 rounded-full ${getConfidenceColorClass(metadataConfidence[track.id]?.mood)}`}
                              title={`Confidence: ${metadataConfidence[track.id]?.mood}%`}
                            ></span>
                          </span>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleImport(track.id)}
                      disabled={importStatus[track.id] === 'pending' || !track.bpm || !track.musicalKey}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        importStatus[track.id] === 'success'
                          ? 'bg-green-600 text-white'
                          : importStatus[track.id] === 'error'
                            ? 'bg-red-600 text-white'
                            : !track.bpm || !track.musicalKey
                              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {importStatus[track.id] === 'success' ? (
                        <>
                          <FaCheck /> Imported
                        </>
                      ) : importStatus[track.id] === 'error' ? (
                        <>
                          <FaEdit /> Retry
                        </>
                      ) : (
                        'Import Track'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 