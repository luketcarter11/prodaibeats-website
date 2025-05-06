/**
 * Command-line script to repair metadata files with incorrect URLs
 */
import { repairMetadataUrls } from './src/lib/repair-metadata-urls';

console.log('🚀 R2 Metadata URL Repair Tool');
console.log('============================');

repairMetadataUrls()
  .then(result => {
    if (result.failed === 0) {
      console.log('🎉 Repair completed successfully!');
      process.exit(0);
    } else {
      console.log(`❌ Repair completed with ${result.failed} failures.`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 