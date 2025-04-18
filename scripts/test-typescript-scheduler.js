#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary TypeScript file
const tempFile = path.join(__dirname, 'temp-scheduler-test.ts');

// TypeScript code to test the scheduler
const code = `
import { getScheduler } from '../src/lib/models/Scheduler';

async function main() {
  try {
    console.log('Testing scheduler...');
    
    const scheduler = await getScheduler();
    console.log('Scheduler instance created');
    
    console.log('Getting scheduler status...');
    const status = scheduler.getStatus();
    console.log('Current status:', JSON.stringify(status, null, 2));
    
    console.log('\\nToggling scheduler to active...');
    await scheduler.toggleActive(true);
    
    console.log('\\nGetting updated status...');
    const newStatus = scheduler.getStatus();
    console.log('New status:', JSON.stringify(newStatus, null, 2));
    
    console.log('\\nTest completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
`;

try {
  // Write the TypeScript code to a temporary file
  fs.writeFileSync(tempFile, code);
  console.log(`Created temporary test file: ${tempFile}`);
  
  // Check if ts-node is installed
  try {
    execSync('npx ts-node --version', { stdio: 'ignore' });
    console.log('ts-node is available. Running test...\n');
  } catch (e) {
    console.log('ts-node is not installed. Installing...');
    execSync('npm install -g ts-node typescript', { stdio: 'inherit' });
    console.log('ts-node installed. Running test...\n');
  }
  
  // Run the TypeScript file using ts-node
  execSync(`npx ts-node ${tempFile}`, { stdio: 'inherit' });
  
  console.log('\nTest executed successfully');
} catch (error) {
  console.error('Failed to run test:', error);
} finally {
  // Clean up the temporary file
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
    console.log(`Removed temporary file: ${tempFile}`);
  }
} 