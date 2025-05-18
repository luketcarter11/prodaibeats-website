// Test script to verify R2 skipping functionality
console.log('Starting R2 skip test...');
console.log(`SKIP_R2_INIT: ${process.env.SKIP_R2_INIT || 'not set'}`);

// Try to load the modules with the environment variable set
async function testModules() {
  try {
    console.log('Importing r2Config...');
    const { r2Client } = await import('../src/lib/r2Config.ts');
    
    console.log('Importing r2Storage...');
    const { r2Storage } = await import('../src/lib/r2Storage.ts');
    
    console.log('Waiting for r2Storage to initialize...');
    await r2Storage.waitForReady();
    
    console.log('Testing r2Storage.load()...');
    const testData = await r2Storage.load('test-key', { defaultValue: true });
    console.log('Load result:', testData);
    
    console.log('All imports and calls completed successfully!');
  } catch (error) {
    console.error('Error during module testing:', error);
  }
}

testModules(); 