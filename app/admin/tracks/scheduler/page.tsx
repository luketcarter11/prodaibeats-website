'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaArrowLeft, FaPlay, FaPause, FaClock, FaTrash, FaExternalLinkAlt, FaCheck, FaTimes } from 'react-icons/fa'

export default function SchedulerPage() {
  const [schedulerStatus, setSchedulerStatus] = useState<'active' | 'paused'>('paused')
  const [nextRunTime, setNextRunTime] = useState<string>('')
  const [trackSources, setTrackSources] = useState<{
    id: string;
    source: string;
    type: 'channel' | 'playlist';
    lastChecked: string;
    active: boolean;
  }[]>([])
  const [newSource, setNewSource] = useState({ source: '', type: 'channel' })
  const [logs, setLogs] = useState<{
    timestamp: string;
    message: string;
    sourceId?: string;
    type: 'info' | 'success' | 'error';
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch scheduler status, track sources and logs
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/tracks/scheduler/status')
        
        if (!response.ok) {
          throw new Error('Failed to fetch scheduler data')
        }
        
        const data = await response.json()
        console.log('Scheduler data:', data) // Debug log
        
        setSchedulerStatus(data.active ? 'active' : 'paused')
        setNextRunTime(data.nextRun || 'Not scheduled')
        setTrackSources(data.sources || [])
        setLogs(data.logs || [])
      } catch (err) {
        console.error('Error fetching scheduler data:', err) // Debug log
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
    
    // Set up polling for status updates every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleToggleScheduler = async () => {
    try {
      const newStatus = schedulerStatus === 'active' ? 'paused' : 'active'
      
      const response = await fetch('/api/tracks/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus === 'active' })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${newStatus === 'active' ? 'activate' : 'pause'} scheduler`)
      }
      
      const data = await response.json()
      setSchedulerStatus(newStatus)
      setNextRunTime(data.nextRun || 'Not scheduled')
      
      // Add log entry
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        message: `Scheduler ${newStatus === 'active' ? 'activated' : 'paused'}`,
        type: 'info'
      }, ...prev.slice(0, 49)]) // Keep last 50 logs
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleAddSource = async () => {
    if (!newSource.source.trim()) {
      setError('Please enter a valid YouTube URL')
      return
    }
    
    try {
      console.log('Adding source:', newSource) // Debug log
      const response = await fetch('/api/tracks/scheduler/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: newSource.source.trim(),
          type: newSource.type
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error adding source:', errorData) // Debug log
        throw new Error(errorData.message || 'Failed to add source')
      }
      
      const data = await response.json()
      console.log('Source added successfully:', data) // Debug log
      setTrackSources(prev => [...prev, data.source])
      setNewSource({ source: '', type: 'channel' })
      
      // Add log entry
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        message: `Added new ${data.source.type}: ${data.source.source}`,
        type: 'success'
      }, ...prev.slice(0, 49)])
    } catch (err) {
      console.error('Error in handleAddSource:', err) // Debug log
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeleteSource = async (id: string) => {
    try {
      const response = await fetch(`/api/tracks/scheduler/sources?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete source')
      }
      
      setTrackSources(prev => prev.filter(source => source.id !== id))
      
      // Add log entry
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        message: `Removed source`,
        type: 'info'
      }, ...prev.slice(0, 49)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleToggleSource = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/tracks/scheduler/sources`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update source')
      }
      
      setTrackSources(prev => prev.map(source => 
        source.id === id ? { ...source, active } : source
      ))
      
      // Add log entry
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        message: `${active ? 'Activated' : 'Deactivated'} source`,
        sourceId: id,
        type: 'info'
      }, ...prev.slice(0, 49)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleRunNow = async () => {
    try {
      const response = await fetch('/api/tracks/scheduler/run', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to start immediate scan')
      }
      
      // Add log entry
      setLogs(prev => [{
        timestamp: new Date().toISOString(),
        message: 'Started immediate scan of all sources',
        type: 'info'
      }, ...prev.slice(0, 49)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    
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
        <h1 className="text-3xl font-bold text-white">Track Scheduler</h1>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-zinc-900 rounded-xl p-6 md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Scheduler Status</h2>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${schedulerStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-zinc-300">Status: <span className="text-white font-medium">{schedulerStatus === 'active' ? 'Active' : 'Paused'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-zinc-500" />
                <span className="text-zinc-300">Next run: <span className="text-white font-medium">{nextRunTime || 'Not scheduled'}</span></span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleToggleScheduler}
                className={`${
                  schedulerStatus === 'active' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white px-4 py-2 rounded-lg flex items-center gap-2`}
              >
                {schedulerStatus === 'active' ? (
                  <>
                    <FaPause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <FaPlay className="w-4 h-4" /> Activate
                  </>
                )}
              </button>
              
              <button
                onClick={handleRunNow}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaPlay className="w-4 h-4" /> Run Now
              </button>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-white mb-3">Track Sources</h3>
          <div className="overflow-hidden mb-6 rounded-lg border border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="text-left py-2 px-4 text-zinc-400 font-medium">Source</th>
                  <th className="text-left py-2 px-4 text-zinc-400 font-medium">Type</th>
                  <th className="text-left py-2 px-4 text-zinc-400 font-medium">Last Checked</th>
                  <th className="text-center py-2 px-4 text-zinc-400 font-medium">Status</th>
                  <th className="py-2 px-4 text-zinc-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trackSources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-400">
                      No sources added yet. Add your first YouTube Music channel or playlist.
                    </td>
                  </tr>
                ) : (
                  trackSources.map((source) => (
                    <tr key={source.id} className="border-t border-zinc-800">
                      <td className="py-3 px-4 text-zinc-300">
                        <div className="flex items-center">
                          <a 
                            href={source.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 truncate max-w-xs flex items-center gap-1"
                          >
                            {source.source.length > 50 ? source.source.substring(0, 50) + '...' : source.source}
                            <FaExternalLinkAlt className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 capitalize">{source.type}</td>
                      <td className="py-3 px-4 text-zinc-300">{formatDate(source.lastChecked)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          source.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}>
                          {source.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleSource(source.id, !source.active)}
                            className={`p-2 rounded-lg ${
                              source.active ? 'text-red-400 hover:bg-red-900/20' : 'text-green-400 hover:bg-green-900/20'
                            }`}
                            aria-label={source.active ? 'Deactivate source' : 'Activate source'}
                          >
                            {source.active ? <FaTimes /> : <FaCheck />}
                          </button>
                          <button
                            onClick={() => handleDeleteSource(source.id)}
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg"
                            aria-label="Delete source"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <h3 className="text-lg font-medium text-white mb-3">Add New Source</h3>
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Track Source</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <label className="text-zinc-400 text-sm block mb-2">YouTube URL (Channel or Playlist)</label>
                <input
                  type="url"
                  value={newSource.source}
                  onChange={(e) => setNewSource({ ...newSource, source: e.target.value })}
                  placeholder="https://music.youtube.com/channel/UC..."
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="text-zinc-400 text-sm block mb-2">Type</label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value as 'channel' | 'playlist' })}
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="channel">Channel</option>
                  <option value="playlist">Playlist</option>
                </select>
              </div>
              <div className="w-full md:w-auto md:self-end">
                <button
                  onClick={handleAddSource}
                  className="w-full md:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add Source
                </button>
              </div>
            </div>
            
            {/* Quick Add Button for UCf8GBn4oMPCCZKLhFazgYlA */}
            <div className="mt-4">
              <button
                onClick={() => {
                  setNewSource({ 
                    source: 'https://music.youtube.com/channel/UCf8GBn4oMPCCZKLhFazgYlA', 
                    type: 'channel' 
                  })
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Quick Add: UCf8GBn4oMPCCZKLhFazgYlA
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Activity Log</h2>
          <div className="h-[400px] overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <div className="text-center py-4 text-zinc-400">
                No activity logs yet
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg text-sm ${
                      log.type === 'success' ? 'bg-green-900/20 text-green-400' :
                      log.type === 'error' ? 'bg-red-900/20 text-red-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium">{log.message}</span>
                      <span className="text-xs opacity-80">{formatDate(log.timestamp)}</span>
                    </div>
                    {log.sourceId && (
                      <div className="text-xs opacity-80">
                        Source: {trackSources.find(s => s.id === log.sourceId)?.source || log.sourceId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Track Download History</h2>
        <p className="text-zinc-400 mb-6">
          View a complete log of all tracks downloaded from YouTube Music, including their original source link,
          local file location, and website URL. This information is crucial for tracking your content and ensuring
          no duplicates are downloaded.
        </p>
        <Link
          href="/admin/tracks/history"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
        >
          View Download History
        </Link>
      </div>
    </div>
  )
} 