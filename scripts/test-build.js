#!/usr/bin/env node

console.log('✅ Build test script running');
console.log('📊 Environment variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- SKIP_R2_INIT: ${process.env.SKIP_R2_INIT}`);
console.log(`- VERCEL: ${process.env.VERCEL}`);
console.log(`- VERCEL_ENV: ${process.env.VERCEL_ENV}`);

// Create directories that might be needed
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Create data directory if it doesn't exist
try {
  const dataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('📁 Creating data directory');
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create scheduler.json if it doesn't exist
  const schedulerPath = path.join(dataDir, 'scheduler.json');
  if (!fs.existsSync(schedulerPath)) {
    console.log('📄 Creating scheduler.json');
    fs.writeFileSync(
      schedulerPath,
      JSON.stringify({ active: false, nextRun: null, sources: [], logs: [] }, null, 2)
    );
  }

  console.log('✅ Directory and file check complete');
} catch (error) {
  console.error('❌ Error creating directories or files:', error);
}

console.log('🏁 Test script completed'); 