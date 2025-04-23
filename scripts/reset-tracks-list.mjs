import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Create R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc52388f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function resetTracksList() {
  try {
    console.log('🔄 Resetting tracks/list.json in R2...');
    
    // Create an empty array JSON string
    const emptyArrayJson = JSON.stringify([], null, 2);
    
    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Key: 'tracks/list.json',
      Body: emptyArrayJson,
      ContentType: 'application/json',
    });
    
    await r2Client.send(putCommand);
    console.log('✅ Successfully reset tracks/list.json to empty array');
    
  } catch (error) {
    console.error('❌ Error resetting tracks/list.json:', error);
  }
}

// Run the script
resetTracksList(); 