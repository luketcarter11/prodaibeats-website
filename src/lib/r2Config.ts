/**
 * Cloudflare R2 Configuration
 * Shared constants and settings for R2 storage
 */

// Use the exact S3 Compatible API endpoint for Cloudflare R2
export const R2_ENDPOINT = 'https://1992471ec8cc52388f80797e15a0529.r2.cloudflarestorage.com';

// Default bucket name
export const R2_BUCKET_NAME = process.env.R2_BUCKET || 'prodai-beats-storage';

// Path constants
export const SCHEDULER_STATE_KEY = 'scheduler/scheduler.json';

// CDN Base URL
export const CDN_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c059baad842f47laaa2labb935e98d.r2.dev';

// Environment detection
export const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Check if R2 is properly configured with credentials
export const hasR2Credentials = (): boolean => {
  return !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
};

// Get the public URL for an object in R2
export const getR2PublicUrl = (key: string): string => {
  // If a CDN URL is configured, use that
  if (CDN_BASE_URL) {
    return `${CDN_BASE_URL}/${key}`;
  }
  
  // Fall back to direct R2 endpoint
  return `${process.env.R2_ENDPOINT || R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}; 