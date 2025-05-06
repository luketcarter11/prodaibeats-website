// youtubeTrackImporter.ts (updated)

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToR2, uploadJsonToR2 } from './r2Uploader';
import { getR2PublicUrl } from './r2Config';
import { Track } from '../types/track';
import { extractMetadataFromTitle } from './metadataExtractor';

const TEMP_DIR = path.join(process.cwd(), 'tmp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function importTrackFromYoutube(videoId: string, videoUrl: string): Promise<Track | null> {
  try {
    console.log(`📥 Starting import for YouTube video: ${videoId}`);

    const tempTrackDir = path.join(TEMP_DIR, `yt-${videoId}-${Date.now()}`);
    fs.mkdirSync(tempTrackDir, { recursive: true });

    const ytDlpCommand = `yt-dlp "${videoUrl}" --write-thumbnail --extract-audio --audio-format mp3 --audio-quality 0 --output "${tempTrackDir}/%(title)s.%(ext)s" --write-info-json`;
    execSync(ytDlpCommand, { stdio: 'inherit' });

    const files = fs.readdirSync(tempTrackDir);
    const audioFile = files.find(f => f.endsWith('.mp3'));
    const thumbnailFile = files.find(f => f.match(/\.(jpg|webp|png)$/));
    const infoFile = files.find(f => f.endsWith('.info.json'));
    if (!audioFile || !infoFile) return null;

    const info = JSON.parse(fs.readFileSync(path.join(tempTrackDir, infoFile), 'utf8'));

    const id = `track_${uuidv4().replace(/-/g, '')}`;
    const audioFilePath = path.join(tempTrackDir, audioFile);
    const coverFilePath = thumbnailFile ? path.join(tempTrackDir, thumbnailFile) : '';
    const ext = path.extname(coverFilePath || '.jpg');

    const audioR2Key = `tracks/${id}.mp3`;
    const coverR2Key = `covers/${id}${ext}`;
    const metadataR2Key = `metadata/${id}.json`;

    const audioUrl = getR2PublicUrl(audioR2Key);
    const coverUrl = coverFilePath ? await uploadFileToR2(coverFilePath, coverR2Key) : getR2PublicUrl('defaults/default-cover.jpg');

    const extracted = extractMetadataFromTitle(info.title || '');

    const duration = typeof info.duration === 'number' ? formatDuration(info.duration) : '0:00';

    const track: Track = {
      id,
      title: info.title || 'Untitled',
      artist: info.artist || info.uploader || 'Prod AI',
      bpm: extracted.bpm || 140,
      key: extracted.key || 'C',
      duration,
      price: 12.99,
      coverUrl,
      audioUrl,
      tags: info.tags?.slice(0, 5) || [],
      licenseType: 'Non-Exclusive',
      videoId,
      downloadDate: new Date().toISOString(),
      slug: id,
    };

    // Upload metadata JSON to R2
    await uploadJsonToR2(track, metadataR2Key);

    // Upload audio
    await uploadFileToR2(audioFilePath, audioR2Key);

    // Clean up
    fs.rmSync(tempTrackDir, { recursive: true, force: true });

    console.log(`✅ Uploaded track: ${track.title}`);
    return track;
  } catch (err) {
    console.error('❌ Failed to import track:', err);
    return null;
  }
}

/**
 * Import multiple tracks from a YouTube channel or playlist
 * @param sourceUrl URL of the YouTube channel or playlist
 * @param limit Maximum number of tracks to import
 * @returns Array of imported tracks
 */
export async function importTracksFromSource(sourceUrl: string, limit: number = 5): Promise<Track[]> {
  try {
    console.log(`📥 Starting batch import from source: ${sourceUrl} (limit: ${limit})`);
    
    // Create a unique temporary directory for this import
    const tempSourceDir = path.join(TEMP_DIR, `source-${Date.now()}`);
    fs.mkdirSync(tempSourceDir, { recursive: true });
    
    // Get the playlist or channel video list using yt-dlp
    // --flat-playlist gets just the video info without downloading
    // --max-downloads limits the number of entries
    const ytDlpListCommand = `yt-dlp "${sourceUrl}" --flat-playlist --max-downloads ${limit} --print id --print title`;
    
    const result = execSync(ytDlpListCommand, { encoding: 'utf8' });
    const lines = result.split('\n').filter(line => line.trim());
    
    // Process in pairs (id, title)
    const videos = [];
    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        videos.push({
          id: lines[i],
          title: lines[i + 1]
        });
      }
    }
    
    console.log(`Found ${videos.length} videos`);
    
    // Import each video
    const importedTracks: Track[] = [];
    for (const video of videos) {
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      console.log(`Processing video: ${video.title} (${video.id})`);
      
      try {
        const track = await importTrackFromYoutube(video.id, videoUrl);
        if (track) {
          importedTracks.push(track);
        }
      } catch (error) {
        console.error(`Error importing video ${video.id}:`, error);
      }
    }
    
    // Clean up the temporary directory
    try {
      fs.rmSync(tempSourceDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Warning: Could not clean up temporary directory:', error);
    }
    
    console.log(`✅ Batch import complete. Imported ${importedTracks.length} tracks`);
    return importedTracks;
  } catch (error) {
    console.error('❌ Failed to import tracks from source:', error);
    return [];
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
