import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { Track } from '@/types/track'
import { r2Storage } from '@/lib/r2Storage'

/**
 * Scans the local tracks directories to find all downloaded and imported tracks
 * Extracts metadata from JSON files and audio/image files
 */
export async function scanLocalTracks(): Promise<Track[]> {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const dataDir = path.join(process.cwd(), 'data')
    const tracks: Track[] = []
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Scan the data directory for .imported.json files (tracks that have been imported)
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir)
      const importedJsonFiles = files.filter(file => file.endsWith('.imported.json'))
      
      for (const file of importedJsonFiles) {
        const filePath = path.join(dataDir, file)
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          const trackData = JSON.parse(content)
          
          // Create a Track object from the imported data
          const track: Track = {
            id: trackData.trackId,
            title: trackData.title,
            artist: trackData.artist,
            coverUrl: trackData.coverUrl,
            price: 12.99, // Default to the Non-Exclusive license price
            bpm: trackData.metadata.bpm || 0,
            key: trackData.metadata.key || 'Unknown',
            duration: trackData.metadata.duration || '0:00',
            tags: trackData.metadata.tags || [],
            audioUrl: trackData.audioUrl,
            licenseType: 'Non-Exclusive'
          }
          
          // Verify that the audio and cover files exist
          const audioPath = path.join(publicDir, trackData.audioUrl)
          const coverPath = path.join(publicDir, trackData.coverUrl)
          
          if (fs.existsSync(audioPath) && fs.existsSync(coverPath)) {
            tracks.push(track)
          }
        } catch (error) {
          console.error(`Error processing track file ${file}:`, error)
        }
      }
    }
    
    // Also scan the audio directory for any MP3 files that might not have metadata
    const audioDir = path.join(publicDir, 'audio')
    if (fs.existsSync(audioDir)) {
      const audioFiles = fs.readdirSync(audioDir)
      const mp3Files = audioFiles.filter(file => file.toLowerCase().endsWith('.mp3'))
      
      // For each MP3 file, check if we already have it in our tracks array
      for (const mp3File of mp3Files) {
        const audioUrl = `/audio/${mp3File}`
        const exists = tracks.some(track => track.audioUrl === audioUrl)
        
        if (!exists) {
          // Generate a new ID for this track
          const id = `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`
          
          // Create a basic track with default metadata
          const title = mp3File.replace(/\.mp3$/i, '').replace(/_/g, ' ')
          const track: Track = {
            id,
            title,
            artist: 'Unknown Artist',
            coverUrl: '/images/covers/default-cover.jpg', // Default cover
            price: 12.99,
            bpm: 0,
            key: 'Unknown',
            duration: '0:00',
            tags: [],
            audioUrl,
            licenseType: 'Non-Exclusive'
          }
          
          // Try to find a matching cover image
          const coverDir = path.join(publicDir, 'images/covers')
          if (fs.existsSync(coverDir)) {
            const coverFiles = fs.readdirSync(coverDir)
            
            // Try to match by filename without extension
            const baseName = path.basename(mp3File, '.mp3')
            const matchingCover = coverFiles.find(file => 
              file.toLowerCase().startsWith(baseName.toLowerCase()) && 
              /\.(jpg|jpeg|png|webp)$/i.test(file)
            )
            
            if (matchingCover) {
              track.coverUrl = `/images/covers/${matchingCover}`
            }
          }
          
          tracks.push(track)
        }
      }
    }
    
    return tracks
  } catch (error) {
    console.error('Error scanning tracks:', error)
    return []
  }
}

/**
 * Updates the tracks data in R2 storage
 */
export async function updateTracksData(tracks: Track[]): Promise<boolean> {
  try {
    // Save each track's metadata to R2
    await Promise.all(tracks.map(async (track) => {
      const metadata = {
        title: track.title,
        artist: track.artist,
        price: track.price,
        bpm: track.bpm,
        key: track.key,
        duration: track.duration,
        tags: track.tags,
        description: track.description || '',
        uploadDate: track.downloadDate || new Date().toISOString(),
        waveform: track.waveform,
        licenseType: track.licenseType,
        createdAt: track.createdAt,
        plays: track.plays,
        slug: track.slug,
        videoId: track.videoId
      }

      // Save metadata
      await r2Storage.save(`metadata/${track.id}.json`, JSON.stringify(metadata))
    }))

    // Update the tracks list with deduplication
    const existing = await r2Storage.load<string[]>('tracks/list.json', [])
    const newIds = tracks.map(track => track.id)
    
    // Create a Set to ensure unique IDs
    const uniqueIds = new Set([...existing, ...newIds])
    
    // Convert back to array and sort for consistency
    const merged = Array.from(uniqueIds).sort()
    
    // Only update if there are changes
    if (merged.length !== existing.length || !merged.every((id, i) => id === existing[i])) {
      console.log(`📝 Updating tracks/list.json with ${merged.length} unique track IDs`)
      await r2Storage.save('tracks/list.json', JSON.stringify(merged))
    } else {
      console.log('ℹ️ No changes needed to tracks/list.json - all track IDs already exist')
    }

    return true
  } catch (error) {
    console.error('Error updating tracks data in R2:', error)
    return false
  }
}

/**
 * Ensures the default cover image exists
 */
export async function ensureDefaultCover(): Promise<void> {
  const defaultCoverPath = path.join(process.cwd(), 'public', 'images', 'covers', 'default-cover.jpg')
  
  // Check if default cover exists
  try {
    await fsPromises.access(defaultCoverPath, fs.constants.F_OK)
    // File exists, no need to create it
  } catch (error) {
    // Default cover doesn't exist, create a simple one
    console.log('Creating default cover image...')
    
    try {
      // Create a simple black square as default cover
      // In a production environment, you would want to create a better default image
      // This is just a placeholder
      const defaultImageContent = Buffer.from(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCADIAMgDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/Z',
        'base64'
      )
      
      // Ensure the directory exists
      const coverDir = path.dirname(defaultCoverPath)
      await fsPromises.mkdir(coverDir, { recursive: true })
      
      await fsPromises.writeFile(defaultCoverPath, defaultImageContent, { encoding: 'binary' })
      console.log('Default cover image created successfully')
    } catch (writeError) {
      console.error('Error creating default cover image:', writeError)
    }
  }
} 