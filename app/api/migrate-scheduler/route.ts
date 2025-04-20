import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { r2Storage } from '@/lib/r2Storage';

export const dynamic = 'force-dynamic';

/**
 * Migration utility to move scheduler data from file system to R2
 */
export async function GET() {
  try {
    // Check if we already have the migration lock file to prevent multiple migrations
    const migrationLockPath = path.join(process.cwd(), 'data', '.migration-complete');
    if (fs.existsSync(migrationLockPath)) {
      return NextResponse.json({
        success: true,
        message: 'Migration already completed',
        migrated: false
      });
    }
    
    // Check if the file exists
    const schedulerFilePath = path.join(process.cwd(), 'data', 'scheduler.json');
    if (!fs.existsSync(schedulerFilePath)) {
      return NextResponse.json({
        success: true,
        message: 'No scheduler data to migrate',
        migrated: false
      });
    }
    
    // Read the file
    console.log('📤 Reading scheduler data from file system...');
    const fileData = fs.readFileSync(schedulerFilePath, 'utf8');
    const schedulerData = JSON.parse(fileData);
    
    // Save to R2
    console.log('📤 Migrating scheduler data to R2...');
    await r2Storage.save('scheduler/scheduler.json', schedulerData);
    
    // Create a migration lock file to prevent multiple migrations
    fs.writeFileSync(migrationLockPath, new Date().toISOString());
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      migrated: true,
      data: schedulerData
    });
  } catch (error) {
    console.error('Error migrating scheduler data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 