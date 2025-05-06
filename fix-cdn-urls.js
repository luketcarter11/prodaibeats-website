// Script to update the audio URLs in metadata files to use the correct CDN URL
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import readline from 'readline';
import { stdin as input, stdout as output } from 'process';

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

// Configure bucket and CDN
const R2_BUCKET = process.env.R2_BUCKET || 'prodai-beats-storage';
const OLD_CDN_URL = 'https://pub-c059baad842f47laaa2labb935e98d.r2.dev';
const NEW_CDN_URL = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Create readline interface for user input
const rl = readline.createInterface({ input, output });

// Function to get all metadata files
async function getMetadataFiles() {
  try {
    console.log('🔍 Listing metadata files in R2...');
    
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: 'metadata/',
    });
    
    const response = await r2Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No metadata files found');
      return [];
    }
    
    console.log(`✅ Found ${response.Contents.length} metadata files`);
    return response.Contents;
  } catch (error) {
    console.error('❌ Error listing metadata files:', error);
    return [];
  }
}

// Function to update metadata files with new CDN URL
async function updateMetadataFiles(files, newCdnUrl) {
  console.log(`🔄 Updating metadata files to use ${newCdnUrl}...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    try {
      const key = file.Key;
      
      // Get the current metadata
      const getCommand = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      });
      
      const response = await r2Client.send(getCommand);
      const metadataString = await response.Body?.transformToString();
      
      if (!metadataString) {
        console.warn(`⚠️ Empty metadata file: ${key}`);
        continue;
      }
      
      // Parse metadata
      const metadata = JSON.parse(metadataString);
      
      // Extract track ID from metadata file name
      const trackId = key.split('/').pop()?.replace('.json', '');
      
      if (!trackId) {
        console.warn(`⚠️ Invalid metadata file name: ${key}`);
        continue;
      }
      
      // Generate new URLs with the new CDN base URL
      const newAudioUrl = `${newCdnUrl}/tracks/${trackId}.mp3`;
      const newCoverUrl = `${newCdnUrl}/covers/${trackId}.jpg`;
      
      // Check if URLs need updating
      const needsUpdate = 
        (metadata.audioUrl && metadata.audioUrl.startsWith(OLD_CDN_URL)) || 
        (metadata.coverUrl && metadata.coverUrl.startsWith(OLD_CDN_URL));
      
      if (needsUpdate) {
        // Update metadata with new URLs
        const updatedMetadata = {
          ...metadata,
          audioUrl: newAudioUrl,
          coverUrl: newCoverUrl,
        };
        
        // Upload updated metadata
        const putCommand = new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: JSON.stringify(updatedMetadata, null, 2),
          ContentType: 'application/json',
        });
        
        await r2Client.send(putCommand);
        console.log(`✅ Updated ${key}`);
        console.log(`   Old audio URL: ${metadata.audioUrl || 'Not set'}`);
        console.log(`   New audio URL: ${newAudioUrl}`);
        successCount++;
      } else {
        console.log(`ℹ️ No update needed for ${key}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${file.Key}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Update Summary:');
  console.log(`✅ Successfully updated: ${successCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
}

// Main function
async function main() {
  try {
    console.log('🚀 R2 Metadata URL Fixer');
    console.log('======================');
    console.log('This script will update the audio URLs in all metadata files to use the correct CDN URL.');
    console.log(`Current R2 bucket: ${R2_BUCKET}`);
    console.log(`Old CDN URL (incorrect): ${OLD_CDN_URL}`);
    console.log(`New CDN URL (correct): ${NEW_CDN_URL}`);
    console.log('');
    
    // Confirm before proceeding
    rl.question('Proceed with updating metadata to use the correct URL? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        const files = await getMetadataFiles();
        
        if (files.length > 0) {
          await updateMetadataFiles(files, NEW_CDN_URL);
        } else {
          console.log('❌ No files to update');
        }
      } else {
        console.log('❌ Operation cancelled');
      }
      
      rl.close();
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the script
main(); 