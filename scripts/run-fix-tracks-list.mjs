#!/usr/bin/env node
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🔍 Running track list fix script...');

// Verify R2 credentials are available
const requiredEnvVars = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please make sure these are set in your environment or .env file');
  process.exit(1);
}

console.log('✅ R2 credentials verified');
console.log(`📋 R2 Bucket: ${process.env.R2_BUCKET}`);
console.log(`📋 R2 Endpoint: ${process.env.R2_ENDPOINT}`);

try {
  // Run the fix script
  console.log('🔄 Executing fix-tracks-list.mjs...');
  
  const result = execSync('node -r dotenv/config scripts/fix-tracks-list.mjs', { 
    stdio: 'inherit'
  });
  
  console.log('✅ Successfully ran fix-tracks-list.mjs');
  console.log('⚠️ IMPORTANT: Verify that the tracks are now loading correctly in your application!');
} catch (error) {
  console.error(`❌ Error running fix-tracks-list.mjs: ${error.message}`);
  process.exit(1);
} 