'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaArrowLeft, FaExternalLinkAlt, FaMusic, FaFolder, FaLink, FaSearch, FaFileExport, FaFilter } from 'react-icons/fa'

interface TrackHistoryItem {
  id: string
  title: string
  artist: string
  sourceUrl: string
  downloadDate: string
  localPath: string
  websiteUrl: string
  sourceType: string
  sourceId: string
}

export default function TrackHistoryPage() {
  const [trackHistory, setTrackHistory] = useState<TrackHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [sources, setSources] = useState<{id: string, name: string}[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 20
  })

  useEffect(() => {
    fetchTrackHistory()
  }, [pagination.currentPage, selectedSource])

  const fetchTrackHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tracks/history?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}&source=${selectedSource}&search=${searchTerm}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch track history')
      }
      
      const data = await response.json()
      setTrackHistory(data.items || [])
      setPagination({
        ...pagination,
        totalPages: data.totalPages || 1
      })
      
      // Get unique sources for filtering
      if (sources.length === 0) {
        const sourcesResponse = await fetch('/api/tracks/history/sources')
        if (sourcesResponse.ok) {
          const sourcesData = await sourcesResponse.json()
          setSources([{ id: 'all', name: 'All Sources' }, ...(sourcesData.sources || [])])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({...pagination, currentPage: 1})
    fetchTrackHistory()
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setPagination({...pagination, currentPage: 1})
    fetchTrackHistory()
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/tracks/history/export')
      
      if (!response.ok) {
        throw new Error('Failed to export track history')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `track-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (err) {
      return 'Invalid date'
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
        <h1 className="text-3xl font-bold text-white">Track Download History</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 text-red-400 rounded-lg">
          {error}
          <button 
            className="ml-4 text-red-400 hover:text-red-300"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="bg-zinc-900 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, artist, or URL..."
                className="w-full p-3 pl-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="appearance-none pl-10 pr-8 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              >
                {sources.map(source => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 pointer-events-none">
                ▼
              </div>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <FaFileExport /> Export CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Track</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Source</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Downloaded</th>
                <th className="text-center py-3 px-4 text-zinc-400 font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400">
                    Loading track history...
                  </td>
                </tr>
              ) : trackHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400">
                    No tracks found. Start downloading from YouTube Music to see your history here.
                  </td>
                </tr>
              ) : (
                trackHistory.map((track) => (
                  <tr key={track.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{track.title}</span>
                        <span className="text-zinc-400">{track.artist}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-300 capitalize">{track.sourceType}</span>
                        <a 
                          href={track.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm truncate max-w-[200px] inline-block"
                        >
                          {track.sourceUrl.length > 30 ? track.sourceUrl.substring(0, 30) + '...' : track.sourceUrl}
                        </a>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-300">{formatDate(track.downloadDate)}</span>
                        <span className="text-zinc-500 text-sm flex items-center gap-1">
                          <FaFolder className="w-3 h-3" /> {track.localPath}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <a 
                          href={track.sourceUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-zinc-300 p-2 hover:bg-zinc-800 rounded"
                          aria-label="Original source"
                          title="View original YouTube source"
                        >
                          <FaMusic />
                        </a>
                        <a 
                          href={track.websiteUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 p-2 hover:bg-zinc-800 rounded"
                          aria-label="View on website"
                          title="View track on website"
                        >
                          <FaLink />
                        </a>
                        <a 
                          href={`/api/tracks/preview?id=${track.id}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-zinc-300 p-2 hover:bg-zinc-800 rounded"
                          aria-label="Preview track"
                          title="Listen to track preview"
                        >
                          <FaExternalLinkAlt />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {trackHistory.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-zinc-400">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
                disabled={pagination.currentPage === 1}
                className="bg-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-700 text-white px-3 py-1 rounded"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
                disabled={pagination.currentPage === pagination.totalPages}
                className="bg-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-700 text-white px-3 py-1 rounded"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">How This Works</h2>
        <div className="text-zinc-400 space-y-3">
          <p>
            This page displays a complete history of all tracks downloaded from YouTube Music. Every track is stored
            with detailed records of its original source and file paths.
          </p>
          <h3 className="text-lg font-medium text-white mt-4">Key Features:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Duplicate Prevention</strong>: The system checks each track's YouTube URL before downloading to ensure it hasn't been downloaded before.
            </li>
            <li>
              <strong className="text-white">Complete Logging</strong>: All track details are logged, including the original YouTube URL, local file paths, and the link to the track on your website.
            </li>
            <li>
              <strong className="text-white">Search and Filter</strong>: Easily find tracks by title, artist, or URL. Filter by source to see tracks from specific YouTube channels or playlists.
            </li>
            <li>
              <strong className="text-white">CSV Export</strong>: Export your track history to a CSV file for use in other applications or for backup purposes.
            </li>
          </ul>
          <p className="mt-4">
            This data is crucial for your automated YouTube upload workflow, as it provides the necessary links between your original sources
            and your website's tracks.
          </p>
        </div>
      </div>
    </div>
  )
} 