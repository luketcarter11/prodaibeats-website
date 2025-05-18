/**
 * Cloudflare R2 Configuration
 * Shared constants and settings for R2 storage
 */
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Check if we should skip R2 initialization (used during Vercel builds)
const skipR2Init = process.env.SKIP_R2_INIT === 'true';

if (skipR2Init) {
  console.log('⏩ SKIP_R2_INIT flag detected in r2Config, using mock configuration');
}

// Check if we're in a build environment
const isBuildTime = process.env.VERCEL_ENV === 'development' || 
  process.env.NODE_ENV === 'development' ||
  process.env.CI === 'true';

// Use the exact S3 Compatible API endpoint for Cloudflare R2
export const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://1992471ec8cc52388f80797e15a0529.r2.cloudflarestorage.com';

// Default bucket name
export const R2_BUCKET_NAME = process.env.R2_BUCKET || 'prodai-beats-storage';

// Path constants
export const SCHEDULER_STATE_KEY = 'scheduler/scheduler.json';

// CDN Base URL
export const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Environment detection
export const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Create a simple mock client if skipping R2 initialization
class MockS3Client {
  async send() {
    console.log('📦 Mock S3Client.send() called');
    return {
      Body: {
        transformToString: () => JSON.stringify({ mockData: true }),
      },
    };
  }
}

// Create a properly configured S3 client for R2
export const r2Client = skipR2Init
  ? (new MockS3Client() as unknown as S3Client)
  : new S3Client({
      region: 'auto', // Required, even though R2 ignores it
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

// Check if R2 is properly configured with credentials and bucket
export const hasR2Credentials = async (): Promise<boolean> => {
  if (skipR2Init) {
    console.log('⏩ Skipping R2 credentials check due to SKIP_R2_INIT flag');
    return false;
  }
  
  try {
    // Check if all required credentials are present
    const missingVars = [];
    
    if (!process.env.R2_ACCESS_KEY_ID) missingVars.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missingVars.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_ENDPOINT) missingVars.push('R2_ENDPOINT');
    if (!process.env.R2_BUCKET) missingVars.push('R2_BUCKET');
    
    if (missingVars.length > 0) {
      console.log(`❌ R2 credentials missing: ${missingVars.join(', ')}`);
      return false;
    }

    // Try to access the bucket to verify credentials
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
    console.log('✅ R2 credentials and bucket verified');
    return true;
  } catch (error) {
    console.error('❌ R2 configuration error:', error);
    return false;
  }
};

// Get the public URL for an object in R2
export const getR2PublicUrl = (key: string): string => {
  // If a CDN URL is configured, use that
  if (CDN_BASE_URL) {
    return `${CDN_BASE_URL}/${key}`;
  }
  
  // Fall back to direct R2 endpoint
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}; 