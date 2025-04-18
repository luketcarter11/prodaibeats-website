import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface TrackHistoryItem {
  id: string
  youtubeId: string
  title: string
  artist: string
  sourceUrl: string
  downloadDate: string
  localPath: {
    audio: string
    cover: string
    metadata: string
  }
  websiteUrl: string
  websiteId: string
  sourceType: 'channel' | 'playlist' | 'video'
  sourceId: string
}

class TrackHistoryManager {
  private historyFilePath: string
  private history: TrackHistoryItem[]
  private initialized: boolean = false

  constructor() {
    this.historyFilePath = path.join(process.cwd(), 'data', 'track-history.json')
    this.history = []
  }

  /**
   * Initialize the history manager by loading data from disk
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Create the data directory if it doesn't exist
      const dataDir = path.dirname(this.historyFilePath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      // Create the history file if it doesn't exist
      if (!fs.existsSync(this.historyFilePath)) {
        fs.writeFileSync(this.historyFilePath, JSON.stringify({ history: [] }, null, 2))
      }

      // Load the history from the file
      const data = JSON.parse(fs.readFileSync(this.historyFilePath, 'utf8'))
      this.history = Array.isArray(data.history) ? data.history : []
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize track history:', error)
      this.history = []
      this.initialized = true
    }
  }

  /**
   * Save the history to disk
   */
  private async save(): Promise<void> {
    try {
      fs.writeFileSync(this.historyFilePath, JSON.stringify({ history: this.history }, null, 2))
    } catch (error) {
      console.error('Failed to save track history:', error)
    }
  }

  /**
   * Add a new track to the history
   */
  async addTrack(trackData: Omit<TrackHistoryItem, 'id' | 'downloadDate'>): Promise<TrackHistoryItem> {
    await this.initialize()

    // Check if this YouTube track has already been downloaded
    const existingTrack = this.history.find(track => track.youtubeId === trackData.youtubeId)
    if (existingTrack) {
      return existingTrack
    }

    // Create a new track history item
    const newTrack: TrackHistoryItem = {
      ...trackData,
      id: uuidv4(),
      downloadDate: new Date().toISOString()
    }

    // Add to history and save
    this.history.push(newTrack)
    await this.save()

    return newTrack
  }

  /**
   * Get a track by ID
   */
  async getTrackById(id: string): Promise<TrackHistoryItem | null> {
    await this.initialize()
    return this.history.find(track => track.id === id) || null
  }

  /**
   * Get a track by YouTube ID
   */
  async getTrackByYoutubeId(youtubeId: string): Promise<TrackHistoryItem | null> {
    await this.initialize()
    return this.history.find(track => track.youtubeId === youtubeId) || null
  }

  /**
   * Check if a YouTube ID exists in history
   */
  async exists(youtubeId: string): Promise<boolean> {
    await this.initialize()
    return this.history.some(track => track.youtubeId === youtubeId)
  }

  /**
   * Get all tracks with optional filtering and pagination
   */
  async getTracks(options: {
    page?: number
    limit?: number
    sourceId?: string
    search?: string
  } = {}): Promise<{
    items: TrackHistoryItem[]
    total: number
    totalPages: number
  }> {
    await this.initialize()

    const { 
      page = 1, 
      limit = 20, 
      sourceId = 'all',
      search = ''
    } = options

    // Filter tracks
    let filteredTracks = [...this.history]

    // Filter by source
    if (sourceId !== 'all') {
      filteredTracks = filteredTracks.filter(track => track.sourceId === sourceId)
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase()
      filteredTracks = filteredTracks.filter(track => 
        track.title.toLowerCase().includes(searchLower) ||
        track.artist.toLowerCase().includes(searchLower) ||
        track.sourceUrl.toLowerCase().includes(searchLower)
      )
    }

    // Sort by downloadDate descending (newest first)
    filteredTracks.sort((a, b) => new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime())

    // Calculate pagination
    const total = filteredTracks.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    // Get paginated tracks
    const items = filteredTracks.slice(startIndex, endIndex)

    return {
      items,
      total,
      totalPages
    }
  }

  /**
   * Get all unique sources for filtering
   */
  async getSources(): Promise<{ id: string, name: string }[]> {
    await this.initialize()

    // Get unique source IDs and names
    const sourceMap = new Map<string, string>()
    
    this.history.forEach(track => {
      if (!sourceMap.has(track.sourceId)) {
        let name = track.sourceId
        
        // Try to create a readable name from the URL
        if (track.sourceType === 'channel') {
          name = `Channel: ${track.sourceId}`
        } else if (track.sourceType === 'playlist') {
          name = `Playlist: ${track.sourceId}`
        }
        
        sourceMap.set(track.sourceId, name)
      }
    })

    // Convert to array
    return Array.from(sourceMap.entries()).map(([id, name]) => ({ id, name }))
  }

  /**
   * Export history to CSV format
   */
  async exportToCSV(): Promise<string> {
    await this.initialize()

    // CSV header
    const header = [
      'ID',
      'YouTube ID',
      'Title',
      'Artist',
      'Source URL',
      'Download Date',
      'Audio Path',
      'Cover Path',
      'Metadata Path',
      'Website URL',
      'Website ID',
      'Source Type',
      'Source ID'
    ].join(',')

    // CSV rows
    const rows = this.history.map(track => [
      track.id,
      track.youtubeId,
      `"${track.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${track.artist.replace(/"/g, '""')}"`,
      `"${track.sourceUrl}"`,
      track.downloadDate,
      `"${track.localPath.audio}"`,
      `"${track.localPath.cover}"`,
      `"${track.localPath.metadata}"`,
      `"${track.websiteUrl}"`,
      track.websiteId,
      track.sourceType,
      track.sourceId
    ].join(','))

    // Combine header and rows
    return [header, ...rows].join('\n')
  }
}

// Singleton instance
export const trackHistory = new TrackHistoryManager() 