import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { uploadFileToR2 } from './r2Uploader';
import { getR2PublicUrl } from './r2Config';
import { Track } from '../types/track';

// Constants
const TEMP_DIR = path.join(process.cwd(), 'tmp');
const TRACKS_DIR = path.join(process.cwd(), 'tracks');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Downloads and processes a track from YouTube
 * @param videoId YouTube video ID
 * @param videoUrl Full YouTube URL
 * @returns Track object with metadata and URLs
 */
export async function importTrackFromYoutube(videoId: string, videoUrl: string): Promise<Track | null> {
  try {
    console.log(`Starting import for YouTube video: ${videoId}`);
    
    // Create a unique slug for this track
    const slug = `yt-${videoId}-${Date.now()}`;
    const tempTrackDir = path.join(TEMP_DIR, slug);
    
    // Create temp directory for this track
    if (!fs.existsSync(tempTrackDir)) {
      fs.mkdirSync(tempTrackDir, { recursive: true });
    }
    
    // 1. Download video using yt-dlp
    console.log(`Downloading video ${videoId} using yt-dlp...`);
    const ytDlpCommand = `yt-dlp "${videoUrl}" --write-thumbnail --extract-audio --audio-format mp3 --audio-quality 0 --output "${tempTrackDir}/%(title)s.%(ext)s" --write-info-json`;
    
    try {
      execSync(ytDlpCommand, { stdio: 'inherit' });
    } catch (error) {
      console.error('yt-dlp download failed:', error);
      return null;
    }
    
    // 2. Find the downloaded files
    const files = fs.readdirSync(tempTrackDir);
    const audioFile = files.find(f => f.endsWith('.mp3'));
    const thumbnailFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.png'));
    const infoFile = files.find(f => f.endsWith('.info.json'));
    
    if (!audioFile || !infoFile) {
      console.error('Required files not found after download');
      return null;
    }
    
    // 3. Parse metadata from info file
    const infoFilePath = path.join(tempTrackDir, infoFile);
    const metadata = JSON.parse(fs.readFileSync(infoFilePath, 'utf8'));
    
    // 4. Process thumbnail if exists, or use a default
    let thumbnailPath = '';
    if (thumbnailFile) {
      thumbnailPath = path.join(tempTrackDir, thumbnailFile);
    }
    
    // 5. Upload audio file to R2
    const audioFilePath = path.join(tempTrackDir, audioFile);
    const audioR2Key = `audio/${slug}.mp3`;
    const audioPublicUrl = await uploadFileToR2(audioFilePath, audioR2Key);
    
    // 6. Upload cover image to R2 if available
    let coverPublicUrl = '';
    if (thumbnailPath) {
      const imageExt = path.extname(thumbnailPath);
      const coverR2Key = `cover/${slug}${imageExt}`;
      coverPublicUrl = await uploadFileToR2(thumbnailPath, coverR2Key);
    } else {
      // Use a default cover image
      coverPublicUrl = getR2PublicUrl('defaults/default-cover.jpg');
    }
    
    // 7. Extract basic metadata
    const title = metadata.title || 'Unknown Track';
    const artist = metadata.artist || metadata.uploader || 'Unknown Artist';
    // Default to common values for music
    const bpm = 120; // Default BPM
    const key = 'C'; // Default key
    
    // 8. Create a track object
    const track: Track = {
      id: videoId,
      title,
      artist,
      coverUrl: coverPublicUrl,
      audioUrl: audioPublicUrl,
      bpm,
      key,
      duration: formatDuration(metadata.duration || 0),
      tags: Array.isArray(metadata.tags) ? metadata.tags.slice(0, 5) : [],
      price: 29.99, // Default price
      licenseType: 'Non-Exclusive',
      videoId,
      downloadDate: new Date().toISOString(),
      slug
    };
    
    // 9. Save track to storage
    saveTrackToStorage(track);
    
    // 10. Clean up temp files
    fs.rmSync(tempTrackDir, { recursive: true, force: true });
    
    return track;
  } catch (error) {
    console.error('Error importing track from YouTube:', error);
    return null;
  }
}

/**
 * Formats seconds into mm:ss format
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Saves track data to persistent storage
 */
function saveTrackToStorage(track: Track): void {
  try {
    // 1. Load existing tracks list
    const tracksFilePath = path.join(process.cwd(), 'tracklist.json');
    let tracks: Track[] = [];
    
    if (fs.existsSync(tracksFilePath)) {
      const tracksData = fs.readFileSync(tracksFilePath, 'utf8');
      tracks = JSON.parse(tracksData);
    }
    
    // 2. Add new track (avoid duplicates)
    const existingIndex = tracks.findIndex(t => t.videoId === track.videoId);
    if (existingIndex >= 0) {
      tracks[existingIndex] = track;
    } else {
      tracks.push(track);
    }
    
    // 3. Save updated list
    fs.writeFileSync(tracksFilePath, JSON.stringify(tracks, null, 2));
    console.log(`Track ${track.title} saved to storage`);
  } catch (error) {
    console.error('Error saving track to storage:', error);
  }
}

/**
 * Imports a batch of tracks from a YouTube channel or playlist
 */
export async function importTracksFromSource(source: string, limit: number = 5): Promise<Track[]> {
  // Implementation for batch imports from a channel or playlist
  // This would use similar logic to the single track import
  // but would handle multiple videos
  console.log(`Importing up to ${limit} tracks from source: ${source}`);
  
  // This is a placeholder - actual implementation would
  // fetch video IDs from the source and process them one by one
  return [];
} 