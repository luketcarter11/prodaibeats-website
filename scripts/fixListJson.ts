import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const TRACK_METADATA_PREFIX = 'metadata';
const TRACK_LIST_PATH = 'tracks/list.json';

// Required environment variables with type assertion
const R2_ENDPOINT = process.env.R2_ENDPOINT as string;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID as string;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY as string;
const R2_BUCKET = process.env.R2_BUCKET as string;

// Validate environment variables
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('❌ Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Create R2 client with validated credentials
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function listObjects(prefix: string) {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix,
  });
  const response = await r2Client.send(command);
  return response.Contents || [];
}

async function saveJsonToR2(path: string, data: any) {
  // Convert data to JSON string and then to UTF-8 buffer
  const jsonString = JSON.stringify(data, null, 2);
  const buffer = Buffer.from(jsonString, 'utf-8');
  
  // Log detailed information about what we're saving
  console.log(`📦 Saving to ${path}:`);
  console.log(`   Size: ${buffer.length} bytes`);
  console.log(`   Preview: ${jsonString.slice(0, 200)}${jsonString.length > 200 ? '...' : ''}`);
  
  // Upload with proper headers
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: path,
    Body: buffer,
    ContentType: 'application/json; charset=utf-8',
    CacheControl: 'no-cache',
  }));
}

async function main() {
  console.log('🔍 Reading metadata keys...');
  
  // Get all objects in metadata directory
  const allObjects = await listObjects(TRACK_METADATA_PREFIX);
  
  // Extract and validate track IDs
  const trackIds = allObjects
    .filter(obj => obj.Key?.endsWith('.json'))
    .map(obj => obj.Key!.replace(`${TRACK_METADATA_PREFIX}/`, '').replace('.json', ''))
    .filter(id => {
      // Skip empty, undefined, or invalid IDs
      if (!id || id === 'undefined' || id.includes('"')) return false;
      
      // Only keep valid track_ IDs
      return id.startsWith('track_') && id.length > 7;
    });

  if (trackIds.length === 0) {
    console.error('❌ No valid tracks found.');
    process.exit(1);
  }

  // Sort track IDs for consistency
  trackIds.sort();

  console.log(`✅ Found ${trackIds.length} valid tracks. Saving list...`);
  await saveJsonToR2(TRACK_LIST_PATH, trackIds);
  console.log(`✅ Done. Reload the site to see updated tracks.`);
}

main().catch(err => {
  console.error('❌ Error fixing list.json:', err);
  process.exit(1);
}); 