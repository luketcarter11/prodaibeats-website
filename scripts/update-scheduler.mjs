// Script to update the scheduler state to run immediately
import { getScheduler } from '../src/lib/models/Scheduler.js';

async function updateScheduler() {
  try {
    console.log('Updating scheduler to run immediately...');
    
    // Get the scheduler instance
    const scheduler = await getScheduler();
    
    // Wait for initialization to complete
    await scheduler.initializationPromise;
    
    // Activate the scheduler if not already active
    await scheduler.toggleActive(true);
    
    // Update the next run time to now
    const state = scheduler.getState();
    state.nextRun = new Date().toISOString();
    const success = await scheduler.saveState();
    
    if (success) {
      console.log('✅ Scheduler updated successfully');
      return true;
    } else {
      console.error('❌ Failed to save scheduler state');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating scheduler:', error);
    return false;
  }
}

// Run the update function
updateScheduler()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 