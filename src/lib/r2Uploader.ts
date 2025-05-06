import fs from 'fs';
import path from 'path';
import { PutObjectCommand, HeadObjectCommand, GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { R2_BUCKET_NAME, getR2PublicUrl, hasR2Credentials, r2Client } from './r2Config';

// Mime type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.json': 'application/json',
};

/**
 * Check if a file exists in R2 storage
 * @param r2Key Key (path) of the file in R2
 * @returns boolean indicating if the file exists
 */
export async function fileExistsInR2(r2Key: string): Promise<boolean> {
  try {
    // Check if we have the required credentials
    if (!hasR2Credentials()) {
      throw new Error('R2 credentials not found in environment variables');
    }

    // Try to get the object's metadata
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
      })
    );
    
    return true;
  } catch (error) {
    // If the error is a 404, the file doesn't exist
    if (error instanceof S3ServiceException && error.name === 'NotFound') {
      return false;
    }
    // For other errors, rethrow
    throw error;
  }
}

/**
 * Upload a file to R2 storage
 * @param filePath Local file path to upload
 * @param r2Key Key (path) where to store the file in R2
 * @returns Public URL for the uploaded file
 */
export async function uploadFileToR2(filePath: string, r2Key: string): Promise<string> {
  try {
    // Check if we have the required credentials
    if (!hasR2Credentials()) {
      throw new Error('R2 credentials not found in environment variables');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check if file already exists in R2
    const exists = await fileExistsInR2(r2Key);
    if (exists) {
      console.log(`⚠️ Skipping ${r2Key} – already exists`);
      return getR2PublicUrl(r2Key);
    }

    // Auto-detect content type based on file extension
    const fileExtension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[fileExtension] || 'application/octet-stream';
    
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    
    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: fileContent,
        ContentType: contentType,
      })
    );
    
    console.log(`✅ File uploaded to R2: ${r2Key}`);
    
    // Construct the public URL
    return getR2PublicUrl(r2Key);
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

/**
 * Validates if data is a proper array of track IDs
 * Used specifically for tracks/list.json integrity
 * @param data Data to validate
 * @returns boolean indicating if the data is valid
 */
function validateTracksList(data: any): boolean {
  // Special validation for tracks/list.json
  if (Array.isArray(data)) {
    // Check all elements are strings starting with track_
    const validTrackIds = data.every(
      item => typeof item === 'string' && item.startsWith('track_')
    );
    
    if (!validTrackIds) {
      console.error('❌ Invalid tracks list: Contains non-track_* values');
      return false;
    }
    
    // Check for duplicate IDs
    const uniqueIds = new Set(data);
    if (uniqueIds.size !== data.length) {
      console.warn(`⚠️ Warning: List contains ${data.length - uniqueIds.size} duplicate IDs`);
      // Duplicates are a warning but we can still proceed
    }
    
    return true;
  }
  
  return true; // Not a tracks list, so no specific validation
}

/**
 * Upload JSON data to R2 storage with enhanced validation
 * @param data JSON data to upload
 * @param r2Key Key (path) where to store the file in R2
 * @returns Public URL for the uploaded file
 */
export async function uploadJsonToR2(data: any, r2Key: string): Promise<string> {
  try {
    // Check if we have the required credentials
    if (!hasR2Credentials()) {
      throw new Error('R2 credentials not found in environment variables');
    }

    // Additional validation for tracks/list.json to prevent corruption
    if (r2Key === 'tracks/list.json') {
      console.log('🔍 Validating tracks/list.json before upload...');
      
      if (!Array.isArray(data)) {
        throw new Error('CRITICAL ERROR: tracks/list.json must be an array');
      }
      
      if (!validateTracksList(data)) {
        throw new Error('CRITICAL ERROR: Invalid track list format - upload aborted');
      }
      
      console.log(`✅ Validation passed: tracks/list.json contains ${data.length} valid track IDs`);
    }

    // Convert data to JSON string with proper formatting
    // Use 2-space indentation for better readability if needed to debug
    const jsonString = JSON.stringify(data, null, 2);
    
    // Check that the result is valid JSON by trying to parse it back
    try {
      JSON.parse(jsonString);
    } catch (error) {
      console.error('❌ Generated invalid JSON content:', error);
      throw new Error('Failed to create valid JSON string from data');
    }
    
    // Create a backup of existing file if it's the tracks list
    if (r2Key === 'tracks/list.json') {
      try {
        const exists = await fileExistsInR2(r2Key);
        if (exists) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupKey = `backups/tracks-list-${timestamp}.json`;
          
          console.log(`📦 Creating backup of tracks/list.json at ${backupKey}`);
          
          // Upload a backup copy
          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: backupKey,
              Body: jsonString,
              ContentType: 'application/json',
            })
          );
          
          console.log('✅ Backup created successfully');
        }
      } catch (backupError) {
        console.warn('⚠️ Failed to create backup, proceeding with update:', backupError);
      }
    }
    
    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: jsonString,
        ContentType: 'application/json',
      })
    );
    
    console.log(`✅ JSON data uploaded to R2: ${r2Key}`);
    
    // Additional verification for tracks/list.json
    if (r2Key === 'tracks/list.json') {
      try {
        // Verify the file was uploaded correctly by downloading it back
        const command = await r2Client.send(
          new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: r2Key,
          })
        );
        
        if (command) {
          console.log('✅ Verified tracks/list.json was uploaded successfully');
        }
      } catch (verifyError) {
        console.warn('⚠️ Failed to verify upload, but upload appeared successful:', verifyError);
      }
    }
    
    // Construct the public URL
    return getR2PublicUrl(r2Key);
  } catch (error) {
    console.error('Error uploading JSON to R2:', error);
    throw error;
  }
} 