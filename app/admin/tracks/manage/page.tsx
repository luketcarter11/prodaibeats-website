'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaArrowLeft, FaSync } from 'react-icons/fa'
import { tracks as initialTracks } from '@/lib/data'
import type { Track } from '@/types/track'

export default function ManageTracksPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<null | { success: boolean; message: string; tracksCount: number }>(null)
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  
  const handleScan = async () => {
    try {
      setIsScanning(true)
      setScanResult(null)
      
      const response = await fetch('/api/tracks/scan')
      const data = await response.json()
      
      // Refresh tracks after scan
      if (data.success) {
        // Re-import to get the updated data
        const { tracks: updatedTracks } = require('@/lib/data')
        setTracks(updatedTracks)
      }
      
      setScanResult({
        success: data.success,
        message: data.message,
        tracksCount: data.tracks?.length || 0
      })
    } catch (error) {
      setScanResult({
        success: false,
        message: 'An error occurred while scanning tracks.',
        tracksCount: 0
      })
    } finally {
      setIsScanning(false)
    }
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
        <h1 className="text-3xl font-bold text-white">Manage Tracks</h1>
      </div>

      <div className="bg-zinc-900 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Track Scanner</h2>
        <p className="text-zinc-400 mb-4">
          Scan your local filesystem for tracks and update the website tracklist.
          This will find all tracks in the public/audio directory and update the data.ts file.
        </p>
        
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {isScanning ? (
            <>
              <FaSync className="w-4 h-4 animate-spin" /> Scanning...
            </>
          ) : (
            <>
              <FaSync className="w-4 h-4" /> Scan Local Tracks
            </>
          )}
        </button>
        
        {scanResult && (
          <div className={`mt-4 p-4 rounded-lg ${scanResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            <p>{scanResult.message}</p>
            {scanResult.success && scanResult.tracksCount > 0 && (
              <p className="mt-2">Found {scanResult.tracksCount} tracks.</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Current Tracks ({tracks.length})</h2>
        
        {tracks.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            No tracks found. Download and import tracks from YouTube Music.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left pb-3 text-zinc-400 font-medium">Title</th>
                  <th className="text-left pb-3 text-zinc-400 font-medium">Artist</th>
                  <th className="text-left pb-3 text-zinc-400 font-medium">BPM</th>
                  <th className="text-left pb-3 text-zinc-400 font-medium">Key</th>
                  <th className="text-left pb-3 text-zinc-400 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="py-3 pr-4 text-white">{track.title}</td>
                    <td className="py-3 pr-4 text-zinc-300">{track.artist}</td>
                    <td className="py-3 pr-4 text-zinc-300">{track.bpm} BPM</td>
                    <td className="py-3 pr-4 text-zinc-300">{track.key}</td>
                    <td className="py-3 pr-4 text-zinc-300">${track.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 