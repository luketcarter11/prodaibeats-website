import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { getScheduler } from './models/Scheduler'

const execAsync = promisify(exec)

interface YouTubeDownloadResult {
  id: string
  title: string
  artist: string
  thumbnail: string
  audioPath: string
}

/**
 * This function should be called by a cron job every minute to check
 * if the scheduler should run and download new tracks.
 */
export async function checkAndRunScheduler(): Promise<void> {
  const scheduler = getScheduler()
  
  // Check if scheduler should run
  if (!scheduler.shouldRun()) {
    console.log('Scheduler check: Not scheduled to run yet')
    return
  }
  
  console.log('Running scheduled YouTube Music check')
  scheduler.addLog('Running scheduled YouTube Music check', 'info')
  
  try {
    // Get all active sources
    const sources = scheduler.getActiveSources()
    
    if (sources.length === 0) {
      console.log('No active sources to check')
      scheduler.addLog('No active sources to check', 'info')
      return
    }
    
    // Process each source
    for (const source of sources) {
      try {
        console.log(`Checking source: ${source.source}`)
        scheduler.addLog(`Checking source: ${source.source}`, 'info', source.id)
        
        // Get last check time
        const lastChecked = source.lastChecked ? new Date(source.lastChecked) : null
        
        // Check for new tracks
        const newTracks = await checkForNewTracks(source.source, source.type, lastChecked)
        
        if (newTracks.length === 0) {
          console.log(`No new tracks found for ${source.source}`)
          scheduler.addLog(`No new tracks found`, 'info', source.id)
        } else {
          console.log(`Found ${newTracks.length} new tracks for ${source.source}`)
          scheduler.addLog(`Found ${newTracks.length} new tracks`, 'success', source.id)
          
          // Download each track
          for (const track of newTracks) {
            try {
              await downloadTrack(track)
              scheduler.addLog(`Downloaded: ${track}`, 'success', source.id)
            } catch (error) {
              console.error(`Error downloading track ${track}:`, error)
              scheduler.addLog(`Failed to download: ${track}`, 'error', source.id)
            }
          }
        }
        
        // Update last checked time
        scheduler.updateSourceLastChecked(source.id)
      } catch (error) {
        console.error(`Error processing source ${source.source}:`, error)
        scheduler.addLog(`Error checking source: ${error instanceof Error ? error.message : String(error)}`, 'error', source.id)
      }
    }
    
    // Update next run time
    scheduler.updateNextRun()
    console.log('Scheduler run completed')
    scheduler.addLog('Scheduler run completed', 'info')
  } catch (error) {
    console.error('Error running scheduler:', error)
    scheduler.addLog(`Scheduler error: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

async function checkForNewTracks(source: string, type: 'channel' | 'playlist', lastChecked: Date | null): Promise<string[]> {
  try {
    // Command options for yt-dlp
    const dateFilter = lastChecked 
      ? `--dateafter ${lastChecked.toISOString().split('T')[0]}` 
      : ''
    
    // Different options based on source type
    const options = type === 'channel'
      ? `--flat-playlist --skip-download --print id`
      : `--flat-playlist --skip-download --print id`
    
    // Execute yt-dlp to get track IDs only
    const { stdout } = await execAsync(`yt-dlp ${options} ${dateFilter} "${source}"`)
    
    // Parse track IDs
    return stdout.trim().split('\n').filter(id => id.trim().length > 0)
  } catch (error) {
    console.error('Error checking for new tracks:', error)
    throw new Error(`Failed to check for new tracks: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function downloadTrack(trackId: string): Promise<YouTubeDownloadResult> {
  try {
    // Create directories if they don't exist
    const publicDir = path.join(process.cwd(), 'public')
    const audioDir = path.join(publicDir, 'audio')
    const coversDir = path.join(publicDir, 'images', 'covers')
    const dataDir = path.join(process.cwd(), 'data')
    
    ;[audioDir, coversDir, dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
    
    // Output template for audio file
    const outputTemplate = path.join(audioDir, '%(title)s.%(ext)s')
    
    // Download track with metadata
    const { stdout } = await execAsync(`yt-dlp -x --audio-format mp3 --audio-quality 192k -o "${outputTemplate}" --write-thumbnail --print-json "https://music.youtube.com/watch?v=${trackId}"`)
    
    // Parse track info
    const trackInfo = JSON.parse(stdout)
    
    // Sanitize filename for consistency
    const sanitizedTitle = trackInfo.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    
    // Generate output paths
    const audioPath = path.join(audioDir, `${sanitizedTitle}.mp3`)
    const thumbnailPath = path.join(coversDir, `${sanitizedTitle}.jpg`)
    const metadataPath = path.join(dataDir, `${trackId}.json`)
    
    // Move and rename thumbnail if it exists
    if (trackInfo.thumbnail) {
      const thumbnailExt = path.extname(trackInfo.thumbnail)
      const originalThumbnailPath = path.join(audioDir, `${trackInfo.title}.${thumbnailExt}`)
      
      if (fs.existsSync(originalThumbnailPath)) {
        // Convert to JPG if needed
        if (thumbnailExt.toLowerCase() !== '.jpg') {
          await execAsync(`ffmpeg -i "${originalThumbnailPath}" "${thumbnailPath}"`)
          fs.unlinkSync(originalThumbnailPath)
        } else {
          fs.renameSync(originalThumbnailPath, thumbnailPath)
        }
      }
    }
    
    // Extract metadata
    const metadata = {
      id: trackId,
      title: trackInfo.title,
      artist: trackInfo.artist || trackInfo.uploader || 'Unknown Artist',
      description: trackInfo.description || '',
      uploadDate: trackInfo.upload_date,
      duration: trackInfo.duration,
      audioPath: `/audio/${sanitizedTitle}.mp3`,
      coverImage: `/images/covers/${sanitizedTitle}.jpg`,
      source: trackInfo.webpage_url,
      downloaded: new Date().toISOString()
    }
    
    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    
    return {
      id: trackId,
      title: trackInfo.title,
      artist: metadata.artist,
      thumbnail: thumbnailPath,
      audioPath
    }
  } catch (error) {
    console.error(`Error downloading track ${trackId}:`, error)
    throw new Error(`Failed to download track: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Function to manually trigger the scheduler
export async function runSchedulerNow(): Promise<void> {
  const scheduler = getScheduler()
  
  console.log('Manually triggering YouTube Music check')
  scheduler.addLog('Manually triggering YouTube Music check', 'info')
  
  // Run the scheduler
  await checkAndRunScheduler()
} 