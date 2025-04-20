import { NextResponse } from 'next/server';
import { r2Storage } from '@/lib/r2Storage';
import { getScheduler, DEFAULT_STATE } from '@/lib/models/Scheduler';

export const dynamic = 'force-dynamic';

/**
 * Initialization utility to ensure the scheduler is properly configured
 * This can be called on post-deployment or startup to ensure R2 has the right data
 */
export async function GET() {
  try {
    // First try to load the scheduler data from R2
    const data = await r2Storage.load('scheduler/scheduler.json', DEFAULT_STATE);
    
    // If we have data, ensure the scheduler is initialized
    const scheduler = await getScheduler();
    const status = scheduler.getStatus();
    
    // Return the current state
    return NextResponse.json({
      success: true,
      message: 'Scheduler initialized successfully',
      status
    });
  } catch (error) {
    console.error('Error initializing scheduler:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 