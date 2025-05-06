// Script to upload a test file to the R2 bucket
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const PUBLIC_URL = 'https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev';

// Function to create a simple audio test file
function createTestFile() {
  const testFilePath = path.join(__dirname, 'test-audio.mp3');
  
  // Check if we already have a test file
  if (fs.existsSync(testFilePath)) {
    console.log('✅ Test file already exists at:', testFilePath);
    return testFilePath;
  }
  
  try {
    // Create a tiny MP3 file (1KB of zeroes with MP3 header)
    const header = Buffer.from([
      0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // ID3v2 header
      0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // MP3 frame header
    ]);
    
    // Create 1KB file
    const fileSize = 1024;
    const buffer = Buffer.alloc(fileSize);
    header.copy(buffer); // Copy header to the beginning of the buffer
    
    // Write to file
    fs.writeFileSync(testFilePath, buffer);
    console.log('✅ Created test MP3 file at:', testFilePath);
    return testFilePath;
  } catch (error) {
    console.error('❌ Error creating test file:', error);
    throw error;
  }
}

// Function to upload test file to different paths
async function uploadTestFile(filePath) {
  console.log('🚀 Uploading test file to different paths in R2...');
  
  const testPaths = [
    'test-audio.mp3',               // Root
    'audio/test-audio.mp3',         // /audio directory
    'tracks/test-audio.mp3',        // /tracks directory
    'test/test-audio.mp3',          // /test directory
  ];
  
  const results = [];
  
  for (const path of testPaths) {
    try {
      console.log(`📤 Uploading to: ${path}`);
      
      const fileContent = fs.readFileSync(filePath);
      
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: path,
        Body: fileContent,
        ContentType: 'audio/mpeg',
      });
      
      await r2Client.send(command);
      console.log(`✅ Successfully uploaded to: ${path}`);
      
      const publicUrl = `${PUBLIC_URL}/${path}`;
      console.log(`🔗 Public URL: ${publicUrl}`);
      
      results.push({
        path,
        publicUrl,
      });
    } catch (error) {
      console.error(`❌ Error uploading to ${path}:`, error);
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log('🚀 R2 Test File Uploader');
  console.log('=======================');
  console.log(`R2 Bucket: ${R2_BUCKET}`);
  console.log(`Public URL: ${PUBLIC_URL}`);
  console.log('');
  
  try {
    // Create test file
    const testFilePath = createTestFile();
    
    // Upload to different paths
    const results = await uploadTestFile(testFilePath);
    
    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log(`Uploaded test file to ${results.length} locations.`);
    
    if (results.length > 0) {
      console.log('\n🔍 Testing file access:');
      console.log('To verify the files are publicly accessible, try accessing these URLs in your browser:');
      results.forEach(result => {
        console.log(`- ${result.publicUrl}`);
      });
      
      console.log('\n⚠️ If the files are not accessible, check that:');
      console.log('1. The public access is enabled for your bucket in Cloudflare dashboard');
      console.log('2. The Public Development URL matches the one you\'re using');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run script
main(); 