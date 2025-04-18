#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const schedulerPath = path.join(rootDir, 'data', 'scheduler.json');

console.log('Checking for scheduler.json file...');
console.log(`Looking in: ${schedulerPath}`);

try {
  if (fs.existsSync(schedulerPath)) {
    console.log('✅ scheduler.json exists');
    
    // Read the file
    const content = fs.readFileSync(schedulerPath, 'utf8');
    console.log('\nFile contents:');
    console.log(content);
    
    // Parse the JSON
    try {
      const data = JSON.parse(content);
      console.log('\nParsed data:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\nScheduler status:');
      console.log(`Active: ${data.active}`);
      console.log(`Next run: ${data.nextRun}`);
      console.log(`Sources: ${data.sources ? data.sources.length : 0}`);
      console.log(`Logs: ${data.logs ? data.logs.length : 0}`);
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError.message);
    }
  } else {
    console.log('❌ scheduler.json does not exist');
    
    // Check if data directory exists
    const dataDir = path.join(rootDir, 'data');
    if (fs.existsSync(dataDir)) {
      console.log('✅ data directory exists');
      console.log('Files in data directory:');
      const files = fs.readdirSync(dataDir);
      files.forEach(file => {
        console.log(`- ${file}`);
      });
    } else {
      console.log('❌ data directory does not exist');
    }
  }
} catch (error) {
  console.error('Error checking for scheduler.json:', error);
} 