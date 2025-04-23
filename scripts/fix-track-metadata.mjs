import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

// Promisify exec
const execPromise = promisify(exec);

// Create R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Function to download a file from R2 to temp directory
async function downloadFileFromR2(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Key: key,
    });
    
    const response = await r2Client.send(command);
    
    if (!response.Body) {
      throw new Error(`No body in response for ${key}`);
    }
    
    const tmpDir = path.join(os.tmpdir(), 'prodai-metadata-fix');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const tmpFilePath = path.join(tmpDir, path.basename(key));
    
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(tmpFilePath);
      const stream = response.Body;
      
      stream.pipe(fileStream)
        .on('error', err => {
          fileStream.close();
          reject(err);
        })
        .on('finish', () => {
          fileStream.close();
          resolve(tmpFilePath);
        });
    });
  } catch (error) {
    console.error(`Error downloading ${key}:`, error);
    return null;
  }
}

// Function to get audio duration using ffprobe
async function getAudioDuration(filePath) {
  try {
    // Use ffprobe to get duration
    const { stdout } = await execPromise(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    
    const durationInSeconds = parseFloat(stdout.trim());
    
    if (isNaN(durationInSeconds)) {
      console.warn(`⚠️ Could not parse duration for ${filePath}`);
      return '0:00';
    }
    
    // Format as mm:ss
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error(`Error getting duration for ${filePath}:`, error);
    return '0:00';
  }
}

// Function to parse title and BPM from a YouTube title
function parseYouTubeTitle(title) {
  if (!title) return { title: 'Unknown Track', bpm: 0 };
  
  console.log(`🔍 Parsing YouTube title: "${title}"`);
  
  // Extract BPM
  const bpmMatch = title.match(/\b(\d{2,3})\s*(?:bpm|BPM)\b/);
  const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;
  
  // Clean up the title
  let cleanTitle = title;
  
  // Remove BPM information
  cleanTitle = cleanTitle.replace(/\b\d{2,3}\s*(?:bpm|BPM)\b/i, '');
  
  // Remove common suffixes like "Type Beat", "Instrumental", etc.
  const suffixesToRemove = [
    /(?:type\s*beat)/i,
    /(?:instrumental)/i,
    /(?:prod\s*by\s*[\w\s]+)/i,
    /(?:free)/i,
    /(?:UK drill)/i,
    /(?:drill)/i,
    /(?:trap)/i,
    /(?:hip\s*hop)/i,
    /(?:beat)/i
  ];
  
  for (const suffix of suffixesToRemove) {
    cleanTitle = cleanTitle.replace(suffix, '');
  }
  
  // Trim whitespace and special characters
  cleanTitle = cleanTitle.trim()
    .replace(/^[^\w]+/, '')  // Remove non-word chars from beginning
    .replace(/[^\w]+$/, '')  // Remove non-word chars from end
    .replace(/\s{2,}/g, ' '); // Replace multiple spaces with single space
  
  if (!cleanTitle) {
    cleanTitle = 'Unknown Track';
  }
  
  return { title: cleanTitle, bpm };
}

// Main function to fix track metadata
async function fixTrackMetadata() {
  try {
    console.log('🔍 Starting track metadata fix...');
    
    // Check if ffprobe is installed
    try {
      await execPromise('ffprobe -version');
      console.log('✅ ffprobe is installed');
    } catch (error) {
      console.error('❌ ffprobe is not installed. Please install FFmpeg with ffprobe.');
      return;
    }
    
    // List all objects in the metadata directory
    const listMetadataCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Prefix: 'metadata/',
    });
    
    const metadataResponse = await r2Client.send(listMetadataCommand);
    
    if (!metadataResponse.Contents) {
      console.error('❌ No metadata files found in R2');
      return;
    }
    
    // Extract slugs from metadata filenames
    const slugs = metadataResponse.Contents
      .map(obj => obj.Key)
      .filter(key => key && key.endsWith('.json'))
      .map(key => key.replace('metadata/', '').replace('.json', ''))
      .filter(slug => slug.length > 0);
    
    console.log(`📋 Found ${slugs.length} track slugs from metadata files`);
    console.log(`📋 Sample of slugs (first 5):`, slugs.slice(0, 5));
    
    // Process each slug
    let processedCount = 0;
    let errorCount = 0;
    
    for (const slug of slugs) {
      try {
        console.log(`\n🔄 Processing track: ${slug}`);
        
        // Get existing metadata (to extract the YouTube title)
        const metadataKey = `metadata/${slug}.json`;
        const getMetadataCommand = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
          Key: metadataKey,
        });
        
        let existingMetadata = {};
        let youtubeTitle = '';
        
        try {
          const metadataResponse = await r2Client.send(getMetadataCommand);
          const metadataString = await metadataResponse.Body?.transformToString();
          
          // Handle potential double-encoded JSON
          if (metadataString.startsWith('"') && metadataString.endsWith('"') && metadataString.includes('\\"')) {
            try {
              const unescaped = JSON.parse(metadataString);
              if (typeof unescaped === 'string') {
                existingMetadata = JSON.parse(unescaped);
              }
            } catch (parseError) {
              console.warn(`⚠️ Error parsing double-encoded metadata for ${slug}:`, parseError.message);
              try {
                existingMetadata = JSON.parse(metadataString);
              } catch (e) {
                console.warn(`⚠️ Couldn't parse metadata at all for ${slug}`);
              }
            }
          } else {
            try {
              existingMetadata = JSON.parse(metadataString);
            } catch (parseError) {
              console.warn(`⚠️ Error parsing metadata for ${slug}:`, parseError.message);
            }
          }
          
          // Try to extract YouTube title
          youtubeTitle = existingMetadata.title || '';
          
        } catch (metadataError) {
          console.warn(`⚠️ Error fetching metadata for ${slug}:`, metadataError.message);
        }
        
        // Download the audio file to get duration
        const audioKey = `audio/${slug}.mp3`;
        console.log(`📥 Downloading audio file: ${audioKey}`);
        
        let duration = '0:00';
        const audioFilePath = await downloadFileFromR2(audioKey);
        
        if (audioFilePath) {
          console.log(`✅ Downloaded audio to ${audioFilePath}`);
          duration = await getAudioDuration(audioFilePath);
          console.log(`⏱️ Audio duration: ${duration}`);
          
          // Clean up temp file
          fs.unlinkSync(audioFilePath);
        } else {
          console.warn(`⚠️ Could not download audio file for ${slug}`);
        }
        
        // Parse title and BPM from YouTube title
        const { title, bpm } = parseYouTubeTitle(youtubeTitle);
        console.log(`📝 Parsed title: "${title}"`);
        console.log(`📝 Parsed BPM: ${bpm}`);
        
        // Create new metadata object
        const newMetadata = {
          title,
          bpm,
          duration,
          uploadDate: new Date().toISOString()
        };
        
        console.log(`📝 New metadata:`, newMetadata);
        
        // Upload the new metadata to R2
        const metadataString = JSON.stringify(newMetadata, null, 2);
        const putMetadataCommand = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
          Key: metadataKey,
          Body: metadataString,
          ContentType: 'application/json',
        });
        
        await r2Client.send(putMetadataCommand);
        console.log(`✅ Successfully uploaded fixed metadata for ${slug}`);
        
        processedCount++;
      } catch (slugError) {
        console.error(`❌ Error processing ${slug}:`, slugError);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Metadata fix complete!`);
    console.log(`📊 Processed: ${processedCount}/${slugs.length} tracks`);
    console.log(`📊 Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing track metadata:', error);
  }
}

// Run the script
fixTrackMetadata(); 