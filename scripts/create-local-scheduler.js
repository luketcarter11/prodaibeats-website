#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const schedulerPath = path.join(rootDir, 'data', 'scheduler.json');
const dataDir = path.dirname(schedulerPath);

// Create default scheduler state
const defaultState = {
  active: false,
  nextRun: null,
  sources: [],
  logs: []
};

// Toggle active state
function toggleActive(state, active = true) {
  const newState = { ...state };
  newState.active = active;
  newState.nextRun = active 
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
    : null;
  
  return newState;
}

// Add a source
function addSource(state, source, type = 'channel') {
  const newState = { ...state };
  
  const newSource = {
    id: uuidv4(),
    source,
    type,
    lastChecked: null,
    active: true
  };
  
  newState.sources = [...(newState.sources || []), newSource];
  
  return newState;
}

// Add a log entry
function addLog(state, message, type = 'info', sourceId = null) {
  const newState = { ...state };
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    type,
    ...(sourceId ? { sourceId } : {})
  };
  
  newState.logs = [...(newState.logs || []), logEntry];
  
  return newState;
}

// Main function
async function createLocalScheduler() {
  try {
    console.log('Creating local scheduler file...');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if scheduler file already exists
    if (fs.existsSync(schedulerPath)) {
      console.log('Scheduler file already exists');
      const content = fs.readFileSync(schedulerPath, 'utf8');
      
      try {
        const existingState = JSON.parse(content);
        console.log('Current state:', JSON.stringify(existingState, null, 2));
        
        // Ask if we want to update
        console.log('\nDo you want to update this file? (y/n)');
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('> ', (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            updateState(existingState);
          } else {
            console.log('Operation cancelled');
            readline.close();
          }
        });
        
        // Update function
        function updateState(state) {
          // Example operations
          let updatedState = state;
          
          // Make scheduler active
          updatedState = toggleActive(updatedState, true);
          
          // Add a YouTube channel as source
          if (!updatedState.sources.some(s => s.source === 'https://www.youtube.com/channel/UCBVjMGOIkavEAhyqpxJ73Dw')) {
            updatedState = addSource(
              updatedState, 
              'https://www.youtube.com/channel/UCBVjMGOIkavEAhyqpxJ73Dw', 
              'channel'
            );
          }
          
          // Add a log entry
          updatedState = addLog(
            updatedState,
            'Scheduler activated via script',
            'info'
          );
          
          // Save the updated state
          fs.writeFileSync(schedulerPath, JSON.stringify(updatedState, null, 2));
          console.log('\nScheduler state updated successfully!');
          console.log('New state:', JSON.stringify(updatedState, null, 2));
          
          readline.close();
        }
      } catch (error) {
        console.error('Error parsing existing scheduler file:', error);
        createNewFile();
      }
    } else {
      createNewFile();
    }
    
    function createNewFile() {
      // Create a new scheduler state
      let state = defaultState;
      
      // Make it active
      state = toggleActive(state, true);
      
      // Add a YouTube channel
      state = addSource(
        state, 
        'https://www.youtube.com/channel/UCBVjMGOIkavEAhyqpxJ73Dw',
        'channel'
      );
      
      // Add initialization log
      state = addLog(
        state,
        'Scheduler initialized via script',
        'info'
      );
      
      // Save the state
      fs.writeFileSync(schedulerPath, JSON.stringify(state, null, 2));
      
      console.log('New scheduler file created successfully!');
      console.log('State:', JSON.stringify(state, null, 2));
    }
  } catch (error) {
    console.error('Error creating scheduler file:', error);
  }
}

// Run the script
createLocalScheduler(); 