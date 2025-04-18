#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const schedulerPath = path.join(rootDir, 'src', 'lib', 'models', 'Scheduler.ts');
const backupPath = `${schedulerPath}.backup`;

// Backup the original file
if (!fs.existsSync(backupPath)) {
  console.log('Creating backup of Scheduler.ts...');
  fs.copyFileSync(schedulerPath, backupPath);
  console.log(`Backup created at ${backupPath}`);
}

// Read the file
console.log('Reading Scheduler.ts...');
const originalContent = fs.readFileSync(schedulerPath, 'utf8');

// Add instrumentation to trace the loadState and saveState methods
let instrumentedContent = originalContent;

// Check if there's a local file implementation of loadState
if (originalContent.includes('loadState')) {
  console.log('Looking for loadState implementation...');
  
  // Add trace to loadState function
  instrumentedContent = instrumentedContent.replace(
    /async loadState\(\): Promise<void> {/,
    `async loadState(): Promise<void> {
    console.log('======= TRACING loadState =======');
    try {
      // Check for local storage implementation
      const fs = require('fs');
      const path = require('path');
      const localPath = path.join(process.cwd(), 'data', 'scheduler.json');
      console.log('Checking for local storage at:', localPath);
      if (fs.existsSync(localPath)) {
        console.log('Local file exists, attempting to read it');
        const content = fs.readFileSync(localPath, 'utf8');
        console.log('File content:', content);
      } else {
        console.log('Local file does not exist');
      }
    } catch (err) {
      console.error('Error checking for local storage:', err);
    }
    console.log('==================================');`
  );
  
  console.log('Added tracing to loadState');
}

// Check if there's a local file implementation of saveState
if (originalContent.includes('saveState')) {
  console.log('Looking for saveState implementation...');
  
  // Add trace to saveState function
  instrumentedContent = instrumentedContent.replace(
    /async saveState\(\): Promise<boolean> {/,
    `async saveState(): Promise<boolean> {
    console.log('======= TRACING saveState =======');
    try {
      console.log('State to save:', JSON.stringify(this.state));
      // Check for local storage implementation
      const fs = require('fs');
      const path = require('path');
      const localPath = path.join(process.cwd(), 'data', 'scheduler.json');
      console.log('Checking if data directory exists');
      const dataDir = path.dirname(localPath);
      if (!fs.existsSync(dataDir)) {
        console.log('Creating data directory:', dataDir);
      }
      console.log('Would save to local storage at:', localPath);
    } catch (err) {
      console.error('Error checking for local storage:', err);
    }
    console.log('==================================');`
  );
  
  console.log('Added tracing to saveState');
}

// Write the instrumented file
fs.writeFileSync(schedulerPath, instrumentedContent);
console.log('Instrumented Scheduler.ts has been written');

// Create a script to test the Scheduler
const testScript = `
#!/usr/bin/env node

async function testScheduler() {
  try {
    console.log('Testing scheduler...');
    
    // Import the getScheduler function
    const { getScheduler } = require('../src/lib/models/Scheduler');
    
    console.log('Getting scheduler instance...');
    const scheduler = await getScheduler();
    
    console.log('Scheduler instance created successfully');
    
    console.log('Toggling scheduler active state...');
    await scheduler.toggleActive(true);
    
    console.log('Getting scheduler status...');
    const status = scheduler.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing scheduler:', error);
  }
}

testScheduler();
`;

// Save the test script
const testScriptPath = path.join(__dirname, 'test-instrumented-scheduler.js');
fs.writeFileSync(testScriptPath, testScript);
fs.chmodSync(testScriptPath, '755');
console.log(`Test script created at ${testScriptPath}`);

console.log('\nTo test the scheduler with tracing:');
console.log(`node ${testScriptPath}`);
console.log('\nTo restore the original Scheduler.ts:');
console.log(`mv ${backupPath} ${schedulerPath}`); 