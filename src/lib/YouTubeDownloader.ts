import { exec } from 'child_process'
import util from 'util'
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { updateTracksData } from './scanTracks'
import { Track } from '@/types/track'
import { trackHistory } from './models/TrackHistory'
import { scheduler } from './models/Scheduler'

const execPromise = util.promisify(exec)

interface DownloadResult {
  success: boolean
  message: string
  trackId?: string
  youtubeId?: string
  trackData?: any
}

export class YouTubeDownloader {
  /**
   * Download a track from YouTube Music
   */
  static async downloadTrack(url: string, sourceType: 'channel' | 'playlist' | 'video', sourceId: string): Promise<DownloadResult> {
    try {
      // Extract YouTube ID from URL
      const youtubeId = this.extractYoutubeId(url)
      if (!youtubeId) {
        return {
          success: false,
          message: 'Invalid YouTube URL'
        }
      }
      
      // Check if this track has already been downloaded
      const existingTrack = await trackHistory.getTrackByYoutubeId(youtubeId)
      if (existingTrack) {
        return {
          success: false,
          message: 'Track has already been downloaded',
          trackId: existingTrack.id,
          youtubeId
        }
      }
      
      // Create necessary directories
      const publicDir = path.join(process.cwd(), 'public')
      const audioDir = path.join(publicDir, 'audio')
      const coverDir = path.join(publicDir, 'images/covers')
      const dataDir = path.join(process.cwd(), 'data')
      
      await fsPromises.mkdir(audioDir, { recursive: true })
      await fsPromises.mkdir(coverDir, { recursive: true })
      await fsPromises.mkdir(dataDir, { recursive: true })
      
      // Generate a unique ID for the track
      const trackId = `track_${uuidv4().replace(/-/g, '').substring(0, 16)}`
      
      // Set up file paths
      const audioFilePath = path.join(audioDir, `${trackId}.mp3`)
      const coverFilePath = path.join(coverDir, `${trackId}.jpg`)
      const metadataFilePath = path.join(dataDir, `${trackId}.json`)
      
      // Download metadata first to check if the track exists and get info
      const metadataResult = await this.downloadMetadata(url, metadataFilePath)
      if (!metadataResult.success) {
        return metadataResult
      }
      
      // Check if the video is truly a music track (should have metadata for a music track)
      const metadata = metadataResult.metadata
      if (!metadata.title || !metadata.artist) {
        // Delete the metadata file since it's not a valid music track
        if (fs.existsSync(metadataFilePath)) {
          fs.unlinkSync(metadataFilePath)
        }
        
        return {
          success: false,
          message: 'Not a valid music track (missing title or artist)',
          youtubeId
        }
      }
      
      // Download audio
      const audioResult = await this.downloadAudio(url, audioFilePath)
      if (!audioResult.success) {
        return audioResult
      }
      
      // Download thumbnail
      const thumbnailResult = await this.downloadThumbnail(url, coverFilePath)
      if (!thumbnailResult.success) {
        return thumbnailResult
      }
      
      // Create track data
      const trackData = {
        id: trackId,
        title: metadata.title,
        artist: metadata.artist,
        coverUrl: `/images/covers/${trackId}.jpg`,
        price: 12.99, // Default to the usual price
        bpm: 0,  // Will be set during import
        key: 'Unknown',  // Will be set during import
        duration: metadata.duration || '0:00',
        tags: metadata.tags || [],
        audioUrl: `/audio/${trackId}.mp3`,
        licenseType: 'Non-Exclusive' // Default license type
      }
      
      // Save full metadata to the JSON file
      const fullMetadata = {
        ...metadata,
        trackId,
        youtubeId,
        audioUrl: `/audio/${trackId}.mp3`,
        coverUrl: `/images/covers/${trackId}.jpg`,
        sourceUrl: url,
        downloadDate: new Date().toISOString()
      }
      
      fs.writeFileSync(metadataFilePath, JSON.stringify(fullMetadata, null, 2))
      
      // Add to track history
      const trackUrl = `/tracks/${trackId}`
      await trackHistory.addTrack({
        youtubeId,
        title: metadata.title,
        artist: metadata.artist,
        sourceUrl: url,
        localPath: {
          audio: audioFilePath,
          cover: coverFilePath,
          metadata: metadataFilePath
        },
        websiteUrl: trackUrl,
        websiteId: trackId,
        sourceType,
        sourceId
      })
      
      // Add to tracks data
      await updateTracksData([trackData as Track])
      
      return {
        success: true,
        message: 'Track downloaded successfully',
        trackId,
        youtubeId,
        trackData
      }
    } catch (error) {
      console.error('Error downloading track:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }
  }

  /**
   * Extract YouTube ID from URL
   */
  static extractYoutubeId(url: string): string | null {
    let match
    
    // Match different YouTube URL formats
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      if (url.includes('v=')) {
        // Standard YouTube watch URL
        match = url.match(/[?&]v=([^&#]*)/)
      } else if (url.includes('youtu.be/')) {
        // Shortened youtu.be URL
        match = url.match(/youtu\.be\/([^?&#]*)/)
      } else if (url.includes('embed/')) {
        // Embed URL
        match = url.match(/embed\/([^?&#]*)/)
      }
      
      return match && match[1] ? match[1] : null
    }
    
    // YouTube Music specific URLs
    if (url.includes('music.youtube.com')) {
      if (url.includes('watch?v=')) {
        // YouTube Music watch URL
        match = url.match(/watch\?v=([^&]*)/)
      } else if (url.includes('browse/')) {
        // YouTube Music browse URL (likely a playlist or album)
        match = url.match(/browse\/([^?&#]*)/)
      }
      
      return match && match[1] ? match[1] : null
    }
    
    return null
  }

  /**
   * Download metadata from YouTube
   */
  private static async downloadMetadata(url: string, outputPath: string): Promise<{ success: boolean; message: string; metadata?: any }> {
    try {
      // Create a temporary file for the metadata
      const tempFile = path.join(process.cwd(), 'data', `temp_${Date.now()}.json`)
      
      // Use yt-dlp to get metadata
      const command = `yt-dlp --skip-download --print-json --no-warnings "${url}" > "${tempFile}"`
      
      await execPromise(command)
      
      // Check if the file was created
      if (!fs.existsSync(tempFile)) {
        return {
          success: false,
          message: 'Failed to download metadata'
        }
      }
      
      // Read the metadata
      const metadataRaw = fs.readFileSync(tempFile, 'utf8')
      let metadata
      
      try {
        metadata = JSON.parse(metadataRaw)
      } catch (e) {
        fs.unlinkSync(tempFile)
        return {
          success: false,
          message: 'Invalid metadata format'
        }
      }
      
      // Extract relevant music metadata
      const extractedMetadata = {
        title: metadata.title || '',
        artist: metadata.artist || metadata.uploader || '',
        album: metadata.album || '',
        duration: this.formatDuration(metadata.duration || 0),
        tags: metadata.tags || [],
        uploadDate: metadata.upload_date || '',
        description: metadata.description || '',
        originalUrl: url,
        youtubeId: metadata.id || ''
      }
      
      // If there's no artist but there's a title with a hyphen, try to extract artist from title
      if (!extractedMetadata.artist && extractedMetadata.title.includes(' - ')) {
        const parts = extractedMetadata.title.split(' - ')
        extractedMetadata.artist = parts[0].trim()
        extractedMetadata.title = parts.slice(1).join(' - ').trim()
      }
      
      // Save the extracted metadata
      fs.writeFileSync(outputPath, JSON.stringify(extractedMetadata, null, 2))
      
      // Clean up
      fs.unlinkSync(tempFile)
      
      return {
        success: true,
        message: 'Metadata downloaded successfully',
        metadata: extractedMetadata
      }
    } catch (error) {
      console.error('Error downloading metadata:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }
  }

  /**
   * Download audio from YouTube
   */
  private static async downloadAudio(url: string, outputPath: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use yt-dlp to download audio
      const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath.replace(/\.mp3$/, '')}.%(ext)s" "${url}"`
      
      await execPromise(command)
      
      // Check if the file was created
      if (!fs.existsSync(outputPath)) {
        return {
          success: false,
          message: 'Failed to download audio'
        }
      }
      
      return {
        success: true,
        message: 'Audio downloaded successfully'
      }
    } catch (error) {
      console.error('Error downloading audio:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }
  }

  /**
   * Download thumbnail from YouTube
   */
  private static async downloadThumbnail(url: string, outputPath: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use yt-dlp to download thumbnail
      const command = `yt-dlp --skip-download --write-thumbnail --convert-thumbnails jpg -o "${outputPath.replace(/\.jpg$/, '')}" "${url}"`
      
      await execPromise(command)
      
      // Check if the file was created
      if (!fs.existsSync(outputPath)) {
        return {
          success: false,
          message: 'Failed to download thumbnail'
        }
      }
      
      return {
        success: true,
        message: 'Thumbnail downloaded successfully'
      }
    } catch (error) {
      console.error('Error downloading thumbnail:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }
  }

  /**
   * Format duration from seconds to MM:SS
   */
  private static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * Download all tracks from a YouTube Music channel or playlist
   */
  static async downloadAllFromSource(sourceId: string): Promise<{ success: boolean; message: string; downloaded: number; failed: number; skipped: number }> {
    try {
      // Get source from scheduler
      const status = await scheduler.getStatus()
      const source = status.sources.find(s => s.id === sourceId)
      
      if (!source) {
        return {
          success: false,
          message: 'Source not found',
          downloaded: 0,
          failed: 0,
          skipped: 0
        }
      }
      
      // Add log entry
      scheduler.addLog(
        `Starting download from ${source.type}: ${source.source}`,
        'info',
        source.id
      )
      
      // Create a temporary file for the video URLs
      const tempFile = path.join(process.cwd(), 'data', `temp_urls_${Date.now()}.txt`)
      
      // Use yt-dlp to get all video URLs from the channel or playlist
      let command
      if (source.type === 'channel') {
        command = `yt-dlp --flat-playlist --get-id "${source.source}" > "${tempFile}"`
      } else { // playlist
        command = `yt-dlp --flat-playlist --get-id "${source.source}" > "${tempFile}"`
      }
      
      await execPromise(command)
      
      // Check if the file was created
      if (!fs.existsSync(tempFile)) {
        scheduler.addLog(
          `Failed to get video list from ${source.type}`,
          'error',
          source.id
        )
        
        return {
          success: false,
          message: 'Failed to get video list',
          downloaded: 0,
          failed: 0,
          skipped: 0
        }
      }
      
      // Read the video URLs
      const videoIds = fs.readFileSync(tempFile, 'utf8').split('\n').filter(Boolean)
      
      // Clean up
      fs.unlinkSync(tempFile)
      
      // Download each video
      let downloaded = 0
      let failed = 0
      let skipped = 0
      
      for (const videoId of videoIds) {
        // Check if this video has already been downloaded
        const exists = await trackHistory.exists(videoId)
        
        if (exists) {
          skipped++
          continue
        }
        
        // Construct the full URL
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
        
        // Download the track
        const result = await this.downloadTrack(videoUrl, source.type, source.id)
        
        if (result.success) {
          downloaded++
          scheduler.addLog(
            `Downloaded track: ${result.trackData?.title || videoId}`,
            'success',
            source.id
          )
        } else {
          failed++
          scheduler.addLog(
            `Failed to download track: ${videoId} - ${result.message}`,
            'error',
            source.id
          )
        }
      }
      
      // Update the last checked time
      await scheduler.updateSourceLastChecked(source.id)
      
      // Add final log entry
      scheduler.addLog(
        `Completed download from ${source.type}. Downloaded: ${downloaded}, Failed: ${failed}, Skipped: ${skipped}`,
        'info',
        source.id
      )
      
      return {
        success: true,
        message: `Completed download from ${source.type}`,
        downloaded,
        failed,
        skipped
      }
    } catch (error) {
      console.error('Error downloading from source:', error)
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        downloaded: 0,
        failed: 0, 
        skipped: 0
      }
    }
  }

  /**
   * Run the scheduler to download tracks from all active sources
   */
  static async runScheduler(): Promise<{ success: boolean; message: string; results: any[] }> {
    try {
      // Get all active sources
      const sources = await scheduler.getActiveSources()
      
      if (sources.length === 0) {
        return {
          success: true,
          message: 'No active sources to check',
          results: []
        }
      }
      
      // Results for each source
      const results = []
      
      // Process each source
      for (const source of sources) {
        const result = await this.downloadAllFromSource(source.id)
        results.push({
          sourceId: source.id,
          source: source.source,
          type: source.type,
          ...result
        })
      }
      
      // Update the next run time
      await scheduler.updateNextRun()
      
      return {
        success: true,
        message: 'Scheduler run completed',
        results
      }
    } catch (error) {
      console.error('Error running scheduler:', error)
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        results: []
      }
    }
  }
} 