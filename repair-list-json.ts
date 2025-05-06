/**
 * Command-line script to repair the corrupted tracks/list.json in R2 storage
 */
import { repairTracksList } from './src/lib/repair-list-json';

console.log('🚀 R2 Tracks List Repair Tool');
console.log('============================');

repairTracksList()
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