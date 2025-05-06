/**
 * Command-line script to repair the corrupted tracks/list.json in R2 storage
 */
import { repairTracksList } from './src/lib/repair-list-json';
import { hasR2Credentials } from './src/lib/r2Config';

console.log('🚀 R2 Tracks List Repair Tool');
console.log('============================');

// Check credentials before running the repair
async function checkCredentialsAndRun() {
  // First verify R2 credentials
  const credentialsOk = await hasR2Credentials();
  
  if (!credentialsOk) {
    console.error('❌ R2 credentials are not properly configured');
    console.log('\n💡 Make sure to set the following environment variables:');
    console.log('- R2_ACCESS_KEY_ID');
    console.log('- R2_SECRET_ACCESS_KEY');
    console.log('- R2_ENDPOINT');
    console.log('- R2_BUCKET');
    console.log('- NEXT_PUBLIC_STORAGE_BASE_URL');
    
    console.log('\n💡 You can set them by:');
    console.log('1. Creating a .env file in the project root');
    console.log('2. Setting them in your shell before running the script');
    console.log('3. Using the Vercel dashboard for production deployments');
    process.exit(1);
    return false;
  }
  
  // If credentials are OK, proceed with repairs
  return await repairTracksList();
}

// Run the repair with credential check
checkCredentialsAndRun()
  .then(success => {
    if (success) {
      console.log('🎉 Repair completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Repair failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 