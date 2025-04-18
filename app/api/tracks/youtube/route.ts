import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DownloadResponse {
  success: boolean;
  message: string;
  data?: {
    trackId: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
    metadata: any;
  };
}

// Ensure the track directory exists
const ensureDirectoryExists = async (directory: string) => {
  try {
    await fs.promises.mkdir(directory, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${directory}:`, error);
    throw error;
  }
};

// Sanitize file name to be used as directory
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 60);
};

export async function POST(request: Request) {
  try {
    const { youtubeUrl } = await request.json();
    
    if (!youtubeUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'YouTube URL is required' 
      }, { status: 400 });
    }

    // Create unique ID for this track
    const trackId = `yt_${Date.now()}`;
    
    // Set up directories
    const publicDir = path.join(process.cwd(), 'public');
    const audioDir = path.join(publicDir, 'audio');
    const coverDir = path.join(publicDir, 'images/covers');
    
    await ensureDirectoryExists(audioDir);
    await ensureDirectoryExists(coverDir);
    
    // Use yt-dlp to download and extract data
    const tempDir = path.join(process.cwd(), 'temp', trackId);
    await ensureDirectoryExists(tempDir);
    
    // Command to download audio, thumbnail, and metadata
    const downloadCmd = `cd ${tempDir} && yt-dlp "${youtubeUrl}" \
      --extract-audio --audio-format mp3 --audio-quality 192k \
      --write-thumbnail --write-info-json \
      --no-playlist --no-keep-video \
      -o "%(title)s.%(ext)s"`;
    
    console.log('Running download command:', downloadCmd);
    
    await execAsync(downloadCmd);
    
    // Read the directory to find the downloaded files
    const files = await fs.promises.readdir(tempDir);
    
    // Find the JSON metadata file
    const jsonFile = files.find(file => file.endsWith('.info.json'));
    if (!jsonFile) {
      throw new Error('Metadata file not found');
    }
    
    // Read metadata
    const metadataPath = path.join(tempDir, jsonFile);
    const metadataRaw = await fs.promises.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataRaw);
    
    // Find the mp3 file
    const mp3File = files.find(file => file.endsWith('.mp3'));
    if (!mp3File) {
      throw new Error('MP3 file not found');
    }
    
    // Find the thumbnail
    let thumbnailFile = files.find(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    if (!thumbnailFile) {
      throw new Error('Thumbnail not found');
    }
    
    // Create sanitized name for the track
    const sanitizedTitle = sanitizeFileName(metadata.title);
    
    // Copy MP3 to public directory
    const mp3TargetPath = path.join(audioDir, `${sanitizedTitle}.mp3`);
    await fs.promises.copyFile(
      path.join(tempDir, mp3File),
      mp3TargetPath
    );
    
    // Copy thumbnail to covers directory
    const thumbnailExt = path.extname(thumbnailFile);
    const coverTargetPath = path.join(coverDir, `${sanitizedTitle}${thumbnailExt}`);
    await fs.promises.copyFile(
      path.join(tempDir, thumbnailFile),
      coverTargetPath
    );
    
    // Create a track object
    const track = {
      trackId,
      title: metadata.title,
      artist: metadata.artist || metadata.uploader || 'Unknown Artist',
      coverUrl: `/images/covers/${sanitizedTitle}${thumbnailExt}`,
      audioUrl: `/audio/${sanitizedTitle}.mp3`,
      metadata: {
        bpm: 0, // To be detected or manually set
        key: 'Unknown', // To be detected or manually set
        duration: metadata.duration_string || '0:00',
        tags: metadata.tags || [],
        originalUrl: youtubeUrl,
        uploadDate: metadata.upload_date,
        description: metadata.description
      }
    };
    
    // Save track metadata to a JSON file that could be used to update your data.ts
    const tracksMetadataDir = path.join(process.cwd(), 'data');
    await ensureDirectoryExists(tracksMetadataDir);
    
    await fs.promises.writeFile(
      path.join(tracksMetadataDir, `${trackId}.json`),
      JSON.stringify(track, null, 2)
    );
    
    // Clean up temp directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Track downloaded successfully',
      data: track
    });
    
  } catch (error: any) {
    console.error('Error downloading track:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: `Error downloading track: ${error.message}` 
    }, { status: 500 });
  }
} 