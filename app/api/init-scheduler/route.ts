import { NextResponse } from 'next/server';
import { r2Storage } from '@/lib/r2Storage';

const DEFAULT_STATE = {
  active: false,
  nextRun: null,
  sources: [],
  logs: []
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Initialization utility to ensure the scheduler is properly configured
 * This can be called on post-deployment or startup to ensure R2 has the right data
 */
export async function GET() {
  try {
    // Wait for R2Storage to be ready
    await r2Storage.waitForReady();
    console.log('✅ R2Storage is ready');

    // First try to load the scheduler data from R2
    const data = await r2Storage.load('scheduler/scheduler.json', DEFAULT_STATE);
    console.log('📥 Loaded scheduler state:', data);

    // If we don't have any data, initialize with default state
    if (!data) {
      console.log('🆕 No scheduler state found, initializing with default state');
      await r2Storage.save('scheduler/scheduler.json', DEFAULT_STATE);
      console.log('✅ Saved default scheduler state to R2');
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduler initialized successfully',
      data
    });
  } catch (error) {
    console.error('Error initializing scheduler:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 