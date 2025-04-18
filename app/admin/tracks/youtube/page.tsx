'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface DownloadedTrack {
  trackId: string
  title: string
  artist: string
  coverUrl: string
  audioUrl: string
  metadata: any
}

export default function YouTubeDownloader() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [downloadedTrack, setDownloadedTrack] = useState<DownloadedTrack | null>(null)
  const [recentDownloads, setRecentDownloads] = useState<DownloadedTrack[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube Music URL')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setDownloadedTrack(null)
    
    try {
      const response = await fetch('/api/tracks/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to download track')
      }
      
      setSuccess('Track downloaded successfully!')
      setDownloadedTrack(result.data)
      setRecentDownloads(prev => [result.data, ...prev.slice(0, 4)])
      setYoutubeUrl('')
    } catch (err: any) {
      setError(err.message || 'An error occurred while downloading the track')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">YouTube Music Downloader</h1>
          <Link 
            href="/admin" 
            className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Back to Admin
          </Link>
        </div>
        
        <div className="bg-zinc-800 rounded-xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="youtubeUrl" className="block text-white text-sm font-medium mb-2">
                YouTube Music URL
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://music.youtube.com/watch?v=..."
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <p className="mt-2 text-sm text-gray-400">
                Paste a YouTube Music URL to download the track and extract its metadata
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  isLoading
                    ? 'bg-purple-700 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  'Download Track'
                )}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-800 rounded-md text-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-4 bg-green-900/50 border border-green-800 rounded-md text-green-200">
              {success}
            </div>
          )}
        </div>
        
        {downloadedTrack && (
          <div className="bg-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Downloaded Track
            </h2>
            
            <div className="flex gap-6">
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src={downloadedTrack.coverUrl}
                  alt={downloadedTrack.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{downloadedTrack.title}</h3>
                <p className="text-gray-400">{downloadedTrack.artist}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Audio</h4>
                    <p className="text-white truncate">{downloadedTrack.audioUrl}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Track ID</h4>
                    <p className="text-white">{downloadedTrack.trackId}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Duration</h4>
                    <p className="text-white">{downloadedTrack.metadata.duration}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Tags</h4>
                    <p className="text-white">
                      {downloadedTrack.metadata.tags?.slice(0, 3).join(', ') || 'No tags'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400">Required Manual Input</h4>
                  <div className="flex gap-4 mt-2">
                    <div className="bg-zinc-700 rounded px-3 py-1 text-sm">
                      <span className="text-gray-400 mr-2">BPM:</span>
                      <span className="text-white">{downloadedTrack.metadata.bpm || 'Need to set'}</span>
                    </div>
                    <div className="bg-zinc-700 rounded px-3 py-1 text-sm">
                      <span className="text-gray-400 mr-2">Key:</span>
                      <span className="text-white">{downloadedTrack.metadata.key || 'Need to set'}</span>
                    </div>
                  </div>
                </div>
                
                <audio className="mt-4 w-full" controls src={downloadedTrack.audioUrl} />
              </div>
            </div>
          </div>
        )}
        
        {recentDownloads.length > 0 && (
          <div className="bg-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Recent Downloads
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentDownloads.map((track) => (
                <div key={track.trackId} className="flex gap-4 p-3 bg-zinc-700/50 rounded-lg">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={track.coverUrl}
                      alt={track.title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{track.title}</h3>
                    <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs bg-zinc-600 text-gray-300 px-2 py-0.5 rounded">
                        ID: {track.trackId}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 