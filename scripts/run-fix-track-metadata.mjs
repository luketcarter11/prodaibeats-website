#!/usr/bin/env node
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🔍 Running track metadata fix script...');

// Verify R2 credentials are available
const requiredEnvVars = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please make sure these are set in your environment or .env file');
  process.exit(1);
}

// Verify ffprobe is installed
try {
  execSync('ffprobe -version', { stdio: 'ignore' });
  console.log('✅ ffprobe is installed');
} catch (error) {
  console.error('❌ ffprobe is not installed. Please install FFmpeg with ffprobe:');
  console.error('   - macOS: brew install ffmpeg');
  console.error('   - Ubuntu/Debian: sudo apt install ffmpeg');
  console.error('   - Windows: https://ffmpeg.org/download.html');
  process.exit(1);
}

console.log('✅ R2 credentials verified');
console.log(`📋 R2 Bucket: ${process.env.R2_BUCKET}`);
console.log(`📋 R2 Endpoint: ${process.env.R2_ENDPOINT}`);

try {
  // Run the fix script
  console.log('🔄 Executing fix-track-metadata.mjs...');
  
  const result = execSync('node -r dotenv/config scripts/fix-track-metadata.mjs', { 
    stdio: 'inherit'
  });
  
  console.log('✅ Successfully ran fix-track-metadata.mjs');
  console.log('⚠️ IMPORTANT: Verify that the tracks now show correct metadata in your application!');
} catch (error) {
  console.error(`❌ Error running fix-track-metadata.mjs: ${error.message}`);
  process.exit(1);
} 