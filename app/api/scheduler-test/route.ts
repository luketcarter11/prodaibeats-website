import { NextResponse } from 'next/server';
import { r2Storage } from '@/lib/r2Storage';
import { getScheduler } from '@/lib/models/Scheduler';

export const dynamic = 'force-dynamic';

/**
 * Test API to verify the R2Storage implementation
 */
export async function GET() {
  try {
    // Test R2 storage directly
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Testing R2 storage'
    };

    // Save test data to R2
    await r2Storage.save('test/test-data.json', testData);
    
    // Load test data from R2
    const loadedData = await r2Storage.load('test/test-data.json', { test: false });
    
    // Test scheduler that uses R2 storage
    const scheduler = await getScheduler();
    const status = scheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      r2TestResult: {
        savedData: testData,
        loadedData,
        storageWorking: loadedData.test === true
      },
      schedulerStatus: status
    });
  } catch (error) {
    console.error('Error testing R2 storage:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 