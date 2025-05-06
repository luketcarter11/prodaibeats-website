/**
 * Command-line script to check R2 URL configuration
 * This helps diagnose R2 configuration issues
 */
import { checkR2Urls } from './src/lib/check-r2-urls.js';
import { hasR2Credentials } from './src/lib/r2Config.js';

console.log('🚀 R2 URL Configuration Checker');
console.log('=============================');

// First check if R2 credentials are properly set
const runCheck = async () => {
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
    return;
  }
  
  // If credentials are OK, proceed with the check
  checkR2Urls()
    .then(success => {
      if (success) {
        console.log('🎉 R2 configuration looks good!');
        process.exit(0);
      } else {
        console.log('⚠️ Some issues found with R2 configuration.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
};

runCheck(); 