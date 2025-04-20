import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';

// MIME type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

// Initialize S3 client with Cloudflare R2 credentials
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || 'c616c808af752cc71682ff6dc323a6c1',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'bd63d4b189cf4cde3264d1ce7f4ad36f102f90486ed09c3eb50fc4dc533fff',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET || 'prodai-tracks';

/**
 * Uploads a file to Cloudflare R2 storage
 * @param filepath Local file path to upload
 * @param key R2 object key (path within bucket)
 * @param contentType Optional MIME type, auto-detected if not provided
 * @returns Public URL of the uploaded file
 */
export const uploadFileToR2 = async (
  filepath: string,
  key: string,
  contentType?: string
): Promise<string> => {
  try {
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found at path: ${filepath}`);
    }

    // Read file content
    const fileContent = fs.readFileSync(filepath);
    
    // Auto-detect content type if not provided
    let detectedContentType = contentType;
    if (!detectedContentType) {
      const ext = path.extname(filepath).toLowerCase();
      detectedContentType = MIME_TYPES[ext] || 'application/octet-stream';
    }

    // Set upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: detectedContentType,
      // Make object publicly accessible
      ACL: 'public-read' as ObjectCannedACL,
    };

    // Upload to R2
    console.log(`Uploading file to R2: ${filepath} -> ${key}`);
    await r2Client.send(new PutObjectCommand(params));
    
    // Construct and return the public URL
    const publicUrl = `${process.env.R2_ENDPOINT || 'https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com'}/${BUCKET_NAME}/${key}`;
    console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('R2 Upload Failed:', error);
    throw error;
  }
};

/**
 * Get the public URL for an object in R2
 * @param key R2 object key
 * @returns Public URL
 */
export const getR2PublicUrl = (key: string): string => {
  return `${process.env.R2_ENDPOINT || 'https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com'}/${BUCKET_NAME}/${key}`;
}; 