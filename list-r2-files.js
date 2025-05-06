// Script to list files in R2 bucket to find audio files
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Configure bucket
const R2_BUCKET = process.env.R2_BUCKET || 'prodai-beats-storage';

// Function to list files with a specific prefix
async function listFiles(prefix = '') {
  try {
    console.log(`🔍 Listing files in R2 bucket with prefix: "${prefix || 'none'}"`);
    
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      MaxKeys: 100, // Adjust as needed
    });
    
    const response = await r2Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found');
      return [];
    }
    
    console.log(`✅ Found ${response.Contents.length} files`);
    
    // Process and display files
    const filesInfo = response.Contents.map(item => ({
      key: item.Key,
      lastModified: item.LastModified,
      size: formatFileSize(item.Size || 0),
    }));
    
    // Print files grouped by directory
    const filesByDirectory = groupByDirectory(filesInfo);
    Object.entries(filesByDirectory).forEach(([directory, files]) => {
      console.log(`\n📁 ${directory || 'Root'}/ (${files.length} files):`);
      files.forEach(file => {
        console.log(`   - ${file.key.split('/').pop()} (${file.size})`);
      });
    });
    
    return filesInfo;
  } catch (error) {
    console.error('❌ Error listing files:', error);
    return [];
  }
}

// Format file size for display
function formatFileSize(sizeInBytes) {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  if (sizeInBytes < 1024 * 1024 * 1024) return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Group files by directory
function groupByDirectory(files) {
  return files.reduce((grouped, file) => {
    const key = file.key;
    const parts = key.split('/');
    let directory = '';
    
    if (parts.length > 1) {
      directory = parts[0];
    }
    
    if (!grouped[directory]) {
      grouped[directory] = [];
    }
    
    grouped[directory].push(file);
    return grouped;
  }, {});
}

// Function to search for audio files specifically
async function findAudioFiles() {
  console.log('🔍 Searching for audio files (.mp3) in R2 bucket...');
  
  try {
    // List all files
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      MaxKeys: 1000, // Adjust as needed
    });
    
    const response = await r2Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found in bucket');
      return [];
    }
    
    // Filter audio files
    const audioFiles = response.Contents
      .filter(item => item.Key?.toLowerCase().endsWith('.mp3'))
      .map(item => ({
        key: item.Key,
        lastModified: item.LastModified,
        size: formatFileSize(item.Size || 0),
      }));
    
    if (audioFiles.length === 0) {
      console.log('❌ No audio files found');
    } else {
      console.log(`✅ Found ${audioFiles.length} audio files:`);
      audioFiles.forEach(file => {
        console.log(`   - ${file.key} (${file.size})`);
      });
    }
    
    return audioFiles;
  } catch (error) {
    console.error('❌ Error searching for audio files:', error);
    return [];
  }
}

// Main function
async function main() {
  console.log('🚀 R2 Bucket File Explorer');
  console.log('=========================');
  console.log(`R2 Bucket: ${R2_BUCKET}`);
  console.log('');
  
  // List all files
  await listFiles();
  
  console.log('\n🔍 Looking specifically for audio files:');
  const audioFiles = await findAudioFiles();
  
  if (audioFiles.length > 0) {
    console.log('\n🎵 To access these audio files, use the following URL pattern:');
    console.log('https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev/{file_path}');
    console.log('\nFor example:');
    console.log(`https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev/${audioFiles[0].key}`);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 