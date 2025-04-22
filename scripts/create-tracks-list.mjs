import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://1992471ec8cc52388f80797e15a0529.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function createTracksList() {
  try {
    console.log('🔍 Creating tracks/list.json in R2...');
    
    // Sample track IDs
    const trackIds = [
      'track_0cdc7bee6ac44f96',
      'track_1713a69d8baa4bd5',
      'track_179d27384dbf4c59'
    ];
    
    // Convert to JSON string
    const jsonString = JSON.stringify(trackIds, null, 2);
    console.log('📝 Track IDs to save:', trackIds);
    console.log('📝 JSON string:', jsonString);
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
      Key: 'tracks/list.json',
      Body: jsonString,
      ContentType: 'application/json',
    });
    
    await r2Client.send(command);
    console.log('✅ Successfully created tracks/list.json');
    
    // Create metadata files for each track
    console.log('\n🔍 Creating metadata files for each track...');
    
    for (const trackId of trackIds) {
      const metadata = {
        title: `Sample Track ${trackId}`,
        artist: 'ProdAI',
        price: 29.99,
        bpm: 140,
        key: 'Am',
        duration: '3:30',
        tags: ['UK Drill', 'Beat'],
        description: 'A sample track for testing',
        uploadDate: new Date().toISOString(),
        genre: 'UK Drill',
        mood: 'Dark',
        licenseType: 'Non-Exclusive'
      };
      
      const metadataString = JSON.stringify(metadata, null, 2);
      console.log(`📝 Metadata for track ${trackId}:`, metadata);
      
      const metadataCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET || 'prodai-beats-storage',
        Key: `metadata/${trackId}.json`,
        Body: metadataString,
        ContentType: 'application/json',
      });
      
      await r2Client.send(metadataCommand);
      console.log(`✅ Created metadata for track: ${trackId}`);
    }
    
    console.log('\n✅ All files created successfully');
  } catch (error) {
    console.error('❌ Error creating files:', error);
  }
}

createTracksList(); 