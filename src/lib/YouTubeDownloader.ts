import { exec } from 'child_process'
import util from 'util'
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { updateTracksData } from './scanTracks'
import { Track } from '@/types/track'
import { trackHistory } from './models/TrackHistory'
import { getScheduler } from './models/Scheduler'
import { uploadFileToR2, fileExistsInR2 } from './r2Uploader'
import { isProd, getR2PublicUrl, CDN_BASE_URL } from './r2Config'

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
      
      // Get scheduler instance
      const scheduler = await getScheduler()
      const state = scheduler.getState()
      
      // Check if track is already in downloadedTrackIds
      if (state.downloadedTrackIds?.includes(youtubeId)) {
        console.log(`⏭️ Skipping already downloaded track: ${youtubeId}`)
        return {
          success: false,
          message: 'Track has already been downloaded',
          youtubeId
        }
      }
      
      // Check if this track has already been downloaded (legacy check)
      const existingTrack = await trackHistory.getTrackByYoutubeId(youtubeId)
      if (existingTrack) {
        // Add to downloadedTrackIds if found in legacy system
        if (!state.downloadedTrackIds) {
          state.downloadedTrackIds = []
        }
        state.downloadedTrackIds.push(youtubeId)
        await scheduler.saveState()
        
        return {
          success: false,
          message: 'Track has already been downloaded',
          trackId: existingTrack.id,
          youtubeId
        }
      }
      
      // Generate a unique ID for the track
      const trackId = `track_${uuidv4().replace(/-/g, '').substring(0, 16)}`
      
      // Set paths differently based on environment
      let audioFilePath, coverFilePath, metadataFilePath;
      
      // In production, use temp directory
      if (isProd) {
        const tempDir = path.join('/tmp', trackId);
        await fsPromises.mkdir(tempDir, { recursive: true });
        
        audioFilePath = path.join(tempDir, `audio.mp3`);
        coverFilePath = path.join(tempDir, `cover.jpg`);
        metadataFilePath = path.join(tempDir, `metadata.json`);
      } else {
        // In development, use local filesystem
        const publicDir = path.join(process.cwd(), 'public');
        const audioDir = path.join(publicDir, 'audio');
        const coverDir = path.join(publicDir, 'images/covers');
        const dataDir = path.join(process.cwd(), 'data');
        
        await fsPromises.mkdir(audioDir, { recursive: true });
        await fsPromises.mkdir(coverDir, { recursive: true });
        await fsPromises.mkdir(dataDir, { recursive: true });
        
        audioFilePath = path.join(audioDir, `${trackId}.mp3`);
        coverFilePath = path.join(coverDir, `${trackId}.jpg`);
        metadataFilePath = path.join(dataDir, `${trackId}.json`);
      }
      
      // Download metadata first to check if the track exists and get info
      const metadataResult = await this.downloadMetadata(url, metadataFilePath)
      if (!metadataResult.success) {
        console.log(`❌ Metadata error: ${metadataResult.message}`)
        return {
          success: false,
          message: metadataResult.message,
          youtubeId
        }
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
      
      // Define R2 paths
      const audioR2Path = `tracks/${trackId}.mp3`
      const coverR2Path = `covers/${trackId}.jpg`
      
      // Upload files to R2
      console.log(`📦 Uploading to R2: audio=${audioR2Path}, cover=${coverR2Path}`)
      
      try {
        // Upload audio file
        const audioBuffer = fs.readFileSync(audioFilePath)
        await uploadFileToR2(audioFilePath, audioR2Path)
        console.log(`✅ Uploaded audio to R2: ${audioR2Path}`)
        
        // Download and upload thumbnail
        const imageRes = await fetch(metadata.thumbnail)
        const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
        await uploadFileToR2(coverFilePath, coverR2Path)
        console.log(`✅ Uploaded cover to R2: ${coverR2Path}`)
        
        // Generate public URLs
        const audioUrl = getR2PublicUrl(audioR2Path)
        const coverUrl = getR2PublicUrl(coverR2Path)
        
        // Create track data
        const trackData = {
          id: trackId,
          title: metadata.title,
          artist: 'Prod AI',
          coverUrl: coverUrl,
          price: 12.99,
          bpm: 140,
          key: 'C',
          duration: metadata.duration,
          tags: metadata.tags,
          audioUrl: audioUrl,
          licenseType: 'Non-Exclusive'
        }
        
        // Save full metadata
        const fullMetadata = {
          ...metadata,
          trackId,
          youtubeId,
          audioUrl,
          coverUrl,
          sourceUrl: url,
          downloadDate: new Date().toISOString()
        }
        
        fs.writeFileSync(metadataFilePath, JSON.stringify(fullMetadata, null, 2))
        
        // Add to track history
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
          websiteUrl: audioUrl,
          websiteId: trackId,
          sourceType,
          sourceId
        })
        
        // Add to tracks data
        await updateTracksData([trackData as Track])
        
        // Add to downloadedTrackIds
        if (!state.downloadedTrackIds) {
          state.downloadedTrackIds = []
        }
        state.downloadedTrackIds.push(youtubeId)
        await scheduler.saveState()
        
        // Clean up temp files in production
        if (isProd) {
          try {
            fs.unlinkSync(audioFilePath)
            fs.unlinkSync(coverFilePath)
            fs.unlinkSync(metadataFilePath)
            
            const tempDir = path.dirname(audioFilePath)
            fs.rmdirSync(tempDir)
          } catch (cleanupError) {
            console.warn('Error cleaning up temp files:', cleanupError)
          }
        }
        
        return {
          success: true,
          message: 'Track downloaded and uploaded successfully',
          trackId,
          youtubeId,
          trackData
        }
      } catch (uploadError) {
        console.error('Error uploading to R2:', uploadError)
        return {
          success: false,
          message: 'Failed to upload files to R2 storage'
        }
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
      // Get metadata using JSON output format
      const { stdout } = await execPromise(`yt-dlp --print-json --skip-download ${url}`)
      const metadata = JSON.parse(stdout)
      
      // Validate duration - skip if too short (likely not a full track)
      if (!metadata.duration || metadata.duration < 30) {
        return {
          success: false,
          message: 'Track too short (less than 30 seconds) - likely not a full track'
        }
      }
      
      // Extract and validate title
      const title = metadata.title?.trim()
      if (!title) {
        return {
          success: false,
          message: 'Track title is required'
        }
      }
      
      // Extract relevant fields with proper defaults
      const processedMetadata = {
        title,
        artist: 'Prod AI', // Always use Prod AI as artist
        duration: metadata.duration, // Keep as number in seconds
        bpm: 140, // Default BPM for now
        price: 12.99, // Fixed price
        thumbnail: metadata.thumbnail,
        tags: metadata.tags || [],
        upload_date: metadata.upload_date,
        uploader_id: metadata.uploader_id,
        track: metadata.track,
        album: metadata.album,
        licenseType: 'Non-Exclusive'
      }
      
      // Save metadata to file
      fs.writeFileSync(outputPath, JSON.stringify(processedMetadata, null, 2))
      
      return {
        success: true,
        message: 'Metadata downloaded successfully',
        metadata: processedMetadata
      }
    } catch (error) {
      console.error('Error downloading metadata:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to download metadata'
      }
    }
  }

  /**
   * Download audio from YouTube
   */
  private static async downloadAudio(url: string, outputPath: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔊 Downloading audio from ${url}`)
      
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
      console.log(`🖼️ Downloading thumbnail from ${url}`)
      
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
      const schedulerInstance = await getScheduler()
      const status = schedulerInstance.getStatus()
      const source = status.sources.find(s => s.id === sourceId)
      
      if (!source) {
        return {
          success: false,
          message: `Source with ID ${sourceId} not found`,
          downloaded: 0,
          failed: 0,
          skipped: 0
        }
      }
      
      // Add log entry
      const schedulerLog = await getScheduler()
      schedulerLog.addLog(
        `Starting download from ${source.type}: ${source.source}`,
        'info',
        sourceId
      )
      
      // Use yt-dlp to get all video IDs from the channel or playlist, capturing stdout directly
      let command = `yt-dlp --flat-playlist --get-id "${source.source}"`
      console.log(`Executing command: ${command}`);
      
      try {
        // Execute command and capture stdout directly
        const { stdout } = await execPromise(command);
        
        // Parse video IDs from stdout
        const videoIds = stdout.trim().split('\n').filter(Boolean);
        
        // Add debugging log
        console.log(`✅ yt-dlp extracted ${videoIds.length} video IDs successfully`);
        if (videoIds.length > 0) {
          console.log(`Sample IDs: ${videoIds.slice(0, 3).join(', ')}${videoIds.length > 3 ? '...' : ''}`);
        }
        
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
          
          // Log before downloading
          console.log(`🎧 Downloading audio for: ${videoId} (${videoUrl})`);
          
          // Download the track
          const result = await this.downloadTrack(videoUrl, source.type, source.id)
          
          if (result.success) {
            downloaded++
            schedulerLog.addLog(
              `Downloaded track: ${result.trackData?.title || videoId}`,
              'success',
              sourceId
            )
          } else {
            failed++
            schedulerLog.addLog(
              `Failed to download track: ${videoId} - ${result.message}`,
              'error',
              sourceId
            )
          }
        }
        
        // Update the last checked time
        await schedulerInstance.updateSourceLastChecked(source.id)
        
        // Add final log entry
        schedulerLog.addLog(
          `Completed download from ${source.type}. Downloaded: ${downloaded}, Failed: ${failed}, Skipped: ${skipped}`,
          'info',
          sourceId
        )
        
        // Add debugging log
        console.log(`💾 Saved state to R2 for source: ${sourceId}`);
        
        return {
          success: true,
          message: `Completed download from ${source.type}`,
          downloaded,
          failed,
          skipped
        }
      } catch (execError: any) {
        console.error('Error executing yt-dlp command:', execError);
        schedulerLog.addLog(
          `Failed to extract video IDs from ${source.type}: ${execError.message || 'Unknown error'}`,
          'error',
          sourceId
        );
        
        return {
          success: false,
          message: `Error executing yt-dlp command: ${execError.message || 'Unknown error'}`,
          downloaded: 0,
          failed: 0,
          skipped: 0
        };
      }
    } catch (error) {
      console.error('Error downloading all tracks:', error)
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
      // Get initialized scheduler instance
      const schedulerInstance = await getScheduler()
      
      // Get all active sources
      const sources = schedulerInstance.getActiveSources()
      
      if (sources.length === 0) {
        return {
          success: true,
          message: 'No active sources to check',
          results: []
        }
      }
      
      console.log(`🔄 Starting scheduler run for ${sources.length} active sources`);
      
      // Results for each source
      const results = []
      
      // Process each source
      for (const source of sources) {
        console.log(`📁 Processing source: ${source.source} (${source.type})`);
        const result = await this.downloadAllFromSource(source.id)
        results.push({
          sourceId: source.id,
          source: source.source,
          type: source.type,
          ...result
        })
      }
      
      // Update the next run time
      await schedulerInstance.updateNextRun()
      
      console.log(`💾 Updated next run time in R2`);
      
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