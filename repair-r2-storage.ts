/**
 * Command-line script to repair R2 storage issues
 * This will run both repair operations:
 * 1. Fix tracks/list.json - Issues with corrupted JSON array
 * 2. Fix metadata URLs - Issues with incorrect domain in URLs
 */
import { repairTracksList } from './src/lib/repair-list-json';
import { repairMetadataUrls } from './src/lib/repair-metadata-urls';
import { hasR2Credentials } from './src/lib/r2Config';

console.log('🚀 R2 Storage Repair Tool');
console.log('=======================');

// Check for credentials before running repairs
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
  return await runRepairs();
}

// Run both repair operations in sequence
async function runRepairs() {
  try {
    // Step 1: Repair tracks/list.json
    console.log('\n📋 STEP 1: Repairing tracks/list.json');
    console.log('-----------------------------------');
    const listSuccess = await repairTracksList();
    
    if (!listSuccess) {
      console.error('❌ Failed to repair tracks/list.json');
      return false;
    }
    
    // Step 2: Repair metadata URLs
    console.log('\n📋 STEP 2: Repairing metadata URLs');
    console.log('--------------------------------');
    const metadataResult = await repairMetadataUrls();
    
    if (metadataResult.failed > 0) {
      console.warn(`⚠️ Some metadata files could not be repaired (${metadataResult.failed} failures)`);
    }
    
    // Final summary
    console.log('\n📊 FINAL REPAIR SUMMARY:');
    console.log('----------------------');
    console.log(`✅ tracks/list.json: Repaired successfully`);
    console.log(`✅ Metadata files: ${metadataResult.updated} updated, ${metadataResult.failed} failed`);
    
    return metadataResult.failed === 0;
  } catch (error) {
    console.error('❌ Repair process failed:', error);
    return false;
  }
}

// Run the repair process with credential check
checkCredentialsAndRun()
  .then(success => {
    if (success) {
      console.log('\n🎉 All repairs completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Restart your application to ensure changes take effect');
      console.log('2. Verify audio playback on the frontend');
      process.exit(0);
    } else {
      console.log('\n⚠️ Repairs completed with some issues.');
      console.log('Please check the logs above for details.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }); 