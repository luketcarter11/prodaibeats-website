#!/usr/bin/env node

async function testScheduler() {
  try {
    console.log('Testing scheduler...');
    
    // Import the getScheduler function - adjust path based on the actual location
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
