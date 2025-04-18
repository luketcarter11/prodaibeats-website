#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SOURCES = [
  'https://www.youtube.com/playlist?list=PL1_92PeYYnJnBHwR-G6XpFAMtwWgwjrT7', // Example Lo-Fi playlist
  'https://music.youtube.com/channel/UCf8GBn4oMPCCZKLhFazgYlA'                // Example Lo-Fi channel
];
const TRACKS_DIR = path.join(__dirname, 'tracks');
const DOWNLOADED_FILE = path.join(__dirname, 'downloaded.json');
const TRACKLIST_FILE = path.join(__dirname, 'data', 'tracks.json');
const DATA_DIR = path.join(__dirname, 'data');

// Load environment variables from .env if available
try {
  require('dotenv').config();
} catch (err) {
  console.log('dotenv not available, skipping .env loading');
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error.message);
  }
} else {
  console.log('⚠️ Supabase credentials not found. Using local storage only for deduplication.');
}

// ======= Utility Functions =======

/**
 * Create a slug from a string
 * @param {string} text - Text to slugify
 * @return {string} Slugified text
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
    .substring(0, 80);              // Limit length
}

/**
 * Format duration in seconds to MM:SS
 * @param {number} seconds - Duration in seconds
 * @return {string} Formatted duration (MM:SS)
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Ensure a directory exists
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read JSON from a file or return a default value if file doesn't exist
 * @param {string} filePath - Path to JSON file
 * @param {any} defaultValue - Default value if file doesn't exist
 * @return {any} Parsed JSON or default value
 */
function readJsonSafe(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
  return defaultValue;
}

/**
 * Write data to a JSON file
 * @param {string} filePath - Path to JSON file
 * @param {any} data - Data to write
 * @return {boolean} Success status
 */
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check if a track exists in Supabase by YouTube ID or slug
 * @param {string} youtubeId - YouTube video ID
 * @param {string} slug - Slugified track title
 * @return {Promise<boolean>} True if track exists in Supabase
 */
async function checkTrackExistsInSupabase(youtubeId, slug) {
  if (!supabase) return false;
  
  try {
    // Check by YouTube ID first (preferred method)
    const { data: idData, error: idError } = await supabase
      .from('tracks')
      .select('id')
      .eq('videoId', youtubeId)
      .maybeSingle();
    
    if (idError) {
      console.error('Error checking track by videoId:', idError.message);
    } else if (idData) {
      console.log(`Track with YouTube ID ${youtubeId} already exists in Supabase`);
      return true;
    }
    
    // Check by slug as a fallback
    const { data: slugData, error: slugError } = await supabase
      .from('tracks')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (slugError) {
      console.error('Error checking track by slug:', slugError.message);
    } else if (slugData) {
      console.log(`Track with slug ${slug} already exists in Supabase`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking Supabase for existing track:', error.message);
    return false;
  }
}

/**
 * Save track metadata to Supabase
 * @param {Object} trackData - Track metadata
 * @return {Promise<boolean>} Success status
 */
async function saveTrackToSupabase(trackData) {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase
      .from('tracks')
      .upsert({
        title: trackData.title,
        artist: trackData.artist,
        slug: trackData.slug,
        videoId: trackData.videoId,
        duration: trackData.duration,
        audio: trackData.audio,
        cover: trackData.cover,
        url: trackData.url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving track to Supabase:', error.message);
      return false;
    }
    
    console.log(`Successfully saved track to Supabase: ${trackData.title}`);
    return true;
  } catch (error) {
    console.error('Error saving track to Supabase:', error.message);
    return false;
  }
}

/**
 * Extract information from a YouTube video using yt-dlp
 * @param {string} videoId - YouTube video ID
 * @return {Object} Video metadata
 */
function getVideoInfo(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const command = `yt-dlp --skip-download --print-json --no-warnings "${url}"`;
    const output = execSync(command, { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error(`Error getting info for video ${videoId}:`, error.message);
    return null;
  }
}

/**
 * Download audio file from YouTube video
 * @param {string} videoId - YouTube video ID
 * @param {string} outputPath - Path to save the audio file
 * @return {boolean} Success status
 */
function downloadAudio(videoId, outputPath) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 320k -o "${outputPath}" "${url}"`;
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error downloading audio for ${videoId}:`, error.message);
    return false;
  }
}

/**
 * Download thumbnail from YouTube video
 * @param {string} videoId - YouTube video ID
 * @param {string} outputPath - Path to save the thumbnail
 * @return {boolean} Success status
 */
function downloadThumbnail(videoId, outputPath) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const command = `yt-dlp --skip-download --write-thumbnail --convert-thumbnails jpg -o "${path.dirname(outputPath)}/thumb" "${url}"`;
    execSync(command, { stdio: 'inherit' });
    
    // Find the thumbnail file (it might have a different extension)
    const thumbDir = path.dirname(outputPath);
    const files = fs.readdirSync(thumbDir);
    const thumbFile = files.find(file => file.startsWith('thumb') && file.match(/\.(jpg|jpeg|webp|png)$/i));
    
    if (thumbFile) {
      const thumbPath = path.join(thumbDir, thumbFile);
      fs.renameSync(thumbPath, outputPath);
      return true;
    } else {
      console.error(`Thumbnail file not found for ${videoId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error downloading thumbnail for ${videoId}:`, error.message);
    return false;
  }
}

/**
 * Get list of video IDs from a YouTube playlist or channel
 * @param {string} url - YouTube playlist or channel URL
 * @return {Array<string>} List of video IDs
 */
function getVideoIds(url) {
  try {
    console.log(`Fetching videos from: ${url}`);
    const command = `yt-dlp --flat-playlist --get-id "${url}"`;
    const output = execSync(command, { encoding: 'utf8' });
    return output.split('\n').filter(id => id.trim().length > 0);
  } catch (error) {
    console.error(`Error fetching videos from ${url}:`, error.message);
    return [];
  }
}

/**
 * Check if a track already exists locally
 * @param {string} videoId - YouTube video ID
 * @param {string} slug - Slugified track title
 * @param {Array<string>} downloadedIds - Array of already downloaded video IDs
 * @return {boolean} True if track exists locally
 */
function checkTrackExistsLocally(videoId, slug) {
  // Check in downloaded.json
  const downloadedIds = readJsonSafe(DOWNLOADED_FILE, []);
  if (downloadedIds.includes(videoId)) {
    return true;
  }
  
  // Check if file exists in tracks directory
  const trackDir = path.join(TRACKS_DIR, slug);
  const audioPath = path.join(trackDir, `${slug}.mp3`);
  if (fs.existsSync(audioPath)) {
    return true;
  }
  
  return false;
}

/**
 * Safely run Git commands to commit and push changes
 * @param {boolean} tracksAdded - Whether new tracks were added
 */
function gitCommitAndPush(tracksAdded) {
  if (!tracksAdded) {
    console.log('No new tracks added, skipping general Git operations');
    // We'll still check for changes in tracks.json later
    return;
  }
  
  try {
    console.log('Running Git operations to commit and push new tracks...');
    
    // Check if we're in a Git repository
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch (error) {
      console.log('Not in a Git repository, skipping Git operations');
      return;
    }
    
    // Add all changes except tracks.json (we'll handle that separately)
    console.log('Adding changes to Git...');
    execSync('git add --all -- :!data/tracks.json', { stdio: 'inherit' });
    
    // Check if there are changes to commit
    try {
      const status = execSync('git status --porcelain -- :!data/tracks.json', { encoding: 'utf8' });
      if (!status.trim()) {
        console.log('No general changes to commit');
      } else {
        // Commit changes
        console.log('Committing general changes...');
        execSync('git commit -m "Add new tracks from YouTube Music"', { stdio: 'inherit' });
        
        // Push changes
        console.log('Pushing general changes to remote repository...');
        execSync('git push', { stdio: 'inherit' });
        
        console.log('General Git operations completed successfully');
      }
    } catch (error) {
      console.error('Error during general Git operations:', error.message);
    }
  } catch (error) {
    console.error('Error in Git operations:', error.message);
    console.log('Continuing with script execution...');
  }
}

// ======= Main Functions =======

/**
 * Process a single YouTube video
 * @param {string} videoId - YouTube video ID
 * @param {Array<string>} downloadedIds - List of already downloaded video IDs
 * @param {Array<Object>} tracklist - Current tracklist
 * @return {Promise<Object>} Updated tracklist and downloadedIds
 */
async function processVideo(videoId, downloadedIds, tracklist) {
  // Get basic info to determine slug
  const info = getVideoInfo(videoId);
  if (!info) {
    console.error(`Could not get info for ${videoId}, skipping`);
    return { downloadedIds, tracklist };
  }

  // Extract basic metadata
  const title = info.title || `Track-${videoId}`;
  const slug = slugify(title);
  
  // Multi-layer deduplication check
  
  // 1. Check in downloaded IDs list (memory)
  if (downloadedIds.includes(videoId)) {
    console.log(`Skipping ${videoId} - '${title}' (found in downloaded.json)`);
    return { downloadedIds, tracklist };
  }
  
  // 2. Check in local filesystem
  const trackDir = path.join(TRACKS_DIR, slug);
  const audioPath = path.join(trackDir, `${slug}.mp3`);
  if (fs.existsSync(audioPath)) {
    console.log(`Skipping ${videoId} - '${title}' (MP3 file already exists at ${audioPath})`);
    
    // Add to downloaded IDs if not already there
    if (!downloadedIds.includes(videoId)) {
      downloadedIds.push(videoId);
      writeJson(DOWNLOADED_FILE, downloadedIds);
    }
    
    return { downloadedIds, tracklist };
  }
  
  // 3. Check in Supabase if available
  if (supabase) {
    const existsInSupabase = await checkTrackExistsInSupabase(videoId, slug);
    if (existsInSupabase) {
      console.log(`Skipping ${videoId} - '${title}' (found in Supabase database)`);
      
      // Add to downloaded IDs if not already there
      if (!downloadedIds.includes(videoId)) {
        downloadedIds.push(videoId);
        writeJson(DOWNLOADED_FILE, downloadedIds);
      }
      
      return { downloadedIds, tracklist };
    }
  }
  
  console.log(`Processing video: ${videoId} - '${title}'`);
  
  // Continue with full metadata extraction
  const duration = formatDuration(info.duration || 0);
  const artist = info.artist || info.uploader || 'Unknown Artist';
  
  // Create track directory
  ensureDir(trackDir);
  
  // Define file paths
  const safeFileName = `${slug}.mp3`;
  const coverPath = path.join(trackDir, 'cover.jpg');
  const metadataPath = path.join(trackDir, 'metadata.json');
  
  // Download audio
  console.log(`Downloading audio for: ${title}`);
  const audioSuccess = downloadAudio(videoId, audioPath);
  
  if (!audioSuccess) {
    console.error(`Failed to download audio for ${videoId}, skipping`);
    return { downloadedIds, tracklist };
  }
  
  // Download thumbnail
  console.log(`Downloading thumbnail for: ${title}`);
  const thumbSuccess = downloadThumbnail(videoId, coverPath);
  
  // Create metadata
  const metadata = {
    title,
    artist,
    slug,
    videoId,
    duration,
    uploadDate: info.upload_date,
    description: info.description,
    url: `https://youtube.com/watch?v=${videoId}`,
    downloadDate: new Date().toISOString()
  };
  
  // Save metadata
  writeJson(metadataPath, metadata);
  
  // Add to tracklist
  const trackInfo = {
    title,
    slug,
    artist,
    duration,
    videoId,
    audio: `/tracks/${slug}/${safeFileName}`,
    cover: `/tracks/${slug}/cover.jpg`,
    url: `https://youtube.com/watch?v=${videoId}`
  };
  
  tracklist.push(trackInfo);
  downloadedIds.push(videoId);
  
  console.log(`Successfully processed: ${title}`);
  
  // Save updated files after each successful download
  writeJson(DOWNLOADED_FILE, downloadedIds);
  writeJson(TRACKLIST_FILE, tracklist);
  
  // Save to Supabase if available
  if (supabase) {
    await saveTrackToSupabase(trackInfo);
  }
  
  return { downloadedIds, tracklist };
}

/**
 * Main function to process all sources
 */
async function main() {
  // Ensure directories exist
  ensureDir(TRACKS_DIR);
  ensureDir(DATA_DIR);
  
  // Load existing data
  let downloadedIds = readJsonSafe(DOWNLOADED_FILE, []);
  let tracklist = readJsonSafe(TRACKLIST_FILE, []);
  
  // Store initial counts to determine if new tracks were added
  const initialDownloadedCount = downloadedIds.length;
  
  console.log(`Found ${downloadedIds.length} previously downloaded tracks`);
  console.log(`Current tracklist has ${tracklist.length} tracks`);
  
  // Process each source
  for (const source of SOURCES) {
    const videoIds = getVideoIds(source);
    console.log(`Found ${videoIds.length} videos in source: ${source}`);
    
    for (const videoId of videoIds) {
      const result = await processVideo(videoId, downloadedIds, tracklist);
      downloadedIds = result.downloadedIds;
      tracklist = result.tracklist;
    }
  }
  
  // Final save
  writeJson(DOWNLOADED_FILE, downloadedIds);
  writeJson(TRACKLIST_FILE, tracklist);
  
  // Check if new tracks were added
  const tracksAdded = downloadedIds.length > initialDownloadedCount;
  
  // Commit and push general changes if new tracks were added
  gitCommitAndPush(tracksAdded);
  
  console.log(`Finished processing all sources`);
  console.log(`Total tracks in library: ${tracklist.length}`);
  if (tracksAdded) {
    console.log(`Added ${downloadedIds.length - initialDownloadedCount} new tracks`);
  } else {
    console.log('No new tracks were added');
  }

  // Now handle tracks.json separately as requested
  const tracksJsonPath = path.join(DATA_DIR, 'tracks.json');

  // Function to commit and push tracks.json changes
  const commitAndPushTracksJson = () => {
    try {
      // Check if we're in a Git repository
      try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      } catch (error) {
        console.log('Not in a Git repository, skipping tracks.json Git operations');
        return;
      }
      
      // Check if data/tracks.json has changes
      const gitStatus = execSync('git status --porcelain data/tracks.json', { encoding: 'utf8' });
      
      if (!gitStatus.trim()) {
        console.log('📋 No changes detected in tracks.json, skipping commit and push');
        return;
      }
      
      console.log('🔄 Changes detected in tracks.json, preparing to commit and push');
      
      // Force-add data/tracks.json even if it's in .gitignore
      execSync('git add -f data/tracks.json', { stdio: 'inherit' });
      console.log('✅ Successfully added tracks.json to git');
      
      // Commit with the specified message
      execSync('git commit -m "Update tracks.json with latest track data"', { stdio: 'inherit' });
      console.log('✅ Successfully committed changes');
      
      // Push to the remote GitHub repo (on main)
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ Successfully pushed changes to GitHub');
    } catch (error) {
      console.error('❌ Error committing and pushing tracks.json:', error.message);
      if (error.stderr) {
        console.error('Error details:', error.stderr.toString());
      }
    }
  };

  // Call the function to commit and push tracks.json changes
  if (fs.existsSync(tracksJsonPath)) {
    console.log('🔄 Checking for changes in tracks.json...');
    commitAndPushTracksJson();
  } else {
    console.error('❌ tracks.json file not found at', tracksJsonPath);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 