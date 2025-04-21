import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { getScheduler } from './models/Scheduler'
import { YouTubeDownloader } from './YouTubeDownloader'

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
  try {
    console.log('🔄 Starting scheduler check...')
    
    // Get the scheduler instance and wait for it to be fully initialized
    const scheduler = await getScheduler()
    console.log('✅ Scheduler instance ready')
  
    // Check if scheduler should run
    if (!scheduler.shouldRun()) {
      console.log('⏱️ Scheduler check: Not scheduled to run yet')
      return
    }
  
    console.log('🚀 Running scheduled YouTube Music check')
    scheduler.addLog('Running scheduled YouTube Music check', 'info')
  
    // Get all active sources
    const sources = scheduler.getActiveSources()
    
    if (sources.length === 0) {
      console.log('⚠️ No active sources to check')
      scheduler.addLog('No active sources to check', 'info')
      return
    }
    
    // Process each source
    for (const source of sources) {
      try {
        console.log(`🔍 Checking source: ${source.source}`)
        scheduler.addLog(`Checking source: ${source.source}`, 'info', source.id)
        
        // Get last check time
        const lastChecked = source.lastChecked ? new Date(source.lastChecked) : null
        
        // Check for new tracks
        const newTracks = await checkForNewTracks(source.source, source.type, lastChecked)
        
        if (newTracks.length === 0) {
          console.log(`✅ No new tracks found for ${source.source}`)
          scheduler.addLog(`No new tracks found`, 'info', source.id)
        } else {
          console.log(`🎵 Found ${newTracks.length} new tracks for ${source.source}`)
          scheduler.addLog(`Found ${newTracks.length} new tracks`, 'success', source.id)
          
          // Download each track
          for (const trackId of newTracks) {
            try {
              const result = await YouTubeDownloader.downloadTrack(
                `https://www.youtube.com/watch?v=${trackId}`,
                source.type,
                source.id
              )
              
              if (result.success) {
                console.log(`✅ Downloaded track: ${result.trackData?.title}`)
                scheduler.addLog(`Downloaded: ${result.trackData?.title}`, 'success', source.id)
              } else {
                console.log(`⏭️ Skipped track: ${result.message}`)
                scheduler.addLog(`Skipped: ${result.message}`, 'info', source.id)
              }
            } catch (error) {
              console.error(`❌ Error downloading track ${trackId}:`, error)
              scheduler.addLog(`Failed to download: ${trackId}`, 'error', source.id)
            }
          }
        }
        
        // Update last checked time
        await scheduler.updateSourceLastChecked(source.id)
      } catch (error) {
        console.error(`❌ Error processing source ${source.source}:`, error)
        scheduler.addLog(`Error checking source: ${error instanceof Error ? error.message : String(error)}`, 'error', source.id)
      }
    }
    
    // Update next run time
    await scheduler.updateNextRun()
    console.log('✅ Scheduler run completed')
    scheduler.addLog('Scheduler run completed', 'info')
  } catch (error) {
    console.error('❌ Error running scheduler:', error)
    console.error(`Scheduler error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function checkForNewTracks(source: string, type: 'channel' | 'playlist', lastChecked: Date | null): Promise<string[]> {
  try {
    console.log(`🔍 Starting check for new tracks from ${source} (${type})`)
    console.log(`⏱️ Last checked: ${lastChecked ? lastChecked.toISOString() : 'Never'}`)
    
    // Convert music.youtube.com to www.youtube.com for better compatibility
    const youtubeUrl = source.replace('music.youtube.com', 'www.youtube.com')
    console.log(`🔄 Using URL: ${youtubeUrl}`)
    
    // Command options for yt-dlp - simplified to just list videos
    const dateFilter = lastChecked 
      ? `--dateafter ${lastChecked.toISOString().split('T')[0].replace(/-/g, '')}` // Convert YYYY-MM-DD to YYYYMMDD
      : ''
    
    console.log(`📅 Date filter: ${dateFilter || 'None'}`)
    
    // Simplified options - just get video IDs with flat playlist
    const options = `--get-id --flat-playlist ${dateFilter}`
    
    console.log(`🔧 yt-dlp options: ${options}`)
    const command = `'/usr/local/Cellar/yt-dlp/2025.3.31/bin/yt-dlp' ${options} '${youtubeUrl}'`
    console.log(`🔧 Full command: ${command}`)
    
    // Run yt-dlp with a timeout
    console.log(`🚀 Executing yt-dlp command with 30 second timeout...`)
    
    // Create a promise that rejects after 30 seconds
    const timeoutPromise = new Promise<{stdout: string, stderr: string}>((_, reject) => {
      setTimeout(() => reject(new Error('Command timed out after 30 seconds')), 30000);
    });
    
    // Create the actual command promise
    const commandPromise = execAsync(command);
    
    // Race the command against the timeout
    const { stdout, stderr } = await Promise.race([commandPromise, timeoutPromise]) as {stdout: string, stderr: string};
    
    if (stderr) {
      console.log(`⚠️ yt-dlp stderr: ${stderr}`)
    }
    
    console.log(`✅ yt-dlp command completed`)
    console.log(`📊 Raw output: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`)
    
    // Parse the output to get track IDs
    const trackIds = stdout.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.trim())
    
    console.log(`📊 Found ${trackIds.length} track IDs`)
    if (trackIds.length > 0) {
      console.log(`📊 First few track IDs: ${trackIds.slice(0, 3).join(', ')}${trackIds.length > 3 ? '...' : ''}`)
    }
    
    return trackIds
  } catch (error) {
    console.error(`❌ Error checking for new tracks: ${error instanceof Error ? error.message : String(error)}`)
    if (error instanceof Error && error.stack) {
      console.error(`❌ Stack trace: ${error.stack}`)
    }
    return []
  }
}

/**
 * Function to manually trigger the scheduler to run immediately
 */
export async function runSchedulerNow(): Promise<void> {
  try {
    console.log('🚀 Manually triggering scheduler...')
    
    // Get the scheduler instance and wait for it to be fully initialized
    const scheduler = await getScheduler()
    console.log('✅ Scheduler instance ready')
    
    // Run the scheduler
    await checkAndRunScheduler()
    
    console.log('✅ Manual scheduler run completed')
  } catch (error) {
    console.error('❌ Error running scheduler manually:', error)
    console.error(`Scheduler error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Main entry point when file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting scheduler...')
  checkAndRunScheduler().catch(error => {
    console.error('Scheduler error:', error)
    process.exit(1)
  })
} 