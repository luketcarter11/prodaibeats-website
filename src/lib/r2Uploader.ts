import fs from 'fs';
import path from 'path';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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
    
    console.log(`File uploaded to R2: ${r2Key}`);
    
    // Construct the public URL
    return getR2PublicUrl(r2Key);
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

/**
 * Check if a file exists in R2 storage
 * @param r2Key Key (path) to check in R2
 * @returns True if file exists, false otherwise
 */
export async function fileExistsInR2(r2Key: string): Promise<boolean> {
  try {
    // Check if we have the required credentials
    if (!hasR2Credentials()) {
      return false;
    }
    
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
} 