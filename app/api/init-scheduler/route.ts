import { NextResponse } from 'next/server';
import { r2Storage } from '@/lib/r2Storage';
import { getScheduler } from '@/lib/models/Scheduler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Initialization utility to ensure the scheduler is properly configured
 * This can be called on post-deployment or startup to ensure R2 has the right data
 */
export async function GET() {
  try {
    // Get the scheduler instance (this will initialize it if needed)
    const scheduler = await getScheduler();
    const state = scheduler.getState();

    return NextResponse.json({
      success: true,
      message: 'Scheduler initialized successfully',
      data: state
    });
  } catch (error) {
    console.error('Error initializing scheduler:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 